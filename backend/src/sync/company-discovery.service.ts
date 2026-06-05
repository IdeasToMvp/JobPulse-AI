import {
  Injectable,
  InternalServerErrorException,
  Logger,
} from '@nestjs/common';
import { ApplicationStatus } from '../applications/application.entity';
import { SupabaseService } from '../supabase/supabase.service';
import {
  extractDomainFromEmail,
  extractEmailAddress,
  isPlatformOrPersonalDomain,
  lookupDomainHint,
} from './company-domain-hints';
import { normalizeCompanyKey } from './company-name.util';
import {
  CompanyForPhase2,
  DiscoveredCompanyRecord,
} from './company.entity';

@Injectable()
export class CompanyDiscoveryService {
  private readonly logger = new Logger(CompanyDiscoveryService.name);

  constructor(private readonly supabase: SupabaseService) {}

  async upsertFromPlatformEmail(input: {
    userId: string;
    companyName: string;
    platformId: string;
    fromAddress?: string;
    messageAt: Date;
  }): Promise<DiscoveredCompanyRecord | null> {
    const key = normalizeCompanyKey(input.companyName);
    if (!key || key === 'unknowncompany') return null;

    const now = input.messageAt.toISOString();

    const { data: existing, error: fetchError } = await this.supabase.db
      .from('discovered_companies')
      .select('*')
      .eq('user_id', input.userId)
      .eq('normalized_key', key)
      .maybeSingle();

    if (fetchError) this.raise('upsertFromPlatformEmail.fetch', fetchError);

    let company: DiscoveredCompanyRecord;

    if (existing) {
      const updates: Record<string, unknown> = {
        last_seen_at: now,
        canonical_name: input.companyName,
      };
      if (!existing.primary_platform_id) {
        updates.primary_platform_id = input.platformId;
      }

      const { data, error } = await this.supabase.db
        .from('discovered_companies')
        .update(updates)
        .eq('id', existing.id)
        .select('*')
        .single();

      if (error) this.raise('upsertFromPlatformEmail.update', error);
      company = this.mapCompany(data);
    } else {
      const { data, error } = await this.supabase.db
        .from('discovered_companies')
        .insert({
          user_id: input.userId,
          canonical_name: input.companyName,
          normalized_key: key,
          primary_platform_id: input.platformId,
          application_status: null,
          first_seen_at: now,
          last_seen_at: now,
        })
        .select('*')
        .single();

      if (error) this.raise('upsertFromPlatformEmail.insert', error);
      company = this.mapCompany(data);
    }

    await this.inferAndStoreDomain({
      userId: input.userId,
      companyId: company.id,
      companyKey: key,
      fromAddress: input.fromAddress,
    });

    return company;
  }

