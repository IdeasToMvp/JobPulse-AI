import { Injectable } from '@nestjs/common';

export type RuleConfidence = 'high' | 'low' | 'none';

export interface ApplyDetectionResult {
  isApply: boolean;
  confidence: RuleConfidence;
  company: string;
  role?: string;
}

const APPLY_PATTERN =
  /application received|thank you for applying|we received your application|successfully applied|application submitted|your application for|your application was sent|application was sent to|applied successfully|application has been submitted/i;

const ROLE_PATTERN =
  /(?:for|as|position[:\s-]+|role[:\s-]+)([A-Za-z0-9][A-Za-z0-9\s/&.-]{2,60})/i;

@Injectable()
export class RuleEngineService {
  detectApplyConfirmation(from: string, subject: string): ApplyDetectionResult {
    const text = `${subject} ${from}`;
    const company = this.extractCompany(from, subject);
    const role = this.extractRole(subject);

    if (APPLY_PATTERN.test(text)) {
      return { isApply: true, confidence: 'high', company, role };
    }

    if (this.looksJobRelated(text)) {
      return { isApply: true, confidence: 'low', company, role };
    }

    return { isApply: false, confidence: 'none', company, role };
  }

  /** @deprecated Use detectApplyConfirmation for sync v2 */
  classify(from: string, subject: string) {
    const result = this.detectApplyConfirmation(from, subject);
    return {
      status: result.isApply ? ('applied' as const) : ('unknown' as const),
      company: result.company,
      role: result.role,
      confidence: result.confidence,
    };
  }

  private looksJobRelated(text: string): boolean {
    return /application|applied|thank you for applying|job application|successfully applied/i.test(
      text,
    );
  }

  private extractCompany(from: string, subject: string): string {
    const displayMatch = from.match(/^([^<]+)</);
    if (displayMatch?.[1]) {
      return displayMatch[1].trim().replace(/['"]/g, '');
    }

    const emailMatch = from.match(/@([a-z0-9.-]+)\./i);
    if (emailMatch?.[1]) {
      const domain = emailMatch[1].split('.').pop() ?? emailMatch[1];
      return domain.charAt(0).toUpperCase() + domain.slice(1);
    }

    const subjectCompany = subject.match(/^([^-|–:]+)[-|–:]/);
    if (subjectCompany?.[1]) {
      return subjectCompany[1].trim();
    }

    return 'Unknown Company';
  }

  private extractRole(subject: string): string | undefined {
    const match = subject.match(ROLE_PATTERN);
    if (!match?.[1]) return undefined;
    const role = match[1].trim();
    if (role.length < 3 || role.length > 80) return undefined;
    return role;
  }
}
