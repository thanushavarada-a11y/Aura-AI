# Aura AI — Smart AI Agent Assistant (No LangChain)

Aura AI is a modern, responsive React + TypeScript chat interface built on Vite and Tailwind CSS v4, running a **custom, manual AI Agent loop** integrated directly with the official **Google Gemini 2.5 Flash API** using the Google Gen AI SDK.

---

### The 3 Stages of the Agent Loop

1. **Intent Classification & Routing (`src/intentRouter.ts`)**:
   - The user query is sent to Gemini 2.5 Flash with a strict instruction to act as a classifier. It evaluates the available tools and returns a JSON payload detailing the target tool and argument values: `{ tool: "wikipedia_summary", arguments: { "term": "Black Holes" } }`.
   
2. **Action Execution (`src/tools.ts`)**:
   - If a tool is selected, the application calls the matching native TypeScript function. For example, `wikipedia_summary` triggers a fetch to the public Wikipedia API to fetch a live summary of the topic.
   
3. **Response Synthesis & Memory Context (`src/gemini.ts` & `src/chatMemory.ts`)**:
   - The tool outputs are combined with a history window (managed by `ChatMemory` to keep token counts low) and sent to Gemini to generate the final response.
   - The step-by-step reasoning logs are output inside a `<thought>...</thought>` block. The React UI parses this block and renders it in a beautiful, collapsible "Thinking Process" accordion bubble before the main text.

---

## 🛠️ Integrated Tools

1. **Calculator Tool**: Parses math formulas and evaluates them safely.
2. **Current Date/Time Tool**: Returns system date/time variables.
3. **Weather Tool**: Checks real-time mock meteorological forecasts.
4. **Wikipedia Summary Tool**: Fetches live page summaries from the public Wikipedia REST API.
5. **URL Opener**: Validates web addresses and redirects users in new tabs.
6. **Notes/Memory Notepad**: Persists notes inside LocalStorage, allowing users to save, retrieve, list, or delete notes dynamically (e.g. *"save note: project meeting tomorrow at 9 AM"*).

---

## 🚀 Getting Started

### Installation
Make sure you have [Node.js](https://nodejs.org/) installed (v18 or higher).

1. Install dependencies:
   ```bash
   npm install
   ```

2. Set up environment variables:
   Copy `.env.example` to `.env`:
   ```bash
   copy .env.example .env
   ```

3. Open `.env` and configure your API Key:
   ```env
   VITE_GEMINI_API_KEY=AIzaSy...yourKeyHere
   ```
   *Note: Get a free key from [Google AI Studio](https://aistudio.google.com/).*

### Running the App
To start the local development server:
```bash
npm run dev
```
Open **http://localhost:5173/** in your browser.

---

## 📂 Project Structure
```
├── src/
│   ├── main.tsx           # React entry point
│   ├── index.css          # Styling & glassmorphic tokens
│   ├── App.tsx            # Main layout orchestrator
│   ├── types/
│   │   └── chat.ts        # Chat session type interfaces
│   ├── hooks/
│   │   └── useChat.ts     # Core hook managing agent execution state
│   ├── components/
│   │   ├── Sidebar.tsx    # Recent chat lists & renamer panel
│   │   ├── ChatInterface.tsx # Top status panel, model selectors, suggestion cards, clear chat
│   │   ├── ChatBubble.tsx # Accordion thought visualizer & markdown code blocks
│   │   └── LoadingAnimation.tsx # Pulsing bounce dots
│   ├── tools.ts           # TS tool implementations (Calculator, Wiki API, Weather, Notes)
│   ├── chatMemory.ts      # Sliding window conversation memory
│   ├── intentRouter.ts    # Classifier instructions for tool selection
│   ├── gemini.ts          # GenAI SDK initialization and response synthesis
│   └── utils.ts           # Cleaners and validators
```
