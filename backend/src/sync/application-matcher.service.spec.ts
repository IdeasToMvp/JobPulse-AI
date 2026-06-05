import { ApplicationMatcherService } from './application-matcher.service';
import { ApplicationsService } from '../applications/applications.service';
import { ApplicationLifecycleService } from './application-lifecycle.service';
import { ActivitiesService } from '../activities/activities.service';

describe('ApplicationMatcherService', () => {
  const applications = {
    getLatestApplicationForThread: jest.fn(),
    getLatestApplicationForCompany: jest.fn(),
    getLatestApplicationForCompanyNameAndRole: jest.fn(),
    createApplication: jest.fn(),
    updateApplication: jest.fn(),
  } as unknown as ApplicationsService;

  const activities = {
    recordApplicationDetected: jest.fn().mockResolvedValue(undefined),
    recordStatusUpdate: jest.fn().mockResolvedValue(undefined),
  } as unknown as ActivitiesService;

  const lifecycle = new ApplicationLifecycleService();
  let matcher: ApplicationMatcherService;

  beforeEach(() => {
    jest.clearAllMocks();
    matcher = new ApplicationMatcherService(applications, lifecycle, activities);
  });

  const baseInput = {
    userId: 'user-1',
    threadId: 'thread-1',
    messageId: 'msg-1',
    messageAt: new Date('2025-06-01'),
    platformId: 'company_direct',
    companyId: 'company-1',
    companyName: 'Microsoft',
    role: 'Software Engineer',
    status: 'interview' as const,
  };

  it('updates application matched by thread', async () => {
    applications.getLatestApplicationForThread = jest
      .fn()
      .mockResolvedValue({
        id: 'app-1',
        userId: 'user-1',
        threadId: 'thread-1',
        cycleIndex: 0,
        platformId: 'linkedin',
        company: 'Microsoft',
        status: 'applied',
        createdAt: new Date(),
        updatedAt: new Date(),
      });
    applications.updateApplication = jest.fn().mockResolvedValue({
      id: 'app-1',
      company: 'Microsoft',
      role: 'Software Engineer',
      status: 'interview',
    });

    const id = await matcher.matchAndUpsert(baseInput);

    expect(id).toBe('app-1');
    expect(applications.updateApplication).toHaveBeenCalled();
    expect(applications.createApplication).not.toHaveBeenCalled();
  });

  it('creates application when no thread or company match', async () => {
    applications.getLatestApplicationForThread = jest
      .fn()
      .mockResolvedValue(null);
    applications.getLatestApplicationForCompany = jest
      .fn()
      .mockResolvedValue(null);
    applications.getLatestApplicationForCompanyNameAndRole = jest
      .fn()
      .mockResolvedValue(null);
    applications.createApplication = jest
      .fn()
      .mockResolvedValue({
        id: 'app-new',
        company: 'Microsoft',
        role: 'Software Engineer',
      });

    const id = await matcher.matchAndUpsert(baseInput);

    expect(id).toBe('app-new');
    expect(applications.createApplication).toHaveBeenCalledWith(
      expect.objectContaining({
        platformId: 'company_direct',
        companyId: 'company-1',
      }),
    );
  });

  it('updates application matched by company name and role across threads', async () => {
    applications.getLatestApplicationForThread = jest
      .fn()
      .mockResolvedValue(null);
    applications.getLatestApplicationForCompany = jest
      .fn()
      .mockResolvedValue(null);
    applications.getLatestApplicationForCompanyNameAndRole = jest
      .fn()
      .mockResolvedValue({
        id: 'app-linkedin',
        userId: 'user-1',
        threadId: 'thread-old',
        cycleIndex: 0,
        platformId: 'linkedin',
        company: 'Fast-Growing Startup',
        role: 'Full Stack Role',
        status: 'applied',
        createdAt: new Date(),
        updatedAt: new Date(),
      });
    applications.updateApplication = jest
      .fn()
      .mockResolvedValue({
        id: 'app-linkedin',
        company: 'Fast-Growing Startup',
        role: 'Full Stack Role',
        status: 'active',
      });

    const id = await matcher.matchAndUpsert({
      ...baseInput,
      threadId: 'thread-new',
      platformId: 'linkedin',
      companyId: undefined,
      companyName: 'Fast-Growing Startup',
      role: 'Full Stack Role',
      status: 'active',
    });

    expect(id).toBe('app-linkedin');
    expect(applications.updateApplication).toHaveBeenCalled();
    expect(applications.createApplication).not.toHaveBeenCalled();
  });
});
