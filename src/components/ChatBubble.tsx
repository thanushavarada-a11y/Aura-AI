import React, { useState } from 'react';
import { Message } from '../types/chat';
import { Sparkles, Code, Brain, Zap, User, Copy, Check, ChevronDown, ChevronUp } from 'lucide-react';

interface ChatBubbleProps {
  message: Message;
  modelIcon?: string;
}

export const ChatBubble: React.FC<ChatBubbleProps> = ({ message, modelIcon }) => {
  const { sender, content, timestamp } = message;
  const [copied, setCopied] = useState(false);
  const [thoughtExpanded, setThoughtExpanded] = useState(false);

  const handleCopy = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  // Helper to format timestamp
  const formatTime = (isoString: string) => {
    try {
      const date = new Date(isoString);
      return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    } catch {
      return '';
    }
  };

  // Extract thinking process if present
  const thoughtRegex = /<thought>([\s\S]*?)<\/thought>/;
  const thoughtMatch = content.match(thoughtRegex);
  const thoughtText = thoughtMatch ? thoughtMatch[1].trim() : null;
  const displayContent = thoughtMatch ? content.replace(thoughtRegex, '').trim() : content;

  // Simple custom markdown-like renderer (handles paragraphs and code blocks)
  const renderMessageContent = (text: string) => {
    const parts = text.split(/(```[\s\S]*?```)/g);

    return parts.map((part, index) => {
      if (part.startsWith('```')) {
        // Code Block
        const lines = part.split('\n');
        const firstLine = lines[0].replace('```', '').trim();
        const codeLanguage = firstLine || 'code';
        const codeContent = lines.slice(1, -1).join('\n');

        return (
          <div key={index} className="my-3 rounded-xl overflow-hidden border border-white/5 bg-slate-950/80 max-w-full">
            <div className="flex justify-between items-center px-4 py-2 bg-slate-900 border-b border-white/5 text-xs text-slate-400 font-mono">
              <span>{codeLanguage}</span>
              <button
                onClick={() => handleCopy(codeContent)}
                className="flex items-center space-x-1 hover:text-white transition-colors"
                title="Copy Code"
              >
                {copied ? <Check size={12} className="text-emerald-400" /> : <Copy size={12} />}
                <span>{copied ? 'Copied!' : 'Copy'}</span>
              </button>
            </div>
            <pre className="p-4 text-sm font-mono overflow-x-auto text-violet-200/90 leading-relaxed scrollbar-thin">
              <code>{codeContent}</code>
            </pre>
          </div>
        );
      } else {
        // Plain text with line breaks
        const paragraphs = part.split('\n');
        return paragraphs.map((para, pIdx) => {
          if (!para.trim()) return null;
          
          // Bold formatting **text**
          const boldParts = para.split(/(\*\*.*?\*\*)/g);
          const renderedPara = boldParts.map((bPart, bIdx) => {
            if (bPart.startsWith('**') && bPart.endsWith('**')) {
              return <strong key={bIdx} className="text-white font-semibold">{bPart.slice(2, -2)}</strong>;
            }
            return bPart;
          });

          return (
            <p key={`${index}-${pIdx}`} className="text-[15px] leading-relaxed text-slate-200/95 mb-2 last:mb-0">
              {renderedPara}
            </p>
          );
        });
      }
    });
  };

  // Get matching model avatar icon
  const getAvatar = () => {
    if (sender === 'user') {
      return (
        <div className="h-9 w-9 rounded-xl bg-violet-600/30 border border-violet-500/30 flex items-center justify-center text-violet-400 glow-purple">
          <User size={18} />
        </div>
      );
    }

    let iconElement = <Sparkles size={18} />;
    let bgStyle = "bg-cyan-500/20 border-cyan-500/30 text-cyan-400 glow-cyan";

    if (modelIcon === 'code') {
      iconElement = <Code size={18} />;
      bgStyle = "bg-emerald-500/20 border-emerald-500/30 text-emerald-400";
    } else if (modelIcon === 'brain') {
      iconElement = <Brain size={18} />;
      bgStyle = "bg-pink-500/20 border-pink-500/30 text-pink-400";
    } else if (modelIcon === 'zap') {
      iconElement = <Zap size={18} />;
      bgStyle = "bg-amber-500/20 border-amber-500/30 text-amber-400";
    }

    return (
      <div className={`h-9 w-9 rounded-xl border flex items-center justify-center ${bgStyle}`}>
        {iconElement}
      </div>
    );
  };

  const isUser = sender === 'user';

  return (
    <div className={`flex w-full space-x-3 md:space-x-4 mb-6 ${isUser ? 'flex-row-reverse space-x-reverse' : ''}`}>
      {/* Avatar */}
      <div className="flex-shrink-0 self-end mb-1">
        {getAvatar()}
      </div>

      {/* Bubble Content */}
      <div className={`flex flex-col max-w-[85%] md:max-w-[75%] ${isUser ? 'items-end' : 'items-start'}`}>
        {/* Name and time */}
        <div className="flex items-center space-x-2 mb-1 px-1 text-xs text-slate-500 font-medium">
          <span>{isUser ? 'You' : 'Aura AI'}</span>
          <span>•</span>
          <span>{formatTime(timestamp)}</span>
        </div>

        {/* Bubble Box */}
        <div
          className={`px-4.5 py-3.5 rounded-2xl ${
            isUser
              ? 'bg-gradient-to-br from-violet-600 to-indigo-600 text-white rounded-br-sm shadow-lg shadow-violet-950/20 border border-violet-500/20'
              : 'glass-card text-slate-200 rounded-bl-sm'
          }`}
        >
          {/* Collapsible Reasoning Block (Aura Brain mode) */}
          {thoughtText && (
            <div className="mb-3 w-full border border-pink-500/20 rounded-xl bg-pink-950/10 overflow-hidden">
              <button
                onClick={() => setThoughtExpanded(!thoughtExpanded)}
                className="w-full px-3 py-2 flex items-center justify-between text-xs text-pink-400 font-mono hover:bg-pink-500/5 transition-colors"
              >
                <span className="flex items-center space-x-1.5">
                  <Brain size={13} className="animate-pulse" />
                  <span>Thinking Process</span>
                </span>
                {thoughtExpanded ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
              </button>
              {thoughtExpanded && (
                <div className="px-4 py-3 bg-black/25 text-xs text-pink-300/80 font-mono border-t border-pink-500/10 whitespace-pre-wrap leading-relaxed">
                  {thoughtText}
                </div>
              )}
            </div>
          )}

          {/* Main Bubble Text */}
          <div className="chat-md-content break-words">
            {renderMessageContent(displayContent)}
          </div>
        </div>
      </div>
    </div>
  );
};
