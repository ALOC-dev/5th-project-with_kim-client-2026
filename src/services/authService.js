import { API_BASE_URL } from './apiConfig';
const KAKAO_LOGIN_START_PATH = '/api/auth/kakao';
const ACCESS_TOKEN_KEY = 'sibang.accessToken';
const REFRESH_TOKEN_KEY = 'sibang.refreshToken';
const TOKEN_TYPE_KEY = 'sibang.tokenType';
const ACCESS_TOKEN_ISSUED_AT_KEY = 'sibang.accessTokenIssuedAt';
const USER_ID_KEY = 'sibang.userId';
const USERNAME_KEY = 'sibang.username';
const ROLE_KEY = 'sibang.role';
const ACCESS_TOKEN_LIFETIME_MS = 24 * 60 * 60 * 1000;
const TOKEN_EXPIRY_MARGIN_MS = 30 * 1000;
export const AUTH_SESSION_EXPIRED_EVENT = 'sibang:auth-session-expired';
let reissueRequest = null;

export function getKakaoLoginStartUrl() {
  return `${API_BASE_URL}${KAKAO_LOGIN_START_PATH}`;
}

export function startKakaoLogin() {
  // Browser navigation sends GET /api/auth/kakao and follows Spring Boot's 302 Location response.
  window.location.assign(getKakaoLoginStartUrl());
}

export async function loginBusinessUser(credentials) {
  const response = await fetch(`${API_BASE_URL}/api/auth/login`, {
    method: 'POST',
    headers: { Accept: 'application/json', 'Content-Type': 'application/json' },
    body: JSON.stringify({
      loginId: credentials.loginId,
      password: credentials.password,
    }),
  });

  if (!response.ok) {
    throw new Error('아이디 또는 비밀번호를 확인해 주세요.');
  }

  const loginResponse = await response.json();
  return storeLoginResponse(loginResponse, credentials.loginId, 'BROKER');
}

export async function requestBrokerSignup(signupData) {
  const response = await fetch(`${API_BASE_URL}/api/auth/signup`, {
    method: 'POST',
    headers: { Accept: 'application/json', 'Content-Type': 'application/json' },
    body: JSON.stringify({
      loginId: signupData.loginId,
      username: signupData.username,
      password: signupData.password,
      confirmPassword: signupData.confirmPassword,
    }),
  });

  if (!response.ok) {
    let message = '회원가입에 실패했어요. 입력한 정보를 확인해 주세요.';
    try {
      const errorBody = await response.json();
      message = errorBody.message || errorBody.error || message;
    } catch {
      // Keep the user-facing fallback when the server has no JSON error body.
    }
    throw new Error(message);
  }

  if (response.status === 204) return null;
  try {
    return await response.json();
  } catch {
    return null;
  }
}

export async function exchangeKakaoCode(code) {
  const response = await fetch(`${API_BASE_URL}/api/auth/login/kakao?code=${encodeURIComponent(code)}`);
  if (!response.ok) throw new Error('Kakao login failed');

  // Spring Boot LoginResponse: { id, username, accessToken, refreshToken, tokenType }
  const loginResponse = await response.json();
  return storeLoginResponse(loginResponse);
}

function storeLoginResponse(loginResponse, fallbackUsername = '', fallbackRole = '') {
  const { id, username, accessToken, refreshToken } = loginResponse;
  const tokenType = loginResponse.tokenType || loginResponse.TokenType || 'Bearer';
  const role = loginResponse.role || loginResponse.userRole || getRoleFromAccessToken(accessToken) || fallbackRole;
  if (!accessToken) throw new Error('Access token is missing');

  localStorage.setItem(ACCESS_TOKEN_KEY, accessToken);
  localStorage.setItem(ACCESS_TOKEN_ISSUED_AT_KEY, String(Date.now()));
  if (id !== undefined && id !== null) localStorage.setItem(USER_ID_KEY, String(id));
  if (username || fallbackUsername) localStorage.setItem(USERNAME_KEY, username || fallbackUsername);
  if (refreshToken) localStorage.setItem(REFRESH_TOKEN_KEY, refreshToken);
  if (tokenType) localStorage.setItem(TOKEN_TYPE_KEY, tokenType);
  if (role) localStorage.setItem(ROLE_KEY, role);
  return { id, username: username || fallbackUsername, accessToken, refreshToken, tokenType, role };
}

export function storeCurrentUserProfile(profile = {}) {
  const id = profile.userId ?? profile.id;
  const { username, role } = profile;

  if (id !== undefined && id !== null) localStorage.setItem(USER_ID_KEY, String(id));
  if (username) localStorage.setItem(USERNAME_KEY, username);
  if (role) localStorage.setItem(ROLE_KEY, role);

  return {
    id: id !== undefined && id !== null ? String(id) : getCurrentUserId(),
    username: username || getCurrentUsername(),
    role: role || getCurrentRole(),
  };
}

function getRoleFromAccessToken(accessToken) {
  try {
    const payload = accessToken.split('.')[1];
    if (!payload) return '';
    const normalizedPayload = payload.replace(/-/g, '+').replace(/_/g, '/');
    const decoded = JSON.parse(window.atob(normalizedPayload));
    return decoded.role || decoded.roles?.[0] || '';
  } catch {
    return '';
  }
}

