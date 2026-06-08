import { ConfigService } from '@nestjs/config';
import { AppReleaseService } from './app-release.service';

describe('AppReleaseService', () => {
  const config = {
    get: jest.fn((key: string) => {
      if (key === 'androidRelease') {
        return {
          enabled: true,
          latestVersion: '1.0.0',
          latestBuildNumber: 1,
          apkUrl: '',
          releaseNotes: '',
          forceUpdate: false,
          minSupportedBuildNumber: 1,
        };
      }
      return undefined;
    }),
  } as unknown as ConfigService;

  it('returns no update when client build matches latest', () => {
    const service = new AppReleaseService(config);
    const result = service.checkForUpdate(1);
    expect(result.updateAvailable).toBe(false);
  });

  it('returns update when admin publishes a newer build', () => {
    const service = new AppReleaseService(config);
    service.setConfig({
      enabled: true,
      latestVersion: '1.0.1',
      latestBuildNumber: 2,
      apkUrl: 'https://example.com/app.apk',
      releaseNotes: 'Bug fixes',
      forceUpdate: false,
      minSupportedBuildNumber: 1,
    });

    const result = service.checkForUpdate(1);
    expect(result).toMatchObject({
      updateAvailable: true,
      latestVersion: '1.0.1',
      latestBuildNumber: 2,
      apkUrl: 'https://example.com/app.apk',
      releaseNotes: 'Bug fixes',
      forceUpdate: false,
    });
  });

  it('forces update when client is below minimum supported build', () => {
    const service = new AppReleaseService(config);
    service.setConfig({
      enabled: true,
      latestVersion: '2.0.0',
      latestBuildNumber: 5,
      apkUrl: 'https://example.com/app.apk',
      releaseNotes: 'Security update',
      forceUpdate: false,
      minSupportedBuildNumber: 3,
    });

    const result = service.checkForUpdate(1);
    expect(result.updateAvailable).toBe(true);
    expect(result.forceUpdate).toBe(true);
  });
});
