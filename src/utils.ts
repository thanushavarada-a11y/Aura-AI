/**
 * Helper to clean and parse JSON strings returned by the LLM.
 * LLMs often wrap JSON outputs in markdown code blocks like ```json ... ```.
 */
export const parseCleanJson = (text: string): any => {
  try {
    let cleaned = text.trim();
    
    // Remove markdown code blocks if present
    if (cleaned.startsWith('```')) {
      // Find the first line break to strip out the language identifier (e.g. ```json)
      const firstLineBreak = cleaned.indexOf('\n');
      if (firstLineBreak !== -1) {
        cleaned = cleaned.substring(firstLineBreak + 1);
      }
      
      // Strip out the trailing markdown brackets
      if (cleaned.endsWith('```')) {
        cleaned = cleaned.substring(0, cleaned.length - 3);
      }
      cleaned = cleaned.trim();
    }
    
    return JSON.parse(cleaned);
  } catch (error) {
    console.error('Failed to parse clean JSON:', text, error);
    return null;
  }
};

/**
 * Basic URL validation regex.
 */
export const isValidUrl = (urlString: string): boolean => {
  try {
    const url = new URL(urlString);
    return url.protocol === 'http:' || url.protocol === 'https:';
  } catch {
    return false;
  }
};
