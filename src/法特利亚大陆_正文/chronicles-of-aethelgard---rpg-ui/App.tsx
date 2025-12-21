import { Maximize2, Minimize2 } from 'lucide-react';
import React, { useEffect, useRef, useState } from 'react';
import { LeftSidebar } from './components/LeftSidebar';
import { MainContent } from './components/MainContent';
import { Modal } from './components/Modal';
import { RightSidebar } from './components/RightSidebar';
import { INITIAL_CHARACTER, INITIAL_CHAT_LOG, INITIAL_GLOBAL, MOCK_NEWS } from './constants';
import { Character, GameGlobal, Message, ModalType, NewsItem } from './types';

// In a real app, this would use the Gemini API from services
// import { generateResponse } from './services/geminiService';

const App: React.FC = () => {
  const [character, setCharacter] = useState(INITIAL_CHARACTER);
  const [globalState, setGlobalState] = useState(INITIAL_GLOBAL);
  const [chatLog, setChatLog] = useState<Message[]>(INITIAL_CHAT_LOG);
  const [isProcessing, setIsProcessing] = useState(false);
  const [activeModal, setActiveModal] = useState<ModalType>(null);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [mainText, setMainText] = useState<string>('');
  const [options, setOptions] = useState<string[]>([]);
  const [news, setNews] = useState<NewsItem[]>(MOCK_NEWS);
  const [mvuStat, setMvuStat] = useState<any | null>(null);
  // 用于让其他组件（例如技能面板）向输入框预填文本
  const prefillInputRef = useRef<((text: string) => void) | null>(null);

  // --- 布局：左右栏开关（支持记忆） ---
  const loadSidebarSettings = () => {
    try {
      // @ts-expect-error getVariables 为全局注入
      const vars = getVariables({ type: 'chat' });
      const saved = vars?.['ui_settings']?.['sidebar'];
      return {
        left: typeof saved?.left === 'boolean' ? saved.left : false,
        right: typeof saved?.right === 'boolean' ? saved.right : false,
      };
    } catch (err) {
      console.warn('读取侧栏设置失败，使用默认值（仅正文）', err);
      return { left: false, right: false };
    }
  };

  const [{ left: showLeftSidebar, right: showRightSidebar }, setSidebarState] = useState(() => loadSidebarSettings());

  const saveSidebarSettings = (next: { left: boolean; right: boolean }) => {
    try {
      // @ts-expect-error getVariables, insertOrAssignVariables 为全局注入
      const vars = getVariables({ type: 'chat' });
      const updated = {
        ...vars,
        ui_settings: {
          ...(vars?.ui_settings || {}),
          sidebar: next,
        },
      };
      // @ts-expect-error insertOrAssignVariables 为全局注入
      insertOrAssignVariables(updated, { type: 'chat' });
    } catch (err) {
      console.warn('保存侧栏设置失败', err);
    }
  };

  const updateSidebarState = (next: { left: boolean; right: boolean }) => {
    setSidebarState(next);
    saveSidebarSettings(next);
  };

  useEffect(() => {
    const handler = () => setIsFullscreen(!!document.fullscreenElement);
    document.addEventListener('fullscreenchange', handler);
    return () => document.removeEventListener('fullscreenchange', handler);
  }, []);

  // 从 MVU 变量同步角色、全局信息和新闻
  useEffect(() => {
    const bootstrapMvu = async () => {
      try {
        const globalAny = window as any;
        if (globalAny.waitGlobalInitialized) {
          await globalAny.waitGlobalInitialized('Mvu');
        }
        if (!globalAny.Mvu) return;

        const refreshFromMvu = (vars?: any) => {
          const data = vars ?? globalAny.Mvu.getMvuData({ type: 'message', message_id: 'latest' });
          if (!data) return;
          setMvuStat(data.stat_data ?? null);
          const mappedCharacter = mapMvuToCharacter(data);
          const mappedGlobal = mapMvuToGlobal(data);
          const mappedNews = mapMvuToNews(data, mappedGlobal?.date);

          if (mappedCharacter) setCharacter(mappedCharacter);
          if (mappedGlobal) setGlobalState(mappedGlobal);
          if (mappedNews) setNews(mappedNews);
        };

        refreshFromMvu();
        globalAny.eventOn?.(globalAny.Mvu.events.VARIABLE_UPDATE_ENDED, (vars: any) => refreshFromMvu(vars));
      } catch (err) {
        console.warn('无法读取 MVU 变量，使用默认展示', err);
      }
    };

    bootstrapMvu();
  }, []);

  // 从最新一楼消息中用正则提取 <content> … </content> 的正文和 <option> 标签的选项，并过滤 <!-- --> 注释
  useEffect(() => {
    try {
      const messages = getChatMessages(-1, { role: 'assistant', hide_state: 'all' });
      const raw = messages[0]?.message ?? '';
      if (!raw) {
        setMainText('');
        setOptions([]);
        return;
      }
      const { content, options: extractedOptions } = extractContentFromRaw(raw);
      setMainText(content);
      setOptions(extractedOptions);
    } catch (err) {
      console.warn('无法从聊天消息中提取正文', err);
    }
  }, []);

  const toggleFullscreen = async () => {
    if (!document.fullscreenElement) {
      await document.documentElement.requestFullscreen?.();
    } else {
      await document.exitFullscreen?.();
    }
  };

  const handleSendMessage = async (message: string) => {
    const content = message.trim();
    if (!content) return;

    try {
      // 发送到酒馆当前聊天作为用户发言
      // @ts-expect-error createChatMessages 为全局注入
      await createChatMessages([
        {
          role: 'user',
          message: content,
        },
      ]);

      // 触发一次常规生成
      // @ts-expect-error triggerSlash 为全局注入
      await triggerSlash('/trigger');

      // 可选：给一点提示
      // @ts-expect-error toastr 为全局注入
      toastr.success('已将指令发送至当前聊天。', '酒馆已接收');
    } catch (err) {
      console.error('发送到酒馆失败', err);
      // @ts-expect-error toastr 为全局注入
      toastr.error('发送到酒馆失败，请稍后重试。', '错误');
    }
  };

  return (
    <div className="relative min-h-full w-full bg-gradient-to-br from-[#050507] via-[#0b0d13] to-[#050507] flex items-center justify-center p-4 overflow-visible font-sans select-none text-[var(--gold-100)]">
      {/* 顶部控制按钮区域：左右栏开关 + 全屏 */}
      <div className="absolute top-4 left-4 z-30 flex flex-wrap gap-2">
        <button
          onClick={() => updateSidebarState({ left: !showLeftSidebar, right: showRightSidebar })}
          className="px-3 py-1 rounded-md border border-[#3a2a0f] bg-[#0f1018cc] text-[var(--gold-100)] shadow-[0_10px_30px_rgba(0,0,0,0.6)] hover:border-[var(--gold-500)] hover:shadow-[0_10px_30px_rgba(214,167,79,0.35)] backdrop-blur-md transition-all duration-200 text-[10px] tracking-widest"
        >
          {showLeftSidebar ? '隐藏左栏' : '显示左栏'}
        </button>
        <button
          onClick={() => updateSidebarState({ left: showLeftSidebar, right: !showRightSidebar })}
          className="px-3 py-1 rounded-md border border-[#3a2a0f] bg-[#0f1018cc] text-[var(--gold-100)] shadow-[0_10px_30px_rgba(0,0,0,0.6)] hover:border-[var(--gold-500)] hover:shadow-[0_10px_30px_rgba(214,167,79,0.35)] backdrop-blur-md transition-all duration-200 text-[10px] tracking-widest"
        >
          {showRightSidebar ? '隐藏右栏' : '显示右栏'}
        </button>
      </div>

      <button
        onClick={toggleFullscreen}
        className="absolute top-4 right-4 z-30 px-3 py-2 rounded-md border border-[#3a2a0f] bg-[#0f1018cc] text-[var(--gold-100)] shadow-[0_10px_40px_rgba(0,0,0,0.6)] hover:border-[var(--gold-500)] hover:shadow-[0_10px_40px_rgba(214,167,79,0.35)] backdrop-blur-md transition-all duration-200 flex items-center gap-2 text-xs tracking-widest"
      >
        {isFullscreen ? <Minimize2 size={14} /> : <Maximize2 size={14} />}
        {isFullscreen ? '退出全屏' : '全屏'}
      </button>
      {/* Background Layer */}
      <div className="fixed inset-0 z-0 pointer-events-none">
        <div className="absolute inset-0 bg-gradient-radial from-stone-900 to-black opacity-80"></div>
        {/* Subtle Vignette */}
        <div className="absolute inset-0 shadow-[inset_0_0_150px_rgba(0,0,0,0.9)]"></div>
      </div>

      <div className="relative z-10 w-full max-w-[1600px] min-h-[760px]">
        {/* 中心正文区域：永远占满容器宽度 */}
        <div className="h-full flex">
          <MainContent
            chatLog={chatLog}
            onSendMessage={handleSendMessage}
            isProcessing={isProcessing}
            mainText={mainText}
            options={options}
            registerPrefillHandler={fn => {
              prefillInputRef.current = fn;
            }}
            expandFull
          />
        </div>

        {/* 左侧覆盖状态栏 */}
        {showLeftSidebar && (
          <div className="absolute inset-y-4 left-0 z-30 flex">
            <LeftSidebar character={character} global={globalState} mvuStat={mvuStat} variant="overlay" />
          </div>
        )}

        {/* 右侧覆盖状态栏 */}
        {showRightSidebar && (
          <div className="absolute inset-y-4 right-0 z-30 flex justify-end">
            <RightSidebar character={character} news={news} onOpenModal={setActiveModal} variant="overlay" />
          </div>
        )}
      </div>

      {/* Modal Overlay */}
      <Modal
        isOpen={!!activeModal}
        type={activeModal}
        onClose={() => setActiveModal(null)}
        character={character}
        mvuStat={mvuStat}
        isFullscreen={isFullscreen}
        onSkillToChat={text => {
          prefillInputRef.current?.(text);
        }}
      />
    </div>
  );
};

