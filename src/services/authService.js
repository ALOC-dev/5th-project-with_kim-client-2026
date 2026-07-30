import { API_BASE_URL } from './apiConfig';
const KAKAO_LOGIN_START_PATH = '/api/auth/kakao';
const ACCESS_TOKEN_KEY = 'sibang.accessToken';
const REFRESH_TOKEN_KEY = 'sibang.refreshToken';
const TOKEN_TYPE_KEY = 'sibang.tokenType';
const USER_ID_KEY = 'sibang.userId';

export function getKakaoLoginStartUrl() {
  return `${API_BASE_URL}${KAKAO_LOGIN_START_PATH}`;
}

export function startKakaoLogin() {
  // Browser navigation sends GET /api/auth/kakao and follows Spring Boot's 302 Location response.
  window.location.assign(getKakaoLoginStartUrl());
}

export async function loginBusinessUser(credentials) {
  // TODO: API 연동 필요 - POST '-'
  // 설명: 공인중개사 아이디/비밀번호를 보내고 사업자용 accessToken, refreshToken, tokenType 응답을 기대합니다.
  throw new Error('Business login API is not configured');
}

export async function requestBrokerSignup(formData) {
  // TODO: API 연동 필요 - POST '-'
  // 설명: 중개사무소 소재지, 사업자 아이디/비밀번호, 공인중개사 자격증 파일을 multipart/form-data로 보내는 가입 신청 응답을 기대합니다.
  throw new Error('Broker signup API is not configured');
}

export async function exchangeKakaoCode(code) {
  const response = await fetch(`${API_BASE_URL}/api/auth/login/kakao?code=${encodeURIComponent(code)}`);
  if (!response.ok) throw new Error('Kakao login failed');

  // Spring Boot LoginResponse: { id, accessToken, refreshToken, tokenType }
  const loginResponse = await response.json();
  const { id, accessToken, refreshToken } = loginResponse;
  const tokenType = loginResponse.tokenType || loginResponse.TokenType || 'Bearer';
  if (!accessToken) throw new Error('Access token is missing');

  localStorage.setItem(ACCESS_TOKEN_KEY, accessToken);
  if (id !== undefined && id !== null) localStorage.setItem(USER_ID_KEY, String(id));
  if (refreshToken) localStorage.setItem(REFRESH_TOKEN_KEY, refreshToken);
  if (tokenType) localStorage.setItem(TOKEN_TYPE_KEY, tokenType);
  return { id, accessToken, refreshToken, tokenType };
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

export async function logout() {
  localStorage.removeItem(ACCESS_TOKEN_KEY);
  localStorage.removeItem(USER_ID_KEY);
  localStorage.removeItem(REFRESH_TOKEN_KEY);
  localStorage.removeItem(TOKEN_TYPE_KEY);
}
