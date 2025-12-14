export interface LLMResponse<T> {
    data: T | null;
    error?: string;
}

export interface LLMConfig {
    apiKey: string;
    endpoint?: string; // Defaults to OpenAI
    model?: string;    // Defaults to gpt-4o or similar
}

const DEFAULT_ENDPOINT = 'https://api.openai.com/v1/chat/completions';
const DEFAULT_MODEL = 'gpt-4o';

export class LLMService {
    private config: LLMConfig;

    constructor(config: LLMConfig) {
        this.config = config;
    }


    async generateStructuredData<T>(prompt: string, systemPrompt: string = "You are a helpful assistant."): Promise<LLMResponse<T>> {
        if (!this.config.apiKey) {
            return { data: null, error: "Missing API Key" };
        }

        const isGemini = this.config.apiKey.startsWith('AIza');

        if (isGemini) {
            return this.generateGemini<T>(prompt, systemPrompt);
        }

        // Default to OpenAI
        return this.generateOpenAI<T>(prompt, systemPrompt);
    }

    private async generateGemini<T>(prompt: string, systemPrompt: string): Promise<LLMResponse<T>> {
        // Use available models from list, prioritizing Flash variants
        // gemini-2.5-flash appears to be the user's active model with quota. 
        // Removed 2.0-flash as it has 0 quota for this user.
        const models = ['gemini-2.5-flash', 'gemini-flash-latest'];

        for (const model of models) {
            try {
                const endpoint = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${this.config.apiKey}`;

                const makeRequest = async () => {
                    return fetch(endpoint, {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({
                            contents: [{
                                parts: [{ text: `${systemPrompt}\n\n${prompt}` }]
                            }],
                            generationConfig: {
                                response_mime_type: "application/json"
                            }
                        })
                    });
                };

                // Initial Request
                let response = await makeRequest();

                // Robust Retry logic for 429 (Rate Limit) AND 503 (Service Unavailable)
                if (response.status === 429 || response.status === 503) {
                    console.warn(`Hit ${response.status} for ${model}. Waiting 5s before retry...`);
                    await new Promise(resolve => setTimeout(resolve, 5000));
                    response = await makeRequest();
                }

                if (!response.ok) {
                    const err = await response.text();

                    // If it's a 404, try next model immediately
                    if (response.status === 404 && model !== models[models.length - 1]) {
                        console.warn(`Model ${model} not found (404), trying next...`);
                        continue;
                    }

                    // If we still fail after retry (e.g. persistent 503 or 429), try next model
                    if (model !== models[models.length - 1]) {
                        console.warn(`Model ${model} failed (${response.status}), trying next...`);
                        continue;
                    }

                    return { data: null, error: `Gemini API request failed (${model}): ${response.status} - ${err}` };
                }

                const raw = await response.json();
                const content = raw.candidates?.[0]?.content?.parts?.[0]?.text;

                if (!content) {
                    return { data: null, error: "Empty response from Gemini" };
                }

                const parsed = JSON.parse(content) as T;
                return { data: parsed };

            } catch (e: any) {
                console.warn(`Error with model ${model}:`, e.message);
                if (model === models[models.length - 1]) {
                    return { data: null, error: e.message || "Unknown Gemini error" };
                }
            }
        }

        return { data: null, error: "All Gemini models failed" };
    }

    private async generateOpenAI<T>(prompt: string, systemPrompt: string): Promise<LLMResponse<T>> {
        try {
            const response = await fetch(this.config.endpoint || DEFAULT_ENDPOINT, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${this.config.apiKey}`
                },
                body: JSON.stringify({
                    model: this.config.model || DEFAULT_MODEL,
                    messages: [
                        { role: 'system', content: systemPrompt },
                        { role: 'user', content: prompt }
                    ],
                    response_format: { type: "json_object" }
                })
            });

            if (!response.ok) {
                const err = await response.text();
                return { data: null, error: `API request failed: ${response.status} - ${err}` };
            }

            const raw = await response.json();
            const content = raw.choices[0]?.message?.content;

            if (!content) {
                return { data: null, error: "Empty response from LLM" };
            }

            const parsed = JSON.parse(content) as T;
            return { data: parsed };

        } catch (e: any) {
            return { data: null, error: e.message || "Unknown error occurred" };
        }
    }
}
