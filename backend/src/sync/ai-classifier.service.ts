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

const OPENAI_TIMEOUT_MS = 45_000;
const OPENAI_MAX_ATTEMPTS = 3;

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
    body?: string;
    html?: string;
  }): Promise<AiExtractionResult | null> {
    if (!this.apiKey) {
      this.logger.warn('OPENAI_API_KEY not set; skipping AI extraction');
      return null;
    }

    if (input.ruleConfidence === 'high' && input.ruleIsApply !== false) {
      return null;
    }

    try {
      const response = await this.requestOpenAi(input);
      if (!response) return null;

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
      this.logger.error(
        `AI extraction failed: ${this.formatFetchError(error)}`,
      );
      return null;
    }
  }

  async extractNaukriStatusApplication(input: {
    subject: string;
    body: string;
    html?: string;
  }): Promise<{
    company: string;
    role: string;
    location?: string;
  } | null> {
    if (!this.apiKey) {
      return null;
    }

    const trimmedHtml = input.html?.slice(0, 24_000) ?? '';
    const trimmedBody = input.body.slice(0, 12_000);
    if (!trimmedHtml.trim() && !trimmedBody.trim()) return null;

    try {
      const response = await fetch(
        'https://api.openai.com/v1/chat/completions',
        {
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
                  'Parse a Naukri job application status email. Return JSON only: {"company":"string","role":"string","location":"string or null"}. Extract the employer company name and job title from the job card in the email body. Ignore Naukri boilerplate, blog sections, and profile info.',
              },
              {
                role: 'user',
                content: JSON.stringify({
                  subject: input.subject,
                  body: trimmedBody,
                  html: trimmedHtml || undefined,
                }),
              },
            ],
          }),
          signal: AbortSignal.timeout(OPENAI_TIMEOUT_MS),
        },
      );

      if (!response.ok) return null;

      const payload = (await response.json()) as {
        choices?: { message?: { content?: string } }[];
      };
      const content = payload.choices?.[0]?.message?.content;
      if (!content) return null;

      const parsed = JSON.parse(content) as {
        company?: string;
        role?: string;
        location?: string | null;
      };

      const company = parsed.company?.trim() ?? '';
      const role = parsed.role?.trim() ?? '';
      if (!company || !role) return null;

      return {
        company,
        role,
        location: parsed.location?.trim() || undefined,
      };
    } catch (error) {
      this.logger.error(
        `Naukri status AI extraction failed: ${this.formatFetchError(error)}`,
      );
      return null;
    }
  }

  async extractIndeedApplyApplication(input: {
    subject: string;
    body: string;
    html?: string;
  }): Promise<{
    company: string;
    role: string;
    location?: string;
  } | null> {
    if (!this.apiKey) {
      return null;
    }

    const trimmedHtml = input.html?.slice(0, 24_000) ?? '';
    const trimmedBody = input.body.slice(0, 12_000);
    if (!trimmedHtml.trim() && !trimmedBody.trim()) return null;

    try {
      const response = await fetch(
        'https://api.openai.com/v1/chat/completions',
        {
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
                  'Parse an Indeed application confirmation email from indeedapply@indeed.com. Return JSON only: {"company":"string","role":"string","location":"string or null"}. Use the subject line and email body. The subject often starts with "Indeed Application:" followed by the job title. Ignore Indeed boilerplate and footer links.',
              },
              {
                role: 'user',
                content: JSON.stringify({
                  subject: input.subject,
                  body: trimmedBody,
                  html: trimmedHtml || undefined,
                }),
              },
            ],
          }),
          signal: AbortSignal.timeout(OPENAI_TIMEOUT_MS),
        },
      );

      if (!response.ok) return null;

      const payload = (await response.json()) as {
        choices?: { message?: { content?: string } }[];
      };
      const content = payload.choices?.[0]?.message?.content;
      if (!content) return null;

      const parsed = JSON.parse(content) as {
        company?: string;
        role?: string;
        location?: string | null;
      };

      const company = parsed.company?.trim() ?? '';
      const role = parsed.role?.trim() ?? '';
      if (!company || !role) return null;

      return {
        company,
        role,
        location: parsed.location?.trim() || undefined,
      };
    } catch (error) {
      this.logger.error(
        `Indeed apply AI extraction failed: ${this.formatFetchError(error)}`,
      );
      return null;
    }
  }

  private async requestOpenAi(input: {
    from: string;
    subject: string;
    platformId: string;
    body?: string;
    html?: string;
  }): Promise<Response | null> {
    const trimmedBody = input.body?.slice(0, 12_000) ?? '';
    const trimmedHtml = input.html?.slice(0, 24_000) ?? '';
    const hasBody =
      trimmedBody.trim().length > 0 || trimmedHtml.trim().length > 0;

    let lastError: unknown;

    for (let attempt = 1; attempt <= OPENAI_MAX_ATTEMPTS; attempt++) {
      try {
        const response = await fetch(
          'https://api.openai.com/v1/chat/completions',
          {
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
                  content: hasBody
                    ? 'Extract job application details from a job-board email. Return JSON only: {"isApplyConfirmation":boolean,"company":"string","role":"string or null","salary":"string or null","location":"string or null","employmentType":"string or null","confidence":0.0-1.0}. isApplyConfirmation is true only for emails confirming the user submitted/applied to a job. Prefer the email body when provided.'
                    : 'Extract job application details from email headers only (from + subject). Return JSON only: {"isApplyConfirmation":boolean,"company":"string","role":"string or null","salary":"string or null","location":"string or null","employmentType":"string or null","confidence":0.0-1.0}. isApplyConfirmation is true only for emails confirming the user submitted/applied to a job.',
                },
                {
                  role: 'user',
                  content: JSON.stringify({
                    from: input.from,
                    subject: input.subject,
                    platform: input.platformId,
                    body: hasBody ? trimmedBody : undefined,
                    html: hasBody ? trimmedHtml || undefined : undefined,
                  }),
                },
              ],
            }),
            signal: AbortSignal.timeout(OPENAI_TIMEOUT_MS),
          },
        );

        if (!response.ok) {
          const body = await response.text();
          this.logger.error(
            `OpenAI error ${response.status} (attempt ${attempt}/${OPENAI_MAX_ATTEMPTS}): ${body}`,
          );
          if (response.status >= 500 && attempt < OPENAI_MAX_ATTEMPTS) {
            await this.delay(attempt * 1000);
            continue;
          }
          return null;
        }

        return response;
      } catch (error) {
        lastError = error;
        this.logger.warn(
          `OpenAI request attempt ${attempt}/${OPENAI_MAX_ATTEMPTS} failed: ${this.formatFetchError(error)}`,
        );
        if (attempt < OPENAI_MAX_ATTEMPTS) {
          await this.delay(attempt * 1000);
        }
      }
    }

    throw lastError;
  }

  private formatFetchError(error: unknown): string {
    if (error instanceof Error) {
      const cause =
        error.cause instanceof Error
          ? error.cause.message
          : error.cause != null
            ? // eslint-disable-next-line @typescript-eslint/no-base-to-string
              String(error.cause)
            : '';
      return cause ? `${error.message} (${cause})` : error.message;
    }
    return String(error);
  }

  private delay(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
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
          company:
            rule.company !== 'Unknown Company' ? rule.company : undefined,
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
