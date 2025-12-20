import {
  BookOpen,
  Crown,
  Dice5,
  Droplets,
  Feather,
  Ghost,
  GitBranch,
  Heart,
  Scroll,
  Shield,
  Sparkles,
  Sword,
  User,
  Zap,
} from 'lucide-react';
import React, { useEffect, useState } from 'react';
import { BASE_STAT, CharacterData, MAX_STAT_POINTS, Race, StartingSkill, Stats } from '../types';
import { Frame } from './Ornaments';

interface CharacterCreationProps {
  onStartGame: (data: CharacterData) => void;
  onRequestModal: (modalType: string) => void;
}

const initialStats: Stats = {
  strength: BASE_STAT,
  agility: BASE_STAT,
  intelligence: BASE_STAT,
  constitution: BASE_STAT,
  spirit: BASE_STAT,
  fortune: BASE_STAT,
};

// 按种族分类的被动技能：只保留有特殊种族特性的被动技能（不可取消）
// 注意：不包含需要实时计算的百分比被动技能
const RACE_PASSIVE_SKILLS: Record<Race, StartingSkill[]> = {
  [Race.HUMAN]: [], // 人类没有特殊被动技能
  [Race.DEMON]: [], // 魔族基础种族没有特殊被动技能，只有亚种有
  [Race.ELF]: [], // 精灵基础种族没有特殊被动技能，只有亚种有
  [Race.DEMI_HUMAN]: [], // 亚人基础种族没有特殊被动技能，只有亚种有
  [Race.WINGED]: [
    {
      id: 'winged-hollow-bones-passive',
      name: '中空骨骼',
      level: '中阶',
      skillType: '被动',
      description: '翼族拥有中空轻盈的骨骼，适合飞行。',
      effect: '骨骼中空轻盈，无法适应高重力环境，在高重力环境下所有属性大幅降低。',
    },
    {
      id: 'winged-wind-affinity-passive',
      name: '风元素亲和',
      level: '低阶',
      skillType: '被动',
      description: '翼族天生掌握风元素。',
      effect: '天生掌握风元素，所有风系魔法效果提升。',
    },
  ],
  [Race.SEA_FOLK]: [], // 海族基础种族没有特殊被动技能，只有亚种有
};

// 按亚种分类的被动技能：只保留有特殊种族特性的被动技能（不可取消）
// 注意：不包含需要实时计算的百分比被动技能
const SUBRACE_PASSIVE_SKILLS: Partial<Record<Race, Record<string, StartingSkill[]>>> = {
  [Race.DEMON]: {
    炎魔: [
      {
        id: 'flame-demon-fire-immunity-passive',
        name: '火焰免疫',
        level: '高阶',
        skillType: '被动',
        description: '炎魔天生免疫火焰伤害。',
        effect: '完全免疫火焰伤害，但受到的水系伤害翻倍。',
      },
      {
        id: 'flame-demon-death-explosion-passive',
        name: '死亡自爆',
        level: '极阶',
        skillType: '被动',
        description: '炎魔在死亡时会引发剧烈的火焰爆炸。',
        effect: '死亡时对周围所有敌人造成巨额火焰伤害。',
      },
      {
        id: 'flame-demon-water-weakness-passive',
        name: '水系弱点',
        level: '低阶',
        skillType: '被动',
        description: '炎魔对水系伤害极其脆弱。',
        effect: '受到的水系伤害翻倍。',
      },
    ],
    魅魔: [
      {
        id: 'succubus-charm-resistance-passive',
        name: '魅惑抗性',
        level: '中阶',
        skillType: '被动',
        description: '魅魔对精神控制类技能具有抗性。',
        effect: '精神控制类技能对其效果减半，但物理防御力降低。',
      },
    ],
    恶魔: [
      {
        id: 'demon-chaos-nature-passive',
        name: '混沌本质',
        level: '中阶',
        skillType: '被动',
        description: '恶魔拥有混乱的本质，伤害不可预测。',
        effect: '所有伤害波动范围增加，但受到的秩序系伤害增加。',
      },
    ],
    石像鬼: [
      {
        id: 'gargoyle-stone-skin-passive',
        name: '硬质皮肤',
        level: '中阶',
        skillType: '被动',
        description: '石像鬼拥有坚硬的石质皮肤。',
        effect: '物理防御力大幅提升，但移动速度降低，火焰抗性降低。',
      },
    ],
    影魔: [
      {
        id: 'shadow-demon-light-weakness-passive',
        name: '光系弱点',
        level: '低阶',
        skillType: '被动',
        description: '影魔对光属性伤害极其脆弱。',
        effect: '受到的光属性伤害翻倍。',
      },
    ],
    吸血鬼: [
      {
        id: 'vampire-sun-weakness-passive',
        name: '阳光弱点',
        level: '低阶',
        skillType: '被动',
        description: '吸血鬼在阳光下会持续受到伤害。',
        effect: '在阳光下时持续受到光属性伤害，所有属性降低。',
      },
      {
        id: 'vampire-blood-law-passive',
        name: '鲜血法则',
        level: '高阶',
        skillType: '被动',
        description: '吸血鬼体内无魔力储存回路，无法回复魔力值。',
        effect: '体内无魔力储存回路，无法回复魔力值。施法时强制扣除生命值（血液）代替魔力消耗。',
      },
      {
        id: 'vampire-regeneration-ability-passive',
        name: '超强再生',
        level: '高阶',
        skillType: '被动',
        description: '吸血鬼拥有极强的肉体再生能力和吸血回复能力。',
        effect: '拥有极强的肉体再生能力和吸血回复能力。',
      },
    ],
    巫妖: [
      {
        id: 'lich-undead-passive',
        name: '不死之身',
        level: '高阶',
        skillType: '被动',
        description: '巫妖是不死生物，对许多伤害具有抗性。',
        effect: '免疫毒素、疾病、即死效果，但受到的神圣伤害翻倍。',
      },
      {
        id: 'lich-phylactery-passive',
        name: '命匣',
        level: '极阶',
        skillType: '被动',
        description: '巫妖拥有命匣，只要命匣不毁就能重生。',
        effect: '死亡时可以在命匣位置重生，但重生后所有属性大幅降低。',
      },
    ],
    幽魂: [
      {
        id: 'wraith-incorporeal-passive',
        name: '虚体',
        level: '高阶',
        skillType: '被动',
        description: '幽魂是虚体生物，物理攻击难以伤害。',
        effect: '物理伤害大幅减少，但魔法伤害增加，无法使用物理技能。',
      },
    ],
    不死者: [
      {
        id: 'undead-persistence-passive',
        name: '不死意志',
        level: '高阶',
        skillType: '被动',
        description: '不死者拥有顽强的生命力。',
        effect: '免疫即死效果，生命值归零时不会立即死亡，但受到的神圣伤害增加。',
      },
    ],
    狼人: [
      {
        id: 'werewolf-silver-weakness-passive',
        name: '银质弱点',
        level: '低阶',
        skillType: '被动',
        description: '狼人对银质武器极其脆弱。',
        effect: '受到银质武器伤害时伤害翻倍，且无法再生。',
      },
    ],
  },
  [Race.ELF]: {
    高等精灵: [
      {
        id: 'high-elf-royal-bloodline-passive',
        name: '皇族血统',
        level: '极阶',
        skillType: '被动',
        description: '高等精灵拥有皇族血统，魔力亲和度极高。',
        effect: '魔力亲和度极高，成年的高等精灵无需吟唱即可释放中阶魔法。',
      },
      {
        id: 'high-elf-frail-body-passive',
        name: '孱弱之躯',
        level: '低阶',
        skillType: '被动',
        description: '高等精灵过度依赖魔法，肉体极其孱弱。',
        effect: '肉体极其孱弱，物理防御力大幅降低。',
      },
    ],
  },
  [Race.SEA_FOLK]: {
    塞壬: [
      {
        id: 'siren-song-control-passive',
        name: '歌声控制',
        level: '中阶',
        skillType: '被动',
        description: '塞壬能够通过歌声通过水波传递精神控制效果。',
        effect: '能够通过歌声通过水波传递精神控制效果，声音类技能效果大幅提升。',
      },
    ],
    鲨人: [
      {
        id: 'shark-people-bloodthirsty-passive',
        name: '嗜血',
        level: '中阶',
        skillType: '被动',
        description: '鲨人嗜血，在水中嗅到血腥味会进入"狂暴"状态。',
        effect: '在水中嗅到血腥味会进入"狂暴"状态，痛觉消失，攻击力和速度大幅提升。',
      },
    ],
  },
};

