import { OAuth2Client } from 'google-auth-library';
import { GoogleTokenPayload } from '../../types/auth';

class GoogleAuthService {
  private client: OAuth2Client;

  constructor() {
    const clientId = process.env.GOOGLE_CLIENT_ID;
    if (!clientId) {
      throw new Error('GOOGLE_CLIENT_ID is not configured');
    }
    this.client = new OAuth2Client(clientId);
  }

  async verifyToken(token: string): Promise<GoogleTokenPayload | null> {
    try {
      const ticket = await this.client.verifyIdToken({
        idToken: token,
        audience: process.env.GOOGLE_CLIENT_ID,
      });

      const payload = ticket.getPayload();
      if (!payload) {
        throw new Error('Invalid token payload');
      }

      return {
        iss: payload.iss,
        azp: payload.azp || '',
        aud: payload.aud as string,
        sub: payload.sub,
        email: payload.email || '',
        email_verified: payload.email_verified || false,
        name: payload.name || '',
        picture: payload.picture,
        given_name: payload.given_name,
        family_name: payload.family_name,
        iat: payload.iat || 0,
        exp: payload.exp || 0,
      };
    } catch (error) {
      console.error('Error verifying Google token:', error);
      return null;
    }
  }

  async getUserInfo(token: string): Promise<{
    googleId: string;
    email: string;
    name: string;
    avatar?: string;
  } | null> {
    const payload = await this.verifyToken(token);
    if (!payload) {
      return null;
    }

    return {
      googleId: payload.sub,
      email: payload.email,
      name: payload.name,
      avatar: payload.picture,
    };
  }
}

export const googleAuthService = new GoogleAuthService();
export default googleAuthService;
