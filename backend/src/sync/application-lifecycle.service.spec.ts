import {
  ApplicationLifecycleService,
  GHOSTED_AFTER_DAYS,
} from './application-lifecycle.service';

describe('ApplicationLifecycleService', () => {
  const lifecycle = new ApplicationLifecycleService();

  const baseApp = {
    id: 'app-1',
    userId: 'user-1',
    threadId: 'thread-1',
    cycleIndex: 0,
    platformId: 'linkedin',
    platformIds: ['linkedin'],
    company: 'Microsoft',
    status: 'applied' as const,
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  it('marks stale applied applications as ghosted after 50 days', () => {
    const staleDate = new Date();
    staleDate.setDate(staleDate.getDate() - GHOSTED_AFTER_DAYS);

    const ids = lifecycle.findGhostedCandidates(
      [{ ...baseApp, lastMessageAt: staleDate }],
      new Date(),
    );

    expect(ids).toEqual(['app-1']);
    expect(GHOSTED_AFTER_DAYS).toBe(50);
  });

  it('does not ghost active or interview statuses', () => {
    const staleDate = new Date();
    staleDate.setDate(staleDate.getDate() - GHOSTED_AFTER_DAYS - 1);

    const ids = lifecycle.findGhostedCandidates(
      [
        { ...baseApp, status: 'active', lastMessageAt: staleDate },
        {
          ...baseApp,
          id: 'app-2',
          status: 'interview',
          lastMessageAt: staleDate,
        },
        {
          ...baseApp,
          id: 'app-3',
          status: 'rejected',
          lastMessageAt: staleDate,
        },
      ],
      new Date(),
    );

    expect(ids).toEqual([]);
  });

  it('does not ghost recent applied applications', () => {
    const recentDate = new Date();
    recentDate.setDate(recentDate.getDate() - 10);

    const ids = lifecycle.findGhostedCandidates(
      [{ ...baseApp, lastMessageAt: recentDate }],
      new Date(),
    );

    expect(ids).toEqual([]);
  });
});
