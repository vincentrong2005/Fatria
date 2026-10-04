const assert = require('node:assert/strict');
const test = require('node:test');

process.env.TS_NODE_COMPILER_OPTIONS = JSON.stringify({
  module: 'CommonJS',
  moduleResolution: 'node',
  ignoreDeprecations: '6.0',
});
require('ts-node/register/transpile-only');

const { getPlayerDerivedStats } = require('../src/性斗学园/shared/statSelectors.ts');
const {
  addPermanentNumericBonuses,
  migrateLegacyPermanentNumericBonuses,
} = require('../src/性斗学园/shared/permanentNumericBonuses.ts');
const { applyPermanentConsumableEffect } = require('../src/性斗学园/shared/permanentConsumables.ts');

test('旧商店和月饼数值迁移后，所有派生属性保持不变', () => {
  const data = {
    角色基础: { _等级: 32 },
    核心状态: { _潜力: 7.5 },
    基础属性: { _魅力: 24, _幸运: 18, _闪避率: 62, _暴击率: 96 },
    永久状态: {
      状态列表: {
        商店永久加成_基础性斗力成算: {
          加成: { 魅力加成: 3, 幸运加成: 2, 闪避率加成: 4, 基础性斗力成算: 8, 暴击率加成: 10 },
        },
        永久消耗品_五仁月饼: { 加成: { 基础性斗力成算: 3, 基础忍耐力加成: 5 } },
        敏感体质: { 加成: { 魅力加成: 2 }, 描述: '保留的真正永久状态' },
        商店永久加成_特殊状态: { 加成: { 幸运加成: 1 }, 特殊效果: { 类型: '敏感', 效果值: 10 } },
      },
    },
  };

  const before = getPlayerDerivedStats(data);
  assert.deepEqual(migrateLegacyPermanentNumericBonuses(data).sort(), [
    '商店永久加成_基础性斗力成算',
    '永久消耗品_五仁月饼',
  ]);
  assert.deepEqual(getPlayerDerivedStats(data), before);
  assert.deepEqual(Object.keys(data.永久状态.状态列表), ['敏感体质', '商店永久加成_特殊状态']);
  assert.equal(data.基础属性._性斗力成算, 11);
  assert.equal(data.基础属性._忍耐力加成, 5);
  assert.equal(data.基础属性._暴击率, 106);
  assert.deepEqual(migrateLegacyPermanentNumericBonuses(data), []);
  assert.deepEqual(getPlayerDerivedStats(data), before);

  applyPermanentConsumableEffect(data, '黑芝麻月饼');
  assert.equal(data.基础属性._暴击率, 107);
});

test('新奖励只更新基础属性和核心状态，不创建永久状态', () => {
  const data = { 核心状态: { _潜力: 5 }, 基础属性: {} };
  addPermanentNumericBonuses(data, { 幸运加成: 2, 基础忍耐力成算: 4 }, 3);
  applyPermanentConsumableEffect(data, '冰淇淋月饼');
  applyPermanentConsumableEffect(data, '桂花酒酿月饼');

  assert.equal(data.基础属性._幸运, 6);
  assert.equal(data.基础属性._忍耐力成算, 12);
  assert.equal(data.基础属性._性斗力成算, 2);
  assert.equal(data.核心状态._潜力, 5.1);
  assert.equal(data.永久状态, undefined);
});
