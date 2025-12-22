import { Settings2, Sparkles, X } from 'lucide-react';
import React, { useEffect, useRef, useState } from 'react';
import { Message } from '../types';

interface MainContentProps {
  chatLog: Message[];
  onSendMessage: (message: string) => void;
  isProcessing: boolean;
  mainText?: string;
  options?: string[]; // 从 <option> 标签提取的选项
  // 允许外部（例如技能面板）注册一个函数，用于向输入框预填文本
  registerPrefillHandler?: (fn: (text: string) => void) => void;
  // 当左右栏全部隐藏时，让正文区域铺满可用宽度
  expandFull?: boolean;
}

interface TextSettings {
  width: number; // Percentage
  fontSize: number; // px
  letterSpacing: number; // px
  fontFamily: string; // Tailwnd class
  offsetX: number; // px, 正文整体左右偏移
  quoteColors: {
    double: string; // "" 的颜色
    chineseLeft: string; // 「」 的颜色
  };
}

export const MainContent: React.FC<MainContentProps> = ({
  chatLog,
  isProcessing,
  mainText,
  options = [],
  onSendMessage,
  registerPrefillHandler,
  expandFull = false,
}) => {
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const [showSettings, setShowSettings] = useState(false);

  // 默认设置
  const defaultSettings: TextSettings = {
    width: 85,
    fontSize: 14,
    letterSpacing: 0,
    fontFamily: 'font-serif',
    offsetX: 0,
    quoteColors: {
      double: '#fbbf24', // amber-400
      chineseLeft: '#34d399', // emerald-400
    },
  };

  // 从聊天变量读取保存的设置
  const loadSettings = (): TextSettings => {
    try {
      // @ts-expect-error getVariables 为全局注入
      const vars = getVariables({ type: 'chat' });
      const saved = vars?.['ui_settings']?.['textSettings'];
      if (saved && typeof saved === 'object') {
        return {
          width: typeof saved.width === 'number' ? saved.width : defaultSettings.width,
          fontSize: typeof saved.fontSize === 'number' ? saved.fontSize : defaultSettings.fontSize,
          letterSpacing: typeof saved.letterSpacing === 'number' ? saved.letterSpacing : defaultSettings.letterSpacing,
          fontFamily: typeof saved.fontFamily === 'string' ? saved.fontFamily : defaultSettings.fontFamily,
          offsetX: typeof saved.offsetX === 'number' ? saved.offsetX : defaultSettings.offsetX,
          quoteColors: saved.quoteColors && typeof saved.quoteColors === 'object'
            ? {
                double: typeof saved.quoteColors.double === 'string' ? saved.quoteColors.double : defaultSettings.quoteColors.double,
                chineseLeft: typeof saved.quoteColors.chineseLeft === 'string' ? saved.quoteColors.chineseLeft : defaultSettings.quoteColors.chineseLeft,
              }
            : defaultSettings.quoteColors,
        };
      }
    } catch (err) {
      console.warn('读取字体设置失败，使用默认值', err);
    }
    return defaultSettings;
  };

  const [settings, setSettings] = useState<TextSettings>(loadSettings);
  const [inputValue, setInputValue] = useState('');
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // 保存设置到聊天变量
  const saveSettings = (newSettings: TextSettings) => {
    try {
      // @ts-expect-error getVariables, insertOrAssignVariables 为全局注入
      const vars = getVariables({ type: 'chat' });
      const updated = {
        ...vars,
        ui_settings: {
          ...(vars?.ui_settings || {}),
          textSettings: newSettings,
        },
      };
      // @ts-expect-error insertOrAssignVariables 为全局注入
      insertOrAssignVariables(updated, { type: 'chat' });
    } catch (err) {
      console.warn('保存字体设置失败', err);
    }
  };

  // 组件加载时读取设置
  useEffect(() => {
    const loaded = loadSettings();
    setSettings(loaded);
  }, []);

  // 设置改变时保存
  const updateSettings = (newSettings: TextSettings) => {
    setSettings(newSettings);
    saveSettings(newSettings);
  };

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [chatLog]);

  // 让外部可以把一段文字“塞进”输入框（例如点击技能时）
  useEffect(() => {
    if (!registerPrefillHandler) return;
    registerPrefillHandler((text: string) => {
      setInputValue(text);
    });
  }, [registerPrefillHandler]);

  // 自动调整 textarea 高度
  useEffect(() => {
    const textarea = textareaRef.current;
    if (!textarea) return;
    // 重置高度以获取正确的 scrollHeight
    textarea.style.height = 'auto';
    // 设置新高度，但不超过 max-h-[200px] (200px)
    const newHeight = Math.min(textarea.scrollHeight, 200);
    textarea.style.height = `${newHeight}px`;
  }, [inputValue]);

  const handleSubmit = () => {
    const content = inputValue.trim();
    if (!content) return;
    try {
      onSendMessage(content);
      setInputValue('');
    } catch (e) {
      console.error('发送消息失败', e);
      // 这里交给上层决定是否 toast
    }
  };

  // 解析文本，将引号内的文字用指定颜色渲染
  const renderTextWithQuoteColors = (text: string): React.ReactNode => {
    if (!text) return text;

    const parts: React.ReactNode[] = [];
    let lastIndex = 0;
    let key = 0;

    // 匹配引号对：""、「」
    const patterns = [
      { open: '"', close: '"', color: settings.quoteColors.double },
      { open: '「', close: '」', color: settings.quoteColors.chineseLeft },
    ];

    // 找到所有引号对的位置
    const matches: Array<{ start: number; end: number; color: string; content: string }> = [];

    patterns.forEach(pattern => {
      let searchIndex = 0;
      while (searchIndex < text.length) {
        const openIndex = text.indexOf(pattern.open, searchIndex);
        if (openIndex === -1) break;

        const closeIndex = text.indexOf(pattern.close, openIndex + 1);
        if (closeIndex === -1) break;

        matches.push({
          start: openIndex,
          end: closeIndex,
          color: pattern.color,
          content: text.substring(openIndex + 1, closeIndex),
        });

        searchIndex = closeIndex + 1;
      }
    });

    // 按位置排序
    matches.sort((a, b) => a.start - b.start);

    // 处理重叠：如果引号重叠，优先处理第一个
    const processedMatches: typeof matches = [];
    let lastEnd = -1;
    matches.forEach(match => {
      if (match.start > lastEnd) {
        processedMatches.push(match);
        lastEnd = match.end;
      }
    });

    // 构建渲染结果
    processedMatches.forEach(match => {
      // 添加引号前的文本（保留换行符）
      if (match.start > lastIndex) {
        const beforeText = text.substring(lastIndex, match.start);
        parts.push(
          <React.Fragment key={key++}>{beforeText}</React.Fragment>
        );
      }

      // 添加引号开始
      parts.push(
        <span key={key++} style={{ color: match.color }}>
          {text[match.start]}
        </span>
      );

      // 添加引号内的内容（带颜色，保留换行符）
      parts.push(
        <span key={key++} style={{ color: match.color }}>
          {match.content}
        </span>
      );

      // 添加引号结束
      parts.push(
        <span key={key++} style={{ color: match.color }}>
          {text[match.end]}
        </span>
      );

      lastIndex = match.end + 1;
    });

    // 添加剩余文本（保留换行符）
    if (lastIndex < text.length) {
      const remainingText = text.substring(lastIndex);
      parts.push(
        <React.Fragment key={key++}>{remainingText}</React.Fragment>
      );
    }

    return parts.length > 0 ? <>{parts}</> : text;
  };

  return (
    <main
      className={`
        min-w-0 flex flex-col h-full
        bg-gradient-to-br from-[#0f1018cc] via-[#0b0d13cc] to-[#050507cc]
        rounded-2xl border border-[#2f3040]
        shadow-[0_20px_60px_rgba(0,0,0,0.65)]
        relative overflow-hidden mx-3 backdrop-blur-xl column-scroll
        ${expandFull ? 'basis-full' : 'basis-[56%]'}
      `}
    >
      {/* Background Texture */}
      <div className="absolute inset-0 opacity-5 bg-[url('https://www.transparenttextures.com/patterns/dark-matter.png')] pointer-events-none"></div>

      {/* Header / Title */}
      <div className="p-4 border-b border-[#2f3040] bg-[#0c0e16bf] backdrop-blur-xl flex justify-between items-center z-10 shrink-0 shadow-[0_10px_30px_rgba(0,0,0,0.55)]">
         <div className="flex items-center gap-2">
            <Sparkles size={16} className="text-[var(--gold-500)] animate-pulse-slow" />
            <h1 className="font-display text-[var(--gold-100)] text-lg tracking-[0.2em] drop-shadow-xl">命运轨迹</h1>
         </div>
         <button
           onClick={() => setShowSettings(!showSettings)}
           className={`p-2 rounded-lg border border-transparent hover:border-[var(--gold-500)] hover:bg-white/5 transition-all ${showSettings ? 'text-[var(--gold-300)]' : 'text-stone-400'}`}
         >
            <Settings2 size={18} />
         </button>
      </div>

      {/* Settings Panel */}
      {showSettings && (
         <div className="absolute top-16 right-4 z-20 w-64 bg-[#0f1018f2] border border-[var(--gold-700)]/40 rounded-xl p-4 shadow-[0_15px_40px_rgba(0,0,0,0.6)] backdrop-blur-xl animate-slideUp">
            <div className="flex justify-between items-center mb-3 border-b border-[#2f3040] pb-2">
               <span className="text-xs font-display text-[var(--gold-100)] uppercase tracking-widest">阅读设置</span>
               <button onClick={() => setShowSettings(false)} className="text-stone-500 hover:text-stone-200"><X size={14}/></button>
            </div>

            <div className="space-y-4">
               {/* Width Control */}
               <div>
                  <label className="text-[10px] text-stone-400 uppercase block mb-1">文本宽度 ({settings.width}%)</label>
                  <input
                    type="range" min="50" max="100" step="5"
                    value={settings.width}
                    onChange={(e) => updateSettings({...settings, width: parseInt(e.target.value)})}
                    className="w-full h-1 bg-stone-700 rounded-lg appearance-none cursor-pointer accent-gold-500"
                  />
               </div>

               {/* Horizontal Offset */}
               <div>
                  <label className="text-[10px] text-stone-400 uppercase block mb-1">
                    水平偏移 ({settings.offsetX}px)
                  </label>
                  <input
                    type="range"
                    min="-200"
                    max="200"
                    step="10"
                    value={settings.offsetX}
                    onChange={(e) => updateSettings({ ...settings, offsetX: parseInt(e.target.value) })}
                    className="w-full h-1 bg-stone-700 rounded-lg appearance-none cursor-pointer accent-gold-500"
                  />
                  <p className="mt-1 text-[10px] text-stone-500">
                    负值向左移动，正值向右移动。
                  </p>
               </div>

               {/* Font Size Control */}
               <div>
                  <label className="text-[10px] text-stone-400 uppercase block mb-1">字体大小 ({settings.fontSize}px)</label>
                  <input
                    type="range" min="12" max="24" step="1"
                    value={settings.fontSize}
                    onChange={(e) => updateSettings({...settings, fontSize: parseInt(e.target.value)})}
                    className="w-full h-1 bg-stone-700 rounded-lg appearance-none cursor-pointer accent-gold-500"
                  />
               </div>

               {/* Letter Spacing Control */}
               <div>
                  <label className="text-[10px] text-stone-400 uppercase block mb-1">字间距 ({settings.letterSpacing}px)</label>
                  <input
                    type="range" min="0" max="5" step="0.5"
                    value={settings.letterSpacing}
                    onChange={(e) => updateSettings({...settings, letterSpacing: parseFloat(e.target.value)})}
                    className="w-full h-1 bg-stone-700 rounded-lg appearance-none cursor-pointer accent-gold-500"
                  />
               </div>

                {/* Font Family Control */}
               <div>
                  <label className="text-[10px] text-stone-400 uppercase block mb-1">字体风格</label>
                  <select
                    value={settings.fontFamily}
                    onChange={(e) => updateSettings({...settings, fontFamily: e.target.value})}
                    className="w-full bg-[#0b0d13] border border-[#2f3040] text-[var(--gold-100)] text-xs rounded p-1 focus:border-[var(--gold-500)] outline-none"
                  >
                     <option value="font-serif">衬线 (Serif)</option>
                     <option value="font-sans">无衬线 (Sans)</option>
                     <option value="font-mono">等宽 (Mono)</option>
                     <option value="font-display">展示 (Display)</option>
                  </select>
               </div>

               {/* Quote Colors Control */}
               <div className="border-t border-[#2f3040] pt-4 mt-4">
                  <label className="text-[10px] text-stone-400 uppercase block mb-2">引号颜色</label>
                  <div className="space-y-2">
                     <div className="flex items-center gap-2">
                        <label className="text-[10px] text-stone-500 w-16">双引号 ""</label>
                        <input
                          type="color"
                          value={settings.quoteColors.double}
                          onChange={(e) => updateSettings({
                            ...settings,
                            quoteColors: { ...settings.quoteColors, double: e.target.value }
                          })}
                          className="flex-1 h-6 rounded border border-[#2f3040] cursor-pointer"
                        />
                     </div>
                     <div className="flex items-center gap-2">
                        <label className="text-[10px] text-stone-500 w-16">中文「」</label>
                        <input
                          type="color"
                          value={settings.quoteColors.chineseLeft}
                          onChange={(e) => updateSettings({
                            ...settings,
                            quoteColors: { ...settings.quoteColors, chineseLeft: e.target.value }
                          })}
                          className="flex-1 h-6 rounded border border-[#2f3040] cursor-pointer"
                        />
                     </div>
                  </div>
               </div>
            </div>
         </div>
      )}

      {/* Main Area */}
      <div className="flex-1 overflow-y-auto space-y-6 custom-scrollbar z-10 scroll-smooth" style={{ padding: settings.width === 100 ? '0' : '1.5rem' }}>
        {mainText && (
        <div
          className="w-full flex flex-col items-center gap-4"
          style={{ transform: `translateX(${settings.offsetX}px)` }}
        >
            <div
              className={`
                bg-[#0b0d13e6] border border-[var(--gold-700)]/50 rounded-xl p-6
                shadow-[0_20px_60px_rgba(0,0,0,0.65)] backdrop-blur-xl
                ${settings.fontFamily}
              `}
              style={{
                width: `${settings.width}%`,
                maxWidth: expandFull ? '100%' : '960px',
                fontSize: `${settings.fontSize}px`,
                letterSpacing: `${settings.letterSpacing}px`,
                borderRadius: settings.width === 100 ? '0' : undefined,
              }}
            >
              <div className="text-xs text-[var(--gold-300)] uppercase tracking-[0.25em] mb-3 flex items-center gap-2">
                <span className="w-6 h-[1px] bg-[var(--gold-500)]/60" />
                正文
                <span className="flex-1 h-[1px] bg-[var(--gold-500)]/30" />
              </div>
              <div className="whitespace-pre-wrap leading-7 text-[var(--gold-100)] drop-shadow">
                {renderTextWithQuoteColors(mainText)}
              </div>
            </div>

            {/* 选项按钮区域 */}
            {options.length > 0 && (
              <div className="w-full flex justify-center" style={{ paddingLeft: settings.width === 100 ? '0' : undefined, paddingRight: settings.width === 100 ? '0' : undefined }}>
                <div
                  className="flex flex-col gap-3"
                  style={{
                    width: `${settings.width}%`,
                    maxWidth: expandFull ? '100%' : '960px',
                  }}
                >
                  <div className="text-xs text-[var(--gold-300)] uppercase tracking-[0.25em] mb-1 flex items-center gap-2">
                    <span className="w-6 h-[1px] bg-[var(--gold-500)]/60" />
                    选择行动
                    <span className="flex-1 h-[1px] bg-[var(--gold-500)]/30" />
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {options.map((option, index) => {
                      const optionLabel = ['A', 'B', 'C', 'D'][index];
                      return (
                        <button
                          key={index}
                          onClick={() => {
                            setInputValue(option);
                            // 自动聚焦到输入框
                            textareaRef.current?.focus();
                          }}
                          className="bg-[#0b0d13e6] border border-[var(--gold-700)]/50 rounded-lg p-4 text-left hover:border-[var(--gold-500)] hover:bg-[#0b0d13f0] transition-all duration-200 group"
                        >
                          <div className="flex items-start gap-3">
                            <div className="flex-shrink-0 w-8 h-8 flex items-center justify-center bg-[var(--gold-700)]/20 border border-[var(--gold-700)]/50 rounded font-display font-bold text-[var(--gold-300)] group-hover:bg-[var(--gold-700)]/40 group-hover:text-[var(--gold-200)] transition-colors">
                              {optionLabel}
                            </div>
                            <div className="flex-1">
                              <div className="text-sm text-[var(--gold-100)] font-serif leading-relaxed">
                                {option}
                              </div>
                            </div>
                          </div>
                        </button>
                      );
                    })}
                  </div>
                </div>
              </div>
            )}

            {/* 正文下方输入框 */}
            <div className="w-full flex justify-center" style={{ paddingLeft: settings.width === 100 ? '0' : undefined, paddingRight: settings.width === 100 ? '0' : undefined }}>
              <div
                className="flex items-start gap-2"
                style={{
                  width: `${settings.width}%`,
                  maxWidth: expandFull ? '100%' : '960px',
                }}
              >
                <textarea
                  ref={textareaRef}
                  className="flex-1 bg-[#080910] border border-[var(--gold-700)]/40 rounded-lg px-4 py-2 text-sm text-[var(--gold-100)] placeholder:text-stone-500 focus:outline-none focus:border-[var(--gold-500)] focus:ring-1 focus:ring-[var(--gold-500)] shadow-[0_0_12px_rgba(0,0,0,0.8)] resize-none min-h-[44px] max-h-[200px] overflow-y-auto custom-scrollbar leading-relaxed"
                  placeholder="在此输入你对当前局面的行动、发言或指令，按 Enter 发送，Shift+Enter 换行……"
                  value={inputValue}
                  onChange={(e) => setInputValue(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && !e.shiftKey) {
                      e.preventDefault();
                      handleSubmit();
                    }
                  }}
                  rows={1}
                  style={{
                    fontSize: `${settings.fontSize}px`,
                    letterSpacing: `${settings.letterSpacing}px`,
                    fontFamily: settings.fontFamily === 'font-serif' ? 'serif' :
                                settings.fontFamily === 'font-sans' ? 'sans-serif' :
                                settings.fontFamily === 'font-mono' ? 'monospace' :
                                settings.fontFamily === 'font-display' ? 'Cinzel, "Cormorant Garamond", "Noto Serif SC", serif' : 'inherit',
                  }}
                />
              </div>
            </div>
          </div>
        )}
        {!mainText && chatLog.map((msg, index) => (
          <div
            key={index}
            className={`flex flex-col items-center animate-fadeIn`}
            style={{ animationDelay: `${index * 50}ms` }}
          >
            {msg.role === 'system' && (
              <div className="w-full text-center my-4">
                 <span className="text-xs text-gold-700/60 font-mono border-b border-gold-900/30 pb-1 px-4">{msg.content}</span>
              </div>
            )}

            {msg.role !== 'system' && (
              <div
                className="flex flex-col w-full"
                style={{ width: `${settings.width}%` }}
              >
                 <span className={`text-[10px] text-stone-600 mb-1 px-1 uppercase tracking-wider font-bold ${msg.role === 'user' ? 'text-right' : 'text-left'}`}>
                    {msg.role === 'user' ? '你' : '地下城主 (DM)'}
                 </span>
                 <div
                   className={`
                     p-6 rounded-lg leading-relaxed shadow-lg text-left relative
                     ${msg.role === 'user'
                       ? 'bg-stone-900/90 text-stone-200 border border-stone-700'
                       : 'bg-gradient-to-br from-stone-950 to-black text-stone-300 border border-gold-900/40'}
                     ${settings.fontFamily}
                   `}
                   style={{
                     fontSize: `${settings.fontSize}px`,
                     letterSpacing: `${settings.letterSpacing}px`
                   }}
                 >
                    {msg.role === 'model' && (
                       // Corner accents for model messages
                       <>
                         <div className="absolute top-0 left-0 w-2 h-2 border-t border-l border-gold-600/40"></div>
                         <div className="absolute bottom-0 right-0 w-2 h-2 border-b border-r border-gold-600/40"></div>
                       </>
                    )}
                    <div className="whitespace-pre-wrap">{msg.content}</div>
                 </div>
              </div>
            )}
          </div>
        ))}
        {!mainText && isProcessing && (
           <div className="flex justify-center p-4">
               <div className="flex items-center gap-2">
                  <div className="w-2 h-2 bg-gold-500 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></div>
                  <div className="w-2 h-2 bg-gold-500 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></div>
                  <div className="w-2 h-2 bg-gold-500 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></div>
               </div>
           </div>
        )}
        <div ref={messagesEndRef} />
      </div>
    </main>
  );
};
