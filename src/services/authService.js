import { API_BASE_URL } from './apiConfig';
const KAKAO_LOGIN_START_PATH = '/api/auth/kakao';
const ACCESS_TOKEN_KEY = 'sibang.accessToken';
const REFRESH_TOKEN_KEY = 'sibang.refreshToken';
const TOKEN_TYPE_KEY = 'sibang.tokenType';
const USER_ID_KEY = 'sibang.userId';
const USERNAME_KEY = 'sibang.username';
const ROLE_KEY = 'sibang.role';

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

export async function requestBrokerSignup(formData) {
  // TODO: API 연동 필요 - POST '-'
  // 설명: 중개사무소 소재지, 사업자 아이디/비밀번호, 공인중개사 자격증 파일을 multipart/form-data로 보내는 가입 신청 응답을 기대합니다.
  throw new Error('Broker signup API is not configured');
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
  if (id !== undefined && id !== null) localStorage.setItem(USER_ID_KEY, String(id));
  if (username || fallbackUsername) localStorage.setItem(USERNAME_KEY, username || fallbackUsername);
  if (refreshToken) localStorage.setItem(REFRESH_TOKEN_KEY, refreshToken);
  if (tokenType) localStorage.setItem(TOKEN_TYPE_KEY, tokenType);
  if (role) localStorage.setItem(ROLE_KEY, role);
  return { id, username: username || fallbackUsername, accessToken, refreshToken, tokenType, role };
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
  localStorage.removeItem(ACCESS_TOKEN_KEY);
  localStorage.removeItem(USER_ID_KEY);
  localStorage.removeItem(USERNAME_KEY);
  localStorage.removeItem(REFRESH_TOKEN_KEY);
  localStorage.removeItem(TOKEN_TYPE_KEY);
  localStorage.removeItem(ROLE_KEY);
}