// 按种族分类的预设技能：每个种族固定8个技能（2初阶+4中阶+2高阶）
const RACE_SKILLS: Record<Race, StartingSkill[]> = {
  [Race.HUMAN]: [
    {
      id: 'human-adaptive-strike',
      name: '适应性斩击',
      level: '初阶',
      skillType: '物理',
      description: '根据对手的防御姿态灵活调整攻击角度，寻找破绽。',
      cost: '12 点体力',
      effect: '对单体造成物理伤害，若目标处于防御状态则伤害提升。',
    },
    {
      id: 'human-basic-heal',
      name: '基础治疗',
      level: '初阶',
      skillType: '魔法',
      description: '运用基础的治愈魔法，恢复自身或队友的生命值。',
      cost: '10 点魔力',
      effect: '恢复目标少量生命值，可对自己或友方使用。',
    },
    {
      id: 'human-arcane-missile',
      name: '奥术飞弹',
      level: '中阶',
      skillType: '魔法',
      description: '凝聚奥术能量形成多枚追踪飞弹，自动锁定目标。',
      cost: '25 点魔力',
      effect: '发射3-5枚飞弹，每枚造成中等魔法伤害，难以闪避。',
    },
    {
      id: 'human-combat-roll',
      name: '战斗翻滚',
      level: '中阶',
      skillType: '物理',
      description: '快速翻滚躲避攻击，并在翻滚过程中寻找反击机会。',
      cost: '22 点体力',
      effect: '短时间内大幅提升闪避率，翻滚后可立即反击。',
    },
    {
      id: 'human-inspire',
      name: '鼓舞士气',
      level: '中阶',
      skillType: '魔法',
      description: '用言语和气势激励队友，提升整体战斗力。',
      cost: '30 点魔力',
      effect: '提升范围内友方的攻击力和防御力，持续一段时间。',
    },
    {
      id: 'human-shield-bash',
      name: '盾击',
      level: '中阶',
      skillType: '物理',
      description: '用盾牌猛击敌人，造成伤害并可能打断对方动作。',
      cost: '28 点体力',
      effect: '对单体造成物理伤害，有概率打断目标正在进行的技能。',
    },
    {
      id: 'human-mastery',
      name: '技艺精通',
      level: '高阶',
      skillType: '物理',
      description: '将多年训练的技巧融会贯通，使下一次攻击威力倍增。',
      cost: '45 点体力',
      effect: '下一次物理攻击伤害翻倍，并附带额外效果。',
    },
    {
      id: 'human-arcane-burst',
      name: '奥术爆发',
      level: '高阶',
      skillType: '魔法',
      description: '释放强大的奥术能量，对范围内敌人造成巨额伤害。',
      cost: '60 点魔力',
      effect: '对范围内所有敌人造成巨额魔法伤害，无视部分魔法抗性。',
    },
  ],
  [Race.DEMON]: [
    {
      id: 'demon-dark-bolt',
      name: '暗影箭',
      level: '初阶',
      skillType: '魔法',
      description: '凝聚黑暗能量形成箭矢，穿透敌人的防御。',
      cost: '12 点魔力',
      effect: '对单体造成暗属性魔法伤害，无视部分魔法抗性。',
    },
    {
      id: 'demon-claw-strike',
      name: '恶魔之爪',
      level: '初阶',
      skillType: '物理',
      description: '用锋利的爪子撕裂敌人，造成持续流血伤害。',
      cost: '10 点体力',
      effect: '对单体造成物理伤害，并附加流血状态。',
    },
    {
      id: 'demon-fear-aura',
      name: '恐惧光环',
      level: '中阶',
      skillType: '魔法',
      description: '释放令人战栗的黑暗气息，削弱敌人的战斗意志。',
      cost: '28 点魔力',
      effect: '降低周围敌人的攻击力和命中率，持续一段时间。',
    },
    {
      id: 'demon-blood-drain',
      name: '生命汲取',
      level: '中阶',
      skillType: '魔法',
      description: '从敌人身上汲取生命力，转化为自己的生命值。',
      cost: '32 点魔力',
      effect: '对单体造成魔法伤害，并将伤害的30%转化为自身生命。',
    },
    {
      id: 'demon-inferno',
      name: '地狱烈焰',
      level: '中阶',
      skillType: '魔法',
      description: '召唤来自深渊的火焰，焚烧一切敌人。',
      cost: '35 点魔力',
      effect: '对范围内多个目标造成高额火焰伤害，并附加灼烧状态。',
    },
    {
      id: 'demon-sacrifice',
      name: '生命献祭',
      level: '中阶',
      skillType: '魔法',
      description: '消耗自身生命值，大幅提升魔法威力。',
      cost: '20 点生命值',
      effect: '消耗生命值，下一次魔法攻击伤害翻倍，并提升魔法穿透力。',
    },
    {
      id: 'demon-berserker-rage',
      name: '狂暴之怒',
      level: '高阶',
      skillType: '物理',
      description: '进入狂暴状态，大幅提升攻击速度和伤害。',
      cost: '50 点体力',
      effect: '短时间内大幅提升物理攻击力和攻击速度，但防御力下降。',
    },
    {
      id: 'demon-soul-bind',
      name: '灵魂束缚',
      level: '高阶',
      skillType: '魔法',
      description: '用黑暗魔法束缚敌人的灵魂，使其行动受限。',
      cost: '65 点魔力',
      effect: '对单体造成魔法伤害，并使其移动速度和攻击速度大幅下降。',
    },
  ],
  [Race.ELF]: [
    {
      id: 'elf-nature-bolt',
      name: '自然之箭',
      level: '初阶',
      skillType: '魔法',
      description: '凝聚自然能量形成箭矢，精准命中目标。',
      cost: '10 点魔力',
      effect: '对单体造成自然属性魔法伤害，命中率极高。',
    },
    {
      id: 'elf-forest-step',
      name: '森林步法',
      level: '初阶',
      skillType: '物理',
      description: '在森林中如履平地，快速移动并提升闪避。',
      cost: '12 点体力',
      effect: '短时间内大幅提升移动速度和闪避率。',
    },
    {
      id: 'elf-healing-light',
      name: '治愈之光',
      level: '中阶',
      skillType: '魔法',
      description: '召唤温和的治愈之光，恢复生命值并驱散负面状态。',
      cost: '28 点魔力',
      effect: '恢复目标中量生命值，并移除一个负面状态。',
    },
    {
      id: 'elf-arrow-rain',
      name: '箭雨',
      level: '中阶',
      skillType: '物理',
      description: '向天空射出大量箭矢，如雨点般覆盖敌人。',
      cost: '32 点体力',
      effect: '对范围内多个目标造成物理伤害，难以完全躲避。',
    },
    {
      id: 'elf-nature-shield',
      name: '自然护盾',
      level: '中阶',
      skillType: '魔法',
      description: '召唤自然之力形成护盾，吸收伤害并反弹部分攻击。',
      cost: '30 点魔力',
      effect: '为自己或友方施加护盾，吸收一定伤害并反弹部分物理攻击。',
    },
    {
      id: 'elf-wind-arrow',
      name: '风之箭',
      level: '中阶',
      skillType: '魔法',
      description: '用风元素强化箭矢，造成风属性伤害。',
      cost: '25 点魔力',
      effect: '对单体造成风属性魔法伤害，有概率击退。',
    },
    {
      id: 'elf-moonbeam',
      name: '月华',
      level: '高阶',
      skillType: '魔法',
      description: '引导月光的力量，对敌人造成持续的光属性伤害。',
      cost: '55 点魔力',
      effect: '对单体造成持续的光属性魔法伤害，持续数回合。',
    },
    {
      id: 'elf-ancient-wisdom',
      name: '古老智慧',
      level: '高阶',
      skillType: '魔法',
      description: '运用精灵族传承的古老知识，大幅提升魔法威力。',
      cost: '70 点魔力',
      effect: '下一次魔法攻击伤害翻倍，并提升魔法穿透力。',
    },
  ],
  [Race.DEMI_HUMAN]: [
    {
      id: 'demi-beast-sense',
      name: '野兽直觉',
      level: '初阶',
      skillType: '物理',
      description: '依靠野兽般的直觉预判敌人动作，提前反击。',
      cost: '10 点体力',
      effect: '短时间内提升闪避率和暴击率，成功闪避后可立即反击。',
    },
    {
      id: 'demi-claw-swipe',
      name: '利爪横扫',
      level: '初阶',
      skillType: '物理',
      description: '用锋利的爪子快速横扫，攻击多个敌人。',
      cost: '12 点体力',
      effect: '对前方扇形范围内的多个目标造成物理伤害。',
    },
    {
      id: 'demi-pounce',
      name: '猛扑',
      level: '中阶',
      skillType: '物理',
      description: '像野兽一样猛扑向敌人，造成高额伤害。',
      cost: '28 点体力',
      effect: '快速接近单体目标并造成高额物理伤害，有概率击倒。',
    },
    {
      id: 'demi-roar',
      name: '战吼',
      level: '中阶',
      skillType: '物理',
      description: '发出震慑人心的吼叫，削弱敌人并提升自己。',
      cost: '25 点体力',
      effect: '降低周围敌人的攻击力，同时提升自身的物理攻击力。',
    },
    {
      id: 'demi-fury-strike',
      name: '狂怒连击',
      level: '中阶',
      skillType: '物理',
      description: '进入狂怒状态，连续快速攻击敌人。',
      cost: '35 点体力',
      effect: '对单体进行3-5次连续攻击，每次伤害递增。',
    },
    {
      id: 'demi-beast-form',
      name: '野兽形态',
      level: '中阶',
      skillType: '物理',
      description: '完全释放野兽本能，大幅提升物理能力。',
      cost: '30 点体力',
      effect: '短时间内大幅提升攻击力、攻击速度和移动速度。',
    },
    {
      id: 'demi-bloodlust',
      name: '嗜血',
      level: '高阶',
      skillType: '物理',
      description: '激发体内的野兽本能，攻击时恢复生命值。',
      cost: '50 点体力',
      effect: '短时间内每次攻击都会恢复少量生命值，攻击速度提升。',
    },
    {
      id: 'demi-primal-rage',
      name: '原始狂暴',
      level: '高阶',
      skillType: '物理',
      description: '释放最原始的野兽力量，大幅提升所有物理能力。',
      cost: '65 点体力',
      effect: '大幅提升攻击力、攻击速度、移动速度和暴击率，持续一段时间。',
    },
  ],
  [Race.WINGED]: [
    {
      id: 'winged-wind-blade',
      name: '风刃',
      level: '初阶',
      skillType: '魔法',
      description: '凝聚风元素形成锋利的刀刃，切割敌人。',
      cost: '12 点魔力',
      effect: '对单体造成风属性魔法伤害，有概率造成流血。',
    },
    {
      id: 'winged-aerial-dive',
      name: '俯冲攻击',
      level: '初阶',
      skillType: '物理',
      description: '从空中俯冲而下，利用重力加速攻击敌人。',
      cost: '15 点体力',
      effect: '对单体造成高额物理伤害，伤害随高度增加而提升。',
    },
    {
      id: 'winged-gust',
      name: '强风',
      level: '中阶',
      skillType: '魔法',
      description: '扇动翅膀产生强风，吹飞敌人并造成伤害。',
      cost: '28 点魔力',
      effect: '对前方多个目标造成风属性伤害，并可能击退敌人。',
    },
    {
      id: 'winged-sky-dance',
      name: '天空之舞',
      level: '中阶',
      skillType: '物理',
      description: '在空中优雅地移动，躲避攻击并寻找反击机会。',
      cost: '30 点体力',
      effect: '短时间内大幅提升闪避率，成功闪避后可立即反击。',
    },
    {
      id: 'winged-tornado',
      name: '龙卷风',
      level: '中阶',
      skillType: '魔法',
      description: '召唤强大的龙卷风，席卷范围内的所有敌人。',
      cost: '35 点魔力',
      effect: '对范围内多个目标造成持续的风属性伤害，并可能击飞。',
    },
    {
      id: 'winged-feather-barrage',
      name: '羽箭齐射',
      level: '中阶',
      skillType: '物理',
      description: '将羽毛化为箭矢，同时射出多枚攻击敌人。',
      cost: '32 点体力',
      effect: '对范围内多个目标造成物理伤害，难以完全躲避。',
    },
    {
      id: 'winged-feather-storm',
      name: '羽刃风暴',
      level: '高阶',
      skillType: '物理',
      description: '将羽毛化为利刃，形成风暴攻击敌人。',
      cost: '55 点体力',
      effect: '对范围内多个目标造成大量物理伤害，难以完全躲避。',
    },
    {
      id: 'winged-divine-wind',
      name: '神风',
      level: '高阶',
      skillType: '魔法',
      description: '召唤神圣之风，治愈友方并伤害敌人。',
      cost: '70 点魔力',
      effect: '恢复范围内友方生命值，同时对敌人造成风属性伤害。',
    },
  ],
  [Race.SEA_FOLK]: [
    {
      id: 'sea-water-jet',
      name: '水柱冲击',
      level: '初阶',
      skillType: '魔法',
      description: '压缩水流形成高压水柱，冲击敌人。',
      cost: '10 点魔力',
      effect: '对单体造成水属性魔法伤害，有概率击退。',
    },
    {
      id: 'sea-tidal-wave',
      name: '潮汐冲击',
      level: '初阶',
      skillType: '物理',
      description: '利用潮汐的力量，用身体或武器冲击敌人。',
      cost: '12 点体力',
      effect: '对前方多个目标造成物理伤害，伤害随距离递减。',
    },
    {
      id: 'sea-healing-water',
      name: '治愈之水',
      level: '中阶',
      skillType: '魔法',
      description: '召唤纯净的海水，恢复生命值并清除负面状态。',
      cost: '28 点魔力',
      effect: '恢复目标中量生命值，并移除一个负面状态。',
    },
    {
      id: 'sea-whirlpool',
      name: '漩涡',
      level: '中阶',
      skillType: '魔法',
      description: '在目标位置形成漩涡，持续造成伤害并限制移动。',
      cost: '32 点魔力',
      effect: '对范围内目标造成持续水属性伤害，并降低移动速度。',
    },
    {
      id: 'sea-ink-cloud',
      name: '墨汁云',
      level: '中阶',
      skillType: '魔法',
      description: '释放墨汁形成黑云，遮蔽敌人视线。',
      cost: '25 点魔力',
      effect: '降低范围内敌人的命中率和视野，持续一段时间。',
    },
    {
      id: 'sea-water-shield',
      name: '水盾',
      level: '中阶',
      skillType: '魔法',
      description: '用海水形成护盾，吸收伤害并持续恢复生命。',
      cost: '30 点魔力',
      effect: '为自己或友方施加护盾，吸收伤害并持续恢复生命值。',
    },
    {
      id: 'sea-deep-sea-pressure',
      name: '深海重压',
      level: '高阶',
      skillType: '魔法',
      description: '模拟深海的压力，压迫敌人并造成持续伤害。',
      cost: '55 点魔力',
      effect: '对单体造成持续水属性伤害，并大幅降低其移动和攻击速度。',
    },
    {
      id: 'sea-tsunami',
      name: '海啸',
      level: '高阶',
      skillType: '魔法',
      description: '召唤巨大的海浪，席卷一切敌人。',
      cost: '75 点魔力',
      effect: '对前方大范围内所有目标造成巨额水属性伤害，并可能击倒。',
    },
  ],
};

