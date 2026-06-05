import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import {
  ApplicationStatus,
} from '../applications/application.entity';
import { RuleConfidence } from './rule-engine.service';

export interface AiClassification {
  status: ApplicationStatus | 'unknown';
  company: string;
  role?: string;
  confidence: number;
}

@Injectable()
export class AiClassifierService {
  private readonly logger = new Logger(AiClassifierService.name);
  private readonly apiKey: string;
  private readonly model: string;

  constructor(private readonly config: ConfigService) {
    this.apiKey = this.config.get<string>('openai.apiKey') ?? '';
    this.model = this.config.get<string>('openai.model') ?? 'gpt-4o-mini';
  }

  async classify(input: {
    from: string;
    subject: string;
    platformId: string;
    ruleConfidence: RuleConfidence;
  }): Promise<AiClassification | null> {
    if (!this.apiKey) {
      this.logger.warn('OPENAI_API_KEY not set; skipping AI classification');
      return null;
    }

    if (input.ruleConfidence === 'high') {
      return null;
    }

    try {
      const response = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${this.apiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: this.model,
          temperature: 0,
          response_format: { type: 'json_object' },
          messages: [
            {
              role: 'system',
              content:
                'Classify job-application emails. Return JSON only: {"status":"applied|active|interview|offer|rejected|unknown","company":"string","role":"string or null","confidence":0.0-1.0}',
            },
            {
              role: 'user',
              content: JSON.stringify({
                from: input.from,
                subject: input.subject,
                platform: input.platformId,
              }),
            },
          ],
        }),
      });

      if (!response.ok) {
        const body = await response.text();
        this.logger.error(`OpenAI error ${response.status}: ${body}`);
        return null;
      }

      const payload = (await response.json()) as {
        choices?: { message?: { content?: string } }[];
      };
      const content = payload.choices?.[0]?.message?.content;
      if (!content) return null;

      const parsed = JSON.parse(content) as {
        status?: string;
        company?: string;
        role?: string | null;
        confidence?: number;
      };

      const status = this.normalizeStatus(parsed.status);
      const confidence =
        typeof parsed.confidence === 'number' ? parsed.confidence : 0;

      return {
        status,
        company: parsed.company?.trim() || 'Unknown Company',
        role: parsed.role?.trim() || undefined,
        confidence,
      };
    } catch (error) {
      this.logger.error(`AI classification failed: ${error}`);
      return null;
    }
  }

  private normalizeStatus(value?: string): ApplicationStatus | 'unknown' {
    const allowed: ApplicationStatus[] = [
      'applied',
      'active',
      'interview',
      'offer',
      'rejected',
      'ghosted',
    ];
    if (value && allowed.includes(value as ApplicationStatus)) {
      return value as ApplicationStatus;
    }
    return 'unknown';
  }
}
