import { Book, GitMerge, Package, Shield, Sword, X } from 'lucide-react';
import React, { useState } from 'react';
import { Character, InventoryItem, ModalType } from '../types';

interface ModalProps {
  isOpen: boolean;
  type: ModalType;
  onClose: () => void;
  character: Character;
  mvuStat: any | null;
  isFullscreen: boolean;
  // 当技能被点击，希望把一段文字填入聊天输入框
  onSkillToChat?: (text: string) => void;
}

export const Modal: React.FC<ModalProps> = ({ isOpen, type, onClose, character, mvuStat, isFullscreen, onSkillToChat }) => {
  if (!isOpen || !type) return null;

  const isMap = type === 'MAP';

  const getTitle = () => {
    switch (type) {
      case 'INVENTORY': return '冒险者背包';
      case 'SKILLS': return '技能与法术书';
      case 'QUESTS': return '委托与使命';
      case 'SOCIAL': return '人际关系';
      case 'NEWS': return '大陆见闻录';
      case 'MAP': return '世界地图';
      case 'PARALLEL_EVENTS': return '并行时空观测';
      default: return '';
    }
  };

  const renderContent = () => {
    switch (type) {
      case 'INVENTORY':
        return <InventoryView items={character.inventory} />;
      case 'SKILLS':
        return <SkillsView mvuStat={mvuStat} onSkillToChat={onSkillToChat} />;
      case 'QUESTS':
        return <QuestsView mvuStat={mvuStat} />;
      case 'SOCIAL':
        return <SocialView mvuStat={mvuStat} />;
      case 'MAP':
        return <MapView showGrid={isFullscreen} />;
      case 'PARALLEL_EVENTS':
        return <ParallelEventsView mvuStat={mvuStat} />;
      case 'NEWS':
        return <div className="text-stone-400">新闻详细内容...</div>;
      default:
        return null;
    }
  };

  return (
    <div className={`fixed inset-0 z-50 flex items-center justify-center ${isMap ? 'p-0' : 'p-4'}`}>
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/80 backdrop-blur-sm transition-opacity duration-300 animate-fadeIn"
        onClick={onClose}
      ></div>

      {/* Modal Content */}
      <div className={`
        relative bg-stone-950 border border-gold-700/40 shadow-[0_0_50px_rgba(0,0,0,0.8)] flex flex-col overflow-hidden animate-slideUp
        ${isMap ? 'w-full h-full rounded-none border-none' : 'w-full max-w-4xl h-[85vh] rounded-lg'}
      `}>

        {/* Decorative Border Glow */}
        {!isMap && <div className="absolute inset-0 pointer-events-none box-border border border-gold-500/10 rounded-lg"></div>}

        {/* Header */}
        {!isMap && (
          <div className="flex justify-between items-center p-6 border-b border-gold-900/30 bg-[url('https://www.transparenttextures.com/patterns/wood-pattern.png')] bg-stone-900 shrink-0">
             <div className="flex flex-col">
                <h2 className="text-2xl font-display text-gold-200 tracking-widest uppercase">{getTitle()}</h2>
                <span className="text-xs text-stone-500 font-mono mt-1">SYSTEM_MODULE_LOADED // {type}</span>
             </div>
             <button
               onClick={onClose}
               className="text-stone-500 hover:text-gold-400 transition-colors p-2 rounded hover:bg-stone-800"
             >
               <X size={24} />
             </button>
          </div>
        )}

        {/* Map Header (Overlay) */}
        {isMap && (
           <button
             onClick={onClose}
             className="absolute top-6 right-6 z-50 text-stone-300 hover:text-white bg-black/50 p-3 rounded-full backdrop-blur hover:bg-black/80 transition-all"
           >
             <X size={32} />
           </button>
        )}

        {/* Body */}
        <div className={`flex-1 overflow-hidden bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-stone-900 via-stone-950 to-black ${isMap ? 'p-0' : 'p-6'}`}>
           {renderContent()}
        </div>
      </div>
    </div>
  );
};

// --- Sub-Components for Specific Views ---

