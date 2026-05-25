export interface Message {
  id: string;
  sender: 'user' | 'bot';
  content: string;
  timestamp: string; // ISO string for easy JSON serialization
}

export interface ChatSession {
  id: string;
  title: string;
  createdAt: string;
  messages: Message[];
  modelId: string;
}

export interface BotModel {
  id: string;
  name: string;
  icon: 'brain' | 'sparkles' | 'code' | 'zap';
  description: string;
  systemPrompt: string;
}
