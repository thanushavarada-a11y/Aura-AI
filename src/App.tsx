import React, { useState, useEffect } from 'react';
import { Sidebar } from './components/Sidebar';
import { ChatInterface } from './components/ChatInterface';
import { useChat } from './hooks/useChat';

const App: React.FC = () => {
  const {
    sessions,
    activeSession,
    activeSessionId,
    currentModelId,
    isTyping,
    createSession,
    deleteSession,
    selectSession,
    sendMessage,
    changeModel,
    updateSessionTitle,
    clearSessionMessages,
  } = useChat();

  const [sidebarOpen, setSidebarOpen] = useState(false);

  // Initialize a session if none exist upon load
  useEffect(() => {
    // Add brief delay to ensure localstorage was loaded by useChat hook
    const timer = setTimeout(() => {
      if (sessions.length === 0 && !activeSessionId) {
        createSession();
      }
    }, 100);
    return () => clearTimeout(timer);
  }, [sessions.length, activeSessionId]);

  return (
    <div className="flex h-screen w-screen bg-[#060913] text-[#e2e8f0] overflow-hidden font-sans">
      {/* Sidebar navigation */}
      <Sidebar
        sessions={sessions}
        activeSessionId={activeSessionId}
        onSelectSession={selectSession}
        onDeleteSession={deleteSession}
        onNewChat={() => createSession()}
        onRenameSession={updateSessionTitle}
        isOpen={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
      />

      {/* Main chat section */}
      <ChatInterface
        activeSession={activeSession}
        isTyping={isTyping}
        currentModelId={currentModelId}
        onSendMessage={sendMessage}
        onChangeModel={changeModel}
        onToggleSidebar={() => setSidebarOpen(!sidebarOpen)}
        onClearChat={() => {
          if (activeSessionId) {
            clearSessionMessages(activeSessionId);
          }
        }}
      />
    </div>
  );
};

export default App;