// 亚种专属技能：每个亚种固定8个技能（2初阶+4中阶+2高阶）
const SUBRACE_SKILLS: Partial<Record<Race, Record<string, StartingSkill[]>>> = {
  [Race.DEMON]: {
    炎魔: [
      {
        id: 'flame-demon-inferno-burst',
        name: '烈焰爆发',
        level: '初阶',
        skillType: '魔法',
        description: '从体内爆发炽热的火焰，灼烧周围敌人。',
        cost: '12 点魔力',
        effect: '对周围多个目标造成火焰伤害，并附加灼烧状态。',
      },
      {
        id: 'flame-demon-fire-claw',
        name: '火焰之爪',
        level: '初阶',
        skillType: '物理',
        description: '用燃烧的利爪撕裂敌人，造成物理和火焰双重伤害。',
        cost: '10 点体力',
        effect: '对单体造成物理伤害和火焰伤害，并附加灼烧。',
      },
      {
        id: 'flame-demon-immolation',
        name: '自焚',
        level: '中阶',
        skillType: '魔法',
        description: '点燃自身，对接触的敌人造成持续火焰伤害。',
        cost: '28 点魔力',
        effect: '短时间内对接触的敌人造成持续火焰伤害，自身免疫火焰。',
      },
      {
        id: 'flame-demon-meteor-strike',
        name: '流星坠击',
        level: '中阶',
        skillType: '魔法',
        description: '召唤燃烧的流星从天而降，轰击目标区域。',
        cost: '35 点魔力',
        effect: '对目标区域造成巨额火焰伤害，有概率击倒敌人。',
      },
      {
        id: 'flame-demon-flame-armor',
        name: '火焰护甲',
        level: '中阶',
        skillType: '魔法',
        description: '用火焰包裹身体，反弹物理攻击并灼烧攻击者。',
        cost: '30 点魔力',
        effect: '提升防御力，反弹部分物理伤害并灼烧攻击者。',
      },
      {
        id: 'flame-demon-fire-blast',
        name: '火焰爆破',
        level: '中阶',
        skillType: '魔法',
        description: '释放强大的火焰能量，对范围内敌人造成伤害。',
        cost: '32 点魔力',
        effect: '对范围内多个目标造成高额火焰伤害，并附加灼烧状态。',
      },
      {
        id: 'flame-demon-phoenix-rebirth',
        name: '凤凰涅槃',
        level: '高阶',
        skillType: '魔法',
        description: '在濒死时爆发火焰，恢复生命值并提升火焰抗性。',
        cost: '60 点魔力',
        effect: '恢复大量生命值，短时间内大幅提升火焰抗性和攻击力。',
      },
      {
        id: 'flame-demon-hellfire',
        name: '地狱之火',
        level: '高阶',
        skillType: '魔法',
        description: '召唤来自地狱的火焰，焚烧一切敌人。',
        cost: '80 点魔力',
        effect: '对范围内所有敌人造成巨额火焰伤害，持续数回合。',
      },
    ],
    魅魔: [
      {
        id: 'succubus-charm',
        name: '魅惑',
        level: '初阶',
        skillType: '魔法',
        description: '用魅惑之力影响敌人，降低其战斗意志。',
        cost: '12 点魔力',
        effect: '降低目标的攻击力和命中率，持续一段时间。',
      },
      {
        id: 'succubus-kiss',
        name: '魅魔之吻',
        level: '初阶',
        skillType: '魔法',
        description: '用魅惑之吻吸取敌人的生命力和魔力。',
        cost: '10 点魔力',
        effect: '对单体造成魔法伤害，并将伤害转化为自身生命和魔力。',
      },
      {
        id: 'succubus-illusion',
        name: '幻象',
        level: '中阶',
        skillType: '魔法',
        description: '创造幻象迷惑敌人，使其攻击错误的目标。',
        cost: '28 点魔力',
        effect: '创造幻象分身，吸引敌人攻击，持续一段时间。',
      },
      {
        id: 'succubus-lust-aura',
        name: '欲望光环',
        level: '中阶',
        skillType: '魔法',
        description: '释放魅惑光环，影响范围内所有敌人的心智。',
        cost: '32 点魔力',
        effect: '降低范围内敌人的攻击力和防御力，持续数回合。',
      },
      {
        id: 'succubus-shadow-dance',
        name: '魅影之舞',
        level: '中阶',
        skillType: '物理',
        description: '用优雅的舞步迷惑敌人，同时进行快速攻击。',
        cost: '30 点体力',
        effect: '对多个目标造成物理伤害，并降低其命中率。',
      },
      {
        id: 'succubus-life-drain',
        name: '生命汲取',
        level: '中阶',
        skillType: '魔法',
        description: '从敌人身上汲取生命力，恢复自身。',
        cost: '25 点魔力',
        effect: '对单体造成魔法伤害，并将伤害的30%转化为自身生命。',
      },
      {
        id: 'succubus-soul-seduction',
        name: '灵魂诱惑',
        level: '高阶',
        skillType: '魔法',
        description: '用强大的魅惑之力完全控制敌人的行动。',
        cost: '60 点魔力',
        effect: '短时间内控制单体敌人，使其攻击友方或无法行动。',
      },
      {
        id: 'succubus-eternal-charm',
        name: '永恒魅惑',
        level: '高阶',
        skillType: '魔法',
        description: '释放最强的魅惑之力，永久影响敌人的心智。',
        cost: '75 点魔力',
        effect: '对单体造成持续魔法伤害，并大幅降低其所有属性。',
      },
    ],
    恶魔: [
      {
        id: 'demon-pure-darkness',
        name: '纯粹黑暗',
        level: '初阶',
        skillType: '魔法',
        description: '释放纯粹的黑暗能量，侵蚀敌人的防御。',
        cost: '12 点魔力',
        effect: '对单体造成暗属性伤害，无视部分魔法抗性。',
      },
      {
        id: 'demon-chaos-strike',
        name: '混沌打击',
        level: '初阶',
        skillType: '物理',
        description: '用混乱的力量攻击敌人，造成不可预测的伤害。',
        cost: '10 点体力',
        effect: '对单体造成随机属性的伤害，伤害波动较大。',
      },
      {
        id: 'demon-corruption',
        name: '腐化',
        level: '中阶',
        skillType: '魔法',
        description: '用黑暗力量腐化敌人，持续削弱其能力。',
        cost: '28 点魔力',
        effect: '对单体造成持续暗属性伤害，并持续降低其属性。',
      },
      {
        id: 'demon-void-blast',
        name: '虚空爆破',
        level: '中阶',
        skillType: '魔法',
        description: '在目标位置创造虚空，造成空间撕裂伤害。',
        cost: '35 点魔力',
        effect: '对范围内多个目标造成巨额暗属性伤害。',
      },
      {
        id: 'demon-soul-reap',
        name: '灵魂收割',
        level: '中阶',
        skillType: '魔法',
        description: '收割敌人的灵魂，恢复自身生命和魔力。',
        cost: '30 点魔力',
        effect: '对单体造成暗属性伤害，并将伤害转化为自身生命和魔力。',
      },
      {
        id: 'demon-fear-aura',
        name: '恐惧光环',
        level: '中阶',
        skillType: '魔法',
        description: '释放令人战栗的黑暗气息，削弱敌人的战斗意志。',
        cost: '32 点魔力',
        effect: '降低周围敌人的攻击力和命中率，持续一段时间。',
      },
      {
        id: 'demon-chaos-form',
        name: '混沌形态',
        level: '高阶',
        skillType: '魔法',
        description: '进入混沌形态，大幅提升所有能力。',
        cost: '65 点魔力',
        effect: '短时间内大幅提升攻击力、防御力和移动速度。',
      },
      {
        id: 'demon-apocalypse',
        name: '末日审判',
        level: '高阶',
        skillType: '魔法',
        description: '召唤末日之力，对范围内所有敌人造成毁灭性打击。',
        cost: '85 点魔力',
        effect: '对范围内所有敌人造成巨额暗属性伤害，有概率即死。',
      },
    ],
    石像鬼: [
      {
        id: 'gargoyle-stone-skin',
        name: '石肤',
        level: '初阶',
        skillType: '物理',
        description: '硬化皮肤，大幅提升物理防御力。',
        cost: '10 点体力',
        effect: '短时间内大幅提升物理防御力，但移动速度下降。',
      },
      {
        id: 'gargoyle-stone-fist',
        name: '石拳',
        level: '初阶',
        skillType: '物理',
        description: '用坚硬的拳头重击敌人，造成高额物理伤害。',
        cost: '12 点体力',
        effect: '对单体造成高额物理伤害，有概率击倒。',
      },
      {
        id: 'gargoyle-petrify',
        name: '石化',
        level: '中阶',
        skillType: '魔法',
        description: '用魔法将敌人暂时石化，使其无法行动。',
        cost: '28 点魔力',
        effect: '使单体敌人进入石化状态，无法行动但防御力提升。',
      },
      {
        id: 'gargoyle-stone-rain',
        name: '石雨',
        level: '中阶',
        skillType: '物理',
        description: '从空中投掷大量石块，覆盖目标区域。',
        cost: '32 点体力',
        effect: '对范围内多个目标造成物理伤害，难以躲避。',
      },
      {
        id: 'gargoyle-stone-armor',
        name: '石甲',
        level: '中阶',
        skillType: '魔法',
        description: '用魔法强化身体，形成坚硬的石甲。',
        cost: '30 点魔力',
        effect: '提升物理和魔法防御力，持续一段时间。',
      },
      {
        id: 'gargoyle-stone-spike',
        name: '石刺',
        level: '中阶',
        skillType: '物理',
        description: '从地面召唤石刺，刺穿敌人。',
        cost: '28 点体力',
        effect: '对范围内多个目标造成物理伤害，有概率造成流血。',
      },
      {
        id: 'gargoyle-immovable',
        name: '不动如山',
        level: '高阶',
        skillType: '物理',
        description: '进入完全防御状态，免疫大部分物理攻击。',
        cost: '55 点体力',
        effect: '短时间内免疫物理伤害，但无法移动和攻击。',
      },
      {
        id: 'gargoyle-mountain-crash',
        name: '山崩',
        level: '高阶',
        skillType: '物理',
        description: '像山崩一样冲击敌人，造成毁灭性伤害。',
        cost: '70 点体力',
        effect: '对前方大范围造成巨额物理伤害，有概率击倒所有目标。',
      },
    ],
    影魔: [
      {
        id: 'shadow-demon-shadow-step',
        name: '影步',
        level: '初阶',
        skillType: '物理',
        description: '融入阴影，瞬间移动到敌人身后。',
        cost: '12 点体力',
        effect: '快速移动到目标身后，下一次攻击伤害提升。',
      },
      {
        id: 'shadow-demon-shadow-bolt',
        name: '暗影箭',
        level: '初阶',
        skillType: '魔法',
        description: '从阴影中射出暗影箭，难以察觉。',
        cost: '10 点魔力',
        effect: '对单体造成暗属性伤害，命中率极高。',
      },
      {
        id: 'shadow-demon-shadow-clone',
        name: '影分身',
        level: '中阶',
        skillType: '魔法',
        description: '创造暗影分身，迷惑敌人并协同攻击。',
        cost: '30 点魔力',
        effect: '创造分身，分身可攻击敌人并吸引火力。',
      },
      {
        id: 'shadow-demon-shadow-bind',
        name: '影缚',
        level: '中阶',
        skillType: '魔法',
        description: '用阴影束缚敌人，限制其行动。',
        cost: '28 点魔力',
        effect: '使单体敌人移动速度和攻击速度大幅下降。',
      },
      {
        id: 'shadow-demon-shadow-merge',
        name: '影合',
        level: '中阶',
        skillType: '魔法',
        description: '与阴影融合，短时间内免疫物理攻击。',
        cost: '32 点魔力',
        effect: '短时间内免疫物理伤害，但魔法伤害增加。',
      },
      {
        id: 'shadow-demon-shadow-strike',
        name: '影击',
        level: '中阶',
        skillType: '物理',
        description: '从阴影中发动快速攻击，造成多段伤害。',
        cost: '30 点体力',
        effect: '对单体进行2-3次快速攻击，每次造成物理伤害。',
      },
      {
        id: 'shadow-demon-shadow-realm',
        name: '影域',
        level: '高阶',
        skillType: '魔法',
        description: '将敌人拖入阴影领域，持续造成伤害。',
        cost: '60 点魔力',
        effect: '对范围内敌人造成持续暗属性伤害，并降低其视野。',
      },
      {
        id: 'shadow-demon-shadow-assassination',
        name: '影杀',
        level: '高阶',
        skillType: '物理',
        description: '从阴影中发动致命一击，造成巨额伤害。',
        cost: '65 点体力',
        effect: '对单体造成巨额物理伤害，若从背后攻击则伤害翻倍。',
      },
    ],
    吸血鬼: [
      {
        id: 'vampire-bite',
        name: '吸血',
        level: '初阶',
        skillType: '物理',
        description: '用尖牙咬住敌人，吸取生命值。',
        cost: '10 点体力',
        effect: '对单体造成物理伤害，并将伤害转化为自身生命。',
      },
      {
        id: 'vampire-bat-swarm',
        name: '蝙蝠群',
        level: '初阶',
        skillType: '魔法',
        description: '召唤蝙蝠群攻击敌人，造成持续伤害。',
        cost: '12 点生命值',
        effect: '对范围内多个目标造成持续物理伤害。',
      },
      {
        id: 'vampire-blood-drain',
        name: '血液汲取',
        level: '中阶',
        skillType: '魔法',
        description: '从敌人身上汲取血液，恢复生命并提升能力。',
        cost: '28 点生命值',
        effect: '对单体造成魔法伤害，恢复自身生命并提升攻击力。',
      },
      {
        id: 'vampire-mist-form',
        name: '雾化',
        level: '中阶',
        skillType: '魔法',
        description: '化为雾气，免疫物理攻击并快速移动。',
        cost: '30 点生命值',
        effect: '短时间内免疫物理伤害，移动速度大幅提升。',
      },
      {
        id: 'vampire-regeneration',
        name: '超速再生',
        level: '中阶',
        skillType: '魔法',
        description: '激发吸血鬼的再生能力，快速恢复生命值。',
        cost: '25 点生命值',
        effect: '持续恢复生命值，持续数回合。',
      },
      {
        id: 'vampire-blood-sacrifice',
        name: '血祭',
        level: '中阶',
        skillType: '魔法',
        description: '消耗自身生命值，大幅提升魔法威力。',
        cost: '20 点生命值',
        effect: '消耗生命值，下一次魔法攻击伤害翻倍，并提升魔法穿透力。',
      },
      {
        id: 'vampire-dominate',
        name: '支配',
        level: '高阶',
        skillType: '魔法',
        description: '用强大的意志力支配敌人，使其服从命令。',
        cost: '60 点生命值',
        effect: '短时间内控制单体敌人，使其攻击友方。',
      },
      {
        id: 'vampire-blood-rage',
        name: '血怒',
        level: '高阶',
        skillType: '物理',
        description: '进入血怒状态，大幅提升攻击力和攻击速度。',
        cost: '55 点体力',
        effect: '短时间内大幅提升攻击力、攻击速度和暴击率。',
      },
    ],
    巫妖: [
      {
        id: 'lich-bone-spike',
        name: '骨刺',
        level: '初阶',
        skillType: '魔法',
        description: '从地面召唤骨刺，刺穿敌人。',
        cost: '12 点魔力',
        effect: '对范围内多个目标造成物理伤害，有概率造成流血。',
      },
      {
        id: 'lich-soul-bolt',
        name: '灵魂箭',
        level: '初阶',
        skillType: '魔法',
        description: '凝聚灵魂能量形成箭矢，攻击敌人灵魂。',
        cost: '10 点魔力',
        effect: '对单体造成暗属性伤害，无视部分魔法抗性。',
      },
      {
        id: 'lich-raise-undead',
        name: '召唤亡灵',
        level: '中阶',
        skillType: '魔法',
        description: '召唤亡灵生物协助战斗。',
        cost: '32 点魔力',
        effect: '召唤1-2个亡灵生物，持续一段时间。',
      },
      {
        id: 'lich-death-curse',
        name: '死亡诅咒',
        level: '中阶',
        skillType: '魔法',
        description: '对敌人施加死亡诅咒，持续削弱其生命。',
        cost: '30 点魔力',
        effect: '对单体造成持续暗属性伤害，持续数回合。',
      },
      {
        id: 'lich-bone-armor',
        name: '骨甲',
        level: '中阶',
        skillType: '魔法',
        description: '用骨头形成护甲，提升防御力。',
        cost: '28 点魔力',
        effect: '提升物理和魔法防御力，持续一段时间。',
      },
      {
        id: 'lich-soul-drain',
        name: '灵魂汲取',
        level: '中阶',
        skillType: '魔法',
        description: '汲取敌人的灵魂，恢复自身生命和魔力。',
        cost: '25 点魔力',
        effect: '对单体造成暗属性伤害，并将伤害转化为自身生命和魔力。',
      },
      {
        id: 'lich-phylactery',
        name: '命匣守护',
        level: '高阶',
        skillType: '魔法',
        description: '激活命匣的力量，大幅提升防御和恢复能力。',
        cost: '65 点魔力',
        effect: '短时间内大幅提升防御力，并持续恢复生命和魔力。',
      },
      {
        id: 'lich-apocalypse',
        name: '亡灵天灾',
        level: '高阶',
        skillType: '魔法',
        description: '召唤大量亡灵，对敌人造成毁灭性打击。',
        cost: '85 点魔力',
        effect: '对范围内所有敌人造成巨额暗属性伤害，并召唤亡灵。',
      },
    ],
    幽魂: [
      {
        id: 'ghost-phantom-strike',
        name: '幻影打击',
        level: '初阶',
        skillType: '物理',
        description: '用虚幻的身体穿过敌人，造成精神伤害。',
        cost: '10 点体力',
        effect: '对单体造成精神属性伤害，无视物理防御。',
      },
      {
        id: 'ghost-possession',
        name: '附身',
        level: '初阶',
        skillType: '魔法',
        description: '附身到敌人身上，控制其行动。',
        cost: '12 点魔力',
        effect: '短时间内控制单体敌人，使其攻击友方。',
      },
      {
        id: 'ghost-fear',
        name: '恐惧',
        level: '中阶',
        skillType: '魔法',
        description: '释放恐惧气息，削弱敌人的战斗意志。',
        cost: '28 点魔力',
        effect: '降低范围内敌人的攻击力、防御力和命中率。',
      },
      {
        id: 'ghost-ethereal',
        name: '虚化',
        level: '中阶',
        skillType: '魔法',
        description: '进入虚化状态，免疫物理攻击。',
        cost: '30 点魔力',
        effect: '短时间内免疫物理伤害，但魔法伤害增加。',
      },
      {
        id: 'ghost-wail',
        name: '哀嚎',
        level: '中阶',
        skillType: '魔法',
        description: '发出令人战栗的哀嚎，震慑敌人。',
        cost: '25 点魔力',
        effect: '对范围内敌人造成精神伤害，并降低其攻击力。',
      },
      {
        id: 'ghost-soul-drain',
        name: '灵魂汲取',
        level: '中阶',
        skillType: '魔法',
        description: '汲取敌人的灵魂，恢复自身生命和魔力。',
        cost: '32 点魔力',
        effect: '对单体造成精神属性伤害，并将伤害转化为自身生命和魔力。',
      },
      {
        id: 'ghost-soul-tear',
        name: '撕魂',
        level: '高阶',
        skillType: '魔法',
        description: '撕裂敌人的灵魂，造成巨额精神伤害。',
        cost: '60 点魔力',
        effect: '对单体造成巨额精神伤害，有概率使其进入混乱状态。',
      },
      {
        id: 'ghost-haunting',
        name: '缠身',
        level: '高阶',
        skillType: '魔法',
        description: '持续纠缠敌人，造成持续伤害并限制行动。',
        cost: '75 点魔力',
        effect: '对单体造成持续精神伤害，并大幅降低其所有属性。',
      },
    ],
    不死者: [
      {
        id: 'undead-zombie-bite',
        name: '僵尸撕咬',
        level: '初阶',
        skillType: '物理',
        description: '用腐烂的牙齿撕咬敌人，造成伤害并可能感染。',
        cost: '10 点体力',
        effect: '对单体造成物理伤害，有概率附加中毒状态。',
      },
      {
        id: 'undead-decay',
        name: '腐朽',
        level: '初阶',
        skillType: '魔法',
        description: '释放腐朽气息，持续削弱敌人。',
        cost: '12 点魔力',
        effect: '对范围内敌人造成持续暗属性伤害，并降低其防御力。',
      },
      {
        id: 'undead-regeneration',
        name: '不死再生',
        level: '中阶',
        skillType: '魔法',
        description: '激发不死之力，快速恢复生命值。',
        cost: '28 点魔力',
        effect: '持续恢复生命值，持续数回合。',
      },
      {
        id: 'undead-plague',
        name: '瘟疫',
        level: '中阶',
        skillType: '魔法',
        description: '释放瘟疫，感染范围内的所有敌人。',
        cost: '32 点魔力',
        effect: '对范围内所有敌人造成持续暗属性伤害，持续数回合。',
      },
      {
        id: 'undead-necrosis',
        name: '坏死',
        level: '中阶',
        skillType: '魔法',
        description: '加速敌人身体的坏死，造成持续伤害。',
        cost: '30 点魔力',
        effect: '对单体造成持续暗属性伤害，并持续降低其最大生命值。',
      },
      {
        id: 'undead-raise-corpse',
        name: '召唤尸体',
        level: '中阶',
        skillType: '魔法',
        description: '召唤不死生物协助战斗。',
        cost: '25 点魔力',
        effect: '召唤1-2个不死生物，持续一段时间。',
      },
      {
        id: 'undead-immortal',
        name: '不死之身',
        level: '高阶',
        skillType: '魔法',
        description: '激活不死之力，短时间内免疫死亡。',
        cost: '60 点魔力',
        effect: '短时间内免疫即死效果，生命值不会低于1。',
      },
      {
        id: 'undead-army',
        name: '不死军团',
        level: '高阶',
        skillType: '魔法',
        description: '召唤大量不死生物，形成军团。',
        cost: '80 点魔力',
        effect: '召唤3-5个不死生物，持续一段时间。',
      },
    ],
    狼人: [
      {
        id: 'werewolf-claw',
        name: '狼爪',
        level: '初阶',
        skillType: '物理',
        description: '用锋利的狼爪撕裂敌人，造成流血伤害。',
        cost: '10 点体力',
        effect: '对单体造成物理伤害，并附加流血状态。',
      },
      {
        id: 'werewolf-howl',
        name: '狼嚎',
        level: '初阶',
        skillType: '物理',
        description: '发出震慑人心的狼嚎，提升自身能力。',
        cost: '12 点体力',
        effect: '提升自身攻击力、攻击速度和移动速度。',
      },
      {
        id: 'werewolf-transform',
        name: '狼化',
        level: '中阶',
        skillType: '物理',
        description: '完全转化为狼形态，大幅提升物理能力。',
        cost: '32 点体力',
        effect: '短时间内大幅提升攻击力、攻击速度和移动速度。',
      },
      {
        id: 'werewolf-frenzy',
        name: '狂暴',
        level: '中阶',
        skillType: '物理',
        description: '进入狂暴状态，连续快速攻击敌人。',
        cost: '30 点体力',
        effect: '对单体进行3-5次连续攻击，每次伤害递增。',
      },
      {
        id: 'werewolf-bloodlust',
        name: '嗜血',
        level: '中阶',
        skillType: '物理',
        description: '激发嗜血本能，攻击时恢复生命值。',
        cost: '28 点体力',
        effect: '短时间内每次攻击都会恢复少量生命值。',
      },
      {
        id: 'werewolf-pounce',
        name: '猛扑',
        level: '中阶',
        skillType: '物理',
        description: '像狼一样猛扑向敌人，造成高额伤害。',
        cost: '25 点体力',
        effect: '快速接近单体目标并造成高额物理伤害，有概率击倒。',
      },
      {
        id: 'werewolf-pack-hunter',
        name: '群猎',
        level: '高阶',
        skillType: '物理',
        description: '像狼群一样协同攻击，对多个敌人造成伤害。',
        cost: '55 点体力',
        effect: '对范围内多个目标造成物理伤害，伤害随目标数量增加。',
      },
      {
        id: 'werewolf-lunar-power',
        name: '月之力',
        level: '高阶',
        skillType: '魔法',
        description: '借助月亮的力量，大幅提升所有能力。',
        cost: '70 点魔力',
        effect: '短时间内大幅提升所有属性，并持续恢复生命值。',
      },
    ],
  },
  [Race.ELF]: {
    高等精灵: [
      {
        id: 'high-elf-arcane-mastery',
        name: '奥术精通',
        level: '初阶',
        skillType: '魔法',
        description: '运用高等精灵的奥术知识，提升魔法威力。',
        cost: '12 点魔力',
        effect: '下一次魔法攻击伤害提升50%，并提升魔法穿透力。',
      },
      {
        id: 'high-elf-arcane-shield',
        name: '奥术护盾',
        level: '初阶',
        skillType: '魔法',
        description: '用奥术能量形成护盾，吸收魔法伤害。',
        cost: '10 点魔力',
        effect: '为自己或友方施加护盾，吸收魔法伤害。',
      },
      {
        id: 'high-elf-arcane-bolt',
        name: '奥术飞弹',
        level: '中阶',
        skillType: '魔法',
        description: '发射多枚奥术飞弹，自动追踪敌人。',
        cost: '30 点魔力',
        effect: '发射5-7枚飞弹，每枚造成中等魔法伤害。',
      },
      {
        id: 'high-elf-time-dilation',
        name: '时间膨胀',
        level: '中阶',
        skillType: '魔法',
        description: '扭曲时间流速，提升自身行动速度。',
        cost: '32 点魔力',
        effect: '短时间内大幅提升攻击速度和移动速度。',
      },
      {
        id: 'high-elf-teleport',
        name: '传送',
        level: '中阶',
        skillType: '魔法',
        description: '瞬间传送到目标位置，躲避攻击。',
        cost: '28 点魔力',
        effect: '瞬间移动到目标位置，并提升下一次攻击的伤害。',
      },
      {
        id: 'high-elf-arcane-barrier',
        name: '奥术屏障',
        level: '中阶',
        skillType: '魔法',
        description: '创造奥术屏障，阻挡敌人的攻击。',
        cost: '25 点魔力',
        effect: '为自己或友方施加屏障，吸收大量伤害。',
      },
      {
        id: 'high-elf-arcane-explosion',
        name: '奥术爆破',
        level: '高阶',
        skillType: '魔法',
        description: '释放强大的奥术能量，对范围内敌人造成巨额伤害。',
        cost: '65 点魔力',
        effect: '对范围内所有敌人造成巨额魔法伤害，无视部分魔法抗性。',
      },
      {
        id: 'high-elf-arcane-nexus',
        name: '奥术核心',
        level: '高阶',
        skillType: '魔法',
        description: '激活奥术核心，大幅提升所有魔法能力。',
        cost: '75 点魔力',
        effect: '短时间内大幅提升魔法攻击力、魔法穿透力和魔力恢复速度。',
      },
    ],
    暗精灵: [
      {
        id: 'dark-elf-shadow-arrow',
        name: '暗影箭',
        level: '初阶',
        skillType: '物理',
        description: '用暗影能量包裹箭矢，造成暗属性伤害。',
        cost: '10 点体力',
        effect: '对单体造成物理和暗属性双重伤害。',
      },
      {
        id: 'dark-elf-poison-blade',
        name: '毒刃',
        level: '初阶',
        skillType: '物理',
        description: '在武器上涂抹剧毒，造成持续伤害。',
        cost: '12 点体力',
        effect: '下一次攻击附加中毒状态，造成持续伤害。',
      },
      {
        id: 'dark-elf-shadow-step',
        name: '暗影步',
        level: '中阶',
        skillType: '物理',
        description: '融入阴影，快速移动到敌人身后。',
        cost: '28 点体力',
        effect: '快速移动到目标身后，下一次攻击伤害翻倍。',
      },
      {
        id: 'dark-elf-curse',
        name: '诅咒',
        level: '中阶',
        skillType: '魔法',
        description: '对敌人施加诅咒，持续削弱其能力。',
        cost: '30 点魔力',
        effect: '对单体造成持续暗属性伤害，并持续降低其属性。',
      },
      {
        id: 'dark-elf-night-veil',
        name: '夜幕',
        level: '中阶',
        skillType: '魔法',
        description: '用暗影遮蔽视野，降低敌人命中率。',
        cost: '25 点魔力',
        effect: '降低范围内敌人的视野和命中率，持续一段时间。',
      },
      {
        id: 'dark-elf-shadow-strike',
        name: '暗影打击',
        level: '中阶',
        skillType: '物理',
        description: '从阴影中发动快速攻击，造成多段伤害。',
        cost: '32 点体力',
        effect: '对单体进行2-3次快速攻击，每次造成物理伤害。',
      },
      {
        id: 'dark-elf-assassination',
        name: '暗杀',
        level: '高阶',
        skillType: '物理',
        description: '从阴影中发动致命一击，造成巨额伤害。',
        cost: '60 点体力',
        effect: '对单体造成巨额物理伤害，若从背后攻击则伤害翻倍。',
      },
      {
        id: 'dark-elf-shadow-realm',
        name: '暗影领域',
        level: '高阶',
        skillType: '魔法',
        description: '创造暗影领域，持续伤害敌人并提升自身能力。',
        cost: '75 点魔力',
        effect: '对范围内敌人造成持续暗属性伤害，并提升自身攻击力。',
      },
    ],
    木精灵: [
      {
        id: 'wood-elf-nature-arrow',
        name: '自然之箭',
        level: '初阶',
        skillType: '物理',
        description: '用自然能量包裹箭矢，造成自然属性伤害。',
        cost: '10 点体力',
        effect: '对单体造成物理和自然属性双重伤害。',
      },
      {
        id: 'wood-elf-entangle',
        name: '缠绕',
        level: '初阶',
        skillType: '魔法',
        description: '召唤藤蔓缠绕敌人，限制其移动。',
        cost: '12 点魔力',
        effect: '使单体敌人无法移动，持续一段时间。',
      },
      {
        id: 'wood-elf-forest-camouflage',
        name: '森林伪装',
        level: '中阶',
        skillType: '物理',
        description: '融入森林环境，大幅提升闪避率。',
        cost: '28 点体力',
        effect: '短时间内大幅提升闪避率，成功闪避后可立即反击。',
      },
      {
        id: 'wood-elf-nature-heal',
        name: '自然治愈',
        level: '中阶',
        skillType: '魔法',
        description: '用自然之力治愈伤口，恢复生命值。',
        cost: '30 点魔力',
        effect: '恢复目标中量生命值，并移除一个负面状态。',
      },
      {
        id: 'wood-elf-tree-sentinel',
        name: '树精守卫',
        level: '中阶',
        skillType: '魔法',
        description: '召唤树精协助战斗，提供防御和攻击。',
        cost: '32 点魔力',
        effect: '召唤1个树精，持续一段时间，可攻击和防御。',
      },
      {
        id: 'wood-elf-nature-shield',
        name: '自然护盾',
        level: '中阶',
        skillType: '魔法',
        description: '召唤自然之力形成护盾，吸收伤害并反弹部分攻击。',
        cost: '25 点魔力',
        effect: '为自己或友方施加护盾，吸收一定伤害并反弹部分物理攻击。',
      },
      {
        id: 'wood-elf-thorn-barrage',
        name: '荆棘弹幕',
        level: '高阶',
        skillType: '魔法',
        description: '召唤大量荆棘，覆盖目标区域。',
        cost: '60 点魔力',
        effect: '对范围内多个目标造成持续自然属性伤害，并降低移动速度。',
      },
      {
        id: 'wood-elf-nature-avatar',
        name: '自然化身',
        level: '高阶',
        skillType: '魔法',
        description: '与自然融为一体，大幅提升所有能力。',
        cost: '75 点魔力',
        effect: '短时间内大幅提升所有属性，并持续恢复生命和魔力。',
      },
    ],
    血精灵: [
      {
        id: 'blood-elf-blood-arrow',
        name: '血箭',
        level: '初阶',
        skillType: '物理',
        description: '用自身血液强化箭矢，造成伤害并恢复生命。',
        cost: '12 点体力',
        effect: '对单体造成物理伤害，并将伤害的20%转化为自身生命。',
      },
      {
        id: 'blood-elf-blood-drain',
        name: '血液汲取',
        level: '初阶',
        skillType: '魔法',
        description: '从敌人身上汲取血液，恢复生命并提升能力。',
        cost: '10 点魔力',
        effect: '对单体造成魔法伤害，恢复自身生命并提升攻击力。',
      },
      {
        id: 'blood-elf-blood-rage',
        name: '血怒',
        level: '中阶',
        skillType: '物理',
        description: '激发血液中的力量，大幅提升攻击力。',
        cost: '30 点体力',
        effect: '短时间内大幅提升攻击力和攻击速度。',
      },
      {
        id: 'blood-elf-blood-shield',
        name: '血盾',
        level: '中阶',
        skillType: '魔法',
        description: '用血液形成护盾，吸收伤害并反弹攻击。',
        cost: '32 点魔力',
        effect: '为自己或友方施加护盾，吸收伤害并反弹部分攻击。',
      },
      {
        id: 'blood-elf-vampiric-strike',
        name: '吸血打击',
        level: '中阶',
        skillType: '物理',
        description: '攻击时汲取敌人生命，恢复自身。',
        cost: '28 点体力',
        effect: '对单体造成物理伤害，并将伤害的30%转化为自身生命。',
      },
      {
        id: 'blood-elf-blood-sacrifice',
        name: '血祭',
        level: '中阶',
        skillType: '魔法',
        description: '消耗自身生命值，大幅提升魔法威力。',
        cost: '20 点生命值',
        effect: '消耗生命值，下一次魔法攻击伤害翻倍，并提升魔法穿透力。',
      },
      {
        id: 'blood-elf-blood-curse',
        name: '血咒',
        level: '高阶',
        skillType: '魔法',
        description: '对敌人施加血咒，持续造成伤害并削弱能力。',
        cost: '65 点魔力',
        effect: '对单体造成持续暗属性伤害，并持续降低其最大生命值。',
      },
      {
        id: 'blood-elf-blood-ritual',
        name: '血祭仪式',
        level: '高阶',
        skillType: '魔法',
        description: '进行血祭仪式，大幅提升所有能力。',
        cost: '80 点魔力',
        effect: '消耗部分生命值，短时间内大幅提升所有属性。',
      },
    ],
    星辰精灵: [
      {
        id: 'star-elf-star-bolt',
        name: '星矢',
        level: '初阶',
        skillType: '魔法',
        description: '凝聚星光形成箭矢，造成光属性伤害。',
        cost: '12 点魔力',
        effect: '对单体造成光属性魔法伤害，命中率极高。',
      },
      {
        id: 'star-elf-starlight',
        name: '星光',
        level: '初阶',
        skillType: '魔法',
        description: '召唤温和的星光，恢复生命值。',
        cost: '10 点魔力',
        effect: '恢复目标少量生命值，并移除一个负面状态。',
      },
      {
        id: 'star-elf-starfall',
        name: '流星雨',
        level: '中阶',
        skillType: '魔法',
        description: '召唤流星雨，覆盖目标区域。',
        cost: '32 点魔力',
        effect: '对范围内多个目标造成光属性伤害，难以完全躲避。',
      },
      {
        id: 'star-elf-constellation',
        name: '星图',
        level: '中阶',
        skillType: '魔法',
        description: '召唤星图，提升友方能力并伤害敌人。',
        cost: '30 点魔力',
        effect: '提升范围内友方的攻击力和防御力，同时对敌人造成光属性伤害。',
      },
      {
        id: 'star-elf-star-shield',
        name: '星盾',
        level: '中阶',
        skillType: '魔法',
        description: '用星光形成护盾，吸收伤害并反弹光属性攻击。',
        cost: '28 点魔力',
        effect: '为自己或友方施加护盾，吸收伤害并反弹光属性攻击。',
      },
      {
        id: 'star-elf-star-blessing',
        name: '星辰祝福',
        level: '中阶',
        skillType: '魔法',
        description: '用星辰之力祝福友方，提升其能力。',
        cost: '25 点魔力',
        effect: '提升范围内友方的攻击力、防御力和移动速度。',
      },
      {
        id: 'star-elf-nova',
        name: '新星',
        level: '高阶',
        skillType: '魔法',
        description: '释放新星爆炸，对范围内所有敌人造成巨额伤害。',
        cost: '65 点魔力',
        effect: '对范围内所有敌人造成巨额光属性伤害，并可能致盲。',
      },
      {
        id: 'star-elf-cosmic-power',
        name: '宇宙之力',
        level: '高阶',
        skillType: '魔法',
        description: '借助宇宙的力量，大幅提升所有魔法能力。',
        cost: '75 点魔力',
        effect: '短时间内大幅提升魔法攻击力、魔法穿透力和魔力恢复速度。',
      },
    ],
    幽魂精灵: [
      {
        id: 'wraith-elf-ghost-arrow',
        name: '幽灵箭',
        level: '初阶',
        skillType: '魔法',
        description: '用幽灵能量形成箭矢，穿透物理防御。',
        cost: '10 点魔力',
        effect: '对单体造成精神属性伤害，无视物理防御。',
      },
      {
        id: 'wraith-elf-phantom-form',
        name: '幻影形态',
        level: '初阶',
        skillType: '魔法',
        description: '进入幻影形态，免疫物理攻击。',
        cost: '12 点魔力',
        effect: '短时间内免疫物理伤害，但魔法伤害增加。',
      },
      {
        id: 'wraith-elf-soul-tear',
        name: '撕魂',
        level: '中阶',
        skillType: '魔法',
        description: '撕裂敌人的灵魂，造成精神伤害。',
        cost: '30 点魔力',
        effect: '对单体造成精神属性伤害，有概率使其进入混乱状态。',
      },
      {
        id: 'wraith-elf-haunting',
        name: '缠身',
        level: '中阶',
        skillType: '魔法',
        description: '持续纠缠敌人，造成持续伤害。',
        cost: '28 点魔力',
        effect: '对单体造成持续精神伤害，并降低其所有属性。',
      },
      {
        id: 'wraith-elf-wail',
        name: '哀嚎',
        level: '中阶',
        skillType: '魔法',
        description: '发出令人战栗的哀嚎，震慑敌人。',
        cost: '25 点魔力',
        effect: '对范围内敌人造成精神伤害，并降低其攻击力。',
      },
      {
        id: 'wraith-elf-soul-drain',
        name: '灵魂汲取',
        level: '中阶',
        skillType: '魔法',
        description: '汲取敌人的灵魂，恢复自身生命和魔力。',
        cost: '32 点魔力',
        effect: '对单体造成精神属性伤害，并将伤害转化为自身生命和魔力。',
      },
      {
        id: 'wraith-elf-ethereal-storm',
        name: '虚灵风暴',
        level: '高阶',
        skillType: '魔法',
        description: '释放虚灵风暴，对范围内所有敌人造成精神伤害。',
        cost: '65 点魔力',
        effect: '对范围内所有敌人造成巨额精神伤害，并降低其攻击力。',
      },
      {
        id: 'wraith-elf-immortal-form',
        name: '不死形态',
        level: '高阶',
        skillType: '魔法',
        description: '进入不死形态，短时间内免疫死亡。',
        cost: '70 点魔力',
        effect: '短时间内免疫即死效果，生命值不会低于1。',
      },
    ],
  },
  [Race.DEMI_HUMAN]: {
    猫人族: [
      {
        id: 'cat-people-claw-strike',
        name: '猫爪',
        level: '初阶',
        skillType: '物理',
        description: '用锋利的猫爪快速攻击，造成多段伤害。',
        cost: '10 点体力',
        effect: '对单体进行2-3次快速攻击，每次造成物理伤害。',
      },
      {
        id: 'cat-people-pounce',
        name: '猛扑',
        level: '初阶',
        skillType: '物理',
        description: '像猫一样猛扑向敌人，造成高额伤害。',
        cost: '12 点体力',
        effect: '快速接近单体目标并造成高额物理伤害，有概率击倒。',
      },
      {
        id: 'cat-people-agility',
        name: '敏捷',
        level: '中阶',
        skillType: '物理',
        description: '激发猫的敏捷本能，大幅提升速度和闪避。',
        cost: '28 点体力',
        effect: '短时间内大幅提升移动速度、攻击速度和闪避率。',
      },
      {
        id: 'cat-people-nine-lives',
        name: '九命',
        level: '中阶',
        skillType: '魔法',
        description: '激活猫的九命传说，短时间内免疫死亡。',
        cost: '30 点魔力',
        effect: '短时间内免疫即死效果，生命值不会低于1。',
      },
      {
        id: 'cat-people-stealth',
        name: '潜行',
        level: '中阶',
        skillType: '物理',
        description: '像猫一样悄无声息地移动，提升闪避和暴击。',
        cost: '25 点体力',
        effect: '短时间内大幅提升闪避率和暴击率，下一次攻击伤害翻倍。',
      },
      {
        id: 'cat-people-claw-barrage',
        name: '利爪弹幕',
        level: '中阶',
        skillType: '物理',
        description: '用极快的速度连续挥爪，造成多段伤害。',
        cost: '32 点体力',
        effect: '对单体进行3-5次快速攻击，每次造成物理伤害。',
      },
      {
        id: 'cat-people-frenzy',
        name: '疯狂连击',
        level: '高阶',
        skillType: '物理',
        description: '进入疯狂状态，连续快速攻击敌人。',
        cost: '60 点体力',
        effect: '对单体进行5-7次连续攻击，每次伤害递增。',
      },
      {
        id: 'cat-people-night-vision',
        name: '夜视',
        level: '高阶',
        skillType: '物理',
        description: '激活夜视能力，在黑暗中也能清晰视物。',
        cost: '70 点体力',
        effect: '短时间内大幅提升命中率和暴击率，无视黑暗环境。',
      },
    ],
    狐人族: [
      {
        id: 'fox-people-fox-fire',
        name: '狐火',
        level: '初阶',
        skillType: '魔法',
        description: '召唤神秘的狐火，灼烧敌人。',
        cost: '12 点魔力',
        effect: '对单体造成火焰伤害，并附加灼烧状态。',
      },
      {
        id: 'fox-people-illusion',
        name: '幻术',
        level: '初阶',
        skillType: '魔法',
        description: '用幻术迷惑敌人，使其攻击错误的目标。',
        cost: '10 点魔力',
        effect: '创造幻象分身，吸引敌人攻击，持续一段时间。',
      },
      {
        id: 'fox-people-charm',
        name: '魅惑',
        level: '中阶',
        skillType: '魔法',
        description: '用魅惑之力影响敌人，降低其战斗意志。',
        cost: '28 点魔力',
        effect: '降低目标的攻击力和命中率，持续一段时间。',
      },
      {
        id: 'fox-people-mirage',
        name: '海市蜃楼',
        level: '中阶',
        skillType: '魔法',
        description: '创造多个幻象，迷惑敌人并协同攻击。',
        cost: '32 点魔力',
        effect: '创造2-3个幻象，幻象可攻击敌人并吸引火力。',
      },
      {
        id: 'fox-people-fox-spirit',
        name: '狐灵',
        level: '中阶',
        skillType: '魔法',
        description: '召唤狐灵协助战斗，提供攻击和防御。',
        cost: '30 点魔力',
        effect: '召唤1个狐灵，持续一段时间，可攻击和防御。',
      },
      {
        id: 'fox-people-illusion-strike',
        name: '幻象打击',
        level: '中阶',
        skillType: '魔法',
        description: '用幻象迷惑敌人，同时发动攻击。',
        cost: '25 点魔力',
        effect: '对单体造成魔法伤害，并降低其命中率。',
      },
      {
        id: 'fox-people-spirit-possession',
        name: '附灵',
        level: '高阶',
        skillType: '魔法',
        description: '用强大的精神力量控制敌人的行动。',
        cost: '65 点魔力',
        effect: '短时间内控制单体敌人，使其攻击友方或无法行动。',
      },
      {
        id: 'fox-people-divine-fox',
        name: '天狐',
        level: '高阶',
        skillType: '魔法',
        description: '激活天狐之力，大幅提升所有魔法能力。',
        cost: '75 点魔力',
        effect: '短时间内大幅提升魔法攻击力、魔法穿透力和魔力恢复速度。',
      },
    ],
    兔人族: [
      {
        id: 'rabbit-people-kick',
        name: '兔踢',
        level: '初阶',
        skillType: '物理',
        description: '用强健的后腿踢击敌人，造成高额伤害。',
        cost: '10 点体力',
        effect: '对单体造成高额物理伤害，有概率击退。',
      },
      {
        id: 'rabbit-people-jump',
        name: '跳跃',
        level: '初阶',
        skillType: '物理',
        description: '利用强大的跳跃能力，快速移动并躲避攻击。',
        cost: '12 点体力',
        effect: '快速移动到目标位置，并提升闪避率。',
      },
      {
        id: 'rabbit-people-speed',
        name: '极速',
        level: '中阶',
        skillType: '物理',
        description: '激发兔子的速度本能，大幅提升移动和攻击速度。',
        cost: '28 点体力',
        effect: '短时间内大幅提升移动速度和攻击速度。',
      },
      {
        id: 'rabbit-people-stampede',
        name: '践踏',
        level: '中阶',
        skillType: '物理',
        description: '像兔子群一样践踏敌人，造成范围伤害。',
        cost: '32 点体力',
        effect: '对范围内多个目标造成物理伤害，有概率击倒。',
      },
      {
        id: 'rabbit-people-rapid-strike',
        name: '快速连击',
        level: '中阶',
        skillType: '物理',
        description: '用极快的速度连续攻击敌人。',
        cost: '30 点体力',
        effect: '对单体进行3-5次快速攻击，每次造成物理伤害。',
      },
      {
        id: 'rabbit-people-dash',
        name: '冲刺',
        level: '中阶',
        skillType: '物理',
        description: '快速冲刺，撞击路径上的敌人。',
        cost: '25 点体力',
        effect: '快速移动到目标位置，并对路径上的敌人造成物理伤害。',
      },
      {
        id: 'rabbit-people-lucky-foot',
        name: '幸运脚',
        level: '高阶',
        skillType: '物理',
        description: '激活兔子的幸运之力，大幅提升暴击率和闪避率。',
        cost: '60 点体力',
        effect: '短时间内大幅提升暴击率和闪避率，暴击伤害翻倍。',
      },
      {
        id: 'rabbit-people-moon-jump',
        name: '月跃',
        level: '高阶',
        skillType: '物理',
        description: '借助月亮的力量，进行超远距离跳跃并造成伤害。',
        cost: '70 点体力',
        effect: '快速移动到目标位置，并对路径上的敌人造成物理伤害。',
      },
    ],
    熊人族: [
      {
        id: 'bear-people-claw',
        name: '熊爪',
        level: '初阶',
        skillType: '物理',
        description: '用巨大的熊爪撕裂敌人，造成高额伤害。',
        cost: '12 点体力',
        effect: '对单体造成高额物理伤害，有概率造成流血。',
      },
      {
        id: 'bear-people-roar',
        name: '熊吼',
        level: '初阶',
        skillType: '物理',
        description: '发出震慑人心的吼叫，削弱敌人并提升自己。',
        cost: '10 点体力',
        effect: '降低周围敌人的攻击力，同时提升自身的物理攻击力。',
      },
      {
        id: 'bear-people-thick-fur',
        name: '厚毛',
        level: '中阶',
        skillType: '物理',
        description: '用厚实的毛发防御，大幅提升物理防御力。',
        cost: '28 点体力',
        effect: '短时间内大幅提升物理防御力，但移动速度下降。',
      },
      {
        id: 'bear-people-rage',
        name: '狂暴',
        level: '中阶',
        skillType: '物理',
        description: '进入狂暴状态，大幅提升攻击力和防御力。',
        cost: '32 点体力',
        effect: '短时间内大幅提升攻击力和防御力，但移动速度下降。',
      },
      {
        id: 'bear-people-hibernation',
        name: '冬眠',
        level: '中阶',
        skillType: '魔法',
        description: '进入冬眠状态，快速恢复生命值。',
        cost: '30 点魔力',
        effect: '持续恢复大量生命值，持续数回合，但无法行动。',
      },
      {
        id: 'bear-people-crush',
        name: '碾压',
        level: '中阶',
        skillType: '物理',
        description: '用巨大的力量碾压敌人，造成高额伤害。',
        cost: '30 点体力',
        effect: '对单体造成巨额物理伤害，有概率击倒。',
      },
      {
        id: 'bear-people-rampage',
        name: '横冲直撞',
        level: '高阶',
        skillType: '物理',
        description: '像熊一样横冲直撞，对路径上的所有敌人造成伤害。',
        cost: '65 点体力',
        effect: '对路径上的所有敌人造成巨额物理伤害，有概率击倒。',
      },
      {
        id: 'bear-people-immovable',
        name: '不动如山',
        level: '高阶',
        skillType: '物理',
        description: '像山一样稳固，免疫大部分物理攻击。',
        cost: '70 点体力',
        effect: '短时间内免疫物理伤害，但无法移动和攻击。',
      },
    ],
    蜥人族: [
      {
        id: 'lizard-people-tail-swipe',
        name: '尾扫',
        level: '初阶',
        skillType: '物理',
        description: '用强壮的尾巴横扫敌人，造成范围伤害。',
        cost: '10 点体力',
        effect: '对前方扇形范围内的多个目标造成物理伤害。',
      },
      {
        id: 'lizard-people-regeneration',
        name: '再生',
        level: '初阶',
        skillType: '魔法',
        description: '激活蜥人的再生能力，快速恢复生命值。',
        cost: '12 点魔力',
        effect: '持续恢复生命值，持续数回合。',
      },
      {
        id: 'lizard-people-camouflage',
        name: '伪装',
        level: '中阶',
        skillType: '物理',
        description: '融入环境，大幅提升闪避率。',
        cost: '28 点体力',
        effect: '短时间内大幅提升闪避率，成功闪避后可立即反击。',
      },
      {
        id: 'lizard-people-poison-bite',
        name: '毒咬',
        level: '中阶',
        skillType: '物理',
        description: '用带毒的牙齿咬住敌人，造成持续伤害。',
        cost: '30 点体力',
        effect: '对单体造成物理伤害，并附加中毒状态。',
      },
      {
        id: 'lizard-people-scale-armor',
        name: '鳞甲',
        level: '中阶',
        skillType: '物理',
        description: '硬化鳞片，大幅提升物理防御力。',
        cost: '32 点体力',
        effect: '短时间内大幅提升物理防御力，并反弹部分物理攻击。',
      },
      {
        id: 'lizard-people-venom-spit',
        name: '毒液喷射',
        level: '中阶',
        skillType: '魔法',
        description: '向敌人喷射毒液，造成范围伤害。',
        cost: '25 点魔力',
        effect: '对前方扇形范围内的多个目标造成毒属性伤害，并附加中毒。',
      },
      {
        id: 'lizard-people-immortal-tail',
        name: '不死之尾',
        level: '高阶',
        skillType: '魔法',
        description: '激活蜥人的断尾再生能力，短时间内免疫死亡。',
        cost: '60 点魔力',
        effect: '短时间内免疫即死效果，生命值不会低于1，并持续恢复生命。',
      },
      {
        id: 'lizard-people-venom-storm',
        name: '毒液风暴',
        level: '高阶',
        skillType: '魔法',
        description: '释放大量毒液，对范围内所有敌人造成持续伤害。',
        cost: '75 点魔力',
        effect: '对范围内所有敌人造成持续毒属性伤害，持续数回合。',
      },
    ],
    蛇人: [
      {
        id: 'snake-people-constrict',
        name: '缠绕',
        level: '初阶',
        skillType: '物理',
        description: '用身体缠绕敌人，造成持续伤害并限制行动。',
        cost: '12 点体力',
        effect: '对单体造成持续物理伤害，并使其无法移动。',
      },
      {
        id: 'snake-people-venom-bite',
        name: '毒咬',
        level: '初阶',
        skillType: '物理',
        description: '用带毒的尖牙咬住敌人，造成高额毒属性伤害。',
        cost: '10 点体力',
        effect: '对单体造成物理伤害，并附加强效中毒状态。',
      },
      {
        id: 'snake-people-shed-skin',
        name: '蜕皮',
        level: '中阶',
        skillType: '魔法',
        description: '通过蜕皮移除所有负面状态，并恢复生命值。',
        cost: '30 点魔力',
        effect: '移除所有负面状态，并恢复中量生命值。',
      },
      {
        id: 'snake-people-venom-spit',
        name: '毒液喷射',
        level: '中阶',
        skillType: '魔法',
        description: '向敌人喷射毒液，造成范围伤害。',
        cost: '28 点魔力',
        effect: '对前方扇形范围内的多个目标造成毒属性伤害，并附加中毒。',
      },
      {
        id: 'snake-people-hypnotize',
        name: '催眠',
        level: '中阶',
        skillType: '魔法',
        description: '用眼神催眠敌人，使其无法行动。',
        cost: '32 点魔力',
        effect: '使单体敌人进入睡眠状态，无法行动，受到攻击后解除。',
      },
      {
        id: 'snake-people-venom-coat',
        name: '毒液涂层',
        level: '中阶',
        skillType: '魔法',
        description: '在身体表面覆盖毒液，接触的敌人会中毒。',
        cost: '25 点魔力',
        effect: '短时间内接触的敌人会中毒，造成持续伤害。',
      },
      {
        id: 'snake-people-death-coil',
        name: '死亡缠绕',
        level: '高阶',
        skillType: '物理',
        description: '用身体完全缠绕敌人，造成巨额伤害。',
        cost: '65 点体力',
        effect: '对单体造成巨额物理伤害，并使其无法行动，持续数回合。',
      },
      {
        id: 'snake-people-venom-aura',
        name: '毒雾',
        level: '高阶',
        skillType: '魔法',
        description: '释放毒雾，对范围内所有敌人造成持续伤害。',
        cost: '80 点魔力',
        effect: '对范围内所有敌人造成持续毒属性伤害，持续数回合。',
      },
    ],
  },
  [Race.SEA_FOLK]: {
    塞壬: [
      {
        id: 'siren-song',
        name: '塞壬之歌',
        level: '初阶',
        skillType: '魔法',
        description: '用美妙的歌声迷惑敌人，降低其战斗意志。',
        cost: '12 点魔力',
        effect: '降低范围内敌人的攻击力和命中率，持续一段时间。',
      },
      {
        id: 'siren-lure',
        name: '诱惑',
        level: '初阶',
        skillType: '魔法',
        description: '用魅惑之力吸引敌人，使其靠近。',
        cost: '10 点魔力',
        effect: '强制单体敌人向自己移动，并降低其攻击力。',
      },
      {
        id: 'siren-water-jet',
        name: '水柱',
        level: '中阶',
        skillType: '魔法',
        description: '压缩水流形成高压水柱，冲击敌人。',
        cost: '28 点魔力',
        effect: '对单体造成水属性伤害，有概率击退。',
      },
      {
        id: 'siren-tidal-wave',
        name: '潮汐',
        level: '中阶',
        skillType: '魔法',
        description: '召唤潮汐，对范围内敌人造成伤害并击退。',
        cost: '32 点魔力',
        effect: '对范围内多个目标造成水属性伤害，并可能击退。',
      },
      {
        id: 'siren-healing-song',
        name: '治愈之歌',
        level: '中阶',
        skillType: '魔法',
        description: '用治愈的歌声恢复友方生命值。',
        cost: '30 点魔力',
        effect: '恢复范围内友方中量生命值，并移除一个负面状态。',
      },
      {
        id: 'siren-charm',
        name: '魅惑',
        level: '中阶',
        skillType: '魔法',
        description: '用魅惑之力影响敌人，降低其战斗意志。',
        cost: '25 点魔力',
        effect: '降低目标的攻击力和命中率，持续一段时间。',
      },
      {
        id: 'siren-enchantment',
        name: '魅惑控制',
        level: '高阶',
        skillType: '魔法',
        description: '用强大的魅惑之力完全控制敌人的行动。',
        cost: '65 点魔力',
        effect: '短时间内控制单体敌人，使其攻击友方或无法行动。',
      },
      {
        id: 'siren-ocean-rage',
        name: '海洋之怒',
        level: '高阶',
        skillType: '魔法',
        description: '召唤海洋的愤怒，对范围内所有敌人造成巨额伤害。',
        cost: '80 点魔力',
        effect: '对范围内所有敌人造成巨额水属性伤害，并可能击倒。',
      },
    ],
    鲨人: [
      {
        id: 'shark-people-bite',
        name: '撕咬',
        level: '初阶',
        skillType: '物理',
        description: '用锋利的牙齿撕咬敌人，造成高额伤害。',
        cost: '12 点体力',
        effect: '对单体造成高额物理伤害，并附加流血状态。',
      },
      {
        id: 'shark-people-blood-scent',
        name: '血腥嗅觉',
        level: '初阶',
        skillType: '物理',
        description: '激活对血液的敏感，大幅提升攻击力和暴击率。',
        cost: '10 点体力',
        effect: '短时间内大幅提升攻击力和暴击率，对流血目标伤害翻倍。',
      },
      {
        id: 'shark-people-frenzy',
        name: '狂暴',
        level: '中阶',
        skillType: '物理',
        description: '进入狂暴状态，连续快速攻击敌人。',
        cost: '32 点体力',
        effect: '对单体进行3-5次连续攻击，每次伤害递增。',
      },
      {
        id: 'shark-people-rampage',
        name: '横冲直撞',
        level: '中阶',
        skillType: '物理',
        description: '像鲨鱼一样横冲直撞，对路径上的所有敌人造成伤害。',
        cost: '35 点体力',
        effect: '对路径上的所有敌人造成物理伤害，有概率击倒。',
      },
      {
        id: 'shark-people-water-dash',
        name: '水冲',
        level: '中阶',
        skillType: '物理',
        description: '在水中快速冲刺，撞击敌人。',
        cost: '30 点体力',
        effect: '快速接近单体目标并造成物理伤害，有概率击倒。',
      },
      {
        id: 'shark-people-blood-frenzy',
        name: '血怒',
        level: '中阶',
        skillType: '物理',
        description: '闻到血腥味后进入狂暴状态，大幅提升攻击力。',
        cost: '28 点体力',
        effect: '短时间内大幅提升攻击力和攻击速度。',
      },
      {
        id: 'shark-people-feeding-frenzy',
        name: '进食狂潮',
        level: '高阶',
        skillType: '物理',
        description: '进入进食狂潮，攻击时恢复大量生命值。',
        cost: '65 点体力',
        effect: '短时间内每次攻击都会恢复大量生命值，攻击速度大幅提升。',
      },
      {
        id: 'shark-people-apex-predator',
        name: '顶级掠食者',
        level: '高阶',
        skillType: '物理',
        description: '激活顶级掠食者的本能，大幅提升所有物理能力。',
        cost: '75 点体力',
        effect: '短时间内大幅提升攻击力、攻击速度、移动速度和暴击率。',
      },
    ],
    娜迦: [
      {
        id: 'naga-water-bolt',
        name: '水箭',
        level: '初阶',
        skillType: '魔法',
        description: '凝聚水元素形成箭矢，攻击敌人。',
        cost: '10 点魔力',
        effect: '对单体造成水属性魔法伤害。',
      },
      {
        id: 'naga-constrict',
        name: '缠绕',
        level: '初阶',
        skillType: '物理',
        description: '用蛇身缠绕敌人，造成持续伤害并限制行动。',
        cost: '12 点体力',
        effect: '对单体造成持续物理伤害，并使其无法移动。',
      },
      {
        id: 'naga-whirlpool',
        name: '漩涡',
        level: '中阶',
        skillType: '魔法',
        description: '在目标位置形成漩涡，持续造成伤害并限制移动。',
        cost: '32 点魔力',
        effect: '对范围内目标造成持续水属性伤害，并降低移动速度。',
      },
      {
        id: 'naga-tidal-strike',
        name: '潮汐打击',
        level: '中阶',
        skillType: '物理',
        description: '用尾巴掀起潮汐，冲击敌人。',
        cost: '30 点体力',
        effect: '对前方多个目标造成物理和水属性双重伤害。',
      },
      {
        id: 'naga-water-shield',
        name: '水盾',
        level: '中阶',
        skillType: '魔法',
        description: '用海水形成护盾，吸收伤害。',
        cost: '28 点魔力',
        effect: '为自己或友方施加护盾，吸收伤害并持续恢复生命值。',
      },
      {
        id: 'naga-water-blast',
        name: '水爆',
        level: '中阶',
        skillType: '魔法',
        description: '释放强大的水流，对范围内敌人造成伤害。',
        cost: '25 点魔力',
        effect: '对范围内多个目标造成水属性伤害，有概率击退。',
      },
      {
        id: 'naga-ocean-lord',
        name: '海洋领主',
        level: '高阶',
        skillType: '魔法',
        description: '激活海洋领主的力量，大幅提升所有能力。',
        cost: '70 点魔力',
        effect: '短时间内大幅提升所有属性，并持续恢复生命和魔力。',
      },
      {
        id: 'naga-tsunami',
        name: '海啸',
        level: '高阶',
        skillType: '魔法',
        description: '召唤巨大的海浪，席卷一切敌人。',
        cost: '85 点魔力',
        effect: '对前方大范围内所有目标造成巨额水属性伤害，并可能击倒。',
      },
    ],
    章鱼人: [
      {
        id: 'octopus-people-ink-cloud',
        name: '墨汁云',
        level: '初阶',
        skillType: '魔法',
        description: '释放墨汁形成黑云，遮蔽敌人视线。',
        cost: '12 点魔力',
        effect: '降低范围内敌人的视野和命中率，持续一段时间。',
      },
      {
        id: 'octopus-people-tentacle-grab',
        name: '触手抓取',
        level: '初阶',
        skillType: '物理',
        description: '用触手抓住敌人，限制其行动。',
        cost: '10 点体力',
        effect: '使单体敌人无法移动，持续一段时间。',
      },
      {
        id: 'octopus-people-tentacle-strike',
        name: '触手打击',
        level: '中阶',
        skillType: '物理',
        description: '用多条触手同时攻击多个敌人。',
        cost: '32 点体力',
        effect: '对范围内多个目标造成物理伤害，难以完全躲避。',
      },
      {
        id: 'octopus-people-camouflage',
        name: '伪装',
        level: '中阶',
        skillType: '魔法',
        description: '改变身体颜色融入环境，大幅提升闪避率。',
        cost: '30 点魔力',
        effect: '短时间内大幅提升闪避率，成功闪避后可立即反击。',
      },
      {
        id: 'octopus-people-ink-bind',
        name: '墨缚',
        level: '中阶',
        skillType: '魔法',
        description: '用墨汁束缚敌人，降低其移动和攻击速度。',
        cost: '28 点魔力',
        effect: '使范围内敌人移动速度和攻击速度大幅下降，持续一段时间。',
      },
      {
        id: 'octopus-people-tentacle-whip',
        name: '触手鞭打',
        level: '中阶',
        skillType: '物理',
        description: '用触手快速鞭打敌人，造成多段伤害。',
        cost: '25 点体力',
        effect: '对单体进行2-3次快速攻击，每次造成物理伤害。',
      },
      {
        id: 'octopus-people-tentacle-storm',
        name: '触手风暴',
        level: '高阶',
        skillType: '物理',
        description: '用所有触手形成风暴，对范围内所有敌人造成伤害。',
        cost: '65 点体力',
        effect: '对范围内所有敌人造成巨额物理伤害，有概率击倒。',
      },
      {
        id: 'octopus-people-regeneration',
        name: '再生',
        level: '高阶',
        skillType: '魔法',
        description: '激活章鱼的再生能力，快速恢复生命值。',
        cost: '75 点魔力',
        effect: '持续恢复大量生命值，持续数回合。',
      },
    ],
    海龙: [
      {
        id: 'sea-dragon-water-breath',
        name: '水息',
        level: '初阶',
        skillType: '魔法',
        description: '喷出高压水流，冲击敌人。',
        cost: '12 点魔力',
        effect: '对前方多个目标造成水属性伤害，有概率击退。',
      },
      {
        id: 'sea-dragon-dive',
        name: '俯冲',
        level: '初阶',
        skillType: '物理',
        description: '从水中俯冲而出，撞击敌人。',
        cost: '10 点体力',
        effect: '快速接近单体目标并造成高额物理伤害，有概率击倒。',
      },
      {
        id: 'sea-dragon-tidal-wave',
        name: '巨浪',
        level: '中阶',
        skillType: '魔法',
        description: '召唤巨大的海浪，席卷敌人。',
        cost: '35 点魔力',
        effect: '对前方大范围内多个目标造成水属性伤害，并可能击倒。',
      },
      {
        id: 'sea-dragon-scale-armor',
        name: '龙鳞',
        level: '中阶',
        skillType: '物理',
        description: '硬化龙鳞，大幅提升防御力。',
        cost: '30 点体力',
        effect: '短时间内大幅提升物理和魔法防御力。',
      },
      {
        id: 'sea-dragon-whirlpool',
        name: '龙卷漩涡',
        level: '中阶',
        skillType: '魔法',
        description: '创造巨大的漩涡，持续伤害并限制敌人移动。',
        cost: '32 点魔力',
        effect: '对范围内目标造成持续水属性伤害，并大幅降低移动速度。',
      },
      {
        id: 'sea-dragon-water-shield',
        name: '水盾',
        level: '中阶',
        skillType: '魔法',
        description: '用海水形成护盾，吸收伤害并持续恢复生命。',
        cost: '28 点魔力',
        effect: '为自己或友方施加护盾，吸收伤害并持续恢复生命值。',
      },
      {
        id: 'sea-dragon-dragon-rage',
        name: '龙怒',
        level: '高阶',
        skillType: '魔法',
        description: '进入龙怒状态，大幅提升所有能力。',
        cost: '70 点魔力',
        effect: '短时间内大幅提升所有属性，并持续恢复生命和魔力。',
      },
      {
        id: 'sea-dragon-ocean-dominion',
        name: '海洋支配',
        level: '高阶',
        skillType: '魔法',
        description: '展现海洋支配者的力量，对范围内所有敌人造成毁灭性打击。',
        cost: '90 点魔力',
        effect: '对范围内所有敌人造成巨额水属性伤害，有概率即死。',
      },
    ],
  },
};

