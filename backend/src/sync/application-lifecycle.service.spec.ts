import { ApplicationRecord } from '../applications/application.entity';
import { ApplicationLifecycleService } from './application-lifecycle.service';

describe('ApplicationLifecycleService', () => {
  const lifecycle = new ApplicationLifecycleService();

  const baseApp: ApplicationRecord = {
    id: '1',
    userId: 'u1',
    threadId: 't1',
    cycleIndex: 0,
    platformId: 'naukri',
    company: 'Acme',
    role: 'Engineer',
    status: 'applied',
    lastMessageAt: new Date('2025-01-01'),
    createdAt: new Date('2025-01-01'),
    updatedAt: new Date('2025-01-01'),
  };

  it('moves status forward in pipeline', () => {
    expect(lifecycle.resolveNextStatus('applied', 'interview')).toBe(
      'interview',
    );
    expect(lifecycle.resolveNextStatus('interview', 'applied')).toBe(
      'interview',
    );
  });

  it('creates new cycle after terminal status and re-apply gap', () => {
    const rejected: ApplicationRecord = {
      ...baseApp,
      status: 'rejected',
      lastMessageAt: new Date('2025-01-01'),
    };
    const shouldSplit = lifecycle.shouldCreateNewCycle(
      rejected,
      'applied',
      'Engineer',
      new Date('2025-04-01'),
    );
    expect(shouldSplit).toBe(true);
  });

  it('marks stale applications as ghosted candidates', () => {
    const stale: ApplicationRecord = {
      ...baseApp,
      status: 'active',
      lastMessageAt: new Date('2025-01-01'),
    };
    const ids = lifecycle.findGhostedCandidates(
      [stale],
      new Date('2025-03-01'),
    );
    expect(ids).toEqual(['1']);
  });
});
