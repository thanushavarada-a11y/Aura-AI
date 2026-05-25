import React, { useState } from 'react';
import { ChatSession } from '../types/chat';
import { BOT_MODELS } from '../hooks/useChat';
import { Plus, MessageSquare, Trash2, Settings, Edit3, Check, X, Sparkles, Code, Brain, Zap, Menu } from 'lucide-react';

interface SidebarProps {
  sessions: ChatSession[];
  activeSessionId: string;
  onSelectSession: (id: string) => void;
  onDeleteSession: (id: string) => void;
  onNewChat: () => void;
  onRenameSession: (id: string, newTitle: string) => void;
  isOpen: boolean;
  onClose: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  sessions,
  activeSessionId,
  onSelectSession,
  onDeleteSession,
  onNewChat,
  onRenameSession,
  isOpen,
  onClose,
}) => {
  const [editingSessionId, setEditingSessionId] = useState<string | null>(null);
  const [editTitle, setEditTitle] = useState('');

  const handleStartRename = (e: React.MouseEvent, session: ChatSession) => {
    e.stopPropagation();
    setEditingSessionId(session.id);
    setEditTitle(session.title);
  };

  const handleSaveRename = (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    if (editTitle.trim()) {
      onRenameSession(id, editTitle.trim());
    }
    setEditingSessionId(null);
  };

  const handleCancelRename = (e: React.MouseEvent) => {
    e.stopPropagation();
    setEditingSessionId(null);
  };

  // Get corresponding model icon
  const getSessionModelIcon = (modelId: string) => {
    const model = BOT_MODELS.find(m => m.id === modelId);
    switch (model?.icon) {
      case 'code':
        return <Code size={16} className="text-emerald-400" />;
      case 'brain':
        return <Brain size={16} className="text-pink-400" />;
      case 'zap':
        return <Zap size={16} className="text-amber-400" />;
      default:
        return <Sparkles size={16} className="text-cyan-400" />;
    }
  };

  return (
    <>
      {/* Mobile Backdrop Overlay */}
      {isOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/60 backdrop-blur-sm md:hidden"
          onClick={onClose}
        />
      )}

      {/* Sidebar Container */}
      <div
        className={`fixed inset-y-0 left-0 z-50 flex w-72 flex-col border-r border-white/5 bg-[#060913]/95 backdrop-blur-xl transition-transform duration-300 ease-in-out md:static md:translate-x-0 ${
          isOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        {/* Header Branding */}
        <div className="flex h-16 items-center justify-between px-6 border-b border-white/5">
          <div className="flex items-center space-x-2.5">
            <div className="h-8.5 w-8.5 rounded-xl bg-gradient-to-tr from-violet-600 to-indigo-600 flex items-center justify-center shadow-lg shadow-violet-500/25">
              <Sparkles size={16} className="text-white" />
            </div>
            <span className="font-sans font-bold text-lg tracking-wide bg-gradient-to-r from-white to-slate-400 bg-clip-text text-transparent">
              Aura AI
            </span>
          </div>
          {/* Close Menu Button on Mobile */}
          <button
            onClick={onClose}
            className="rounded-lg p-1.5 text-slate-400 hover:bg-white/5 hover:text-white md:hidden"
          >
            <X size={18} />
          </button>
        </div>

        {/* New Chat Button */}
        <div className="p-4">
          <button
            onClick={() => {
              onNewChat();
              onClose(); // close sidebar on mobile after clicking new chat
            }}
            className="flex w-full items-center justify-center space-x-2 rounded-xl bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-500 hover:to-indigo-500 px-4 py-3 text-sm font-semibold text-white transition-all shadow-md shadow-violet-950/20 active:scale-98 cursor-pointer"
          >
            <Plus size={16} />
            <span>New Session</span>
          </button>
        </div>

        {/* Sessions Scroll Area */}
        <div className="flex-1 overflow-y-auto px-3 py-2 space-y-1">
          <div className="px-3 mb-2 text-xs font-semibold uppercase tracking-wider text-slate-500">
            Recent Conversations
          </div>

          {sessions.length === 0 ? (
            <div className="p-4 text-center text-xs text-slate-500 font-medium">
              No sessions yet. Click 'New Session' above to begin.
            </div>
          ) : (
            sessions.map(session => {
              const isActive = session.id === activeSessionId;
              const isEditing = session.id === editingSessionId;

              return (
                <div
                  key={session.id}
                  onClick={() => {
                    onSelectSession(session.id);
                    onClose(); // close mobile sidebar on select
                  }}
                  className={`group relative flex items-center rounded-xl px-3 py-2.5 text-sm font-medium transition-all cursor-pointer ${
                    isActive
                      ? 'bg-white/8 text-white border border-white/5 shadow-inner'
                      : 'text-slate-400 hover:bg-white/4 hover:text-slate-200'
                  }`}
                >
                  {/* Model Icon / Indicator */}
                  <div className="mr-3 flex-shrink-0">
                    {getSessionModelIcon(session.modelId)}
                  </div>

                  {/* Title or Renamer Input */}
                  {isEditing ? (
                    <input
                      type="text"
                      value={editTitle}
                      onChange={e => setEditTitle(e.target.value)}
                      onKeyDown={e => {
                        if (e.key === 'Enter') handleSaveRename(e as any, session.id);
                        if (e.key === 'Escape') handleCancelRename(e as any);
                      }}
                      onClick={e => e.stopPropagation()}
                      className="w-full bg-slate-900 border border-violet-500/50 rounded px-1.5 py-0.5 text-xs text-white focus:outline-none"
                      autoFocus
                    />
                  ) : (
                    <span className="truncate pr-12 w-full">{session.title}</span>
                  )}

                  {/* Session Action Buttons */}
                  <div className="absolute right-2 flex items-center space-x-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    {isEditing ? (
                      <>
                        <button
                          onClick={(e) => handleSaveRename(e, session.id)}
                          className="rounded p-1 text-slate-400 hover:text-emerald-400 hover:bg-white/5"
                        >
                          <Check size={13} />
                        </button>
                        <button
                          onClick={handleCancelRename}
                          className="rounded p-1 text-slate-400 hover:text-rose-400 hover:bg-white/5"
                        >
                          <X size={13} />
                        </button>
                      </>
                    ) : (
                      <>
                        <button
                          onClick={(e) => handleStartRename(e, session)}
                          className="rounded p-1 text-slate-500 hover:text-white hover:bg-white/5"
                          title="Rename Chat"
                        >
                          <Edit3 size={13} />
                        </button>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            onDeleteSession(session.id);
                          }}
                          className="rounded p-1 text-slate-500 hover:text-rose-400 hover:bg-white/5"
                          title="Delete Chat"
                        >
                          <Trash2 size={13} />
                        </button>
                      </>
                    )}
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* User profile deck at bottom */}
        <div className="border-t border-white/5 p-4 bg-[#04060d]">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="h-9 w-9 rounded-full bg-gradient-to-br from-violet-600 to-indigo-600 flex items-center justify-center text-xs font-semibold text-white border border-white/10 shadow shadow-violet-500/10">
                YA
              </div>
              <div className="flex flex-col">
                <span className="text-xs font-semibold text-white">Yashwanth A.</span>
                <span className="text-[10px] text-slate-500 font-medium">Developer Account</span>
              </div>
            </div>
            <button className="rounded-lg p-2 text-slate-500 hover:bg-white/5 hover:text-slate-300">
              <Settings size={16} />
            </button>
          </div>
        </div>
      </div>
    </>
  );
};
