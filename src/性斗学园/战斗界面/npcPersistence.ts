import { filterNpcSkillIds, type SkillFamily } from './npcSkillPools';

export const CHAT_NPC_PROFILES_KEY = '性斗学园NPC战斗档案';

export interface NpcBattleProfile {
  level: number;
  skillIds: string[];
  family?: SkillFamily;
}

function readChatVariables(): Record<string, any> {
  try {
    const api = window as any;
    return typeof api.getVariables === 'function' ? api.getVariables({ type: 'chat' }) || {} : {};
  } catch {
    return {};
  }
}

function readProfiles(): Record<string, NpcBattleProfile> {
  const raw = readChatVariables()[CHAT_NPC_PROFILES_KEY];
  return raw && typeof raw === 'object' && !Array.isArray(raw) ? raw : {};
}

function writeProfiles(profiles: Record<string, NpcBattleProfile>): boolean {
  try {
    const api = window as any;
    if (typeof api.insertOrAssignVariables !== 'function') return false;
    api.insertOrAssignVariables({ [CHAT_NPC_PROFILES_KEY]: profiles }, { type: 'chat' });
    return true;
  } catch {
    return false;
  }
}

export function getNpcBattleProfile(key: string): NpcBattleProfile | null {
  const profiles = readProfiles();
  let profilesChanged = false;

  // 任意 NPC 档案被读取时一并清理旧版 e_basic_* 技能，避免未遭遇的旧档案继续污染技能池。
  Object.entries(profiles).forEach(([profileKey, candidate]) => {
    if (!candidate || !Array.isArray(candidate.skillIds)) return;
    const cleanedSkillIds = filterNpcSkillIds(candidate.skillIds);
    if (cleanedSkillIds.length === candidate.skillIds.length) return;
    profiles[profileKey] = { ...candidate, skillIds: cleanedSkillIds };
    profilesChanged = true;
  });

  const profile = profiles[key];
  if (!profile || !Array.isArray(profile.skillIds)) {
    if (profilesChanged) writeProfiles(profiles);
    return null;
  }
  const level = Math.max(20, Math.min(100, Math.round(Number(profile.level) || 20)));
  const family = ['hand', 'oral', 'foot', 'chest', 'ride', 'tool', 'mental'].includes(profile.family || '')
    ? (profile.family as SkillFamily)
    : undefined;
  const skillIds = filterNpcSkillIds(profile.skillIds);
  const normalizedProfile = { level, skillIds, family };

  // 迁移旧档案：早期版本会把 e_basic_* 等通用技能写入 NPC 档案。
  if (
    skillIds.length !== profile.skillIds.length ||
    level !== Number(profile.level) ||
    family !== profile.family
  ) {
    profiles[key] = normalizedProfile;
    profilesChanged = true;
  }

  if (profilesChanged) writeProfiles(profiles);

  return normalizedProfile;
}

export function saveNpcBattleProfile(key: string, profile: NpcBattleProfile): boolean {
  const profiles = readProfiles();
  profiles[key] = {
    level: Math.max(20, Math.min(100, Math.round(profile.level))),
    skillIds: filterNpcSkillIds(profile.skillIds),
    family: profile.family,
  };
  return writeProfiles(profiles);
}

export function getOrCreateNpcBattleProfile(key: string, requestedLevel: number, skillIds: string[]): NpcBattleProfile {
  const existing = getNpcBattleProfile(key);
  if (existing) return existing;
  const profile = { level: Math.max(20, Math.min(100, Math.round(requestedLevel))), skillIds: [...new Set(skillIds)] };
  saveNpcBattleProfile(key, profile);
  return profile;
}
