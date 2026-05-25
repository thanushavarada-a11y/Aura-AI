import { Message } from './types/chat';

/**
 * Manages the memory/history context for the AI agent.
 */
export class ChatMemory {
  private static MAX_CONTEXT_MESSAGES = 12; // Keep the last 12 messages to balance context vs tokens

  /**
   * Truncates the message list to keep only the recent window context.
   */
  public static getContextWindow(messages: Message[]): Message[] {
    if (messages.length <= this.MAX_CONTEXT_MESSAGES) {
      return messages;
    }
    
    // Always keep the very first message if it's user starter, or just slice recent
    return messages.slice(-this.MAX_CONTEXT_MESSAGES);
  }

  /**
   * Formats the conversation history into a clean string for the LLM to inspect.
   * Useful when asking Gemini to make routing decisions or summarize topics.
   */
  public static stringifyHistory(messages: Message[]): string {
    const window = this.getContextWindow(messages);
    return window
      .map(msg => {
        const role = msg.sender === 'user' ? 'User' : 'Assistant';
        return `${role}: ${msg.content}`;
      })
      .join('\n');
  }
}
