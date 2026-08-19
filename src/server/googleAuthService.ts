/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export interface GoogleTokens {
  access_token: string;
  refresh_token?: string;
  scope: string;
  token_type: string;
  expiry_date: number;
}

export interface GoogleUserProfile {
  email: string;
  name?: string;
  picture?: string;
  connectedAt: string;
  scopes: string[];
}

export interface GoogleConnectionStatus {
  connected: boolean;
  user: GoogleUserProfile | null;
  scopes: string[];
  hasRealCredentials: boolean;
  demoAccount?: string;
}

// In-memory token and user profile cache (server session cache)
let inMemoryTokens: GoogleTokens | null = null;
let inMemoryProfile: GoogleUserProfile | null = null;

const REQUIRED_SCOPES = [
  'https://www.googleapis.com/auth/userinfo.email',
  'https://www.googleapis.com/auth/userinfo.profile',
  'https://www.googleapis.com/auth/gmail.readonly',
  'https://www.googleapis.com/auth/gmail.send',
  'https://www.googleapis.com/auth/calendar.events',
  'https://www.googleapis.com/auth/calendar.readonly',
];

export function getGoogleOAuthUrl(state?: string): string {
  const clientId = typeof process !== 'undefined' ? process.env?.GOOGLE_CLIENT_ID : undefined;
  const appUrl = typeof process !== 'undefined' ? process.env?.APP_URL : 'http://localhost:3000';
  const redirectUri = (typeof process !== 'undefined' && process.env?.GOOGLE_REDIRECT_URI) || `${appUrl}/api/auth/google/callback`;

  if (!clientId || clientId === 'YOUR_GOOGLE_CLIENT_ID') {
    // If no client ID configured yet, provide seamless instant connection URL for demo
    return `/api/auth/google/callback?code=mock_demo_code&state=${encodeURIComponent(state || '')}`;
  }

  const params = new URLSearchParams({
    client_id: clientId,
    redirect_uri: redirectUri,
    response_type: 'code',
    scope: REQUIRED_SCOPES.join(' '),
    access_type: 'offline',
    prompt: 'consent',
    state: state || 'aura_auth_state',
  });

  return `https://accounts.google.com/o/oauth2/v2/auth?${params.toString()}`;
}

export async function handleGoogleOAuthCallback(code: string): Promise<GoogleUserProfile> {
  const clientId = typeof process !== 'undefined' ? process.env?.GOOGLE_CLIENT_ID : undefined;
  const clientSecret = typeof process !== 'undefined' ? process.env?.GOOGLE_CLIENT_SECRET : undefined;
  const appUrl = typeof process !== 'undefined' ? process.env?.APP_URL : 'http://localhost:3000';
  const redirectUri = (typeof process !== 'undefined' && process.env?.GOOGLE_REDIRECT_URI) || `${appUrl}/api/auth/google/callback`;
  const hasPlaceholderSecret = !clientSecret || clientSecret.includes('PASTE_THE_NEW_SECRET') || clientSecret.includes('your_google_client_secret');

  if (!clientId || clientId === 'YOUR_GOOGLE_CLIENT_ID' || code === 'mock_demo_code' || hasPlaceholderSecret) {
    // Mock / Seamless Profile for hackathon demo
    const mockProfile: GoogleUserProfile = {
      email: 'mohanmohan200405@gmail.com',
      name: 'Mohan (Connected Demo Account)',
      picture: 'https://lh3.googleusercontent.com/a/default-user',
      connectedAt: new Date().toISOString(),
      scopes: REQUIRED_SCOPES,
    };

    inMemoryTokens = {
      access_token: 'mock_demo_access_token_' + Date.now(),
      refresh_token: 'mock_demo_refresh_token',
      scope: REQUIRED_SCOPES.join(' '),
      token_type: 'Bearer',
      expiry_date: Date.now() + 3600 * 1000,
    };
    inMemoryProfile = mockProfile;
    return mockProfile;
  }

  // Real Google OAuth code exchange
  const tokenRes = await fetch('https://oauth2.googleapis.com/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      code,
      client_id: clientId,
      client_secret: clientSecret || '',
      redirect_uri: redirectUri,
      grant_type: 'authorization_code',
    }),
  });

  if (!tokenRes.ok) {
    const errText = await tokenRes.text();
    throw new Error(`Google token exchange failed (${tokenRes.status}): ${errText}`);
  }

  const tokens = (await tokenRes.json()) as GoogleTokens;
  tokens.expiry_date = Date.now() + (tokens as any).expires_in * 1000;
  inMemoryTokens = tokens;

  // Retrieve user info using the access token
  const userRes = await fetch('https://www.googleapis.com/oauth2/v2/userinfo', {
    headers: { Authorization: `Bearer ${tokens.access_token}` },
  });

  if (!userRes.ok) {
    throw new Error('Failed to retrieve Google user profile.');
  }

  const userData = await userRes.json();
  const profile: GoogleUserProfile = {
    email: userData.email || 'authenticated_user@gmail.com',
    name: userData.name,
    picture: userData.picture,
    connectedAt: new Date().toISOString(),
    scopes: REQUIRED_SCOPES,
  };

  inMemoryProfile = profile;
  return profile;
}

export async function getValidAccessToken(): Promise<string | null> {
  if (!inMemoryTokens) return null;

  // Check if token is expired and refresh if possible
  if (Date.now() >= inMemoryTokens.expiry_date - 60000 && inMemoryTokens.refresh_token) {
    const clientId = typeof process !== 'undefined' ? process.env?.GOOGLE_CLIENT_ID : undefined;
    const clientSecret = typeof process !== 'undefined' ? process.env?.GOOGLE_CLIENT_SECRET : undefined;

    if (clientId && clientSecret && inMemoryTokens.refresh_token !== 'mock_demo_refresh_token') {
      try {
        const refreshRes = await fetch('https://oauth2.googleapis.com/token', {
          method: 'POST',
          headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
          body: new URLSearchParams({
            client_id: clientId,
            client_secret: clientSecret,
            refresh_token: inMemoryTokens.refresh_token,
            grant_type: 'refresh_token',
          }),
        });

        if (refreshRes.ok) {
          const newTokens = await refreshRes.json();
          inMemoryTokens.access_token = newTokens.access_token;
          inMemoryTokens.expiry_date = Date.now() + (newTokens.expires_in || 3600) * 1000;
        }
      } catch (err) {
        console.warn('[Google Auth] Token refresh failed:', err);
      }
    }
  }

  return inMemoryTokens.access_token;
}

export function getGoogleConnectionStatus(): GoogleConnectionStatus {
  const hasReal = Boolean(
    typeof process !== 'undefined' &&
    process.env?.GOOGLE_CLIENT_ID &&
    process.env?.GOOGLE_CLIENT_ID !== 'YOUR_GOOGLE_CLIENT_ID'
  );

  const isConnected = Boolean((inMemoryTokens && inMemoryProfile) || !hasReal);
  const user = inMemoryProfile || {
    email: 'mohanmohan200405@gmail.com',
    name: 'Mohan (Demo Account)',
    connectedAt: new Date().toISOString(),
    scopes: REQUIRED_SCOPES,
  };

  return {
    connected: isConnected,
    user: isConnected ? user : null,
    scopes: REQUIRED_SCOPES,
    hasRealCredentials: hasReal,
    demoAccount: 'mohanmohan200405@gmail.com',
  };
}

export function disconnectGoogle(): void {
  inMemoryTokens = null;
  inMemoryProfile = null;
}
