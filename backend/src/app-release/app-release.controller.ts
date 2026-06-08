import {
  Body,
  Controller,
  Get,
  Put,
  Query,
  UseGuards,
} from '@nestjs/common';
import { AdminApiKeyGuard } from './admin-api-key.guard';
import { AppReleaseService } from './app-release.service';
import { AndroidUpdateQueryDto } from './dto/android-update-query.dto';
import { UpdateAndroidReleaseDto } from './dto/update-android-release.dto';

@Controller()
export class AppReleaseController {
  constructor(private readonly releases: AppReleaseService) {}

  @Get('app/android-update')
  checkAndroidUpdate(@Query() query: AndroidUpdateQueryDto) {
    return this.releases.checkForUpdate(query.buildNumber);
  }

  @Put('admin/app/android-update')
  @UseGuards(AdminApiKeyGuard)
  publishAndroidUpdate(@Body() body: UpdateAndroidReleaseDto) {
    const config = this.releases.setConfig(body);
    return { ok: true, release: config };
  }
}
