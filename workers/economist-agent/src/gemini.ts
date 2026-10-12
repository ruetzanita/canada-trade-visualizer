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
   * Calls Deep Research Pro Preview via Interactions API (or falls back to Gemini 3.8 Flash, 3.7 Flash, 3.6 Flash with Search Grounding).
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
      console.warn(`[GeminiService] Deep Research Pro Preview call failed or timed out (${err?.message}). Falling back to Flash cascade...`);
      const candidateModels = [this.defaultModel, 'gemini-3.7-flash', 'gemini-3.6-flash', 'gemini-2.5-flash'];
      for (const model of candidateModels) {
        try {
          console.log(`[GeminiService] Attempting research brief with ${model}...`);
          return await this.callModel(model, prompt, systemInstruction, true);
        } catch (fErr: any) {
          console.warn(`[GeminiService] Model ${model} failed (${fErr?.message}). Trying next candidate...`);
        }
      }
      throw new Error(`All model candidates exhausted for research brief.`);
    }
  }

  /**
   * Tier 2: Compile Brief into Structured JSON
   * Calls Gemini 3.8 Flash (with 3.7 and 3.6 fallbacks) in strict JSON mode.
   */
  async compileStructuredOutput(prompt: string, systemInstruction: string): Promise<any> {
    console.log(`[GeminiService] Initiating Tier 2 Structured Compilation...`);
    const candidateModels = [this.defaultModel, 'gemini-3.7-flash', 'gemini-3.6-flash', 'gemini-2.5-flash'];
    let rawText = '';

    for (const model of candidateModels) {
      try {
        console.log(`[GeminiService] Attempting structured compilation with ${model}...`);
        rawText = await this.callModel(model, prompt, systemInstruction, false, true);
        if (rawText) break;
      } catch (cErr: any) {
        console.warn(`[GeminiService] Structured compilation on ${model} failed (${cErr?.message}). Trying next candidate...`);
      }
    }

    if (!rawText) {
      throw new Error(`All model candidates exhausted for structured compilation.`);
    }
    
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
    const maxRetries = 3;
    let currentGrounding = enableGrounding;

    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
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

        if (currentGrounding) {
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
          let parsed: any;
          try { parsed = JSON.parse(errText); } catch {}

          const isRateLimit = response.status === 429 || parsed?.error?.status === 'RESOURCE_EXHAUSTED';
          const isTransient = isRateLimit || [500, 502, 503, 504, 408].includes(response.status);

          if (isTransient && attempt < maxRetries) {
            const retryHeader = response.headers.get('retry-after');
            let delayMs = retryHeader ? parseInt(retryHeader, 10) * 1000 : null;
            if (!delayMs || isNaN(delayMs) || delayMs <= 0) {
              delayMs = Math.min(30000, 3000 * Math.pow(2, attempt - 1)) + Math.floor(Math.random() * 1500);
            }

            console.warn(`[GeminiService] Transient error (${response.status}) on ${model}. Retrying in ${(delayMs / 1000).toFixed(1)}s (attempt ${attempt}/${maxRetries})...`);

            if (currentGrounding && attempt >= 2) {
              currentGrounding = false; // Fall back to parametric knowledge
            }

            await new Promise(r => setTimeout(r, delayMs));
            continue;
          }

          throw new Error(`Gemini API error (${response.status}): ${errText}`);
        }

        const data: any = await response.json();
        const candidate = data.candidates?.[0];
        const textPart = candidate?.content?.parts?.[0]?.text;

        if (!textPart) {
          throw new Error(`No text returned by model ${model}`);
        }

        return textPart;
      } catch (err: any) {
        const isQuota = err.message?.includes('429') || err.message?.includes('RESOURCE_EXHAUSTED');
        if (isQuota && attempt < maxRetries) {
          const delayMs = Math.min(30000, 3000 * Math.pow(2, attempt - 1)) + Math.floor(Math.random() * 1500);
          console.warn(`[GeminiService] Rate limit error (${err.message}). Retrying in ${(delayMs / 1000).toFixed(1)}s...`);
          await new Promise(r => setTimeout(r, delayMs));
          continue;
        }
        if (attempt >= maxRetries) throw err;
      }
    }

    throw new Error(`Failed to call model ${model} after ${maxRetries} attempts.`);
  }
}