export default App;

function extractValue<T>(value: any, fallback: T): T {
  if (Array.isArray(value)) return (value[0] as T) ?? fallback;
  if (value === undefined || value === null) return fallback;
  return value as T;
}

function getPath(obj: any, path: string, fallback: any = undefined) {
  if (!obj) return fallback;
  const segments = path
    .replace(/\[(\w+)\]/g, '.$1')
    .split('.')
    .filter(Boolean);
  let current = obj;
  for (const key of segments) {
    if (current && Object.prototype.hasOwnProperty.call(current, key)) {
      current = current[key];
    } else {
      return fallback;
    }
  }
  return current ?? fallback;
}

function mapMvuToCharacter(data: any): Character | null {
  const stat = data?.stat_data ?? {};
  const name = '主角';
  const race = extractValue(getPath(stat, '主角.基本信息.种族'), '未知种族');
  const clazz = extractValue(getPath(stat, '主角.基本信息.职业'), '未知职业');

  const attributes = {
    strength: Number(extractValue(getPath(stat, '主角.核心属性.力量'), 0)),
    agility: Number(extractValue(getPath(stat, '主角.核心属性.敏捷'), 0)),
    constitution: Number(extractValue(getPath(stat, '主角.核心属性.体质'), 0)),
    wisdom: Number(extractValue(getPath(stat, '主角.核心属性.智力'), 0)),
    spirit: Number(extractValue(getPath(stat, '主角.核心属性.精神'), 0)),
    luck: Number(extractValue(getPath(stat, '主角.核心属性.气运'), 0)),
  };

  const vitals = {
    hp: Number(extractValue(getPath(stat, '主角.核心数值.生命值.当前值'), 0)),
    maxHp: Number(extractValue(getPath(stat, '主角.核心数值.生命值.最大值'), 0)),
    mp: Number(extractValue(getPath(stat, '主角.核心数值.魔力值.当前值'), 0)),
    maxMp: Number(extractValue(getPath(stat, '主角.核心数值.魔力值.最大值'), 0)),
    stamina: Number(extractValue(getPath(stat, '主角.核心数值.耐力值.当前值'), 0)),
    maxStamina: Number(extractValue(getPath(stat, '主角.核心数值.耐力值.最大值'), 0)),
  };

  const experience = {
    physical: Number(extractValue(getPath(stat, '主角.经验值.锻体经验.当前值'), 0)),
    maxPhysical: Number(extractValue(getPath(stat, '主角.经验值.锻体经验.升级所需'), 0)),
    magical: Number(extractValue(getPath(stat, '主角.经验值.魔法经验.当前值'), 0)),
    maxMagical: Number(extractValue(getPath(stat, '主角.经验值.魔法经验.升级所需'), 0)),
  };

  const combatPower = {
    physical: String(extractValue(getPath(stat, '主角.战斗力.肉身战力等级'), '未知')),
    magical: String(extractValue(getPath(stat, '主角.战斗力.魔法战力等级'), '未知')),
  };

  const statusObj = getPath(stat, '主角.状态', {});
  const statusList: string[] = [];
  if (statusObj && typeof statusObj === 'object') {
    Object.keys(statusObj)
      .filter(key => key !== '$meta')
      .forEach(key => {
        const entry = statusObj[key];
        if (!entry) return;
        const desc = entry.描述 ?? '';
        const effect = entry.效果 ?? '';
        const text = [key, desc, effect].filter(Boolean).join(' | ');
        if (text) statusList.push(text);
      });
  }

  const status = statusList.length ? statusList.join('\n') : '状态良好';

  const buildEquip = (path: string) => {
    const eq = getPath(stat, path, null);
    if (!eq) return null;
    const quality = eq.品质 ?? '';
    const type = eq.类型 ?? '';
    const nameParts = [quality, type].filter(Boolean).join(' ');
    const description = [eq.描述, eq.效果].filter(Boolean).join('；');
    if (!nameParts && !description) return null;
    return { name: nameParts || '未装备', description: description || '暂无效果' };
  };

  const equipment = {
    weapon: buildEquip('主角.装备.武器'),
    armor: buildEquip('主角.装备.防具'),
    accessory: buildEquip('主角.装备.饰品'),
  };

  const currency = {
    gold: Number(extractValue(getPath(stat, '主角.货币.金龙币'), 0)),
    silver: Number(extractValue(getPath(stat, '主角.货币.银狼币'), 0)),
    copper: Number(extractValue(getPath(stat, '主角.货币.铜蛇币'), 0)),
  };

  const inventoryList = getPath(stat, '主角.背包', {});
  const inventoryKeys =
    inventoryList && typeof inventoryList === 'object' ? Object.keys(inventoryList).filter(k => k !== '$meta') : [];
  const inventory = inventoryKeys.map((key, idx) => {
    const item = inventoryList[key] ?? {};
    const rawQuality = String(item.品质 ?? '普通');
    return {
      id: `item-${idx}`,
      name: key,
      quality: rawQuality,
      type: String(item.类型 ?? '未知'),
      description: String(item.描述 ?? '无描述'),
      effect: String(item.效果 ?? '无'),
      quantity: Number(item.数量 ?? 1),
      value: 0,
    };
  });

  return {
    name,
    race,
    class: clazz,
    attributes,
    vitals,
    experience,
    combatPower,
    status,
    equipment,
    currency,
    inventory,
  };
}

