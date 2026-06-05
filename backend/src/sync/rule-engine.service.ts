import { Injectable } from '@nestjs/common';
import { ApplicationStatus } from '../applications/application.entity';

export type RuleConfidence = 'high' | 'low' | 'none';

export interface RuleClassification {
  status: ApplicationStatus | 'unknown';
  company: string;
  role?: string;
  confidence: RuleConfidence;
}

const STATUS_RULES: { status: ApplicationStatus; pattern: RegExp }[] = [
  {
    status: 'rejected',
    pattern:
      /unfortunately|not moving forward|regret to inform|other candidates|position has been filled|no longer under consideration/i,
  },
  {
    status: 'offer',
    pattern:
      /offer letter|pleased to extend|compensation package|congratulations.*offer|we are offering/i,
  },
  {
    status: 'interview',
    pattern:
      /interview invitation|schedule.*interview|phone screen|onsite|virtual meeting|meet the team|coding interview/i,
  },
  {
    status: 'active',
    pattern:
      /assessment invitation|coding challenge|take[- ]home|hackerrank|codility|online test|technical assessment/i,
  },
  {
    status: 'applied',
    pattern:
      /application received|thank you for applying|we received your application|successfully applied|application submitted/i,
  },
];

const ROLE_PATTERN =
  /(?:for|as|position[:\s-]+|role[:\s-]+)([A-Za-z0-9][A-Za-z0-9\s/&.-]{2,60})/i;

@Injectable()
export class RuleEngineService {
  classify(from: string, subject: string): RuleClassification {
    const text = `${subject} ${from}`;
    let matched: ApplicationStatus | 'unknown' = 'unknown';
    let confidence: RuleConfidence = 'none';

    for (const rule of STATUS_RULES) {
      if (rule.pattern.test(text)) {
        matched = rule.status;
        confidence = 'high';
        break;
      }
    }

    if (matched === 'unknown' && this.looksJobRelated(text)) {
      matched = 'applied';
      confidence = 'low';
    }

    const company = this.extractCompany(from, subject);
    const role = this.extractRole(subject);

    return { status: matched, company, role, confidence };
  }

  private looksJobRelated(text: string): boolean {
    return /application|applied|interview|assessment|recruiter|hiring|job|role|position/i.test(
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
