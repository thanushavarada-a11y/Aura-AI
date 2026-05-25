import { useState, useEffect } from 'react';
import { ChatSession, Message, BotModel } from '../types/chat';
import { generateFinalResponse, hasApiKey } from '../gemini';
import { routeIntent } from '../intentRouter';
import { runCalculator, getCurrentDateTime, getWeather, getWikipediaSummary, openUrl, manageNotes } from '../tools';
import { ChatMemory } from '../chatMemory';

export const BOT_MODELS: BotModel[] = [
  {
    id: 'aura-core',
    name: 'Aura Core 3.5',
    icon: 'sparkles',
    description: 'Balanced for general knowledge, text generation, and creative tasks.',
    systemPrompt: 'You are Aura Core, a helpful general assistant.'
  },
  {
    id: 'aura-coder',
    name: 'Aura Coder',
    icon: 'code',
    description: 'Specialized in generating, debugging, and explaining code in multiple languages.',
    systemPrompt: 'You are Aura Coder, a software engineering expert.'
  },
  {
    id: 'aura-brain',
    name: 'Aura Brain (Reasoning)',
    icon: 'brain',
    description: 'Uses step-by-step deep reasoning for complex logical problems, math, and philosophy.',
    systemPrompt: 'You are Aura Brain, a deep thinking reasoning agent.'
  },
  {
    id: 'aura-speed',
    name: 'Aura Speed-Flash',
    icon: 'zap',
    description: 'Sub-second response time, optimized for quick lookups and translations.',
    systemPrompt: 'You are Aura Speed, a fast responding helper.'
  }
];

// Helper to generate mock AI responses based on user input and selected model
const generateMockAIResponse = (userMessage: string, modelId: string): string => {
  const msg = userMessage.toLowerCase();
  
  if (modelId === 'aura-coder') {
    if (msg.includes('javascript') || msg.includes('react') || msg.includes('code') || msg.includes('html')) {
      return `Here is a modern, responsive React component using TypeScript and Tailwind CSS v4:

\`\`\`tsx
import React, { useState } from 'react';

interface CardProps {
  title: string;
  description: string;
}

export const GlassCard: React.FC<CardProps> = ({ title, description }) => {
  const [likes, setLikes] = useState(0);

  return (
    <div className="glass-card p-6 rounded-2xl border border-white/5 bg-slate-900/60 max-w-sm">
      <h3 className="text-xl font-semibold text-violet-400 mb-2">{title}</h3>
      <p className="text-slate-400 text-sm mb-4">{description}</p>
      <button 
        onClick={() => setLikes(l => l + 1)}
        className="px-4 py-2 bg-violet-600 hover:bg-violet-500 rounded-lg text-white font-medium transition-all"
      >
        ❤️ Likes: {likes}
      </button>
    </div>
  );
};
\`\`\`

Let me know if you would like me to explain how the glassmorphism CSS helper works!`;
    }
    
    return `Hello! I am **Aura Coder**, your coding companion. 
    
I can write scripts, troubleshoot errors, or design database schemas. What are we building today?
- **HTML/CSS/JS** front-ends
- **Python** backend scripts
- **SQL** schema configuration
- **Algorithm** optimizations`;
  }

  if (modelId === 'aura-brain') {
    if (msg.includes('why') || msg.includes('how') || msg.includes('life') || msg.includes('future') || msg.includes('philosophy')) {
      return `<thought>
1. User is asking a philosophical or deep question.
2. I must break down my reasoning process to reflect Aura Brain's logical flow.
3. Analyze historical perspectives on consciousness/purpose.
4. Synthesize an answer highlighting complexity, connection, and growth.
</thought>

To address this comprehensively, we must dissect the question into three primary dimensions:
1. **The Biological Layer**: Survival, genetic inheritance, and environmental adaptation.
2. **The Existential Layer**: Creating subjective meaning in an objective cosmos.
3. **The Interconnected Layer**: Collaboration, shared stories, and structural progress.

Ultimately, the purpose is not a hidden treasure to be discovered, but rather an active canvas to be painted. By engaging in creative creation (like coding and conversation), we define the boundaries of our own purpose.`;
    }
    
    return `<thought>
1. User initialized a conversation with Aura Brain (Deep Reasoning).
2. Prepare a response that outlines my reasoning capability and analytical options.
</thought>

Greetings. I am **Aura Brain**. I run internal thinking loops (wrapped in thinking blocks) to analyze your query before producing output. 

I am best suited for:
* Complex multi-step reasoning
* Mathematical equations and proofs
* System design trade-offs
* Deep philosophical inquiries`;
  }

  if (modelId === 'aura-speed') {
    return `⚡ **Aura Speed-Flash Response:** Ready to assist! Found 3 main topics matching your interest. Let's make it quick:
1. **Fast Results**: Minimal fluff, maximum speed.
2. **Optimized Outputs**: Short, concise answers.
3. **Utility**: Ready to copy and paste.

How else can I help?`;
  }

  // Aura Core default responses
  if (msg.includes('hello') || msg.includes('hi') || msg.includes('hey')) {
    return `Hello there! I'm Aura, your AI assistant. How can I help you today? Feel free to ask me to write code, compose text, brainstorm ideas, or solve complex logic problems. Use the sidebar to switch models or manage different chat threads!`;
  }
  
  if (msg.includes('help') || msg.includes('features') || msg.includes('what can you do')) {
    return `Here are some of the things you can do with **Aura AI**:
- 💬 **Create separate chat sessions** in the sidebar to organize your workflows.
- 🤖 **Switch between specialized AI Models** (Aura Core, Aura Coder, Aura Brain, Aura Speed).
- 💾 **Automatic persistence**: Your conversation histories are saved locally.
- 🎨 **Responsive design**: Seamlessly use the chatbot on desktop, tablet, or mobile.
- ⚡ **Interactive elements**: Hover states, micro-animations, and instant markdown styling.`;
  }

  return `I have received your message: "${userMessage}". 

This is a demo response generated by **${BOT_MODELS.find(m => m.id === modelId)?.name || 'Aura AI'}**. In a production environment, this would be wired to a chatbot endpoint (such as OpenAI, Anthropic, or Google Gemini API). 

Feel free to ask another question or explore model switching in the top bar!`;
};

