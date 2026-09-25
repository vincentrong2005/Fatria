export const CHAT_COMBAT_SETTINGS_KEY = '性斗学园战斗设置';
export const ENEMY_TRAITS_ENABLED_KEY = '启用敌人词条';

type ChatVariables = Record<string, any>;

function getChatVariables(): ChatVariables {
  try {
    const api = window as any;
    return typeof api.getVariables === 'function' ? api.getVariables({ type: 'chat' }) || {} : {};
  } catch (error) {
    console.warn('[战斗设置] 读取聊天变量失败', error);
    return {};
  }
}

export function isEnemyTraitsEnabled(): boolean {
  const value = getChatVariables()?.[CHAT_COMBAT_SETTINGS_KEY]?.[ENEMY_TRAITS_ENABLED_KEY];
  return value === undefined ? true : value === true;
}

export function setEnemyTraitsEnabled(enabled: boolean): boolean {
  try {
    const api = window as any;
    if (typeof api.insertOrAssignVariables !== 'function') return false;
    const current = getChatVariables()?.[CHAT_COMBAT_SETTINGS_KEY];
    api.insertOrAssignVariables(
      {
        [CHAT_COMBAT_SETTINGS_KEY]: {
          ...(current && typeof current === 'object' ? current : {}),
          [ENEMY_TRAITS_ENABLED_KEY]: enabled,
        },
      },
      { type: 'chat' },
    );
    const event = new CustomEvent('xuedou:enemy-traits-changed', { detail: { enabled } });
    window.dispatchEvent(event);
    if (window.parent && window.parent !== window) {
      window.parent.dispatchEvent(new CustomEvent('xuedou:enemy-traits-changed', { detail: { enabled } }));
    }
    return true;
  } catch (error) {
    console.warn('[战斗设置] 写入聊天变量失败', error);
    return false;
  }
}

export function subscribeEnemyTraitsSetting(listener: (enabled: boolean) => void): () => void {
  const handler = (event: Event) => listener(Boolean((event as CustomEvent<{ enabled?: boolean }>).detail?.enabled));
  window.addEventListener('xuedou:enemy-traits-changed', handler);
  const parentWindow = window.parent && window.parent !== window ? window.parent : null;
  parentWindow?.addEventListener('xuedou:enemy-traits-changed', handler);
  return () => {
    window.removeEventListener('xuedou:enemy-traits-changed', handler);
    parentWindow?.removeEventListener('xuedou:enemy-traits-changed', handler);
  };
}
