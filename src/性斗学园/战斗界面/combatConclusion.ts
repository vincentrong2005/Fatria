import { getCGImageKey, unlockCharacterCGKey } from '../shared/cgUnlockStore';
import { selectCGEvent } from './data/cgConfig';
import type { CombatLogEntry, TurnState } from './types';

export interface CombatCGSelection {
  imageUrl: string | null;
  description: string;
  eventName: string | null;
  cgKey: string | null;
  unlockedNewCG: boolean;
}

export interface PostBattleRecoveryResult {
  oldPleasure: number;
  newPleasure: number;
  oldStamina: number;
  newStamina: number;
  staminaIncrease: number;
}

export interface ConclusionLog {
  message: string;
  type: CombatLogEntry['type'];
}

export function buildCombatEndContext(phase: TurnState['phase']): string {
  if (phase === 'victory') {
    return '获得胜利';
  }
  if (phase === 'defeat') {
    return '败北';
  }
  return '战斗结束';
}

export async function selectCombatCG(params: {
  enemyName: string;
  playerGender: '男' | '女';
  phase: TurnState['phase'];
  isExorcismBattle?: boolean;
}): Promise<CombatCGSelection> {
  // 驱魔 Boss 会使用“堕落风音”“堕落铃音”等阶段显示名。普通 CG
  // 选择器的别名/包含匹配会把它们误识别成原角色，因此驱魔战不进入普通 CG 池。
  if (params.isExorcismBattle) {
    return {
      imageUrl: null,
      description: '',
      eventName: null,
      cgKey: null,
      unlockedNewCG: false,
    };
  }

  const cgResult = selectCGEvent(params.enemyName, params.playerGender, params.phase === 'victory');
  if (!cgResult) {
    return {
      imageUrl: null,
      description: '',
      eventName: null,
      cgKey: null,
      unlockedNewCG: false,
    };
  }

  const cgKey = getCGImageKey(cgResult.event.id, cgResult.imageIndex);
  return {
    imageUrl: cgResult.imageUrl,
    description: cgResult.description,
    eventName: cgResult.event.name,
    cgKey,
    unlockedNewCG: await unlockCharacterCGKey(params.enemyName, cgKey),
  };
}

export function createPostBattleRecoveryLogs(result: PostBattleRecoveryResult | null): ConclusionLog[] {
  if (!result) {
    return [];
  }

  return [
    {
      message: `战斗结算：快感 ${result.oldPleasure} → ${result.newPleasure} (减半)`,
      type: 'info',
    },
    {
      message: `战斗结算：耐力 ${result.oldStamina} → ${result.newStamina} (+${result.staminaIncrease})`,
      type: 'info',
    },
    {
      message: '战斗结算完成',
      type: 'info',
    },
  ];
}
