import { Injectable } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { Strategy, StrategyOptions, VerifyCallback, Profile } from 'passport-google-oauth20';
import { ConfigService } from '@nestjs/config';
import { AuthService } from '../auth.service';

@Injectable()
export class GoogleStrategy extends PassportStrategy(Strategy, 'google') {
  constructor(
    private readonly configService: ConfigService,
    private readonly authService: AuthService,
  ) {
    super({
      clientID: configService.get<string>('google.clientId'),
      clientSecret: configService.get<string>('google.clientSecret'),
      callbackURL: configService.get<string>('google.callbackUrl'),
      scope: ['email', 'profile'],
    } as StrategyOptions);
  }

  async validate(
    _accessToken: string,
    _refreshToken: string,
    profile: Profile,
    done: VerifyCallback,
  ): Promise<void> {
    try {
      const { id, name, emails } = profile;
      const email = emails?.[0]?.value;

      if (!email) {
        return done(new Error('No email returned from Google'));
      }

      const tokens = await this.authService.validateGoogleUser({
        googleId: id,
        email,
        firstName: name?.givenName || '',
        lastName: name?.familyName || '',
      });

      done(null, tokens);
    } catch (error) {
      console.error('Google OAuth validation failed:', error);
      done(error as Error);
    }
  }
}

