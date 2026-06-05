import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { ApplicationExtractedDetails } from '../applications/application.entity';
import { RuleConfidence } from './rule-engine.service';

export interface AiExtractionResult {
  isApplyConfirmation: boolean;
  company: string;
  role?: string;
  salary?: string;
  location?: string;
  employmentType?: string;
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

  async extractApplicationDetails(input: {
    from: string;
    subject: string;
    platformId: string;
    ruleConfidence: RuleConfidence;
    ruleIsApply?: boolean;
  }): Promise<AiExtractionResult | null> {
    if (!this.apiKey) {
      this.logger.warn('OPENAI_API_KEY not set; skipping AI extraction');
      return null;
    }

    if (input.ruleConfidence === 'high' && input.ruleIsApply !== false) {
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
                'Extract job application details from email headers only (from + subject). Return JSON only: {"isApplyConfirmation":boolean,"company":"string","role":"string or null","salary":"string or null","location":"string or null","employmentType":"string or null","confidence":0.0-1.0}. isApplyConfirmation is true only for emails confirming the user submitted/applied to a job.',
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
        isApplyConfirmation?: boolean;
        company?: string;
        role?: string | null;
        salary?: string | null;
        location?: string | null;
        employmentType?: string | null;
        confidence?: number;
      };

      return {
        isApplyConfirmation: parsed.isApplyConfirmation === true,
        company: parsed.company?.trim() || 'Unknown Company',
        role: parsed.role?.trim() || undefined,
        salary: parsed.salary?.trim() || undefined,
        location: parsed.location?.trim() || undefined,
        employmentType: parsed.employmentType?.trim() || undefined,
        confidence:
          typeof parsed.confidence === 'number' ? parsed.confidence : 0,
      };
    } catch (error) {
      this.logger.error(`AI extraction failed: ${error}`);
      return null;
    }
  }

  mergeExtractedDetails(
    rule: {
      company: string;
      role?: string;
      confidence: RuleConfidence;
      isApply: boolean;
    },
    ai: AiExtractionResult | null,
  ): {
    isApply: boolean;
    company: string;
    role?: string;
    extractedDetails: ApplicationExtractedDetails;
    source: 'rule' | 'ai' | 'mixed';
  } {
    if (!ai) {
      return {
        isApply: rule.isApply,
        company: rule.company,
        role: rule.role,
        extractedDetails: {
          company: rule.company !== 'Unknown Company' ? rule.company : undefined,
          role: rule.role,
          source: 'rule',
        },
        source: 'rule',
      };
    }

    const useAiApply =
      ai.confidence >= 0.7
        ? ai.isApplyConfirmation
        : rule.isApply || ai.isApplyConfirmation;
    const company =
      ai.company !== 'Unknown Company' ? ai.company : rule.company;
    const role = ai.role ?? rule.role;
    const usedAiFields =
      (ai.company !== 'Unknown Company' && ai.company !== rule.company) ||
      !!ai.role ||
      !!ai.salary ||
      !!ai.location ||
      !!ai.employmentType;

    return {
      isApply: useAiApply,
      company,
      role,
      extractedDetails: {
        company: company !== 'Unknown Company' ? company : undefined,
        role,
        salary: ai.salary,
        location: ai.location,
        employmentType: ai.employmentType,
        source: usedAiFields ? (rule.isApply ? 'mixed' : 'ai') : 'rule',
        confidence: ai.confidence,
      },
      source: usedAiFields ? (rule.isApply ? 'mixed' : 'ai') : 'rule',
    };
  }
}
