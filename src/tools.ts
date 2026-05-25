import { isValidUrl } from './utils';

// Define the interface for Tool Execution Response
export interface ToolResult {
  success: boolean;
  output: string;
  log: string; // Internal reasoning logs showing tool choices
}

/**
 * 1. Calculator Tool
 * Evaluates math expressions safely without arbitrary code execution risk.
 */
export const runCalculator = (expression: string): ToolResult => {
  const log = `Invoked Calculator: "${expression}"`;
  
  // Sanitize and check: permit only digits, basic operators, brackets, decimals, and spaces
  const cleanExpr = expression.replace(/\s+/g, '');
  const isValidMath = /^[0-9+\-*/().]+$/.test(cleanExpr);
  
  if (!isValidMath) {
    return {
      success: false,
      output: 'Invalid characters in math expression. Only numbers and operators (+ - * / ( ) .) are allowed.',
      log: `${log} | Failed: expression contains unsafe characters.`
    };
  }

  try {
    // Safe evaluation using Function context
    const result = new Function(`return ${cleanExpr}`)();
    if (typeof result !== 'number' || isNaN(result) || !isFinite(result)) {
      throw new Error('Arithmetic evaluation returned non-numeric result');
    }
    return {
      success: true,
      output: `${expression} = ${result}`,
      log: `${log} | Succeeded: returned ${result}`
    };
  } catch (error: any) {
    return {
      success: false,
      output: `Math Error: ${error.message}`,
      log: `${log} | Failed to evaluate math: ${error.message}`
    };
  }
};

/**
 * 2. Current Date/Time Tool
 * Returns the current date and time.
 */
export const getCurrentDateTime = (): ToolResult => {
  const now = new Date();
  const dateStr = now.toLocaleDateString([], { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });
  const timeStr = now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });
  const output = `Current date: ${dateStr}\nCurrent time: ${timeStr}`;
  return {
    success: true,
    output,
    log: `Invoked Date/Time: returned ${now.toISOString()}`
  };
};

/**
 * 3. Weather Tool
 * Simulated weather data with realistic feedback.
 */
export const getWeather = (city: string): ToolResult => {
  const cleanedCity = city.trim();
  const log = `Invoked Weather: "${cleanedCity}"`;
  
  if (!cleanedCity) {
    return {
      success: false,
      output: 'Please specify a city location.',
      log: `${log} | Failed: missing location input.`
    };
  }

  // Simulated weather data
  const mockWeatherDatabase: Record<string, { temp: number; desc: string; humidity: number; wind: string }> = {
    london: { temp: 14, desc: 'Light drizzle, overcast', humidity: 88, wind: '15 km/h NE' },
    newyork: { temp: 22, desc: 'Partly cloudy, pleasant', humidity: 55, wind: '12 km/h W' },
    tokyo: { temp: 19, desc: 'Sunny and clear skies', humidity: 40, wind: '8 km/h S' },
    delhi: { temp: 38, desc: 'Hot, dry air', humidity: 20, wind: '18 km/h NW' },
    paris: { temp: 16, desc: 'Scattered clouds', humidity: 70, wind: '10 km/h W' },
    sydney: { temp: 21, desc: 'Clear, crisp autumn afternoon', humidity: 50, wind: '14 km/h SE' }
  };

  const lookupKey = cleanedCity.toLowerCase().replace(/\s+/g, '');
  const data = mockWeatherDatabase[lookupKey];

  if (data) {
    const output = `Weather in ${cleanedCity}:\n- Temperature: ${data.temp}°C (${Math.round(data.temp * 1.8 + 32)}°F)\n- Conditions: ${data.desc}\n- Humidity: ${data.humidity}%\n- Wind Speed: ${data.wind}`;
    return {
      success: true,
      output,
      log: `${log} | Succeeded: retrieved mock details.`
    };
  }

  // Generate deterministic mock weather for other cities
  const charSum = cleanedCity.split('').reduce((sum, char) => sum + char.charCodeAt(0), 0);
  const fakeTemp = (charSum % 25) + 10; // between 10C and 35C
  const conditions = ['Sunny', 'Mostly Cloudy', 'Patchy Rain', 'Foggy', 'Windy'][charSum % 5];
  const humidity = (charSum % 40) + 40; // between 40% and 80%
  
  const output = `Weather in ${cleanedCity} (estimated):\n- Temperature: ${fakeTemp}°C (${Math.round(fakeTemp * 1.8 + 32)}°F)\n- Conditions: ${conditions}\n- Humidity: ${humidity}%\n- Wind Speed: ${(charSum % 15) + 5} km/h`;
  
  return {
    success: true,
    output,
    log: `${log} | Succeeded: generated deterministic forecast.`
  };
};

/**
 * 4. Wikipedia Summary Tool
 * Fetch summaries dynamically from Wikipedia using the REST API.
 */