const RACE_SUBTYPES: Record<Race, string[]> = {
  [Race.HUMAN]: [],
  [Race.DEMON]: ['炎魔', '魅魔', '恶魔', '石像鬼', '影魔', '吸血鬼', '巫妖', '幽魂', '不死者', '狼人'],
  [Race.ELF]: ['高等精灵', '暗精灵', '木精灵', '血精灵', '星辰精灵', '幽魂精灵'],
  [Race.DEMI_HUMAN]: ['猫人族', '狐人族', '兔人族', '熊人族', '蜥人族', '蛇人'],
  [Race.WINGED]: [],
  [Race.SEA_FOLK]: ['塞壬', '鲨人', '娜迦', '章鱼人', '海龙'],
};

const CharacterCreation: React.FC<CharacterCreationProps> = ({ onStartGame, onRequestModal }) => {
  const [formData, setFormData] = useState<Partial<CharacterData>>({
    name: '',
    age: 20,
    gender: 'male',
    race: Race.HUMAN,
    subRace: '',
    personality: '',
    description: '',
    scenario: '',
    startingSkills: [],
  });

  const [stats, setStats] = useState<Stats>(initialStats);
  const [isCustomSubRace, setIsCustomSubRace] = useState(false);
  const [customSkillName, setCustomSkillName] = useState('');
  const [customSkillLevel, setCustomSkillLevel] = useState('');
  const [customSkillType, setCustomSkillType] = useState('');
  const [customSkillCost, setCustomSkillCost] = useState('');
  const [customSkillEffect, setCustomSkillEffect] = useState('');
  const [customSkillDescription, setCustomSkillDescription] = useState('');

  // Reset subrace when race changes
  const handleRaceChange = (newRace: Race) => {
    setFormData(prev => ({
      ...prev,
      race: newRace,
      subRace: '',
    }));
    setIsCustomSubRace(false);
  };

  const totalUsedPoints =
    (Object.values(stats) as number[]).reduce((a, b) => a + b, 0) - Object.keys(stats).length * BASE_STAT;
  const remainingPoints = MAX_STAT_POINTS - totalUsedPoints;

  const handleStatChange = (stat: keyof Stats, value: number) => {
    const currentVal = stats[stat];
    const diff = value - currentVal;

    if (diff > 0 && remainingPoints < diff) return; // Not enough points
    if (value < 1) return; // Min stat
    if (value > 20) return; // Max stat is 20

    setStats(prev => ({ ...prev, [stat]: value }));
  };

  const raceIcons: Record<Race, React.ReactNode> = {
    [Race.HUMAN]: <User className="w-6 h-6" />,
    [Race.DEMON]: <Ghost className="w-6 h-6" />,
    [Race.ELF]: <Sparkles className="w-6 h-6" />,
    [Race.DEMI_HUMAN]: <Sword className="w-6 h-6" />,
    [Race.WINGED]: <Feather className="w-6 h-6" />,
    [Race.SEA_FOLK]: <Droplets className="w-6 h-6" />,
  };

  const statIcons: Record<keyof Stats, React.ReactNode> = {
    strength: <Sword className="w-4 h-4 text-red-400" />,
    agility: <Zap className="w-4 h-4 text-yellow-400" />,
    intelligence: <BookOpen className="w-4 h-4 text-blue-400" />,
    constitution: <Shield className="w-4 h-4 text-green-400" />,
    spirit: <Heart className="w-4 h-4 text-purple-400" />,
    fortune: <Dice5 className="w-4 h-4 text-amber-300" />,
  };

  const statLabels: Record<keyof Stats, string> = {
    strength: '力量',
    agility: '敏捷',
    intelligence: '智力',
    constitution: '体质',
    spirit: '精神',
    fortune: '气运',
  };

  // 自动添加被动技能
  useEffect(() => {
    const race = formData.race as Race;
    const subRace = formData.subRace;

    // 获取被动技能
    let passiveSkills: StartingSkill[] = [];
    if (subRace && SUBRACE_PASSIVE_SKILLS[race]?.[subRace]) {
      passiveSkills = SUBRACE_PASSIVE_SKILLS[race][subRace];
    } else if (RACE_PASSIVE_SKILLS[race]) {
      passiveSkills = RACE_PASSIVE_SKILLS[race];
    }

    if (passiveSkills.length > 0) {
      setFormData(prev => {
        const current = prev.startingSkills || [];
        const passiveIds = passiveSkills.map(s => s.id);

        // 移除所有旧的被动技能（包括其他种族的被动技能）
        const allPassiveIds = new Set<string>();
        Object.values(RACE_PASSIVE_SKILLS).forEach(skills => {
          skills.forEach(s => allPassiveIds.add(s.id));
        });
        Object.values(SUBRACE_PASSIVE_SKILLS).forEach(raceSkills => {
          Object.values(raceSkills).forEach(skills => {
            skills.forEach(s => allPassiveIds.add(s.id));
          });
        });

        const nonPassiveSkills = current.filter(s => !allPassiveIds.has(s.id));

        // 添加当前种族的被动技能
        const updatedSkills = [...nonPassiveSkills, ...passiveSkills];

        return { ...prev, startingSkills: updatedSkills };
      });
    } else {
      // 如果没有被动技能，移除所有被动技能
      setFormData(prev => {
        const current = prev.startingSkills || [];
        const allPassiveIds = new Set<string>();
        Object.values(RACE_PASSIVE_SKILLS).forEach(skills => {
          skills.forEach(s => allPassiveIds.add(s.id));
        });
        Object.values(SUBRACE_PASSIVE_SKILLS).forEach(raceSkills => {
          Object.values(raceSkills).forEach(skills => {
            skills.forEach(s => allPassiveIds.add(s.id));
          });
        });
        const nonPassiveSkills = current.filter(s => !allPassiveIds.has(s.id));
        return { ...prev, startingSkills: nonPassiveSkills };
      });
    }
  }, [formData.race, formData.subRace]);

  const toggleStartingSkill = (skill: StartingSkill) => {
    // 被动技能不可取消
    if (skill.skillType === '被动') {
      return;
    }
    const current = formData.startingSkills || [];
    const exists = current.some(s => s.id === skill.id);
    const next = exists ? current.filter(s => s.id !== skill.id) : [...current, skill];
    setFormData(prev => ({ ...prev, startingSkills: next }));
  };

  const handleAddCustomSkill = () => {
    const name = customSkillName.trim();
    const desc = customSkillDescription.trim();
    if (!name) {
      toastr.warning('请填写自定义技能名称', '信息不完整');
      return;
    }
    const id = `custom-${Date.now()}`;
    const newSkill: StartingSkill = {
      id,
      name,
      level: customSkillLevel || undefined,
      skillType: customSkillType || undefined,
      cost: customSkillCost || undefined,
      effect: customSkillEffect || undefined,
      description: desc || '（自定义技能）',
      isCustom: true,
    };
    const current = formData.startingSkills || [];
    setFormData(prev => ({ ...prev, startingSkills: [...current, newSkill] }));
    setCustomSkillName('');
    setCustomSkillLevel('');
    setCustomSkillType('');
    setCustomSkillCost('');
    setCustomSkillEffect('');
    setCustomSkillDescription('');
  };

  const currentSubRaces = RACE_SUBTYPES[formData.race as Race] || [];
  const hasSubRaces = currentSubRaces.length > 0;

  return (
    <div className="min-h-screen bg-stone-950 text-stone-200 py-10 px-4 md:px-8">
      <div className="max-w-6xl mx-auto grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Left Column: Basic Info & Story */}
        <div className="lg:col-span-7 space-y-8 animate-fade-in-up">
          <header className="mb-8">
            <h2 className="text-3xl font-cinzel text-amber-500 mb-2">Create Your Legacy</h2>
            <p className="text-stone-400 text-sm">铭刻你的名字于历史的丰碑之上。</p>
          </header>

          {/* Basic Info Panel */}
          <Frame className="glass-panel p-6 md:p-8 bg-stone-900/60">
            <h3 className="text-xl text-amber-400 font-bold mb-6 flex items-center gap-2">
              <Scroll className="w-5 h-5" /> 基础信息
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <label className="text-stone-400 text-sm uppercase tracking-wider">姓名</label>
                <input
                  type="text"
                  className="w-full bg-stone-950 border border-stone-700 rounded-sm p-3 text-amber-100 focus:border-amber-500 focus:ring-1 focus:ring-amber-500 outline-none transition-colors"
                  placeholder="例如：亚瑟"
                  value={formData.name}
                  onChange={e => setFormData({ ...formData, name: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <label className="text-stone-400 text-sm uppercase tracking-wider">年龄</label>
                <input
                  type="number"
                  className="w-full bg-stone-950 border border-stone-700 rounded-sm p-3 text-amber-100 focus:border-amber-500 outline-none transition-colors"
                  value={formData.age}
                  onChange={e => setFormData({ ...formData, age: parseInt(e.target.value) })}
                />
              </div>
              <div className="space-y-2">
                <label className="text-stone-400 text-sm uppercase tracking-wider">性别</label>
                <div className="flex gap-4">
                  {['male', 'female', 'other'].map(g => (
                    <button
                      key={g}
                      onClick={() => setFormData({ ...formData, gender: g as any })}
                      className={`flex-1 py-2 border ${formData.gender === g ? 'bg-amber-900/40 border-amber-500 text-amber-200' : 'border-stone-700 text-stone-500 hover:border-stone-500'} transition-all`}
                    >
                      {g === 'male' ? '男' : g === 'female' ? '女' : '其他'}
                    </button>
                  ))}
                </div>
              </div>

              {/* Race Selection */}
              <div className="space-y-2">
                <label className="text-stone-400 text-sm uppercase tracking-wider">种族</label>
                <div className="relative">
                  <select
                    className="w-full bg-stone-950 border border-stone-700 rounded-sm p-3 text-amber-100 appearance-none focus:border-amber-500 outline-none"
                    value={formData.race}
                    onChange={e => handleRaceChange(e.target.value as Race)}
                  >
                    {Object.values(Race).map(r => (
                      <option key={r} value={r}>
                        {r}
                      </option>
                    ))}
                  </select>
                  <div className="absolute right-3 top-3 pointer-events-none text-stone-500">▼</div>
                </div>
              </div>

              {/* Sub-Race Selection (Conditional) */}
              {hasSubRaces && (
                <div className="space-y-2 animate-fade-in-up">
                  <div className="flex justify-between items-center">
                    <label className="text-stone-400 text-sm uppercase tracking-wider flex items-center gap-1">
                      <GitBranch size={14} /> 亚种
                    </label>
                  </div>
                  <div className="relative">
                    <select
                      className="w-full bg-stone-950 border border-stone-700 rounded-sm p-3 text-amber-100 appearance-none focus:border-amber-500 outline-none"
                      value={isCustomSubRace ? 'custom' : formData.subRace}
                      onChange={e => {
                        const val = e.target.value;
                        if (val === 'custom') {
                          setIsCustomSubRace(true);
                          setFormData(prev => ({ ...prev, subRace: '' }));
                        } else {
                          setIsCustomSubRace(false);
                          setFormData(prev => ({ ...prev, subRace: val }));
                        }
                      }}
                    >
                      <option value="" disabled>
                        选择分支...
                      </option>
                      {currentSubRaces.map(sub => (
                        <option key={sub} value={sub}>
                          {sub}
                        </option>
                      ))}
                      <option value="custom">✎ 自定义 (Custom)...</option>
                    </select>
                    <div className="absolute right-3 top-3 pointer-events-none text-stone-500">▼</div>
                  </div>

                  {/* Custom Sub-Race Input */}
                  {isCustomSubRace && (
                    <input
                      type="text"
                      autoFocus
                      className="w-full mt-2 bg-stone-950/50 border border-amber-900/50 rounded-sm p-3 text-amber-100 focus:border-amber-500 outline-none animate-fade-in-up"
                      placeholder="请输入您的种族分支名称..."
                      value={formData.subRace}
                      onChange={e => setFormData({ ...formData, subRace: e.target.value })}
                    />
                  )}
                </div>
              )}
            </div>

            <div className="mt-6 space-y-2">
              <label className="text-stone-400 text-sm uppercase tracking-wider">性格特征</label>
              <input
                type="text"
                className="w-full bg-stone-950 border border-stone-700 rounded-sm p-3 text-amber-100 focus:border-amber-500 outline-none transition-colors"
                placeholder="例如：勇敢、多疑、充满好奇心..."
                value={formData.personality}
                onChange={e => setFormData({ ...formData, personality: e.target.value })}
              />
            </div>
          </Frame>

          {/* Narrative Sections */}
          <Frame className="glass-panel p-6 md:p-8 bg-stone-900/60">
            <h3 className="text-xl text-amber-400 font-bold mb-6 flex items-center gap-2">
              <BookOpen className="w-5 h-5" /> 传记与开端
            </h3>

            <div className="space-y-6">
              <div className="space-y-2 group">
                <label className="text-stone-400 text-sm uppercase tracking-wider flex justify-between">
                  <span>外貌与补充说明</span>
                  <Sparkles className="w-4 h-4 text-stone-600 group-hover:text-amber-500 transition-colors" />
                </label>
                <textarea
                  className="w-full h-24 bg-stone-950 border border-stone-700 rounded-sm p-3 text-stone-300 focus:border-amber-500 focus:ring-1 focus:ring-amber-500 outline-none resize-none transition-all scrollbar-thin"
                  placeholder="描述你的外貌特征，或者任何你想补充的设定..."
                  value={formData.description}
                  onChange={e => setFormData({ ...formData, description: e.target.value })}
                />
              </div>

              <div className="space-y-2 group">
                <label className="text-stone-400 text-sm uppercase tracking-wider flex justify-between">
                  <span>自定义开局剧情</span>
                  <Crown className="w-4 h-4 text-stone-600 group-hover:text-amber-500 transition-colors" />
                </label>
                <textarea
                  className="w-full h-32 bg-stone-950 border border-stone-700 rounded-sm p-3 text-stone-300 focus:border-amber-500 focus:ring-1 focus:ring-amber-500 outline-none resize-none transition-all"
                  placeholder="如果你希望故事从一个特定的场景开始，请在这里写下..."
                  value={formData.scenario}
                  onChange={e => setFormData({ ...formData, scenario: e.target.value })}
                />
                <p className="text-xs text-stone-500 italic text-right">Leave blank for a random destiny.</p>
              </div>
            </div>
          </Frame>
        </div>

        {/* Right Column: 种族展示与开局技能 */}
        <div className="lg:col-span-5 space-y-8 animate-fade-in-up" style={{ animationDelay: '0.2s' }}>
          {/* Race Card Visualization */}
          <div className="relative group">
            <div className="absolute inset-0 bg-amber-500/10 rounded-lg blur-xl group-hover:bg-amber-500/20 transition-all duration-500"></div>
            <Frame className="bg-stone-900/80 backdrop-blur-md p-6 text-center border-stone-800 hover:border-amber-500/50 transition-colors duration-300">
              <div className="w-24 h-24 mx-auto bg-stone-950 rounded-full flex items-center justify-center border-2 border-amber-700 mb-4 shadow-[0_0_15px_rgba(245,158,11,0.3)]">
                {raceIcons[formData.race as Race]}
              </div>
              <h3 className="text-2xl font-cinzel text-amber-100">{formData.race}</h3>
              {formData.subRace && (
                <p className="text-amber-500 font-cinzel text-lg mt-1 tracking-widest">{formData.subRace}</p>
              )}
              <p className="text-stone-500 text-sm mt-2 font-serif italic">
                {formData.race === Race.HUMAN && '适应力极强，充满无限可能的种族。'}
                {formData.race === Race.DEMON && '拥有强大的魔力亲和，被黑暗眷顾。'}
                {formData.race === Race.ELF && '长寿而优雅，自然的守护者。'}
                {formData.race === Race.DEMI_HUMAN && '拥有野兽的直觉与人类的智慧。'}
                {formData.race === Race.WINGED && '向往天空，自由不羁的灵魂。'}
                {formData.race === Race.SEA_FOLK && '深海的子民，神秘而古老。'}
              </p>
            </Frame>
          </div>

          {/* Starting Skills */}
          <Frame className="glass-panel p-6 md:p-8 bg-stone-900/60">
            <div className="flex justify-between items-center mb-4 border-b border-stone-800 pb-3">
              <h3 className="text-xl text-amber-400 font-bold flex items-center gap-2">
                <Crown className="w-5 h-5" /> 开局技能
              </h3>
              <p className="text-xs text-stone-500">可多选，并支持自定义</p>
            </div>

            <div className="space-y-4">
              {/* 被动技能区域 */}
              {(() => {
                try {
                  const race = formData.race as Race;
                  const subRace = formData.subRace;
                  let passiveSkills: StartingSkill[] = [];
                  if (subRace && SUBRACE_PASSIVE_SKILLS[race]?.[subRace]) {
                    passiveSkills = SUBRACE_PASSIVE_SKILLS[race][subRace];
                  } else if (RACE_PASSIVE_SKILLS[race]) {
                    passiveSkills = RACE_PASSIVE_SKILLS[race];
                  }
                  return passiveSkills.length > 0 ? passiveSkills : [];
                } catch (err) {
                  console.error('获取被动技能列表失败', err);
                  return [];
                }
              })().length > 0 && (
                <div>
                  <p className="text-xs text-stone-500 uppercase tracking-widest mb-2">种族被动技能（不可取消）</p>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {(() => {
                      try {
                        const race = formData.race as Race;
                        const subRace = formData.subRace;
                        let passiveSkills: StartingSkill[] = [];
                        if (subRace && SUBRACE_PASSIVE_SKILLS[race]?.[subRace]) {
                          passiveSkills = SUBRACE_PASSIVE_SKILLS[race][subRace];
                        } else if (RACE_PASSIVE_SKILLS[race]) {
                          passiveSkills = RACE_PASSIVE_SKILLS[race];
                        }
                        return passiveSkills;
                      } catch (err) {
                        console.error('获取被动技能列表失败', err);
                        return [];
                      }
                    })().map(skill => (
                      <div
                        key={skill.id}
                        className="text-left p-3 border border-purple-500/50 bg-purple-900/20 text-purple-100 rounded-sm text-sm flex flex-col justify-between cursor-not-allowed opacity-90"
                      >
                        <span className="font-semibold mb-1 flex items-center gap-2">
                          <Shield className="w-4 h-4 text-purple-400" />
                          <span>{skill.name}</span>
                          <span className="text-[10px] px-1 py-0.5 rounded border border-purple-500/60 text-purple-300">
                            被动
                          </span>
                        </span>
                        <div className="text-[11px] text-purple-300 mb-1">类型：{skill.skillType ?? '—'}</div>
                        {skill.effect && <div className="text-[11px] text-purple-200 mt-1">效果：{skill.effect}</div>}
                        <span className="mt-1 text-[11px] text-purple-300 line-clamp-2">{skill.description}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* 主动技能区域 */}
              <div>
                <p className="text-xs text-stone-500 uppercase tracking-widest mb-2">主动技能（可多选）</p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {(() => {
                    try {
                      // 优先显示亚种技能，如果没有亚种或亚种没有技能，则显示基础种族技能
                      const race = formData.race as Race;
                      const subRace = formData.subRace;
                      const subRaceSkills = subRace && SUBRACE_SKILLS[race]?.[subRace];
                      const skills = subRaceSkills || RACE_SKILLS[race] || [];
                      return Array.isArray(skills) ? skills : [];
                    } catch (err) {
                      console.error('获取技能列表失败', err);
                      return [];
                    }
                  })().map(skill => {
                    const selected = (formData.startingSkills || []).some(s => s.id === skill.id);
                    return (
                      <button
                        key={skill.id}
                        type="button"
                        onClick={() => toggleStartingSkill(skill)}
                        className={`text-left p-3 border rounded-sm transition-all text-sm h-full flex flex-col justify-between ${
                          selected
                            ? 'border-amber-500 bg-amber-900/40 text-amber-100 shadow-[0_0_10px_rgba(245,158,11,0.4)]'
                            : 'border-stone-700 bg-stone-950/60 text-stone-300 hover:border-stone-500'
                        }`}
                      >
                        <span className="font-semibold mb-1 flex items-center gap-2">
                          <Sparkles className="w-4 h-4 text-amber-400" />
                          <span>{skill.name}</span>
                          {skill.level && (
                            <span className="text-[10px] px-1 py-0.5 rounded border border-amber-500/60 text-amber-300">
                              {skill.level}
                            </span>
                          )}
                        </span>
                        <div className="text-[11px] text-amber-300 mb-1">类型：{skill.skillType ?? '—'}</div>
                        {skill.cost && <div className="text-[11px] text-stone-200">消耗：{skill.cost}</div>}
                        {skill.effect && <div className="text-[11px] text-stone-300 mt-1">效果：{skill.effect}</div>}
                        <span className="mt-1 text-[11px] text-stone-400 line-clamp-2">{skill.description}</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              <div className="pt-4 border-t border-stone-800 space-y-3">
                <p className="text-xs text-stone-500 uppercase tracking-widest">自定义技能</p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="space-y-2">
                    <label className="text-[11px] text-stone-400">技能名称</label>
                    <input
                      type="text"
                      className="w-full bg-stone-950 border border-stone-700 rounded-sm p-2 text-amber-100 text-sm focus:border-amber-500 outline-none transition-colors"
                      placeholder="例如：雷霆斩击"
                      value={customSkillName}
                      onChange={e => setCustomSkillName(e.target.value)}
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-[11px] text-stone-400">技能等级</label>
                    <input
                      type="text"
                      className="w-full bg-stone-950 border border-stone-700 rounded-sm p-2 text-amber-100 text-sm focus:border-amber-500 outline-none transition-colors"
                      placeholder="初阶 / 中阶 / 高阶 / 极阶 / 禁忌"
                      value={customSkillLevel}
                      onChange={e => setCustomSkillLevel(e.target.value)}
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-[11px] text-stone-400">技能类型</label>
                    <select
                      className="w-full bg-stone-950 border border-stone-700 rounded-sm p-2 text-amber-100 text-sm focus:border-amber-500 outline-none transition-colors"
                      value={customSkillType}
                      onChange={e => setCustomSkillType(e.target.value)}
                    >
                      <option value="">请选择</option>
                      <option value="物理">物理</option>
                      <option value="魔法">魔法</option>
                      <option value="被动">被动</option>
                    </select>
                  </div>
                  <div className="space-y-2">
                    <label className="text-[11px] text-stone-400">消耗</label>
                    <input
                      type="text"
                      className="w-full bg-stone-950 border border-stone-700 rounded-sm p-2 text-amber-100 text-sm focus:border-amber-500 outline-none transition-colors"
                      placeholder="例如：20 点体力 / 15 点魔力"
                      value={customSkillCost}
                      onChange={e => setCustomSkillCost(e.target.value)}
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <label className="text-[11px] text-stone-400">技能效果</label>
                  <textarea
                    className="w-full h-20 bg-stone-950 border border-stone-700 rounded-sm p-2 text-stone-300 text-xs focus:border-amber-500 outline-none resize-none transition-colors"
                    placeholder="详细描述此技能在战斗或剧情中的具体效果…"
                    value={customSkillDescription}
                    onChange={e => setCustomSkillDescription(e.target.value)}
                  />
                  <input
                    type="text"
                    className="w-full bg-stone-950 border border-stone-700 rounded-sm p-2 text-amber-100 text-xs focus:border-amber-500 outline-none transition-colors"
                    placeholder="可选：在此写一条简短的效果摘要，方便 GM 快速阅读"
                    value={customSkillEffect}
                    onChange={e => setCustomSkillEffect(e.target.value)}
                  />
                </div>
                <div className="flex justify-between items-center">
                  <button
                    type="button"
                    onClick={handleAddCustomSkill}
                    className="px-3 py-1.5 text-xs border border-amber-600 text-amber-200 rounded-sm bg-amber-900/40 hover:bg-amber-800/60 transition-colors"
                  >
                    添加自定义技能
                  </button>
                  <span className="text-[11px] text-stone-500">已选择 {(formData.startingSkills || []).length} 项</span>
                </div>

                {(formData.startingSkills || []).length > 0 && (
                  <div className="mt-2 text-[11px] text-stone-400 space-y-1">
                    <p className="text-stone-500">当前选择：</p>
                    <ul className="list-disc list-inside space-y-0.5">
                      {(formData.startingSkills || []).map(skill => (
                        <li key={skill.id}>
                          <span className="text-amber-300">{skill.name}</span>
                          {skill.description && <span className="text-stone-500"> —— {skill.description}</span>}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            </div>
          </Frame>

          <button
            onClick={() => onStartGame({ ...formData, stats } as CharacterData)}
            className="w-full py-4 bg-gradient-to-r from-amber-700 to-amber-900 text-amber-100 font-bold tracking-[0.2em] rounded-sm border border-amber-500 hover:shadow-[0_0_20px_rgba(245,158,11,0.4)] transition-all transform hover:-translate-y-1 active:translate-y-0"
          >
            开始旅程
          </button>
        </div>
      </div>
    </div>
  );
};

export default CharacterCreation;
