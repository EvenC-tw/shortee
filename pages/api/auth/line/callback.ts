import {
  COOKIE_NAMES,
  ERROR_MESSAGES,
  LINE_CONFIG
} from '@utils/auth/constants';
import type { NextApiRequest, NextApiResponse } from 'next';
import {
  clearCookie,
  getCookieValue,
  setCookie,
  validateEnvironmentVariables
} from '@utils/auth/utils';

import jwt from 'jsonwebtoken';

async function exchangeCodeForToken(code: string, clientId: string, clientSecret: string, redirectUri: string) {
  const response = await fetch(LINE_CONFIG.TOKEN_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: new URLSearchParams({
      grant_type: 'authorization_code',
      code: code,
      redirect_uri: redirectUri,
      client_id: clientId,
      client_secret: clientSecret,
    }),
  });
  if (!response.ok) {
    console.error('Token request failed:', await response.text());
    throw new Error(ERROR_MESSAGES.TOKEN_REQUEST_FAILED);
  }
  return await response.json();
}

async function fetchUserProfile(accessToken: string) {
  const response = await fetch(LINE_CONFIG.PROFILE_URL, {
    headers: {
      'Authorization': `Bearer ${accessToken}`,
    },
  });
  if (!response.ok) {
    console.error('Profile request failed:', await response.text());
    throw new Error(ERROR_MESSAGES.PROFILE_REQUEST_FAILED);
  }
  return await response.json();
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ message: ERROR_MESSAGES.METHOD_NOT_ALLOWED });
  }

  const { code, state, error } = req.query;
  if (error) {
    console.error('Line login error:', error);
    return res.redirect('/?error=line_login_failed');
  }
  if (!code || !state) {
    console.error('Missing code or state parameter');
    return res.redirect('/?error=invalid_parameters');
  }
  const requiredEnvVars = ['LINE_CHANNEL_ID', 'LINE_CHANNEL_SECRET', 'LINE_CALLBACK_URL', 'JWT_SECRET'];
  if (!validateEnvironmentVariables(requiredEnvVars)) {
    console.error('Missing LINE environment variables');
    return res.status(500).json({ message: ERROR_MESSAGES.MISSING_ENV_VARS });
  }
  const { LINE_CHANNEL_ID, LINE_CHANNEL_SECRET, LINE_CALLBACK_URL, JWT_SECRET } = process.env;
  try {
    const expectedState = getCookieValue(req.headers.cookie, COOKIE_NAMES.LINE_STATE);
    if (state !== expectedState) {
      console.error('State mismatch');
      return res.redirect('/?error=state_mismatch');
    }
    const tokenData = await exchangeCodeForToken(
      code as string,
      LINE_CHANNEL_ID!,
      LINE_CHANNEL_SECRET!,
      LINE_CALLBACK_URL!
    );
    const decodedIdToken = jwt.verify(tokenData.id_token, LINE_CHANNEL_SECRET!, {
      algorithms: [LINE_CONFIG.JWT_OPTIONS.ALGORITHM],
    }) as any;
    const profile = await fetchUserProfile(tokenData.access_token);
    const userData = {
      lineId: profile.userId,
      name: profile.displayName,
      email: decodedIdToken.email || null,
      picture: profile.pictureUrl || null,
    };
    const authToken = jwt.sign(
      {
        userId: userData.lineId,
        name: userData.name,
        email: userData.email,
      },
      JWT_SECRET!,
      LINE_CONFIG.JWT_OPTIONS
    );
    setCookie(res, COOKIE_NAMES.AUTH_TOKEN, authToken, {
      MaxAge: 7 * 24 * 60 * 60,
    });
    clearCookie(res, COOKIE_NAMES.LINE_STATE);
    clearCookie(res, COOKIE_NAMES.LINE_NONCE);
    res.redirect('/?login=success');
  } catch (error) {
    console.error('Line callback error:', error);
    res.redirect('/?error=callback_failed');
  }
} 