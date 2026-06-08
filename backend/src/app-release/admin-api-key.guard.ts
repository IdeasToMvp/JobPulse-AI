import {
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Request } from 'express';

@Injectable()
export class AdminApiKeyGuard implements CanActivate {
  constructor(private readonly config: ConfigService) {}

  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest<Request>();
    const configuredKey = this.config.get<string>('adminApiKey')?.trim();

    if (!configuredKey) {
      throw new UnauthorizedException('Admin API is not configured');
    }

    const header = request.headers.authorization;
    if (!header?.startsWith('Bearer ')) {
      throw new UnauthorizedException('Missing admin bearer token');
    }

    const token = header.slice('Bearer '.length);
    if (token !== configuredKey) {
      throw new UnauthorizedException('Invalid admin token');
    }

    return true;
  }
}
