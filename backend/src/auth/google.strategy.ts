import { Injectable } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { Strategy, VerifyCallback } from 'passport-google-oauth20';

@Injectable()
export class GoogleStrategy extends PassportStrategy(Strategy, 'google') {
  constructor() {
    const callbackURL = process.env.GOOGLE_REDIRECT_URI;
    if (!callbackURL) {
      throw new Error('GOOGLE_REDIRECT_URI is required');
    }

    super({
      clientID: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
      callbackURL,
      scope: ['email', 'profile'],
    });
  }

  async validate(
    accessToken: string,
    refreshToken: string,
    profile: any,
    done: VerifyCallback,
  ): Promise<any> {
    const { name, emails } = profile ?? {};
    const email = emails?.[0]?.value;

    if (!email) {
      return done(new Error('Google account email is unavailable'), false);
    }

    const user = {
      email,
      firstName: name?.givenName || 'Google',
      lastName: name?.familyName || 'User',
      accessToken,
    };
    done(null, user);
  }
}