const InventoryView: React.FC<{ items: InventoryItem[] }> = ({ items }) => {
  const totalSlots = 25;
  const [selectedItemIndex, setSelectedItemIndex] = useState<number | null>(null);

  const getQualityColor = (quality: string) => {
    const q = String(quality);
    if (q.includes('传说') || q.toLowerCase().includes('legend')) return 'text-orange-400';
    if (q.includes('史诗') || q.toLowerCase().includes('epic')) return 'text-purple-400';
    if (q.includes('稀有') || q.toLowerCase().includes('rare')) return 'text-blue-400';
    if (q.includes('优秀') || q.includes('精良') || q.toLowerCase().includes('uncommon')) return 'text-green-400';
    return 'text-stone-300';
  };

  const getBorderColor = (quality: string) => {
    const q = String(quality);
    if (q.includes('传说') || q.toLowerCase().includes('legend')) return 'border-orange-600/50';
    if (q.includes('史诗') || q.toLowerCase().includes('epic')) return 'border-purple-600/50';
    if (q.includes('稀有') || q.toLowerCase().includes('rare')) return 'border-blue-600/50';
    if (q.includes('优秀') || q.includes('精良') || q.toLowerCase().includes('uncommon')) return 'border-green-600/50';
    return 'border-gold-600/50';
  };

  const handleBackdropClick = () => {
    setSelectedItemIndex(null);
  };

  return (
    <>
      <div className="h-full overflow-y-auto custom-scrollbar p-2">
        <div className="grid grid-cols-5 gap-4">
          {Array.from({ length: totalSlots }).map((_, index) => {
            const item = items[index];
            const isSelected = selectedItemIndex === index;
            return (
              <div
                key={index}
                className={`aspect-square bg-stone-900/50 border rounded-md relative transition-colors cursor-pointer ${
                  item && isSelected
                    ? `${getBorderColor(item.quality)} border-2`
                    : 'border-stone-800 hover:border-stone-700'
                }`}
                onClick={(e) => {
                  e.stopPropagation();
                  if (item) {
                    setSelectedItemIndex(isSelected ? null : index);
                  }
                }}
              >
                {item ? (
                  <>
                    <div className="flex flex-col items-center justify-center h-full p-2 text-center">
                      <Package size={24} className={`${getQualityColor(item.quality)} mb-2 drop-shadow-md`} />
                      <span className={`text-[10px] font-serif leading-tight line-clamp-2 ${getQualityColor(item.quality)}`}>{item.name}</span>
                      <span className="absolute bottom-1 right-1 text-[9px] font-mono text-stone-500">x{item.quantity}</span>
                      <div className={`absolute inset-0 bg-gold-500/5 transition-opacity rounded-md pointer-events-none ${isSelected ? 'opacity-100' : 'opacity-0'}`}></div>
                    </div>
                  </>
                ) : (
                  <div className="absolute inset-0 flex items-center justify-center opacity-20">
                     <div className="w-2 h-2 rounded-full bg-stone-800"></div>
                  </div>
                )}
                <span className="absolute top-1 left-1 text-[8px] text-stone-700 font-mono">{index + 1}</span>
              </div>
            );
          })}
        </div>
      </div>

      {/* 物品信息覆盖层 - 与社交栏目相同的样式 */}
      {selectedItemIndex !== null && items[selectedItemIndex] && (() => {
        const item = items[selectedItemIndex];
        return (
          <div
            className="fixed inset-0 z-[70] flex items-center justify-center bg-black/90 backdrop-blur-sm p-4"
            onClick={handleBackdropClick}
          >
            <div
              className="relative w-full max-w-md max-h-[90vh] overflow-y-auto custom-scrollbar bg-stone-950 border border-gold-700/50 rounded-lg shadow-[0_0_50px_rgba(214,167,79,0.5)]"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="p-6">
                <div className="flex justify-between items-start border-b border-stone-800 pb-3 mb-4">
                  <h4 className={`font-display text-xl font-bold ${getQualityColor(item.quality)}`}>{item.name}</h4>
                  <span className="text-xs px-2 py-1 bg-stone-900 border border-stone-800 rounded text-stone-400">{item.type}</span>
                </div>
                <div className="space-y-4 text-sm font-serif text-stone-400">
                  <p className="leading-relaxed italic text-base">"{item.description}"</p>
                  <div className="grid grid-cols-2 gap-3 pt-2">
                    <div className="bg-stone-900/50 p-3 rounded border border-stone-800/50">
                      <span className="text-xs text-stone-600 uppercase block mb-1">品质</span>
                      <span className={`text-base ${getQualityColor(item.quality)}`}>{item.quality}</span>
                    </div>
                    <div className="bg-stone-900/50 p-3 rounded border border-stone-800/50">
                      <span className="text-xs text-stone-600 uppercase block mb-1">数量</span>
                      <span className="text-base text-stone-200">{item.quantity}</span>
                    </div>
                  </div>
                  {item.effect && (
                    <div className="text-green-400/90 mt-3 pt-3 border-t border-stone-800">
                      <span className="text-xs text-green-700/70 uppercase mr-2">效果</span>
                      <span className="text-base">{item.effect}</span>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        );
      })()}
    </>
  );
};

const SkillsView: React.FC<{ mvuStat: any | null; onSkillToChat?: (text: string) => void }> = ({ mvuStat, onSkillToChat }) => {
  const [activeTab, setActiveTab] = useState<'physical' | 'magical' | 'passive'>('physical');

  const grouped = (() => {
    try {
      const root = mvuStat?.['主角']?.['技能列表'] ?? {};
      const entries = Object.keys(root || {}).filter(k => k !== '$meta');

      const levelToRank = (level: string | undefined): string => {
        if (!level) return 'C';
        if (level.includes('禁忌')) return 'SS';
        if (level.includes('极')) return 'S';
        if (level.includes('高')) return 'A';
        if (level.includes('中')) return 'B';
        return 'C';
      };

      const skillList = entries.map(key => {
        const def = root[key] ?? {};
        // MVU 模板中技能结构: { 等级, 类型, 描述, 消耗, 效果 }
        const level = String(def.等级 ?? '');
        const typeText = String(def.类型 ?? '未知');
        const isPassive = typeText.includes('被动');
        const isMagical = typeText.includes('魔法') && !isPassive;
        return {
          category: isPassive ? 'passive' : (isMagical ? 'magical' : 'physical'),
          name: String(key),
          rating: levelToRank(level),
          level,
          type: typeText,
          cost: String(def.消耗 ?? '无'),
          desc: String(def.描述 ?? '无'),
          effect: String(def.效果 ?? ''),
          isPassive,
        };
      });

      return {
        physical: skillList.filter(s => s.category === 'physical'),
        magical: skillList.filter(s => s.category === 'magical'),
        passive: skillList.filter(s => s.category === 'passive'),
      };
    } catch (err) {
      console.error('解析技能列表时出错', err);
      return { physical: [] as any[], magical: [] as any[], passive: [] as any[] };
    }
  })();

  const getRatingColor = (rating: string) => {
    if (rating.includes('S')) return 'text-orange-400 text-shadow-gold';
    if (rating.includes('A')) return 'text-purple-400';
    if (rating.includes('B')) return 'text-blue-400';
    return 'text-stone-400';
  };

  return (
    <div className="flex h-full gap-6">
      {/* Sidebar Tabs */}
      <div className="w-1/4 flex flex-col gap-2 border-r border-stone-800 pr-4">
        <button
          onClick={() => setActiveTab('physical')}
          className={`flex items-center gap-3 p-3 rounded text-left transition-all ${activeTab === 'physical' ? 'bg-gold-900/30 text-gold-200 border border-gold-700/30' : 'text-stone-500 hover:bg-stone-900 hover:text-stone-300'}`}
        >
          <Sword size={18} />
          <span className="font-serif text-sm">物理系 (武技)</span>
        </button>
        <button
          onClick={() => setActiveTab('magical')}
          className={`flex items-center gap-3 p-3 rounded text-left transition-all ${activeTab === 'magical' ? 'bg-purple-900/30 text-purple-200 border border-purple-700/30' : 'text-stone-500 hover:bg-stone-900 hover:text-stone-300'}`}
        >
          <Book size={18} />
          <span className="font-serif text-sm">魔法系 (咒术)</span>
        </button>
        <button
          onClick={() => setActiveTab('passive')}
          className={`flex items-center gap-3 p-3 rounded text-left transition-all ${activeTab === 'passive' ? 'bg-purple-900/30 text-purple-300 border border-purple-700/30' : 'text-stone-500 hover:bg-stone-900 hover:text-stone-300'}`}
        >
          <Shield size={18} />
          <span className="font-serif text-sm">被动技能</span>
        </button>
      </div>

      {/* Skills List */}
      <div className="flex-1 overflow-y-auto custom-scrollbar space-y-3">
         {grouped[activeTab].map((skill, i) => (
           <div
             key={i}
             className={`bg-stone-900/40 border p-4 rounded transition-colors group ${
               skill.isPassive
                 ? 'border-purple-800/50 cursor-default'
                 : 'border-stone-800 hover:border-stone-700 cursor-pointer'
             }`}
             onClick={() => {
               if (skill.isPassive || !onSkillToChat) return;
               const header = `${skill.level || ''}${skill.type || ''} ${skill.name}`.replace(/\s+/g, ' ').trim();
               const line = `【使用】${header} ${skill.desc} 消耗：${skill.cost}`;
               onSkillToChat(line);
             }}
           >
              <div className="flex justify-between items-center mb-1">
                 <div className="flex items-center gap-3">
                    {!skill.isPassive && (
                      <div className="w-8 h-8 flex items-center justify-center bg-stone-950 border border-stone-800 rounded font-display font-bold">
                         <span className={getRatingColor(skill.rating)}>{skill.rating}</span>
                      </div>
                    )}
                    {skill.isPassive && (
                      <div className="w-8 h-8 flex items-center justify-center bg-purple-950/50 border border-purple-800/50 rounded">
                         <Shield size={16} className="text-purple-400" />
                      </div>
                    )}
                    <div className="flex flex-col">
                    <h4 className={`font-display font-semibold transition-colors ${
                      skill.isPassive
                        ? 'text-purple-200'
                        : 'text-gold-100 group-hover:text-gold-300'
                    }`}>{skill.name}</h4>
                      <span className="text-[11px] text-stone-500">{skill.type} {skill.level ? `· ${skill.level}` : ''}</span>
                    </div>
                 </div>
                 {!skill.isPassive && (
                   <span className="text-xs font-mono text-stone-500 bg-stone-950 px-2 py-1 rounded border border-stone-800">{skill.cost}</span>
                 )}
                 {skill.isPassive && (
                   <span className="text-xs font-mono text-purple-400 bg-purple-950/30 px-2 py-1 rounded border border-purple-800/30">被动</span>
                 )}
              </div>
              <p className={`text-sm font-serif pl-11 ${skill.isPassive ? 'text-purple-300/80' : 'text-stone-400'}`}>{skill.desc}</p>
              {skill.effect && (
                <p className={`text-xs font-mono pl-11 mt-1 ${skill.isPassive ? 'text-purple-200' : 'text-emerald-400'}`}>效果：{skill.effect}</p>
              )}
           </div>
         ))}
         {grouped[activeTab].length === 0 && (
           <div className="text-center text-stone-600 mt-10 italic">暂无记录</div>
         )}
      </div>
    </div>
  );
};

const QuestsView: React.FC<{ mvuStat: any | null }> = ({ mvuStat }) => {
  const [activeTab, setActiveTab] = useState<'active' | 'completed'>('active');

  const listRoot = mvuStat?.['任务']?.['任务列表'] ?? {};
  const buildList = (key: '进行中的任务' | '已完成任务') => {
    const bucket = listRoot?.[key] ?? {};
    const entries = Object.keys(bucket || {}).filter(k => k !== '$meta').map(name => ({ name, ...(bucket[name] || {}) }));
    return entries.map(e => ({
      title: e.描述 ? String(e.描述) : e.name,
      desc: String(e.描述 ?? '无描述'),
      rating: String(e.评级 ?? 'D'),
      reward: String(e.奖励 ?? '无'),
    }));
  };

  const quests = {
    active: buildList('进行中的任务'),
    completed: buildList('已完成任务'),
  };

  return (
     <div className="flex flex-col h-full">
        <div className="flex border-b border-stone-800 mb-4">
           <button
             onClick={() => setActiveTab('active')}
             className={`px-6 py-2 text-sm font-serif tracking-wide border-b-2 transition-colors ${activeTab === 'active' ? 'border-gold-500 text-gold-400' : 'border-transparent text-stone-500 hover:text-stone-300'}`}
           >
             已接取任务
           </button>
           <button
             onClick={() => setActiveTab('completed')}
             className={`px-6 py-2 text-sm font-serif tracking-wide border-b-2 transition-colors ${activeTab === 'completed' ? 'border-green-600 text-green-500' : 'border-transparent text-stone-500 hover:text-stone-300'}`}
           >
             已完成任务
           </button>
        </div>

        <div className="flex-1 overflow-y-auto custom-scrollbar space-y-4">
           {quests[activeTab].map((quest, i) => (
              <div key={i} className="relative pl-6 pb-2 border-l border-stone-800 ml-2">
                 <div className={`absolute -left-[5px] top-1 w-2.5 h-2.5 rounded-full ${activeTab === 'active' ? 'bg-gold-600' : 'bg-green-600'} shadow-[0_0_8px_currentColor]`}></div>

                 <div className="bg-stone-900/30 p-4 rounded border border-stone-800/50">
                    <h3 className="text-stone-200 font-display text-lg mb-1">{quest.title}</h3>
                    <p className="text-stone-400 text-sm font-serif mb-3">{quest.desc}</p>
                    <div className="flex items-center gap-2 text-xs text-stone-500 border-t border-stone-800 pt-2">
                       <Package size={12} />
                       <span>评级: {quest.rating} · 奖励: {quest.reward}</span>
                    </div>
                 </div>
              </div>
           ))}
           {quests[activeTab].length === 0 && (
             <div className="text-center text-stone-600 mt-10 italic">暂无记录</div>
           )}
        </div>
     </div>
  );
};

const SocialView: React.FC<{ mvuStat: any | null }> = ({ mvuStat }) => {
  const root = mvuStat?.['羁绊'] ?? {};
  const entries = Object.keys(root || {}).filter(k => k !== '$meta').map(name => ({ name, ...(root[name] || {}) }));
  const [enlargedIndex, setEnlargedIndex] = useState<number | null>(null);
  const [showInfo, setShowInfo] = useState<boolean>(false);

  const getImageUrl = (name: string) => {
    return `https://raw.githack.com/vincentrong2005/Fatria/main/图片素材/法特利亚大陆/${name}.png`;
  };

  // 获取所有变量（除了name），用于显示
  const getVariableInfo = (entry: any) => {
    const { name, ...vars } = entry;
    return Object.entries(vars || {}).filter(([key]) => key !== '$meta');
  };

  // 获取战力颜色
  const getCombatPowerColor = (power: string | number | undefined): string => {
    if (!power) return '';
    const powerStr = String(power).toUpperCase();
    if (powerStr === 'C' || powerStr.includes('C')) return 'text-green-400';
    if (powerStr === 'B' || powerStr.includes('B')) return 'text-blue-400';
    if (powerStr === 'A' || powerStr.includes('A')) return 'text-red-400';
    if (powerStr === 'S' || powerStr.includes('S')) return 'text-yellow-400';
    return '';
  };

  const handleCardClick = (index: number) => {
    if (enlargedIndex === index) {
      // 如果已经放大，点击卡片切换信息显示
      setShowInfo(!showInfo);
    } else {
      // 如果未放大，点击卡片放大图片并显示信息
      setEnlargedIndex(index);
      setShowInfo(true);
    }
  };

  const handleBackdropClick = () => {
    setEnlargedIndex(null);
    setShowInfo(false);
  };

  return (
    <>
      <div className="h-full overflow-y-auto custom-scrollbar p-4">
        <div className="grid grid-cols-3 gap-4">
          {entries.map((e, i) => {
            const imageUrl = getImageUrl(e.name);
            const variableInfo = getVariableInfo(e);
            const isEnlarged = enlargedIndex === i;

            return (
              <div
                key={i}
                className={`relative aspect-[2/3] rounded-lg overflow-hidden border bg-stone-900/40 transition-all duration-300 cursor-pointer ${
                  isEnlarged
                    ? 'border-gold-500/50 shadow-[0_0_20px_rgba(214,167,79,0.3)]'
                    : 'border-stone-800 hover:border-stone-700'
                }`}
                onClick={() => handleCardClick(i)}
              >
                {/* 图片容器 */}
                <div className={`absolute inset-0 transition-transform duration-300 ${isEnlarged ? 'scale-110' : ''}`}>
                  <img
                    src={imageUrl}
                    alt={e.name}
                    className="w-full h-full object-cover"
                    onError={(e) => {
                      // 图片加载失败时显示占位符
                      const target = e.target as HTMLImageElement;
                      target.style.display = 'none';
                      if (target.parentElement) {
                        target.parentElement.innerHTML = `
                          <div class="w-full h-full flex items-center justify-center bg-gradient-to-br from-stone-700 to-stone-900 text-gold-200 font-display text-lg">
                            ${e.name?.slice(0, 2) ?? '??'}
                          </div>
                        `;
                      }
                    }}
                  />
                </div>
              </div>
            );
          })}
        </div>
        {entries.length === 0 && (
          <div className="text-center text-stone-600 mt-10 italic">暂无羁绊记录</div>
        )}
      </div>

      {/* 放大图片的覆盖层 */}
      {enlargedIndex !== null && (
        <div
          className="fixed inset-0 z-[70] flex items-center justify-center bg-black/90 backdrop-blur-sm"
          onClick={handleBackdropClick}
        >
          <div
            className="relative max-w-[90vw] max-h-[90vh] aspect-[2/3] rounded-lg overflow-hidden border border-gold-500/50 shadow-[0_0_50px_rgba(214,167,79,0.5)]"
            onClick={(e) => {
              e.stopPropagation();
              setShowInfo(!showInfo);
            }}
          >
            {(() => {
              const e = entries[enlargedIndex];
              const imageUrl = getImageUrl(e.name);
              const variableInfo = getVariableInfo(e);

              return (
                <>
                  <img
                    src={imageUrl}
                    alt={e.name}
                    className="w-full h-full object-cover"
                    onError={(e) => {
                      const target = e.target as HTMLImageElement;
                      target.style.display = 'none';
                      if (target.parentElement) {
                        target.parentElement.innerHTML = `
                          <div class="w-full h-full flex items-center justify-center bg-gradient-to-br from-stone-700 to-stone-900 text-gold-200 font-display text-2xl">
                            ${e.name?.slice(0, 2) ?? '??'}
                          </div>
                        `;
                      }
                    }}
                  />

                  {/* 信息覆盖层 */}
                  {showInfo && (
                    <div className="absolute inset-0 bg-gradient-to-t from-black/95 via-black/70 to-transparent flex flex-col justify-end p-4 sm:p-6">
                      <div className="space-y-2 sm:space-y-3">
                        <h4 className="text-gold-100 font-display text-lg sm:text-xl font-semibold mb-2 sm:mb-3 break-words">{e.name}</h4>
                        {variableInfo.map(([key, value], idx) => {
                          const isCombatPower = key === '肉身战力' || key === '魔法战力';
                          const colorClass = isCombatPower ? getCombatPowerColor(value) : '';

                          return (
                            <div key={idx} className="text-sm sm:text-base text-stone-300 break-words">
                              <span className="text-stone-500">{key}：</span>
                              <span className={colorClass || 'text-gold-200'}>{String(value ?? '—')}</span>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  )}
                </>
              );
            })()}
          </div>
        </div>
      )}
    </>
  );
};

const ParallelEventsView: React.FC<{ mvuStat: any | null }> = ({ mvuStat }) => {
   const root = mvuStat?.['平行宇宙'] ?? {};
   const events = Object.keys(root || {})
     .filter(k => k !== '$meta')
     .map(name => {
       const raw = root[name];
       if (typeof raw === 'string') {
         return {
           name,
           current: raw,
           remaining: '',
         };
       }
       if (raw && typeof raw === 'object') {
         return {
           name,
           current: String(raw.当前行为 ?? '未知行为'),
           remaining: String(raw.剩余时间 ?? ''),
         };
       }
       return {
         name,
         current: '未知行为',
         remaining: '',
       };
     });

   return (
      <div className="h-full overflow-y-auto custom-scrollbar p-2">
         <div className="space-y-4">
            {events.map((evt, i) => (
               <div key={i} className="flex gap-4 items-start group">
                  {/* Timeline Node */}
                  <div className="flex flex-col items-center gap-1 min-w-[60px] pt-1">
                      <div className="w-3 h-3 rounded-full border-2 border-stone-600 bg-stone-900 group-hover:border-gold-500 group-hover:bg-gold-900/50 transition-colors shadow-[0_0_5px_rgba(0,0,0,0.5)]"></div>
                      <div className="w-[1px] h-full bg-stone-800 group-last:hidden"></div>
                  </div>

                  {/* Content Card */}
                  <div className="flex-1 bg-stone-900/40 border border-stone-800 rounded p-4 relative hover:bg-stone-900/60 transition-colors">
                     <span className="absolute -left-2 top-2 w-2 h-4 border-l border-b border-stone-800 bg-stone-950/0 rotate-45 transform origin-bottom-left"></span>
                     <div className="flex items-center gap-2 mb-1">
                        <GitMerge size={14} className="text-stone-500" />
                        <h4 className="text-gold-200 font-display text-sm tracking-wide bg-stone-950 px-2 rounded border border-stone-800">
                          {evt.name}
                        </h4>
                     </div>
                     <p className="text-stone-400 font-serif text-sm leading-relaxed">
                       {evt.current}
                       {evt.remaining ? `（剩余时间：${evt.remaining}）` : ''}
                     </p>
                  </div>
               </div>
            ))}
         </div>
         {events.length === 0 && (
         <div className="mt-8 text-center">
              <span className="text-xs text-stone-600 font-mono italic">尚未观测到任何平行宇宙事件</span>
         </div>
         )}
      </div>
   );
};

const MapView: React.FC<{ showGrid: boolean }> = ({ showGrid }) => {
  const [clickedLocationIndex, setClickedLocationIndex] = useState<number | null>(null);

  // 地点数据（根据你给的结构整理）
  const regions = [
    {
      name: '人类联合王国',
      children: [
        { name: '王宫', desc: '权力核心', people: '艾莉亚, 奥古斯都三世', x: 50, y: 70 },
        { name: '炼金协会总部', desc: '魔力水晶生产与最高研究机构', people: '玛奇玛', x: 40, y: 68 },
        { name: '白塔学院', desc: '培养魔法师与学者的最高学府', people: '索菲亚', x: 65, y: 68 },
        { name: '钢铁要塞', desc: '王国南部边境，面向永恒战场的军事防线', people: '', x: 48, y: 60 },
        { name: '第一军团驻地', desc: '钢铁要塞内的精锐军团驻地', people: '伊莎贝拉', x: 55, y: 60 },
        { name: '港口城·潮汐之门', desc: '王国最大的贸易港口，负责海上物资运输与海军驻扎', people: '克拉拉', x: 30, y: 80 },
        { name: '巨石城', desc: '西部山脉脚下的矿业城市，为王国提供金属和矿石资源', people: '卡珊德拉', x: 32, y: 62 },
        { name: '黄金平原', desc: '王国的主要粮食产区，由众多农业城镇组成', people: '', x: 38, y: 76 },
        { name: '旧王都·晨星城遗址', desc: '上一个被魔族攻陷的人类王都，现已成废墟', people: '', x: 62, y: 55 },
      ],
    },
    {
      name: '永恒战场',
      children: [
        { name: '骸骨之痕', desc: '古代战场遗迹，散落着巨型生物和战争机械的残骸', people: '', x: 62, y: 39 },
        { name: '叹息之墙', desc: '人类方沿地脉枯竭区边缘建造的巨大城墙', people: '', x: 50, y: 55 },
        { name: '魔牙壁垒', desc: '魔族在战场前线建立的进攻性要塞群', people: '巴洛克', x: 50, y: 30 },
        { name: '无主之地', desc: '墙与壁垒之间的缓冲地带，双方斥候交战区', people: '', x: 50, y: 50 },
      ],
    },
    {
      name: '魔族领地',
      children: [
        { name: '魔王城·诺克萨斯', desc: '古代魔族堡垒，由一整块黑曜石山峰雕刻而成', people: '阿兹莫', x: 50, y: 8 },
        { name: '深渊王座', desc: '魔王的权力中心，笼罩着深不可测的压迫感', people: '奈尔法', x: 50, y: 18 },
        { name: '血祭神庙', desc: '魔族进行力量转化仪式和血脉强化的场所', people: '', x: 35, y: 15 },
        { name: '孵化深渊', desc: '培育新生代魔族士兵的巨大生物巢穴', people: '佩拉', x: 42, y: 21 },
        { name: '骸骨熔炉', desc: '处理战死者尸骸并将其能量回收的设施', people: '', x: 58, y: 20 },
        { name: '尖啸峡谷', desc: '魔族空军巢穴和训练场', people: '', x: 62, y: 15 },
        { name: '遗忘监牢', desc: '囚禁叛徒和强大战俘的地底监狱', people: '', x: 40, y: 13 },
      ],
    },
    {
      name: '东方精灵之森',
      children: [
        { name: '世界树·伊格德拉修', desc: '覆盖大陆东部的原始森林核心', people: '', x: 78, y: 20 },
        { name: '精灵议会', desc: '精灵长老议事之地', people: '艾拉瑞亚', x: 72, y: 39 },
        { name: '月亮湖', desc: '纯净自然魔力的汇集地', people: '奈菲', x: 78, y: 54 },
        { name: '迷雾沼泽', desc: '能迷惑入侵者心智的天然屏障', people: '莉安德拉', x: 79, y: 61 },
        { name: '古树哨兵', desc: '拥有自我意识的巨大树木防线', people: '', x: 71, y: 52 },
        { name: '星光圣殿', desc: '观察星辰与预知未来的古代遗迹', people: '菲莱拉', x: 86, y: 30 },
      ],
    },
    {
      name: '西部翼族山脉',
      children: [
        { name: '风咏之巅', desc: '大陆最高峰，终年风暴环绕', people: '', x: 22, y: 10 },
        { name: '翼族栖息地', desc: '建造在悬崖峭壁上的云端巢穴', people: '艾拉', x: 21, y: 22 },
        { name: '无声风穴', desc: '翼族冥想与风元素沟通的圣地', people: '', x: 28, y: 31 },
        { name: '孤高之巢', desc: '最年长翼族隐居的独立山峰', people: '泰瑞尔', x: 23, y: 30 },
        { name: '试炼之崖', desc: '年轻翼族飞行与战斗试炼的悬崖', people: '伊卡洛斯', x: 25, y: 40 },
      ],
    },
    {
      name: '环大陆之海',
      children: [
        { name: '海盗港·利维坦之骨', desc: '由巨大海兽骸骨构成的法外之地', people: '', x: 9, y: 51},
        { name: '中央大漩涡', desc: '海域中心常年存在的巨型漩涡', people: '', x: 15, y: 75 },
        { name: '深海王国·亚特兰', desc: '人鱼种族的文明中心', people: '莉莉丝,涅瑞伊得,雷戈', x: 92, y: 85 },
        { name: '幽灵船海域', desc: '终年被浓雾笼罩的海域', people: '', x: 85, y: 75 },
        { name: '风暴之墙', desc: '环绕外海的永不平息雷暴带', people: '', x: 95, y: 10 },
      ],
    },
  ];

  const locations = regions.flatMap(region =>
    region.children.map(child => ({
      ...child,
      region: region.name,
    })),
  );

  const getTooltipAlign = (x: number, y: number) => {
    const horizontal = x < 33 ? 'left' : x > 66 ? 'right' : 'center';
    const vertical = y > 66 ? 'top' : y < 33 ? 'bottom' : 'middle';
    return { horizontal, vertical };
  };

  const handleLocationClick = (index: number, e: React.MouseEvent) => {
    e.stopPropagation();
    setClickedLocationIndex(clickedLocationIndex === index ? null : index);
  };

  const handleMapClick = () => {
    setClickedLocationIndex(null);
  };

  return (
    <div className="w-full h-full flex items-center justify-center bg-black overflow-hidden">
      {/* 内层容器尺寸完全由图片决定，发光点用百分比相对图片本身定位，天然自适应且不偏移 */}
      <div
        className="relative inline-block max-w-full max-h-[90vh]"
        onClick={handleMapClick}
      >
        <img
          src="https://files.catbox.moe/66aung.png"
          alt="World Map"
          className="block max-w-full max-h-[90vh] h-auto w-auto opacity-90"
        />

        {/* 发光点与信息框：仅在全屏(showGrid=true)时显示（且仅通过点击触发） */}
        {showGrid && locations.map((loc, index) => {
          const { horizontal, vertical } = getTooltipAlign(loc.x, loc.y);
          const isClicked = clickedLocationIndex === index;
          const shouldShowTooltip = isClicked; // 仅点击时显示

          const baseX = `${loc.x}%`;
          const baseY = `${loc.y}%`;

          const tooltipClasses = [
            'absolute z-40 w-64 p-4 rounded-lg bg-[#05050b]/95 border border-[var(--gold-700)]/60',
            'shadow-[0_18px_45px_rgba(0,0,0,0.8)] text-xs text-[var(--gold-100)]',
            'pointer-events-auto transition-opacity duration-200',
          ].join(' ');

          const style: React.CSSProperties = {};
          if (vertical === 'top') {
            style.bottom = `calc(100% - ${baseY})`;
          } else if (vertical === 'bottom') {
            style.top = baseY;
          } else {
            style.top = `calc(${baseY} - 50%)`;
          }

          if (horizontal === 'left') {
            style.left = `calc(${baseX} + 12px)`;
          } else if (horizontal === 'right') {
            style.right = `calc(100% - ${baseX} + 12px)`;
          } else {
            style.left = baseX;
            style.transform = 'translateX(-50%)';
          }

          const arrowStyle: React.CSSProperties = {};
          if (vertical === 'top') {
            arrowStyle.top = '100%';
          } else if (vertical === 'bottom') {
            arrowStyle.bottom = '100%';
          } else {
            arrowStyle.top = '50%';
          }
          if (horizontal === 'left') {
            arrowStyle.left = '8px';
          } else if (horizontal === 'right') {
            arrowStyle.right = '8px';
          } else {
            arrowStyle.left = '50%';
            arrowStyle.transform = 'translateX(-50%)';
          }

          return (
            <div
              key={index}
              className="absolute cursor-pointer"
              style={{ left: baseX, top: baseY }}
              onClick={(e) => handleLocationClick(index, e)}
            >
              {/* 发光点 */}
              <div className={`relative w-3 h-3 transition-all ${isClicked ? 'scale-125' : ''}`}>
                <div className="absolute inset-0 rounded-full bg-[var(--gold-500)] shadow-[0_0_15px_rgba(214,167,79,0.9)] animate-ping-slow opacity-60" />
                <div className={`absolute inset-0 rounded-full bg-[var(--gold-500)] ${isClicked ? 'ring-2 ring-[var(--gold-400)]' : ''}`} />
              </div>

              {/* 点击信息卡（仅点击时显示） */}
              {shouldShowTooltip && (
                <div
                  className={`${tooltipClasses} opacity-100`}
                  style={style}
                  onClick={(e) => e.stopPropagation()}
                >
                  <div className="text-[10px] uppercase tracking-[0.25em] text-[var(--gold-300)] mb-2">
                    {loc.region}
                  </div>
                  <h4 className="text-sm font-display text-[var(--gold-100)] mb-1">{loc.name}</h4>
                  {loc.desc && <p className="text-[11px] text-stone-300 mb-1">{loc.desc}</p>}
                  {loc.people && (
                    <p className="text-[11px] text-emerald-300">
                      相关人物：<span className="font-mono">{loc.people}</span>
                    </p>
                  )}

                  {/* 小箭头，指向发光点 */}
                  <div
                    className="absolute w-2 h-2 bg-[#05050b] border-[var(--gold-700)]/60 rotate-45"
                    style={arrowStyle}
                  />
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};
