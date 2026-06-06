import { NextRequest } from 'next/server';
import { LLMClient, Config, HeaderUtils } from 'coze-coding-dev-sdk';
import { buildAutoChatPrompt } from '@/lib/world-book';
import { getModelForScene } from '@/lib/config';

export const runtime = 'nodejs';
export const maxDuration = 30;

export async function POST(request: NextRequest) {
  try {
    const { speaker, recentMessages } = await request.json();

    if (!speaker || (speaker !== 'dad' && speaker !== 'mom')) {
      return new Response(JSON.stringify({ error: '缺少参数' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    const customHeaders = HeaderUtils.extractForwardHeaders(request.headers);
    const config = new Config();
    const client = new LLMClient(config, customHeaders);

    const systemPrompt = buildAutoChatPrompt(speaker, recentMessages || []);
    const messages: Array<{ role: 'system' | 'user'; content: string }> = [
      { role: 'system', content: systemPrompt },
      { role: 'user', content: '现在发一条消息给女儿吧' },
    ];

    // 非流式，直接返回完整消息
    let fullText = '';
    const stream = client.stream(messages, {
      model: getModelForScene('auto'),
      temperature: 0.9,
    });

    for await (const chunk of stream) {
      if (chunk.content) {
        fullText += chunk.content.toString();
      }
    }

    return new Response(JSON.stringify({ message: fullText.trim(), speaker }), {
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Auto-chat API error:', error);
    return new Response(JSON.stringify({ error: '服务器错误' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
}
