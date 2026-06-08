import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { UpdateAndroidReleaseDto } from './dto/update-android-release.dto';

export interface AndroidReleaseConfig {
  enabled: boolean;
  latestVersion: string;
  latestBuildNumber: number;
  apkUrl: string;
  releaseNotes: string;
  forceUpdate: boolean;
  minSupportedBuildNumber: number;
}

export interface AndroidUpdateResponse {
  updateAvailable: boolean;
  latestVersion: string;
  latestBuildNumber: number;
  apkUrl: string | null;
  releaseNotes: string;
  forceUpdate: boolean;
  minSupportedBuildNumber: number;
}

@Injectable()
export class AppReleaseService {
  private override: AndroidReleaseConfig | null = null;

  constructor(private readonly config: ConfigService) {}

  getConfig(): AndroidReleaseConfig {
    if (this.override) return { ...this.override };
    return this.configFromEnv();
  }

  setConfig(dto: UpdateAndroidReleaseDto): AndroidReleaseConfig {
    const current = this.getConfig();
    this.override = {
      enabled: dto.enabled,
      latestVersion: dto.latestVersion,
      latestBuildNumber: dto.latestBuildNumber,
      apkUrl: dto.apkUrl?.trim() || current.apkUrl,
      releaseNotes: dto.releaseNotes?.trim() ?? current.releaseNotes,
      forceUpdate: dto.forceUpdate,
      minSupportedBuildNumber: dto.minSupportedBuildNumber,
    };
    return this.getConfig();
  }

  checkForUpdate(buildNumber: number): AndroidUpdateResponse {
    const release = this.getConfig();

    if (!release.enabled) {
      return this.noUpdateResponse(release);
    }

    const belowMinimum = buildNumber < release.minSupportedBuildNumber;
    const updateAvailable = buildNumber < release.latestBuildNumber;
    const forceUpdate =
      belowMinimum || (release.forceUpdate && updateAvailable);

    return {
      updateAvailable: updateAvailable || belowMinimum,
      latestVersion: release.latestVersion,
      latestBuildNumber: release.latestBuildNumber,
      apkUrl: release.apkUrl || null,
      releaseNotes: release.releaseNotes,
      forceUpdate,
      minSupportedBuildNumber: release.minSupportedBuildNumber,
    };
  }

  private noUpdateResponse(
    release: AndroidReleaseConfig,
  ): AndroidUpdateResponse {
    return {
      updateAvailable: false,
      latestVersion: release.latestVersion,
      latestBuildNumber: release.latestBuildNumber,
      apkUrl: null,
      releaseNotes: release.releaseNotes,
      forceUpdate: false,
      minSupportedBuildNumber: release.minSupportedBuildNumber,
    };
  }

  private configFromEnv(): AndroidReleaseConfig {
    const android = this.config.get<AndroidReleaseConfig>('androidRelease');
    return {
      enabled: android?.enabled ?? false,
      latestVersion: android?.latestVersion ?? '1.0.0',
      latestBuildNumber: android?.latestBuildNumber ?? 1,
      apkUrl: android?.apkUrl ?? '',
      releaseNotes: android?.releaseNotes ?? '',
      forceUpdate: android?.forceUpdate ?? false,
      minSupportedBuildNumber: android?.minSupportedBuildNumber ?? 1,
    };
  }
}
