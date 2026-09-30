// workers/economist-agent/src/gemini.ts

export interface GeminiConfig {
  apiKey: string;
  defaultModel?: string;
  deepResearchModel?: string;
}

export class GeminiService {
  private apiKey: string;
  private defaultModel: string;
  private deepResearchModel: string;

  constructor(config: GeminiConfig) {
    this.apiKey = config.apiKey;
    this.defaultModel = config.defaultModel || 'gemini-3.8-flash';
    this.deepResearchModel = config.deepResearchModel || 'deep-research-pro-preview-12-2025';
  }

  /**
   * Tier 1: Generate Deep Research Brief
   * Calls Deep Research Pro Preview via Interactions API (or falls back to Gemini 3.8 Flash with Search Grounding).
   */
  async generateResearchBrief(prompt: string, systemInstruction: string): Promise<string> {
    try {
      if (this.deepResearchModel.includes('deep-research')) {
        console.log(`[GeminiService] Initiating Tier 1 Deep Research via Interactions API (${this.deepResearchModel})...`);
        return await this.callDeepResearchAgent(this.deepResearchModel, prompt, systemInstruction);
      } else {
        return await this.callModel(this.deepResearchModel, prompt, systemInstruction, true);
      }
    } catch (err: any) {
      console.warn(`[GeminiService] Deep Research Pro Preview call failed or timed out (${err?.message}). Falling back to ${this.defaultModel} with Google Search Grounding...`);
      return await this.callModel(this.defaultModel, prompt, systemInstruction, true);
    }
  }

  /**
   * Tier 2: Compile Brief into Structured JSON
   * Calls Gemini 3.8 Flash with strict JSON mode.
   */
  async compileStructuredOutput(prompt: string, systemInstruction: string): Promise<any> {
    console.log(`[GeminiService] Initiating Tier 2 Structured Compilation via ${this.defaultModel}...`);
    const rawText = await this.callModel(this.defaultModel, prompt, systemInstruction, false, true);
    
    // Clean potential markdown fences
    let cleaned = rawText.trim();
    if (cleaned.startsWith('```json')) {
      cleaned = cleaned.replace(/^```json\s*/, '').replace(/\s*```$/, '');
    } else if (cleaned.startsWith('```')) {
      cleaned = cleaned.replace(/^```\s*/, '').replace(/\s*```$/, '');
    }

    try {
      return JSON.parse(cleaned);
    } catch (parseErr: any) {
      throw new Error(`Failed to parse compiler JSON output: ${parseErr.message}\nRaw Text: ${rawText.substring(0, 300)}...`);
    }
  }

  /**
   * Calls Deep Research Agent using the Google Interactions API with async polling.
   */
  private async callDeepResearchAgent(
    agentName: string,
    prompt: string,
    systemInstruction: string
  ): Promise<string> {
    const url = 'https://generativelanguage.googleapis.com/v1beta/interactions';
    const postRes = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-goog-api-key': this.apiKey
      },
      body: JSON.stringify({
        agent: agentName,
        background: true,
        input: `${systemInstruction}\n\n${prompt}`
      })
    });

    if (!postRes.ok) {
      const errText = await postRes.text();
      throw new Error(`Interactions POST error (${postRes.status}): ${errText}`);
    }

    const postData: any = await postRes.json();
    const interactionId = postData.id;
    if (!interactionId) {
      throw new Error('No interaction ID returned by Deep Research agent.');
    }

    console.log(`[GeminiService] Deep Research interaction initiated: ${interactionId}. Polling status...`);

    // Poll for up to 60 seconds (Worker limit consideration)
    const maxPolls = 12;
    for (let i = 0; i < maxPolls; i++) {
      await new Promise(r => setTimeout(r, 5000));
      const getRes = await fetch(`${url}/${interactionId}`, {
        headers: { 'X-goog-api-key': this.apiKey }
      });
      if (!getRes.ok) continue;

      const getData: any = await getRes.json();
      if (getData.status === 'completed' || getData.status === 'done') {
        const lastStep = getData.steps?.[getData.steps.length - 1];
        const text = lastStep?.content?.[0]?.text || getData.output;
        if (text) return text;
      }
      if (getData.status === 'failed' || getData.status === 'error') {
        throw new Error(`Deep Research interaction failed: ${JSON.stringify(getData.error || 'Unknown error')}`);
      }
    }

    throw new Error('Deep Research interaction exceeded worker polling window.');
  }

  private async callModel(
    model: string,
    prompt: string,
    systemInstruction: string,
    enableGrounding: boolean = false,
    jsonMode: boolean = false
  ): Promise<string> {
    const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent`;

    const body: any = {
      systemInstruction: {
        parts: [{ text: systemInstruction }]
      },
      contents: [
        {
          role: 'user',
          parts: [{ text: prompt }]
        }
      ],
      generationConfig: {
        temperature: 0.2,
      }
    };

    if (jsonMode) {
      body.generationConfig.responseMimeType = 'application/json';
    }

    if (enableGrounding) {
      body.tools = [
        {
          googleSearch: {}
        }
      ];
    }

    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-goog-api-key': this.apiKey
      },
      body: JSON.stringify(body)
    });

    if (!response.ok) {
      const errText = await response.text();
      throw new Error(`Gemini API error (${response.status}): ${errText}`);
    }

    const data: any = await response.json();
    const candidate = data.candidates?.[0];
    const textPart = candidate?.content?.parts?.[0]?.text;

    if (!textPart) {
      throw new Error(`No text returned by model ${model}`);
    }

    return textPart;
  }
}

