import { RuleEngineService } from './rule-engine.service';

describe('RuleEngineService', () => {
  const engine = new RuleEngineService();

  it('classifies application received as applied', () => {
    const result = engine.classify(
      'Naukri <noreply@naukri.com>',
      'Application received for Software Engineer',
    );
    expect(result.status).toBe('applied');
    expect(result.confidence).toBe('high');
  });

  it('classifies interview invitation', () => {
    const result = engine.classify(
      'Indeed <noreply@indeed.com>',
      'Interview invitation for Backend Engineer',
    );
    expect(result.status).toBe('interview');
  });

  it('classifies rejection', () => {
    const result = engine.classify(
      'LinkedIn <jobs-listings@linkedin.com>',
      'Unfortunately we are moving forward with other candidates',
    );
    expect(result.status).toBe('rejected');
  });

  it('extracts company from sender', () => {
    const result = engine.classify(
      'Stripe <no-reply@stripe.com>',
      'Thank you for applying',
    );
    expect(result.company.toLowerCase()).toContain('stripe');
  });
});
