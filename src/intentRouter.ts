import { genAI } from './gemini';
import { parseCleanJson } from './utils';

// Define the shape of a routing decision
export interface ToolRoutingDecision {
  tool: 'calculator' | 'current_datetime' | 'get_weather' | 'wikipedia_summary' | 'open_url' | 'manage_notes' | 'none';
  arguments: Record<string, any>;
}

const ROUTING_PROMPT = `You are the Intent Router for Aura AI, an intelligent agent system.
Your sole job is to analyze the user's message and determine if any of the available functions (tools) must be called to provide an accurate response.

Available Tools & Schemas:
1. "calculator": Solve math problems, evaluate arithmetic, ratios, or equations.
   - Schema: { "expression": string } (the mathematical expression to evaluate, e.g. "(45 * 22) / 3")
2. "current_datetime": Get current date, time, year, weekday.
   - Schema: {} (no arguments)
3. "get_weather": Retrieve meteorological weather conditions, temperatures, humidity for a city or country.
   - Schema: { "city": string } (the city name to check, e.g. "Paris")
4. "wikipedia_summary": Find summaries, definitions, historical facts, scientific concepts, biographies, or explanations.
   - Schema: { "term": string } (the exact name of the topic, science concept, or historical entity, e.g. "Theory of Relativity")
5. "open_url": Commands asking to navigate to, visit, open, or launch a URL link or website.
   - Schema: { "url": string } (the website URL, e.g. "github.com")
6. "manage_notes": Write, retrieve, list, or delete notes in the assistant's notepad.
   - Schema: {
       "action": "save" | "get" | "list" | "delete",
       "title"?: string,
       "content"?: string
     }
     - If user wants to save/store/record a note: "action" is "save", "title" is a short summary title, and "content" is the note contents.
     - If user wants to retrieve/get/view a specific note: "action" is "get", "title" is the title of the note.
     - If user wants to list/show all saved notes: "action" is "list".
     - If user wants to delete/remove a note: "action" is "delete", "title" is the title to delete.

Rules:
- If a tool is relevant, select it. If no tools are relevant (standard greetings, chit-chat, programming questions that don't need docs search), select "none".
- Respond ONLY with a valid JSON object matching the following format:
  {
    "tool": "calculator" | "current_datetime" | "get_weather" | "wikipedia_summary" | "open_url" | "manage_notes" | "none",
    "arguments": { ... }
  }
- Do NOT output any markdown tags, explanation text, or conversational chatter. Just return the raw JSON object.`;

/**
 * Automatically classifies user intent and routes the query to a tool.
 * @param userMessage User prompt text
 * @returns Parsed routing decision
 */
export const routeIntent = async (userMessage: string): Promise<ToolRoutingDecision> => {
  // If the SDK client is not active (e.g. no API key), skip routing and return none
  if (!genAI) {
    return { tool: 'none', arguments: {} };
  }

  try {
    const model = genAI.getGenerativeModel({
      model: 'gemini-2.5-flash',
    });

    const response = await model.generateContent({
      contents: [
        { role: 'user', parts: [{ text: `${ROUTING_PROMPT}\n\nUser Message: "${userMessage}"` }] }
      ],
      generationConfig: {
        temperature: 0.1, // low temperature for precise classification
        responseMimeType: 'application/json' // instruct Gemini to return parsed JSON
      }
    });

    const text = response.response.text();
    if (!text) {
      return { tool: 'none', arguments: {} };
    }

    const decision = parseCleanJson(text) as ToolRoutingDecision;
    if (decision && typeof decision === 'object' && decision.tool) {
      return decision;
    }
    
    return { tool: 'none', arguments: {} };
  } catch (error) {
    console.error('Intent routing failed:', error);
    return { tool: 'none', arguments: {} };
  }
};