export const useChat = () => {
  const [sessions, setSessions] = useState<ChatSession[]>([]);
  const [activeSessionId, setActiveSessionId] = useState<string>('');
  const [currentModelId, setCurrentModelId] = useState<string>('aura-core');
  const [isTyping, setIsTyping] = useState<boolean>(false);

  // Load from LocalStorage
  useEffect(() => {
    const savedSessions = localStorage.getItem('aura_chat_sessions');
    const savedActiveId = localStorage.getItem('aura_active_session_id');
    const savedModelId = localStorage.getItem('aura_current_model_id');
    
    if (savedSessions) {
      try {
        setSessions(JSON.parse(savedSessions));
      } catch (e) {
        console.error('Failed to parse chat sessions', e);
      }
    }
    
    if (savedModelId) {
      setCurrentModelId(savedModelId);
    }

    if (savedActiveId) {
      setActiveSessionId(savedActiveId);
    }
  }, []);

  // Save to LocalStorage
  const saveSessions = (updatedSessions: ChatSession[]) => {
    setSessions(updatedSessions);
    localStorage.setItem('aura_chat_sessions', JSON.stringify(updatedSessions));
  };

  const createSession = (modelId = currentModelId) => {
    const model = BOT_MODELS.find(m => m.id === modelId) || BOT_MODELS[0];
    const newSession: ChatSession = {
      id: Math.random().toString(36).substring(2, 11),
      title: `New Chat - ${model.name}`,
      createdAt: new Date().toISOString(),
      messages: [],
      modelId: model.id
    };
    
    const updated = [newSession, ...sessions];
    saveSessions(updated);
    setActiveSessionId(newSession.id);
    localStorage.setItem('aura_active_session_id', newSession.id);
    return newSession.id;
  };

  const deleteSession = (id: string) => {
    const updated = sessions.filter(s => s.id !== id);
    saveSessions(updated);
    
    if (activeSessionId === id) {
      if (updated.length > 0) {
        setActiveSessionId(updated[0].id);
        localStorage.setItem('aura_active_session_id', updated[0].id);
      } else {
        setActiveSessionId('');
        localStorage.removeItem('aura_active_session_id');
      }
    }
  };

  const selectSession = (id: string) => {
    setActiveSessionId(id);
    localStorage.setItem('aura_active_session_id', id);
    
    const session = sessions.find(s => s.id === id);
    if (session) {
      setCurrentModelId(session.modelId);
      localStorage.setItem('aura_current_model_id', session.modelId);
    }
  };

  const updateSessionTitle = (id: string, title: string) => {
    const updated = sessions.map(s => {
      if (s.id === id) {
        return { ...s, title };
      }
      return s;
    });
    saveSessions(updated);
  };

  const changeModel = (modelId: string) => {
    setCurrentModelId(modelId);
    localStorage.setItem('aura_current_model_id', modelId);
    
    if (activeSessionId) {
      const updated = sessions.map(s => {
        if (s.id === activeSessionId) {
          return { ...s, modelId };
        }
        return s;
      });
      saveSessions(updated);
    }
  };

  const sendMessage = async (content: string) => {
    if (!content.trim()) return;

    let currentSessionId = activeSessionId;
    
    // Auto-create session if none active
    if (!currentSessionId) {
      currentSessionId = createSession(currentModelId);
    }

    const userMsg: Message = {
      id: Math.random().toString(36).substring(2, 11),
      sender: 'user',
      content,
      timestamp: new Date().toISOString()
    };

    // Update session state instantly with user's message
    let activeSession = sessions.find(s => s.id === currentSessionId);
    let sessionMessages: Message[] = [];
    
    if (activeSession) {
      sessionMessages = [...activeSession.messages, userMsg];
    } else {
      sessionMessages = [userMsg];
    }

    // Auto update session title if it was default
    let updatedTitle = activeSession?.title || `New Chat`;
    if (activeSession && activeSession.messages.length === 0) {
      updatedTitle = content.length > 26 ? content.substring(0, 25) + '...' : content;
    }

    const updatedSessions = sessions.map(s => {
      if (s.id === currentSessionId) {
        return { 
          ...s, 
          messages: sessionMessages,
          title: updatedTitle
        };
      }
      return s;
    });
    
    saveSessions(updatedSessions);
    setIsTyping(true);

    if (hasApiKey) {
      try {
        // --- MANUAL AI AGENT SYSTEM INSTRUCTIONS ---
        // 1. Detect user intent and routing instructions using our custom router
        const decision = await routeIntent(content);
        
        let toolOutput: string | null = null;
        let thinkingSteps = `### 🧠 Custom AI Agent Router\n\n`;
        thinkingSteps += `- **Query Analyzed:** "${content}"\n`;
        
        // 2. Select and execute correct tool based on routed decision
        if (decision.tool !== 'none') {
          thinkingSteps += `- **Routed Intent:** Selected tool \`${decision.tool}\`\n`;
          thinkingSteps += `- **Tool Parameters:** \`${JSON.stringify(decision.arguments)}\`\n`;
          thinkingSteps += `- **Status:** Running custom TypeScript function...\n`;
          
          let toolResult;
          switch (decision.tool) {
            case 'calculator':
              toolResult = runCalculator(decision.arguments.expression);
              break;
            case 'current_datetime':
              toolResult = getCurrentDateTime();
              break;
            case 'get_weather':
              toolResult = getWeather(decision.arguments.city);
              break;
            case 'wikipedia_summary':
              toolResult = await getWikipediaSummary(decision.arguments.term);
              break;
            case 'open_url':
              toolResult = openUrl(decision.arguments.url);
              break;
            case 'manage_notes':
              toolResult = manageNotes(
                decision.arguments.action,
                decision.arguments.title,
                decision.arguments.content
              );
              break;
            default:
              toolResult = { success: false, output: 'Unknown tool mapping.', log: 'Routing mapping missing.' };
          }
          
          toolOutput = toolResult.output;
          thinkingSteps += `- **Execution Log:** ${toolResult.log}\n`;
          thinkingSteps += `- **Result:** ${toolResult.success ? '✅ Success' : '❌ Failed'}\n`;
        } else {
          thinkingSteps += `- **Routed Intent:** Direct conversation (no tool needed).\n`;
          thinkingSteps += `- **Action:** Routing to standard text generator.\n`;
        }
        
        thinkingSteps += `- **Synthesis:** Informing model parameters and compiling answer...\n`;

        // Get window-limited history for context memory
        const contextHistory = ChatMemory.getContextWindow(sessionMessages);

        // 3. Compile the final response with Gemini
        const responseText = await generateFinalResponse(
          content,
          decision.tool !== 'none' ? decision.tool : null,
          toolOutput,
          contextHistory,
          activeSession?.modelId || currentModelId
        );

        // Wrap the thinking process logs in a `<thought>` tag for the UI to display in the reasoning block
        const botMsg: Message = {
          id: Math.random().toString(36).substring(2, 11),
          sender: 'bot',
          content: `<thought>\n${thinkingSteps}\n</thought>\n\n${responseText}`,
          timestamp: new Date().toISOString()
        };

        const finalSessions = updatedSessions.map(s => {
          if (s.id === currentSessionId) {
            return { ...s, messages: [...sessionMessages, botMsg] };
          }
          return s;
        });
        saveSessions(finalSessions);
      } catch (error: any) {
        const botMsg: Message = {
          id: Math.random().toString(36).substring(2, 11),
          sender: 'bot',
          content: `❌ **Error querying Gemini Agent:**\n\n${error.message}\n\n*Please check your setup or .env configuration.*`,
          timestamp: new Date().toISOString()
        };
        const finalSessions = updatedSessions.map(s => {
          if (s.id === currentSessionId) {
            return { ...s, messages: [...sessionMessages, botMsg] };
          }
          return s;
        });
        saveSessions(finalSessions);
      } finally {
        setIsTyping(false);
      }
    } else {
      // Mock response fallback with warning note (and mock thinking process for demo visualization)
      setTimeout(() => {
        const textLower = content.toLowerCase();
        let mockTool = 'none';
        let mockOutput = '';
        let mockLog = '';
        
        if (textLower.includes('calc') || textLower.includes('math') || /\d+\s*[\+\-\*\/]\s*\d+/.test(textLower)) {
          mockTool = 'calculator';
          mockOutput = 'Expression parsed. Output: 42';
          mockLog = 'Evaluated dummy calculator logic.';
        } else if (textLower.includes('time') || textLower.includes('date')) {
          mockTool = 'current_datetime';
          mockOutput = new Date().toLocaleString();
          mockLog = 'Pulled local Javascript Date.';
        } else if (textLower.includes('weather')) {
          mockTool = 'get_weather';
          mockOutput = 'Weather in City: 22C, Clear';
          mockLog = 'Simulated temperature fetch.';
        } else if (textLower.includes('wiki') || textLower.includes('who is') || textLower.includes('what is')) {
          mockTool = 'wikipedia_summary';
          mockOutput = 'Mock Wiki article summary matching query details.';
          mockLog = 'Retrieved cached offline Wikipedia mock.';
        } else if (textLower.includes('note')) {
          mockTool = 'manage_notes';
          mockOutput = 'Operation successful. Notebook updated.';
          mockLog = 'Modified aura_agent_notes LocalStorage.';
        } else if (textLower.includes('open')) {
          mockTool = 'open_url';
          mockOutput = 'Simulated browser redirection.';
          mockLog = 'Redirection simulated via placeholder logs.';
        }

        let thinkingSteps = `### 🧠 Custom AI Agent Router (DEMO MODE)\n\n`;
        thinkingSteps += `- **Query Analyzed:** "${content}"\n`;
        if (mockTool !== 'none') {
          thinkingSteps += `- **Routed Intent:** Selected tool \`${mockTool}\`\n`;
          thinkingSteps += `- **Execution Log:** ${mockLog}\n`;
          thinkingSteps += `- **Tool Output:** ${mockOutput}\n`;
        } else {
          thinkingSteps += `- **Routed Intent:** Direct conversation (no tool needed).\n`;
        }
        thinkingSteps += `- **Status:** Completed demo response generation.\n`;

        const botMsg: Message = {
          id: Math.random().toString(36).substring(2, 11),
          sender: 'bot',
          content: `<thought>\n${thinkingSteps}\n</thought>\n\n⚠️ **Demo Mode Fallback**\n\n${generateMockAIResponse(content, activeSession?.modelId || currentModelId)}`,
          timestamp: new Date().toISOString()
        };

        const finalSessions = updatedSessions.map(s => {
          if (s.id === currentSessionId) {
            return { ...s, messages: [...sessionMessages, botMsg] };
          }
          return s;
        });

        saveSessions(finalSessions);
        setIsTyping(false);
      }, 1200);
    }
  };

  const clearSessionMessages = (id: string) => {
    const updated = sessions.map(s => {
      if (s.id === id) {
        return { ...s, messages: [] };
      }
      return s;
    });
    saveSessions(updated);
  };

  const activeSession = sessions.find(s => s.id === activeSessionId);

  return {
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
    clearSessionMessages
  };
};
