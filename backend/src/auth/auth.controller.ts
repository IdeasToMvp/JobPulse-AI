import {
  Body,
  Controller,
  Get,
  HttpCode,
  Post,
  Query,
  Req,
  Res,
  UseGuards,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import type { Response } from 'express';
import { AuthService } from './auth.service';
import { GoogleIdTokenDto } from './dto/google-id-token.dto';
import { GoogleTokenDto } from './dto/google-token.dto';
import type { AuthenticatedRequest } from './jwt-auth.guard';
import { JwtAuthGuard } from './jwt-auth.guard';

@Controller('auth')
export class AuthController {
  constructor(
    private readonly auth: AuthService,
    private readonly config: ConfigService,
  ) {}

  /** Returns Google OAuth URL for mobile/web clients to open in a browser. */
  @Get('google/url')
  getGoogleAuthUrl(
    @Query('redirectUri') redirectUri?: string,
    @Query('clientRedirectUri') clientRedirectUri?: string,
  ) {
    return this.auth.getGoogleAuthUrl(redirectUri, clientRedirectUri);
  }

  /**
   * Browser redirect target configured in Google Cloud Console.
   * Exchanges the code server-side and redirects to the client callback URL.
   */
  @Get('google/callback')
  async googleCallback(
    @Query('code') code: string,
    @Query('state') state: string,
    @Query('error') error: string | undefined,
    @Res() res: Response,
  ) {
    const fallbackRedirect =
      this.config.get<string>('mobileRedirectUri') ?? 'jobpulse://auth/callback';

    if (error || !code) {
      return res.redirect(
        `${fallbackRedirect}?error=${encodeURIComponent(error ?? 'access_denied')}`,
      );
    }

    try {
      const { session, clientRedirectUri } = await this.auth.loginWithGoogleCode(
        code,
        this.config.get<string>('google.redirectUri'),
        state,
      );
      const separator = clientRedirectUri.includes('?') ? '&' : '?';
      return res.redirect(
        `${clientRedirectUri}${separator}token=${encodeURIComponent(session.accessToken)}`,
      );
    } catch (err) {
      const message =
        err instanceof Error ? err.message : 'Google authentication failed';
      return res.redirect(
        `${fallbackRedirect}?error=${encodeURIComponent(message)}`,
      );
    }
  }

  /** Mobile clients POST the authorization code after Google sign-in. */
  @Post('google/token')
  @HttpCode(200)
  async exchangeGoogleToken(
    @Body() body: GoogleTokenDto,
    @Query('state') state?: string,
  ) {
    const { session } = await this.auth.loginWithGoogleCode(
      body.code,
      body.redirectUri,
      state,
    );
    return session;
  }

  /**
   * Optional shortcut when the app only has an ID token.
   * Gmail refresh tokens are not available through this path.
   */
  @Post('google/id-token')
  @HttpCode(200)
  verifyGoogleIdToken(@Body() body: GoogleIdTokenDto) {
    return this.auth.loginWithGoogleIdToken(body.idToken);
  }

  @Get('me')
  @UseGuards(JwtAuthGuard)
  async me(@Req() req: AuthenticatedRequest) {
    const profile = await this.auth.getProfile(req.user!.sub);
    return { user: profile };
  }

  @Post('logout')
  @HttpCode(200)
  @UseGuards(JwtAuthGuard)
  async logout(@Req() req: AuthenticatedRequest) {
    await this.auth.logout(req.user!.sub);
    return { success: true };
  }
}
