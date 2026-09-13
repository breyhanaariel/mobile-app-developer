export type AuthProvider = 'email' | 'google' | 'apple';

export type SessionUser = {
  id: string;
  email: string;
  displayName: string;
  providers: AuthProvider[];
};

export type AuthSession = {
  accessToken: string;
  expiresAt: string;
  user: SessionUser;
};

export interface AuthGateway {
  currentSession(): Promise<AuthSession | null>;
  signInWithEmail(email: string, password: string): Promise<AuthSession>;
  signInWithGoogle(): Promise<AuthSession>;
  signInWithApple(): Promise<AuthSession>;
  signOut(): Promise<void>;
}

/**
 * Credential-free development implementation. Production auth will replace this
 * gateway without changing screens or API call sites.
 */
export class DemoAuthGateway implements AuthGateway {
  private session: AuthSession | null = null;

  async currentSession(): Promise<AuthSession | null> {
    return this.session;
  }

  async signInWithEmail(email: string): Promise<AuthSession> {
    return this.createSession(email, 'Jordan Carter', 'email');
  }

  async signInWithGoogle(): Promise<AuthSession> {
    return this.createSession('jordan.carter@example.com', 'Jordan Carter', 'google');
  }

  async signInWithApple(): Promise<AuthSession> {
    return this.createSession('jordan.carter@example.com', 'Jordan Carter', 'apple');
  }

  async signOut(): Promise<void> {
    this.session = null;
  }

  private createSession(email: string, displayName: string, provider: AuthProvider): AuthSession {
    const session: AuthSession = {
      accessToken: 'demo-jordan-carter-token',
      expiresAt: new Date(Date.now() + 60 * 60 * 1000).toISOString(),
      user: {
        id: '11111111-1111-4111-8111-111111111111',
        email,
        displayName,
        providers: [provider],
      },
    };
    this.session = session;
    return session;
  }
}

export const authGateway = new DemoAuthGateway();
