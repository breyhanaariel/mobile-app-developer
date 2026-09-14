import { useCallback, useEffect, useState } from 'react';
import { ClerkProvider, useAuth, useUser } from '@clerk/expo';
import { tokenCache } from '@clerk/expo/token-cache';
import { useHostedAuth } from '@clerk/expo/hosted-auth';
import { DemoAuthGateway, type AuthSession } from './src/auth/auth';
import { AllTogetherApp, Loading, PublicSignInScreen, type SessionGetter } from './src/ui/AllTogetherApp';

const clerkKey = process.env.EXPO_PUBLIC_CLERK_PUBLISHABLE_KEY;

export default function App() {
  if (clerkKey) return <ClerkProvider publishableKey={clerkKey} tokenCache={tokenCache}><ClerkEntry /></ClerkProvider>;
  return <DemoEntry />;
}

function ClerkEntry() {
  const { isLoaded, isSignedIn, getToken, signOut } = useAuth({ treatPendingAsSignedOut: false });
  const { user } = useUser();
  const { startHostedAuth } = useHostedAuth();
  const [pendingInviteCode,setPendingInviteCode] = useState<string>();

  const getSession: SessionGetter = useCallback(async () => {
    if (!user) return null;
    const token = await getToken();
    if (!token) return null;
    return {
      accessToken: token,
      expiresAt: new Date(Date.now() + 55 * 60 * 1000).toISOString(),
      user: {
        id: user.id,
        email: user.primaryEmailAddress?.emailAddress ?? '',
        displayName: user.fullName ?? user.firstName ?? 'Family Member',
        providers: ['email'],
      },
    } satisfies AuthSession;
  }, [getToken, user]);

  if (!isLoaded) return <Loading />;
  if (!isSignedIn || !user) {
    return <PublicSignInScreen
      onSignIn={() => startHostedAuth({ mode: 'sign-in' })}
      onSignUp={() => startHostedAuth({ mode: 'sign-up' })}
      onPendingInvite={setPendingInviteCode}
    />;
  }

  return <AllTogetherApp
    getSession={getSession}
    displayName={user.fullName ?? user.firstName ?? 'Family Member'}
    authMode="Clerk · Email + Google + Apple"
    pendingInviteCode={pendingInviteCode}
    onSignOut={async () => { setPendingInviteCode(undefined); await signOut(); }}
  />;
}

function DemoEntry() {
  const [gateway] = useState(() => new DemoAuthGateway());
  const [ready, setReady] = useState(false);
  useEffect(() => { gateway.signInWithGoogle().finally(() => setReady(true)); }, [gateway]);
  const getSession = useCallback(() => gateway.currentSession(), [gateway]);
  if (!ready) return <Loading />;
  return <AllTogetherApp
    getSession={getSession}
    displayName="Jordan Carter"
    authMode="Demo session · add Clerk credentials for email, Google, and Apple"
    onSignOut={() => gateway.signOut()}
  />;
}