function mapMvuToGlobal(data: any): GameGlobal | null {
  const stat = data?.stat_data ?? {};
  const date = extractValue(getPath(stat, '系统变量.日期'), '');
  const time = extractValue(getPath(stat, '系统变量.时间'), '');
  const location = extractValue(getPath(stat, '主角.位置'), '未知地点');
  const dateStr = [date, time].filter(Boolean).join(' ');
  return {
    date: dateStr || '时间未知',
    location,
  };
}

function mapMvuToNews(data: any, dateStr?: string): NewsItem[] | null {
  const stat = data?.stat_data ?? {};
  const current = extractValue(getPath(stat, '新闻.当前播报'), '');
  if (!current) return null;
  const now = dateStr || extractValue(getPath(stat, '系统变量.时间'), '') || '未知时间';
  return [
    {
      id: 'news-1',
      content: current,
      time: now,
    },
  ];
}

function extractContentFromRaw(raw: string): { content: string; options: string[] } {
  if (!raw) return { content: '', options: [] };
  // 先移除 <!-- --> 包裹的注释
  const withoutComments = raw.replace(/<!--[\s\S]*?-->/g, '');

  // 使用用户给定正则语义: 捕捉 <content>...</content> 中间的内容和 <option> 标签内的选项
  const contentMatch = withoutComments.match(/[\s\S]*?<content>([\s\S]*?)<\/content>/i);
  const content = contentMatch && contentMatch[1] ? contentMatch[1].trim() : withoutComments.trim();

  // 提取 <option> 标签内的选项
  const optionMatch = withoutComments.match(
    /<option>\s*A\.\s*([\s\S]*?)\s*B\.\s*([\s\S]*?)\s*C\.\s*([\s\S]*?)\s*D\.\s*([\s\S]*?)<\/option>/i,
  );
  const extractedOptions: string[] = [];
  if (optionMatch) {
    // 提取 A, B, C, D 四个选项，去除首尾空白
    for (let i = 1; i <= 4; i++) {
      if (optionMatch[i]) {
        extractedOptions.push(optionMatch[i].trim());
      }
    }
  }

  return { content, options: extractedOptions };
}
