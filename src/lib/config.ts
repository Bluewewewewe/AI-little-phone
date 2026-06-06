// AI 模型配置 - 双模型策略
// PRO: 旗舰级，活人感最强，用于聊天/朋友圈等用户直接交互场景
// V3: 性价比高，用于心跳/自动互动等后台场景
export const MODEL_PRO = 'doubao-seed-2-0-pro-260215';
export const MODEL_V3 = 'deepseek-v3-2-251201';

// 根据场景获取模型
export function getModelForScene(scene: 'chat' | 'moments' | 'heartbeat' | 'auto'): string {
  switch (scene) {
    case 'chat':      // 私聊/家庭群 - 用户直接交互
    case 'moments':   // 朋友圈评论 - 用户直接交互
      return MODEL_PRO;
    case 'heartbeat': // 心跳主动消息
    case 'auto':      // 自动点赞评论
      return MODEL_V3;
    default:
      return MODEL_V3;
  }
}

export function getConfig() {
  return {
    version: 'V4.0',
    chapters: 6,
    currentChapter: 1,
  };
}
