import { ApplicationMatcherService } from './application-matcher.service';
import { ApplicationsService } from '../applications/applications.service';
import { ActivitiesService } from '../activities/activities.service';

/* eslint-disable @typescript-eslint/unbound-method */
describe('ApplicationMatcherService', () => {
  const applications = {
    getLatestApplicationForThread: jest.fn(),
    getLatestApplicationForCompanyNameAndRole: jest
      .fn()
      .mockResolvedValue(null),
    createApplication: jest.fn(),
    touchApplicationMessage: jest.fn(),
    addPlatformToApplication: jest.fn(),
    appendStatusHistory: jest.fn().mockResolvedValue(undefined),
  } as unknown as ApplicationsService;

  const activities = {
    recordApplicationDetected: jest.fn().mockResolvedValue(undefined),
  } as unknown as ActivitiesService;

  let matcher: ApplicationMatcherService;

  beforeEach(() => {
    jest.clearAllMocks();
    matcher = new ApplicationMatcherService(applications, activities);
  });

  const baseInput = {
    userId: 'user-1',
    threadId: 'thread-1',
    messageId: 'msg-1',
    messageAt: new Date('2025-06-01'),
    platformId: 'linkedin',
    companyName: 'Microsoft',
    role: 'Software Engineer',
  };

  it('creates application when thread is new', async () => {
    applications.getLatestApplicationForThread = jest
      .fn()
      .mockResolvedValue(null);
    applications.createApplication = jest.fn().mockResolvedValue({
      id: 'app-new',
      company: 'Microsoft',
      role: 'Software Engineer',
      status: 'applied',
    });

    const id = await matcher.matchAndUpsert(baseInput);

    expect(id).toBe('app-new');
    expect(applications.createApplication).toHaveBeenCalledWith(
      expect.objectContaining({
        status: 'applied',
        threadId: 'thread-1',
        cycleIndex: 0,
      }),
    );
    expect(applications.appendStatusHistory).toHaveBeenCalled();
    expect(activities.recordApplicationDetected).toHaveBeenCalled();
  });

  it('touches existing application for same thread without creating', async () => {
    applications.getLatestApplicationForThread = jest.fn().mockResolvedValue({
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
    applications.touchApplicationMessage = jest.fn().mockResolvedValue({
      id: 'app-1',
    });

    const id = await matcher.matchAndUpsert({
      ...baseInput,
      messageId: 'msg-2',
    });

    expect(id).toBe('app-1');
    expect(applications.touchApplicationMessage).toHaveBeenCalled();
    expect(applications.createApplication).not.toHaveBeenCalled();
    expect(activities.recordApplicationDetected).not.toHaveBeenCalled();
  });

  it('merges platforms when same company+role on different source', async () => {
    applications.getLatestApplicationForThread = jest
      .fn()
      .mockResolvedValue(null);
    applications.getLatestApplicationForCompanyNameAndRole = jest
      .fn()
      .mockResolvedValue({
        id: 'app-linkedin',
        platformId: 'linkedin',
        company: 'Microsoft',
        role: 'Software Engineer',
      });
    applications.addPlatformToApplication = jest.fn().mockResolvedValue({
      id: 'app-linkedin',
    });

    const id = await matcher.matchAndUpsert({
      ...baseInput,
      threadId: 'thread-indeed',
      platformId: 'indeed',
    });

    expect(id).toBe('app-linkedin');
    expect(applications.addPlatformToApplication).toHaveBeenCalledWith(
      'app-linkedin',
      'indeed',
      expect.objectContaining({ lastMessageId: 'msg-1' }),
    );
    expect(applications.createApplication).not.toHaveBeenCalled();
  });

  it('creates new application for re-apply on different thread', async () => {
    applications.getLatestApplicationForThread = jest
      .fn()
      .mockResolvedValue(null);
    applications.createApplication = jest.fn().mockResolvedValue({
      id: 'app-reapply',
      company: 'Microsoft',
      role: 'Software Engineer',
      status: 'applied',
    });

    const id = await matcher.matchAndUpsert({
      ...baseInput,
      threadId: 'thread-new',
    });

    expect(id).toBe('app-reapply');
    expect(applications.createApplication).toHaveBeenCalled();
  });
});
/* eslint-enable @typescript-eslint/unbound-method */