export function hasAccessToken() {
  return Boolean(localStorage.getItem(ACCESS_TOKEN_KEY));
}

export function getAuthorizationHeader() {
  const accessToken = localStorage.getItem(ACCESS_TOKEN_KEY);
  const tokenType = localStorage.getItem(TOKEN_TYPE_KEY) || 'Bearer';
  return accessToken ? { Authorization: `${tokenType} ${accessToken}` } : {};
}

export function hasRefreshToken() {
  return Boolean(localStorage.getItem(REFRESH_TOKEN_KEY));
}

export function shouldReissueAccessToken(now = Date.now()) {
  const accessToken = localStorage.getItem(ACCESS_TOKEN_KEY);
  if (!accessToken) return false;

  const payload = decodeAccessToken(accessToken);
  const expiresAt = Number(payload?.exp) * 1000;
  const issuedAt = Number(localStorage.getItem(ACCESS_TOKEN_ISSUED_AT_KEY));
  const expiryCandidates = [
    Number.isFinite(expiresAt) && expiresAt > 0 ? expiresAt : null,
    Number.isFinite(issuedAt) && issuedAt > 0 ? issuedAt + ACCESS_TOKEN_LIFETIME_MS : null,
  ].filter(Boolean);

  return expiryCandidates.some((expiry) => now >= expiry - TOKEN_EXPIRY_MARGIN_MS);
}

export async function ensureValidAccessToken() {
  if (!shouldReissueAccessToken()) return localStorage.getItem(ACCESS_TOKEN_KEY);
  return reissueAccessToken();
}

export function reissueAccessToken() {
  if (reissueRequest) return reissueRequest;

  const refreshToken = localStorage.getItem(REFRESH_TOKEN_KEY);
  if (!refreshToken) return Promise.reject(expireStoredSession());

  reissueRequest = fetch(`${API_BASE_URL}/api/auth/reissue`, {
    method: 'POST',
    headers: { Accept: 'application/json', 'Content-Type': 'application/json' },
    body: JSON.stringify({ refreshToken }),
  })
    .then(async (response) => {
      if (!response.ok) throw new Error('Access token reissue failed');
      const responseBody = await response.json();
      const tokens = responseBody?.data || responseBody;
      if (!tokens?.accessToken) throw new Error('Access token is missing');

      localStorage.setItem(ACCESS_TOKEN_KEY, tokens.accessToken);
      localStorage.setItem(ACCESS_TOKEN_ISSUED_AT_KEY, String(Date.now()));
      if (tokens.refreshToken) localStorage.setItem(REFRESH_TOKEN_KEY, tokens.refreshToken);
      if (tokens.tokenType || tokens.TokenType) localStorage.setItem(TOKEN_TYPE_KEY, tokens.tokenType || tokens.TokenType);
      const role = getRoleFromAccessToken(tokens.accessToken);
      if (role) localStorage.setItem(ROLE_KEY, role);
      return tokens.accessToken;
    })
    .catch((error) => {
      expireStoredSession();
      throw error;
    })
    .finally(() => {
      reissueRequest = null;
    });

  return reissueRequest;
}

export function getCurrentUserId() {
  return localStorage.getItem(USER_ID_KEY);
}

export function getCurrentUsername() {
  return localStorage.getItem(USERNAME_KEY);
}

export function getCurrentRole() {
  return localStorage.getItem(ROLE_KEY);
}

export function isBusinessUser(role = getCurrentRole()) {
  return ['ADMIN', 'BROKER', 'BUSINESS', 'AGENT', 'ROLE_ADMIN', 'ROLE_BROKER', 'ROLE_BUSINESS', 'ROLE_AGENT'].includes(String(role || '').toUpperCase());
}

export async function logout() {
  clearStoredSession();
}

function decodeAccessToken(accessToken) {
  try {
    const payload = accessToken.split('.')[1];
    if (!payload) return null;
    const normalizedPayload = payload.replace(/-/g, '+').replace(/_/g, '/');
    const paddedPayload = normalizedPayload.padEnd(Math.ceil(normalizedPayload.length / 4) * 4, '=');
    return JSON.parse(window.atob(paddedPayload));
  } catch {
    return null;
  }
}

function expireStoredSession() {
  clearStoredSession();
  window.dispatchEvent(new Event(AUTH_SESSION_EXPIRED_EVENT));
  return new Error('로그인 세션이 만료되었습니다. 다시 로그인해 주세요.');
}

function clearStoredSession() {
  localStorage.removeItem(ACCESS_TOKEN_KEY);
  localStorage.removeItem(ACCESS_TOKEN_ISSUED_AT_KEY);
  localStorage.removeItem(USER_ID_KEY);
  localStorage.removeItem(USERNAME_KEY);
  localStorage.removeItem(REFRESH_TOKEN_KEY);
  localStorage.removeItem(TOKEN_TYPE_KEY);
  localStorage.removeItem(ROLE_KEY);
}
