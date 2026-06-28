import { NextRequest } from 'next/server';
import { LLMClient, Config, HeaderUtils } from 'coze-coding-dev-sdk';
import { buildSystemPrompt } from '@/lib/world-book';
import { getModelForScene } from '@/lib/config';

export const runtime = 'nodejs';
export const maxDuration = 30;

export async function POST(request: NextRequest) {
  try {
    const { message, character, speaker, history, identityContext, scene } = await request.json();

    if (!message || !character) {
      return new Response(JSON.stringify({ error: '缺少参数' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    const customHeaders = HeaderUtils.extractForwardHeaders(request.headers);
    const config = new Config();
    const client = new LLMClient(config, customHeaders);

    // 家庭群：指定当前谁在说话
    const currentSpeaker = character === 'family' ? (speaker || 'dad') : character;
    const systemPrompt = buildSystemPrompt(character, currentSpeaker as 'dad' | 'mom');
    
    // 注入身份上下文到system prompt
    const fullSystemPrompt = identityContext 
      ? `${systemPrompt}\n\n${identityContext}`
      : systemPrompt;
    
    const messages: Array<{ role: 'system' | 'user' | 'assistant'; content: string }> = [
      { role: 'system', content: fullSystemPrompt },
    ];

    // 加入历史消息
    if (history && Array.isArray(history)) {
      for (const msg of history) {
        if (msg.role === 'user' || msg.role === 'assistant') {
          messages.push({ role: msg.role, content: msg.content });
        }
      }
    }

    // 加入当前用户消息
    messages.push({ role: 'user', content: message });

    // 根据场景选择模型：聊天/朋友圈用pro（活人感强），其他用v3
    const model = getModelForScene((scene as 'chat' | 'moments' | 'heartbeat' | 'auto') || 'chat');
    const stream = client.stream(messages, {
      model,
      temperature: 0.8,
    });

    // 返回 SSE 流
    const encoder = new TextEncoder();
    const readable = new ReadableStream({
      async start(controller) {
        try {
          for await (const chunk of stream) {
            if (chunk.content) {
              const text = chunk.content.toString();
              controller.enqueue(encoder.encode(`data: ${JSON.stringify({ content: text, speaker: currentSpeaker })}\n\n`));
            }
          }
          controller.enqueue(encoder.encode('data: [DONE]\n\n'));
          controller.close();
        } catch (err) {
          console.error('Stream error:', err);
          controller.enqueue(encoder.encode(`data: ${JSON.stringify({ error: '生成失败' })}\n\n`));
          controller.close();
        }
      },
    });

    return new Response(readable, {
      headers: {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        Connection: 'keep-alive',
      },
    });
  } catch (error) {
    console.error('Chat API error:', error);
    return new Response(JSON.stringify({ error: '服务器错误' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
}
