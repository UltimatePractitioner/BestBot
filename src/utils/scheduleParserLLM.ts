import { LLMService } from '../services/llmService';
import type { ShootDay } from '../types';

export class ScheduleParserLLM {
  private llm: LLMService;

  constructor(apiKey: string) {
    this.llm = new LLMService({ apiKey });
  }

  async parse(text: string): Promise<ShootDay[]> {
    const systemPrompt = `You are an expert Assistant Director. 
    Your job is to parse "Oneline" movie schedules from raw PDF text into structured JSON.
    
    The text contains one or more Shoot Days.
    For EACH day, extract:
    - Day Number (e.g., "Day 1 of 25")
    - Calendar Date (e.g., "Monday, October 5, 2025")
    - Detailed Location Banner (the main location for the day)
    - Scenes scheduled for that day.
    
    For EACH Scene, result:
    - Scene Number
    - Slugline (INT/EXT LOCATION - DAY/NIGHT)
    - Description (Brief summary)
    - Cast IDs (numbers)
    - Page Count (e.g. 1 4/8)

    Structure the response exactly as:
    {
      "days": [
        {
          "dayNumber": number,
          "date": "YYYY-MM-DD",
          "location": "string",
          "scenes": [
            { "sceneNumber": "string", "slugline": "string", "description": "string", "cast": "string", "pages": "string" }
          ]
        }
      ]
    }
    
    If the text is messy, do your best to infer logical boundaries.`;

    // Safety truncate to ~100k characters for now to be safe with limits/costs.
    const truncatedText = text.substring(0, 100000);

    const prompt = `Here is the raw text from a Oneline Schedule PDF:\n\n${truncatedText}\n\nPlease extract the schedule data.`;

    console.log("Sending schedule text to LLM...");
    const result = await this.llm.generateStructuredData<{ days: any[] }>(prompt, systemPrompt);

    if (result.error) {
      console.error("LLM Schedule Parsing Error:", result.error);
      return [];
    }

    // Post-process to ensure IDs and defaults
    return (result.data?.days || []).map((day, idx) => ({
      id: `day-${day.dayNumber || idx}`,
      dayNumber: day.dayNumber || (idx + 1),
      date: day.date || 'Unknown Date',
      location: day.location || 'Unknown Location',
      status: 'scheduled',
      title: '', // Default
      callTime: '', // Default
      sections: [], // Default empty sections
      scenes: (day.scenes || []).map((scene: any) => ({
        id: `scene-${scene.sceneNumber}-${Math.random().toString(36).substr(2, 9)}`,
        sceneNumber: scene.sceneNumber,
        description: scene.description,
        location: scene.slugline || scene.location || 'UNKNOWN',
        cast: scene.cast || '',
        pages: scene.pages || '',
        scriptWait: '',
        rehearsal: '',
        blocking: '',
        lighting: '',
        shooting: '',
        total: ''
      })),
      notes: '',
      original_text: ''
    }));
  }
}
