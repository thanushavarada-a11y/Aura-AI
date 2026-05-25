import React, { useState, useRef, useEffect } from 'react';
import { ChatSession, BotModel } from '../types/chat';
import { BOT_MODELS } from '../hooks/useChat';
import { ChatBubble } from './ChatBubble';
import { LoadingAnimation } from './LoadingAnimation';
import { Send, Menu, Sparkles, Code, Brain, Zap, Paperclip, AlertCircle, RefreshCw } from 'lucide-react';
import { hasApiKey } from '../gemini';

interface ChatInterfaceProps {
  activeSession: ChatSession | undefined;
  isTyping: boolean;
  currentModelId: string;
  onSendMessage: (content: string) => void;
  onChangeModel: (modelId: string) => void;
  onToggleSidebar: () => void;
  onClearChat: () => void;
}

export const ChatInterface: React.FC<ChatInterfaceProps> = ({
  activeSession,
  isTyping,
  currentModelId,
  onSendMessage,
  onChangeModel,
  onToggleSidebar,
  onClearChat,
}) => {
  const [input, setInput] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const textInputRef = useRef<HTMLTextAreaElement>(null);

  // Auto-scroll to bottom of messages
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [activeSession?.messages?.length, isTyping]);

  const handleSend = (e?: React.FormEvent) => {
    e?.preventDefault();
    if (!input.trim() || isTyping) return;
    
    onSendMessage(input.trim());
    setInput('');
    
    // Reset focus
    setTimeout(() => {
      textInputRef.current?.focus();
    }, 50);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const selectSuggestion = (text: string) => {
    setInput(text);
    textInputRef.current?.focus();
  };

  const activeModel = BOT_MODELS.find(m => m.id === currentModelId) || BOT_MODELS[0];

  const getModelIcon = (iconName: string, size = 16) => {
    switch (iconName) {
      case 'code':
        return <Code size={size} />;
      case 'brain':
        return <Brain size={size} />;
      case 'zap':
        return <Zap size={size} />;
      default:
        return <Sparkles size={size} />;
    }
  };

  // Predefined prompts for empty state suggestions
  const suggestions = [
    {
      label: "Code a Glass Card",
      text: "Write a React component with TypeScript and Tailwind CSS for a glassmorphic Card.",
      icon: "code"
    },
    {
      label: "Philosophical reasoning",
      text: "Why do we search for meaning in an infinite cosmos? Explain step-by-step.",
      icon: "brain"
    },
    {
      label: "Features Check",
      text: "What are the core features of Aura AI?",
      icon: "sparkles"
    },
    {
      label: "Fast lookup",
      text: "Tell me the quick command to launch a Vite project.",
      icon: "zap"
    }
  ];

  return (
    <div className="flex flex-1 flex-col h-full bg-bg-dark relative overflow-hidden">
      
      {/* Header bar */}
      <header className="flex h-16 items-center justify-between px-4 md:px-6 border-b border-white/5 bg-bg-darker/60 backdrop-blur-md z-30">
        <div className="flex items-center space-x-3">
          {/* Menu button on mobile */}
          <button
            onClick={onToggleSidebar}
            className="rounded-lg p-2 text-slate-400 hover:bg-white/5 hover:text-white md:hidden cursor-pointer"
          >
            <Menu size={20} />
          </button>
          
          <div className="flex flex-col">
            <div className="flex items-center space-x-1.5">
              <span className="text-sm font-semibold text-white">{activeSession ? activeSession.title : 'New Chat'}</span>
              <span className="text-[10px] bg-violet-500/10 text-violet-400 border border-violet-500/20 px-1.5 py-0.5 rounded-full font-mono">
                {activeModel.name}
              </span>
            </div>
            <span className="hidden sm:inline text-xs text-slate-500 truncate max-w-sm md:max-w-md">
              {activeModel.description}
            </span>
          </div>
        </div>

        {/* Model Switcher Tabs (Desktop Header) & Clear Chat Button */}
        <div className="flex items-center space-x-2">
          <div className="flex items-center space-x-1 bg-[#060913]/60 p-1.25 border border-white/5 rounded-xl">
            {BOT_MODELS.map(model => {
              const isSelected = model.id === currentModelId;
              return (
                <button
                  key={model.id}
                  onClick={() => onChangeModel(model.id)}
                  className={`flex items-center space-x-1.5 rounded-lg px-2.5 py-1 text-xs font-semibold transition-all cursor-pointer ${
                    isSelected
                      ? 'bg-violet-600/20 text-violet-300 border border-violet-500/20 shadow-sm'
                      : 'text-slate-400 hover:text-slate-200'
                  }`}
                  title={model.description}
                >
                  {getModelIcon(model.icon, 13)}
                  <span className="hidden lg:inline">{model.name.split(' ')[0]}</span>
                </button>
              );
            })}
          </div>

          {activeSession && activeSession.messages.length > 0 && (
            <button
              onClick={onClearChat}
              className="flex items-center space-x-1.5 rounded-xl bg-rose-500/10 border border-rose-500/20 px-3 py-2 text-xs font-semibold text-rose-400 hover:bg-rose-500/20 transition-all cursor-pointer active:scale-95"
              title="Clear current session chat history"
            >
              <RefreshCw size={13} />
              <span>Clear Chat</span>
            </button>
          )}
        </div>
      </header>

      {/* Demo Mode Alert Banner */}
      {!hasApiKey && (
        <div className="bg-amber-500/10 border-b border-amber-500/20 px-4 py-3 flex items-center justify-between text-xs text-amber-400 z-20">
          <div className="flex items-center space-x-2">
            <AlertCircle size={14} className="flex-shrink-0 animate-pulse text-amber-400" />
            <span>
              <strong>Running in Demo Mode.</strong> Connect to live Google Gemini 2.5 Flash responses by creating a <code>.env</code> file with your <code>VITE_GEMINI_API_KEY</code>.
            </span>
          </div>
          <a
            href="https://aistudio.google.com/"
            target="_blank"
            rel="noopener noreferrer"
            className="px-2.5 py-1 rounded-lg bg-amber-500/20 hover:bg-amber-500/30 font-semibold transition-colors flex-shrink-0"
          >
            Get Key
          </a>
        </div>
      )}

      {/* Message Stream area */}
      <main className="flex-1 overflow-y-auto px-4 py-6 md:p-6 lg:p-8 flex flex-col">
        {!activeSession || activeSession.messages.length === 0 ? (
          // Empty State Welcome Card
          <div className="flex-1 flex flex-col items-center justify-center max-w-2xl mx-auto text-center px-4 my-auto">
            <div className="animate-float h-14 w-14 rounded-2xl bg-gradient-to-tr from-violet-600 to-indigo-600 flex items-center justify-center shadow-xl shadow-violet-500/15 mb-6">
              <Sparkles size={28} className="text-white" />
            </div>
            
            <h2 className="text-2xl md:text-3xl font-bold tracking-tight text-white mb-3">
              Explore Aura AI
            </h2>
            <p className="text-slate-400 text-sm md:text-base max-w-md mb-8 leading-relaxed">
              Choose your specialized model and ask code snippets, logic formulas, or standard assistant questions.
            </p>

            {/* Quick-select prompt cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 w-full">
              {suggestions.map((suggestion, idx) => (
                <button
                  key={idx}
                  onClick={() => selectSuggestion(suggestion.text)}
                  className="glass-card glass-card-hover p-4 rounded-2xl flex flex-col items-start text-left cursor-pointer"
                >
                  <div className="flex items-center space-x-2 text-violet-400 mb-2">
                    <span className="p-1.5 rounded-lg bg-violet-600/10 border border-violet-500/20">
                      {getModelIcon(suggestion.icon, 14)}
                    </span>
                    <span className="text-xs font-semibold">{suggestion.label}</span>
                  </div>
                  <p className="text-slate-400 text-xs line-clamp-2 leading-relaxed">
                    {suggestion.text}
                  </p>
                </button>
              ))}
            </div>
          </div>
        ) : (
          // Render Message Stream
          <div className="max-w-4xl w-full mx-auto flex-1">
            {activeSession.messages.map(message => (
              <ChatBubble
                key={message.id}
                message={message}
                modelIcon={activeModel.icon}
              />
            ))}

            {/* Simulated Typing Anim */}
            {isTyping && (
              <div className="flex w-full space-x-3 md:space-x-4 mb-6">
                <div className="flex-shrink-0 self-end">
                  <div className="h-9 w-9 rounded-xl border flex items-center justify-center bg-violet-500/20 border-violet-500/30 text-violet-400">
                    {getModelIcon(activeModel.icon, 18)}
                  </div>
                </div>
                <div className="flex flex-col items-start">
                  <div className="flex items-center space-x-2 mb-1 px-1 text-xs text-slate-500 font-medium">
                    <span>Aura AI</span>
                    <span>•</span>
                    <span>Typing...</span>
                  </div>
                  <LoadingAnimation />
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>
        )}
      </main>

      {/* Input Deck Area */}
      <footer className="p-4 md:p-6 bg-gradient-to-t from-bg-darker/90 via-bg-dark/80 to-transparent">
        <form onSubmit={handleSend} className="max-w-4xl w-full mx-auto relative">
          <div className="glass-card rounded-2xl overflow-hidden focus-within:border-violet-500/40 focus-within:ring-2 focus-within:ring-violet-600/10 transition-all">
            
            {/* Input panel text field */}
            <textarea
              ref={textInputRef}
              rows={1}
              value={input}
              onChange={e => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder={`Message ${activeModel.name}... (Press Enter to Send)`}
              className="w-full bg-transparent px-4.5 py-4.5 pr-20 text-slate-200 placeholder-slate-500 resize-none text-[15px] focus:outline-none min-h-[56px] max-h-[200px]"
              style={{ height: 'auto' }}
            />

            {/* Input Action Controls Footer */}
            <div className="flex items-center justify-between px-4 py-2 border-t border-white/4 bg-[#0a0f18]/30">
              <div className="flex items-center space-x-2">
                <button
                  type="button"
                  className="p-1.5 rounded-lg text-slate-500 hover:text-slate-300 hover:bg-white/5 cursor-pointer"
                  title="Attach Files (mock)"
                >
                  <Paperclip size={16} />
                </button>
                <div className="text-[11px] text-slate-600 font-medium flex items-center space-x-1">
                  <AlertCircle size={10} />
                  <span>AI generated results may contain errors.</span>
                </div>
              </div>

              {/* Submit trigger button */}
              <button
                type="submit"
                disabled={!input.trim() || isTyping}
                className={`flex h-8.5 w-8.5 items-center justify-center rounded-xl transition-all cursor-pointer ${
                  input.trim() && !isTyping
                    ? 'bg-violet-600 hover:bg-violet-500 text-white shadow-md shadow-violet-950/40'
                    : 'bg-slate-800 text-slate-600'
                }`}
              >
                <Send size={15} className={input.trim() && !isTyping ? 'translate-x-0.25 -translate-y-0.25' : ''} />
              </button>
            </div>

          </div>
        </form>
      </footer>

    </div>
  );
};