  async learnRecruiterEmail(input: {
    userId: string;
    companyId: string;
    fromAddress: string;
    messageAt: Date;
  }): Promise<void> {
    const email = extractEmailAddress(input.fromAddress);
    if (!email) return;

    const domain = extractDomainFromEmail(email);
    if (!domain || isPlatformOrPersonalDomain(domain)) return;

    const displayMatch = input.fromAddress.match(/^([^<]+)</);
    const displayName = displayMatch?.[1]?.trim().replace(/['"]/g, '');

    const now = input.messageAt.toISOString();
    const { data: existing } = await this.supabase.db
      .from('company_recruiter_emails')
      .select('id')
      .eq('user_id', input.userId)
      .eq('email', email)
      .maybeSingle();

    if (existing) {
      await this.supabase.db
        .from('company_recruiter_emails')
        .update({ last_seen_at: now, company_id: input.companyId })
        .eq('id', existing.id);
      return;
    }

    const { error } = await this.supabase.db
      .from('company_recruiter_emails')
      .insert({
        user_id: input.userId,
        company_id: input.companyId,
        email,
        display_name: displayName ?? null,
        first_seen_at: now,
        last_seen_at: now,
      });

    if (error) this.raise('learnRecruiterEmail', error);

    await this.upsertDomain({
      userId: input.userId,
      companyId: input.companyId,
      domain,
      source: 'recruiter',
      confidence: 0.95,
    });
  }

  async listCompaniesForPhase2(
    userId: string,
    activeOnly: boolean,
  ): Promise<CompanyForPhase2[]> {
    const { data: companies, error } = await this.supabase.db
      .from('discovered_companies')
      .select('*')
      .eq('user_id', userId);

    if (error) this.raise('listCompaniesForPhase2.companies', error);
    if (!companies?.length) return [];

    const companyIds = companies.map((c) => c.id as string);

    const { data: domains } = await this.supabase.db
      .from('company_domains')
      .select('company_id, domain')
      .eq('user_id', userId)
      .in('company_id', companyIds);

    const { data: recruiters } = await this.supabase.db
      .from('company_recruiter_emails')
      .select('company_id, email')
      .eq('user_id', userId)
      .in('company_id', companyIds);

    const domainMap = new Map<string, string[]>();
    for (const row of domains ?? []) {
      const cid = row.company_id as string;
      if (!domainMap.has(cid)) domainMap.set(cid, []);
      domainMap.get(cid)!.push(row.domain as string);
    }

    const recruiterMap = new Map<string, string[]>();
    for (const row of recruiters ?? []) {
      const cid = row.company_id as string;
      if (!recruiterMap.has(cid)) recruiterMap.set(cid, []);
      recruiterMap.get(cid)!.push(row.email as string);
    }

    const activeStatuses = new Set(['applied', 'active', 'interview']);

    const result: CompanyForPhase2[] = [];
    for (const row of companies) {
      const id = row.id as string;
      const d = domainMap.get(id) ?? [];
      const r = recruiterMap.get(id) ?? [];
      if (d.length === 0 && r.length === 0) continue;

      const status = row.application_status as string | null;
      if (activeOnly && status && !activeStatuses.has(status)) continue;

      result.push({
        id,
        canonicalName: row.canonical_name as string,
        applicationStatus: status ?? undefined,
        domains: d,
        recruiterEmails: r,
      });
    }

    result.sort((a, b) => {
      const aActive = activeStatuses.has(a.applicationStatus ?? '') ? 0 : 1;
      const bActive = activeStatuses.has(b.applicationStatus ?? '') ? 0 : 1;
      if (aActive !== bActive) return aActive - bActive;
      return a.canonicalName.localeCompare(b.canonicalName);
    });

    return result.slice(0, 50);
  }

  async countCompanies(userId: string): Promise<number> {
    const { count, error } = await this.supabase.db
      .from('discovered_companies')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', userId);

    if (error) this.raise('countCompanies', error);
    return count ?? 0;
  }

  private async inferAndStoreDomain(input: {
    userId: string;
    companyId: string;
    companyKey: string;
    fromAddress?: string;
  }): Promise<void> {
    const hint = lookupDomainHint(input.companyKey);
    if (hint) {
      await this.upsertDomain({
        userId: input.userId,
        companyId: input.companyId,
        domain: hint,
        source: 'hint',
        confidence: 0.85,
      });
    }

    if (!input.fromAddress) return;
    const email = extractEmailAddress(input.fromAddress);
    if (!email) return;
    const domain = extractDomainFromEmail(email);
    if (!domain || isPlatformOrPersonalDomain(domain)) return;

    await this.upsertDomain({
      userId: input.userId,
      companyId: input.companyId,
      domain,
      source: 'inferred',
      confidence: 0.75,
    });
  }

  private async upsertDomain(input: {
    userId: string;
    companyId: string;
    domain: string;
    source: string;
    confidence: number;
  }): Promise<void> {
    const { data: existing } = await this.supabase.db
      .from('company_domains')
      .select('id')
      .eq('user_id', input.userId)
      .eq('domain', input.domain)
      .maybeSingle();

    if (existing) return;

    const { error } = await this.supabase.db.from('company_domains').insert({
      user_id: input.userId,
      company_id: input.companyId,
      domain: input.domain,
      source: input.source,
      confidence: input.confidence,
    });

    if (error) this.raise('upsertDomain', error);
  }

  private mapCompany(row: Record<string, unknown>): DiscoveredCompanyRecord {
    return {
      id: row.id as string,
      userId: row.user_id as string,
      canonicalName: row.canonical_name as string,
      normalizedKey: row.normalized_key as string,
      primaryPlatformId: (row.primary_platform_id as string) ?? undefined,
      applicationStatus: (row.application_status as ApplicationStatus) ??
        undefined,
      firstSeenAt: new Date(row.first_seen_at as string),
      lastSeenAt: new Date(row.last_seen_at as string),
    };
  }

  private raise(operation: string, error: { message: string }): never {
    this.logger.error(`${operation} failed: ${error.message}`);
    throw new InternalServerErrorException('Database operation failed');
  }
}
