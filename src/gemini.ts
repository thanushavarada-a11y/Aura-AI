import { GoogleGenerativeAI } from '@google/generative-ai';
import { Message } from './types/chat';

const apiKey = import.meta.env.VITE_GEMINI_API_KEY || '';
export const hasApiKey = apiKey.trim().length > 0;

// Initialize SDK instance
export const genAI = hasApiKey ? new GoogleGenerativeAI(apiKey) : null;

// System Prompts per UI model
export const getSystemInstruction = (modelId: string): string => {
  switch (modelId) {
    case 'aura-coder':
      return 'You are Aura Coder, a software engineering expert. Prioritize writing clean, optimized, commented code inside standard markdown code blocks (e.g. ```typescript ... ```). Keep explanations focused, concise, and technical.';
    
    case 'aura-brain':
      return 'You are Aura Brain, a deep thinking reasoning agent. Before answering the user\'s question, you MUST write your internal thinking process enclosed in <thought>...</thought> blocks. Outline your step-by-step analysis, edge cases, and assumptions. Once done, close the tag and provide your final response after the </thought> tag.';
    
    case 'aura-speed':
      return 'You are Aura Speed, a fast responding helper. Respond extremely quickly, concisely, and with minimal fluff. Limit responses to 2-3 sentences max unless code or detailed steps are explicitly requested.';
    
    case 'aura-core':
    default:
      return 'You are Aura Core, a helpful general assistant. Keep answers clear, engaging, and well-structured. Use markdown when formatting lists, tables, or sections.';
  }
};

/**
 * Synthesizes the final response for the user, combining the original prompt,
 * the tool output (if any), and the conversation context.
 *
 * @param userMessage The current message from the user
 * @param toolName The name of the tool executed, or null
 * @param toolOutput The output returned by the tool, or null
 * @param chatHistory The full message history (as context)
 * @param modelId The active UI model ID
 */
export const generateFinalResponse = async (
  userMessage: string,
  toolName: string | null,
  toolOutput: string | null,
  chatHistory: Message[],
  modelId: string
): Promise<string> => {
  if (!genAI) {
    throw new Error('API Key missing. Please set VITE_GEMINI_API_KEY in your .env file.');
  }

  try {
    const model = genAI.getGenerativeModel({
      model: 'gemini-2.5-flash',
      systemInstruction: getSystemInstruction(modelId),
    });

    // Translate chat history to Gemini's format
    const contents = chatHistory.map(msg => ({
      role: msg.sender === 'user' ? 'user' : 'model' as 'user' | 'model',
      parts: [{ text: msg.content }],
    }));

    // If a tool was executed, we append a synthetic system message as the latest turn
    // to feed the tool's result directly into Gemini.
    if (toolName && toolOutput) {
      const toolDirective = `[AGENT SYSTEM NOTE]
The user requested: "${userMessage}".
The agent selected and executed the tool "${toolName}".
Tool output:
"""
${toolOutput}
"""
Please formulate your final response to the user incorporating the tool output. Maintain your persona and styling guidelines.`;
      
      // Add the tool directive as a user prompt block
      contents.push({
        role: 'user',
        parts: [{ text: toolDirective }]
      });
    } else {
      // Standard message turn
      contents.push({
        role: 'user',
        parts: [{ text: userMessage }]
      });
    }

    const result = await model.generateContent({
      contents: contents,
      generationConfig: {
        maxOutputTokens: 2048,
        temperature: modelId === 'aura-brain' ? 0.3 : 0.7,
      }
    });

    const responseText = result.response.text();
    if (!responseText) {
      throw new Error('Received empty response from Gemini.');
    }
    
    return responseText;
  } catch (error: any) {
    console.error('Gemini Final Response compilation error:', error);
    if (error.message?.includes('API_KEY_INVALID')) {
      throw new Error('Invalid Gemini API Key. Please verify your VITE_GEMINI_API_KEY.');
    }
    throw error;
  }
};
