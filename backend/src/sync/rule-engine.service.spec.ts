import { RuleEngineService } from './rule-engine.service';

describe('RuleEngineService', () => {
  const engine = new RuleEngineService();

  it('detects high-confidence apply confirmations', () => {
    const result = engine.detectApplyConfirmation(
      'LinkedIn <jobs@linkedin.com>',
      'Thank you for applying to Software Engineer at Microsoft',
    );
    expect(result.isApply).toBe(true);
    expect(result.confidence).toBe('high');
  });

  it('does not treat interview emails as apply', () => {
    const result = engine.detectApplyConfirmation(
      'Recruiter <hr@company.com>',
      'Interview invitation for Software Engineer',
    );
    expect(result.isApply).toBe(false);
    expect(result.confidence).toBe('none');
  });

  it('detects rejection emails as not apply', () => {
    const result = engine.detectApplyConfirmation(
      'HR <hr@company.com>',
      'Unfortunately we will not be moving forward',
    );
    expect(result.isApply).toBe(false);
  });

  it('legacy classify maps apply to applied status', () => {
    const result = engine.classify(
      'Naukri <noreply@naukri.com>',
      'Application received for Backend Developer',
    );
    expect(result.status).toBe('applied');
    expect(result.confidence).toBe('high');
  });
});