export const getWikipediaSummary = async (term: string): Promise<ToolResult> => {
  const cleanedTerm = term.trim();
  const log = `Invoked Wikipedia: searching "${cleanedTerm}"`;
  
  if (!cleanedTerm) {
    return {
      success: false,
      output: 'Please specify a term to search on Wikipedia.',
      log: `${log} | Failed: missing query terms.`
    };
  }

  // Format search term for Wikipedia article name (replace spaces with underscores)
  const articleName = cleanedTerm.replace(/\s+/g, '_');
  const apiUrl = `https://en.wikipedia.org/api/rest_v1/page/summary/${encodeURIComponent(articleName)}`;

  try {
    const response = await fetch(apiUrl, {
      headers: {
        'User-Agent': 'AuraAI-Agent/1.0 (contact: test@aura-bot.local)'
      }
    });

    if (!response.ok) {
      if (response.status === 404) {
        return {
          success: false,
          output: `Wikipedia page for "${cleanedTerm}" not found. Try searching a different phrase.`,
          log: `${log} | Failed: article not found (404).`
        };
      }
      throw new Error(`HTTP error ${response.status}`);
    }

    const data = await response.json();
    const output = `**Wikipedia Summary for ${data.title}**\n\n${data.extract}\n\n*Read more: ${data.content_urls?.desktop?.page || ''}*`;
    
    return {
      success: true,
      output,
      log: `${log} | Succeeded: retrieved online summary.`
    };
  } catch (error: any) {
    return {
      success: false,
      output: `Could not retrieve Wikipedia content: ${error.message || 'Network error'}`,
      log: `${log} | Failed to fetch: ${error.message}`
    };
  }
};

/**
 * 5. URL Opener Tool
 * Opens a URL in a new browser tab.
 */
export const openUrl = (urlString: string): ToolResult => {
  const log = `Invoked URL Opener: "${urlString}"`;
  let target = urlString.trim();

  // Add https:// prefix if user just typing "google.com"
  if (!/^https?:\/\//i.test(target)) {
    target = 'https://' + target;
  }

  if (!isValidUrl(target)) {
    return {
      success: false,
      output: `Invalid URL: "${urlString}". Please specify a valid web address (e.g. google.com, github.com).`,
      log: `${log} | Failed: URL did not pass validation.`
    };
  }

  try {
    window.open(target, '_blank');
    return {
      success: true,
      output: `Successfully opened website: [${target}](${target}) in a new tab.`,
      log: `${log} | Succeeded: executed window.open for ${target}`
    };
  } catch (error: any) {
    return {
      success: true,
      output: `Simulated navigation: Please click to open [${target}](${target}). *Note: Popup blockers might prevent automated redirection.*`,
      log: `${log} | Blocked/Failed: popup blocker prevented script redirection: ${error.message}`
    };
  }
};

/**
 * 6. Notes/Memory Tool
 * Manages key-value notepad records stored inside LocalStorage.
 */
export const manageNotes = (
  action: 'save' | 'get' | 'list' | 'delete',
  title?: string,
  content?: string
): ToolResult => {
  const log = `Invoked Notes: Action="${action}" title="${title || ''}"`;
  
  const getStoredNotes = (): Record<string, string> => {
    try {
      const stored = localStorage.getItem('aura_agent_notes');
      return stored ? JSON.parse(stored) : {};
    } catch {
      return {};
    }
  };

  const saveStoredNotes = (notes: Record<string, string>) => {
    localStorage.setItem('aura_agent_notes', JSON.stringify(notes));
  };

  const notes = getStoredNotes();

  if (action === 'save') {
    const noteTitle = title?.trim() || 'Untitled Note';
    const noteContent = content?.trim();
    
    if (!noteContent) {
      return {
        success: false,
        output: 'Cannot save empty note. Please supply content.',
        log: `${log} | Failed: missing content body.`
      };
    }

    notes[noteTitle] = noteContent;
    saveStoredNotes(notes);
    return {
      success: true,
      output: `Successfully saved note under title: "**${noteTitle}**"`,
      log: `${log} | Succeeded: note saved.`
    };
  }

  if (action === 'get') {
    if (!title) {
      return {
        success: false,
        output: 'Please specify the title of the note you want to retrieve.',
        log: `${log} | Failed: missing title key.`
      };
    }
    const noteTitle = title.trim();
    const data = notes[noteTitle];

    if (data) {
      return {
        success: true,
        output: `Note: **${noteTitle}**\n\n${data}`,
        log: `${log} | Succeeded: note retrieved.`
      };
    } else {
      return {
        success: false,
        output: `Note titled "${noteTitle}" was not found.`,
        log: `${log} | Failed: key not found.`
      };
    }
  }

  if (action === 'list') {
    const keys = Object.keys(notes);
    if (keys.length === 0) {
      return {
        success: true,
        output: 'Your notebook is currently empty. To save notes, try: "Save note: [title] - [content]"',
        log: `${log} | Succeeded: notebook empty.`
      };
    }
    
    const output = `Here are your stored notes:\n\n` + keys.map(k => `- **${k}**`).join('\n');
    return {
      success: true,
      output,
      log: `${log} | Succeeded: listed ${keys.length} items.`
    };
  }

  if (action === 'delete') {
    if (!title) {
      return {
        success: false,
        output: 'Please specify the title of the note you want to delete.',
        log: `${log} | Failed: missing delete title.`
      };
    }
    const noteTitle = title.trim();
    if (notes[noteTitle] !== undefined) {
      delete notes[noteTitle];
      saveStoredNotes(notes);
      return {
        success: true,
        output: `Successfully deleted note titled: "${noteTitle}"`,
        log: `${log} | Succeeded: deleted key.`
      };
    } else {
      return {
        success: false,
        output: `Note titled "${noteTitle}" was not found.`,
        log: `${log} | Failed: delete target not found.`
      };
    }
  }

  return {
    success: false,
    output: 'Unsupported notes operation.',
    log: `${log} | Failed: unknown action.`
  };
};
