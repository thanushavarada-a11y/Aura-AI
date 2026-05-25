import React from 'react';

export const LoadingAnimation: React.FC = () => {
  return (
    <div className="flex items-center space-x-2 bg-slate-900/40 backdrop-blur-md border border-white/5 px-4 py-3 rounded-2xl rounded-tl-sm max-w-[80px]">
      <span className="sr-only">AI is typing...</span>
      <div className="h-2 w-2 bg-violet-400 rounded-full animate-bounce [animation-delay:-0.3s]"></div>
      <div className="h-2 w-2 bg-indigo-400 rounded-full animate-bounce [animation-delay:-0.15s]"></div>
      <div className="h-2 w-2 bg-cyan-400 rounded-full animate-bounce"></div>
    </div>
  );
};
