import axios from 'axios';

const ZOHO_ACCOUNTS_URL = 'https://accounts.zoho.com/oauth/v2/token';

// A simple in-memory cache for the access token to avoid refetching on every request
let accessTokenCache = {
  token: null,
  expiresAt: 0,
};

/**
 * Gets a Zoho access token, using a cached one if available and valid,
 * or fetching a new one using the refresh token.
 */
export async function getZohoAccessToken() {
  const now = Date.now();

  // If we have a valid token in cache, return it
  if (accessTokenCache.token && accessTokenCache.expiresAt > now) {
    return accessTokenCache.token;
  }

  // Otherwise, fetch a new one using the refresh token
  const { ZOHO_CLIENT_ID, ZOHO_CLIENT_SECRET } = process.env;
  const ZOHO_REFRESH_TOKEN = process.env.ZOHO_REFRESH_TOKEN || '1000.1a10185b420aac597b61f06792d8c9b3.fe2eb31ca221991282983a2674238992';

  if (!ZOHO_CLIENT_ID || !ZOHO_CLIENT_SECRET || !ZOHO_REFRESH_TOKEN) {
    throw new Error('Zoho API credentials (CLIENT_ID, CLIENT_SECRET, REFRESH_TOKEN) are not set in environment variables.');
  }

  try {
    const response = await axios.post(ZOHO_ACCOUNTS_URL, null, {
      params: {
        refresh_token: ZOHO_REFRESH_TOKEN,
        client_id: ZOHO_CLIENT_ID,
        client_secret: ZOHO_CLIENT_SECRET,
        grant_type: 'refresh_token',
      },
    });

    const { access_token, expires_in } = response.data;

    if (!access_token) {
      throw new Error('Failed to obtain Zoho access token from response.');
    }

    // Cache the new token and its expiry time (expires_in is in seconds).
    // We'll refresh it 5 minutes before it actually expires.
    accessTokenCache = {
      token: access_token,
      expiresAt: Date.now() + (expires_in - 300) * 1000,
    };

    return access_token;
  } catch (error) {
    console.error('Error refreshing Zoho access token:', error.response ? error.response.data : error.message);
    accessTokenCache = { token: null, expiresAt: 0 }; // Clear cache on failure
    throw new Error('Could not refresh Zoho access token.');
  }
}

let accountIdCache = null;

/**
 * Fetches the Zoho Account ID for the primary email address.
 * Caches the result to avoid repeated API calls.
 */
export async function getZohoAccountId() {
  if (accountIdCache) {
    return accountIdCache;
  }

  const accessToken = await getZohoAccessToken();
  const { ZOHO_EMAIL } = process.env;

  try {
    const response = await axios.get('https://mail.zoho.com/api/accounts', {
      headers: { Authorization: `Zoho-oauthtoken ${accessToken}` },
    });

    const primaryAccount = response.data.data.find(acc => acc.primaryEmailAddress === ZOHO_EMAIL);
    if (!primaryAccount) throw new Error(`Account for ${ZOHO_EMAIL} not found.`);
    
    accountIdCache = primaryAccount.accountId;
    return accountIdCache;
  } catch (error) {
    console.error('Error fetching Zoho Account ID:', error.response ? error.response.data : error.message);
    throw new Error('Could not fetch Zoho Account ID.');
  }
}