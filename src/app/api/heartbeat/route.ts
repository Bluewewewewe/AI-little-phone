import { NextRequest } from 'next/server';
import { LLMClient, Config, HeaderUtils } from 'coze-coding-dev-sdk';
import { buildHeartbeatPrompt, getParentStatus, getMomStatus, type ParentStatusInfo } from '@/lib/world-book';

export const runtime = 'nodejs';
export const maxDuration = 30;

/**
 * 心跳系统 - 灵感来自 dylan-heartbeat
 * 
 * 核心机制：
 * 1. 前端每隔一段时间调用此API
 * 2. API根据当前时间和爸妈状态，决定是否让爸妈主动联系米米
 * 3. AI自主决定是否发消息（不强制）
 * 4. 返回 { shouldAct: boolean, messages: [...] }
 */
export async function POST(request: NextRequest) {
  try {
    const { 
      recentMessages = [],    // 最近聊天记录
      currentApp = 'home',   // 当前在哪个APP
    } = await request.json();

    const now = new Date();
    const hour = now.getHours();
    const minute = now.getMinutes();
    const timeStr = `${hour.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')}`;
    
    // 获取爸妈当前状态
    const dadStatus = getParentStatus(hour);
    const momStatus = getMomStatus(hour);

    // 检查是否在睡觉时间 - 睡觉时不主动联系
    if (hour >= 23 || hour < 7) {
      return new Response(JSON.stringify({ 
        shouldAct: false, 
        reason: '睡觉时间不主动联系',
        messages: [] 
      }), {
        headers: { 'Content-Type': 'application/json' },
      });
    }

    // 计算距离最后一条用户消息的时间
    const lastUserMsg = [...recentMessages].reverse().find((m: { from: string }) => m.from === 'me');
    let minutesSinceLastUser = 999;
    if (lastUserMsg) {
      // 简单估算：从消息时间推算
      minutesSinceLastUser = 30; // 默认30分钟
    }

    // 根据时间段调整唤醒间隔
    const wakeInterval = (hour >= 10 && hour < 23) ? 45 : 120; // 白天45分钟，夜间120分钟
    
    // 如果用户刚聊过天，不主动联系
    if (minutesSinceLastUser < 5) {
      return new Response(JSON.stringify({ 
        shouldAct: false, 
        reason: '用户刚聊过天',
        messages: [] 
      }), {
        headers: { 'Content-Type': 'application/json' },
      });
    }

    // 随机决定谁主动联系
    const results: Array<{ speaker: string; text: string }> = [];
    
    // 决定谁可能主动联系
    const possibleActors: Array<{ speaker: string; status: ParentStatusInfo }> = [];
    
    if (!dadStatus.status.includes('睡觉')) {
      possibleActors.push({ speaker: 'dad', status: dadStatus });
    }
    if (!momStatus.status.includes('睡觉')) {
      possibleActors.push({ speaker: 'mom', status: momStatus });
    }

    // 30%概率爸爸主动，30%概率妈妈主动，10%两人都主动，30%没人主动
    const rand = Math.random();
    let actorsToAct: Array<{ speaker: string; status: ParentStatusInfo }> = [];
    
    if (possibleActors.length >= 2) {
      if (rand < 0.3) actorsToAct = [possibleActors[0]];
      else if (rand < 0.6) actorsToAct = [possibleActors[1]];
      else if (rand < 0.7) actorsToAct = possibleActors;
      // 0.7-1.0: 无人主动
    } else if (possibleActors.length === 1) {
      if (rand < 0.4) actorsToAct = [possibleActors[0]];
    }

    if (actorsToAct.length === 0) {
      return new Response(JSON.stringify({ 
        shouldAct: false, 
        reason: 'AI自主选择不联系',
        messages: [] 
      }), {
        headers: { 'Content-Type': 'application/json' },
      });
    }

    // 为每个主动的家长生成消息
    const customHeaders = HeaderUtils.extractForwardHeaders(request.headers);
    const config = new Config();
    const client = new LLMClient(config, customHeaders);

    // 构建最近的对话上下文
    const historyText = recentMessages
      .slice(-10)
      .map((m: { from: string; text: string }) => {
        const nameMap: Record<string, string> = { me: '米米', dad: '爸爸', mom: '妈咪', system: '系统' };
        return `[${nameMap[m.from] || m.from}] ${m.text}`;
      })
      .join('\n');

    for (const actor of actorsToAct) {
      const prompt = buildHeartbeatPrompt(actor.speaker, actor.status, timeStr, historyText, currentApp);
      
      const messages: Array<{ role: 'system' | 'user'; content: string }> = [
        { role: 'system', content: prompt },
        { role: 'user', content: `现在是${timeStr}，你正在${actor.status.activity}。决定一下要不要主动联系米米？如果想联系，直接写你想说的话（一句话，30字以内）。如果不想，只输出[NO_ACTION]。` },
      ];

      try {
        let fullText = '';
        const stream = client.stream(messages, {
          model: 'doubao-seed-2-0-lite-260215',
          temperature: 0.85,
        });

        for await (const chunk of stream) {
          if (chunk.content) {
            fullText += chunk.content.toString();
          }
        }

        const trimmed = fullText.trim();
        
        // AI选择不发消息
        if (trimmed.startsWith('[NO_ACTION]')) {
          continue;
        }

        // 清理AI可能加的前缀
        let cleanText = trimmed
          .replace(/^(田雷|田栩宁|梓渝|郑朋|爸爸|妈咪)[：:]\s*/, '')
          .replace(/^["「『]|["」』]$/g, '')
          .trim();

        if (cleanText.length > 0 && cleanText.length <= 50) {
          results.push({ speaker: actor.speaker, text: cleanText });
        }
      } catch (err) {
        console.error('Heartbeat generate error:', err);
        // 失败时使用默认消息
        const defaults = actor.speaker === 'dad' 
          ? ['在干嘛呢', '吃饭了没', '想你了', '作业写完了没']
          : ['宝贝在干嘛呀', '妈咪想你了', '今天开心吗', '吃水果了没'];
        results.push({ speaker: actor.speaker, text: defaults[Math.floor(Math.random() * defaults.length)] });
      }
    }

    return new Response(JSON.stringify({ 
      shouldAct: results.length > 0, 
      messages: results 
    }), {
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Heartbeat API error:', error);
    return new Response(JSON.stringify({ error: '服务器错误' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
}
