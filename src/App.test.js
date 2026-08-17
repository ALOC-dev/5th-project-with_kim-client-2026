import { fireEvent, render, screen } from '@testing-library/react';
import App from './App.jsx';
import { AUTH_SESSION_EXPIRED_EVENT, exchangeKakaoCode, getAuthorizationHeader, getCurrentUsername, getKakaoLoginStartUrl, loginBusinessUser, requestBrokerSignup } from './services';

jest.mock('./pages/HousingPage', () => function MockHousingPage({ username, userId }) {
  return <div>{username || `회원 #${userId}`}</div>;
});

test('renders the Kakao login start page', async () => {
  window.history.replaceState({}, '', '/login');
  render(<App />);
  expect(await screen.findByText('카카오로 시작하기')).toBeInTheDocument();
});

test('switches between student and business login panels', async () => {
  window.history.replaceState({}, '', '/login');
  render(<App />);

  fireEvent.click(await screen.findByRole('button', { name: '사업자 로그인' }));

  expect(screen.getByRole('heading', { name: '사업자 로그인' })).toBeInTheDocument();
  expect(screen.getByLabelText('아이디')).toBeInTheDocument();
  expect(screen.getByLabelText('비밀번호')).toBeInTheDocument();

  fireEvent.click(screen.getByRole('button', { name: '학생 로그인으로 돌아가기' }));

  expect(screen.getByRole('heading', { name: '시작하기' })).toBeInTheDocument();
  expect(screen.getByRole('button', { name: '카카오로 시작하기' })).toBeInTheDocument();
});

test('opens broker signup panel and connects Seoul district to neighborhood options', async () => {
  window.history.replaceState({}, '', '/login');
  render(<App />);

  fireEvent.click(await screen.findByRole('button', { name: '사업자 로그인' }));
  fireEvent.click(screen.getByRole('button', { name: '중개사 가입 신청' }));

  expect(screen.getByRole('heading', { name: '중개사 가입 신청' })).toBeInTheDocument();
  expect(screen.getByLabelText('구 선택')).toHaveValue('동대문구');
  expect(screen.getByLabelText('동 선택')).toHaveValue('전농동');

  fireEvent.change(screen.getByLabelText('구 선택'), { target: { value: '강남구' } });

  expect(screen.getByLabelText('동 선택')).toHaveValue('역삼동');
  expect(screen.getByRole('option', { name: '압구정동' })).toBeInTheDocument();
  expect(screen.getByLabelText('사용자 이름')).toBeInTheDocument();
  expect(screen.getByLabelText('비밀번호 확인')).toBeInTheDocument();
});

test('signs up without sending the frontend-only region and license fields', async () => {
  global.fetch = jest.fn().mockResolvedValue({ ok: true, status: 201, json: async () => ({ id: 11 }) });

  await requestBrokerSignup({
    loginId: 'broker-user',
    username: '김중개',
    password: 'password123!',
    confirmPassword: 'password123!',
    gu: '동대문구',
    dong: '전농동',
    licenseFile: new File(['license'], 'license.pdf', { type: 'application/pdf' }),
  });

  expect(global.fetch).toHaveBeenCalledWith('https://www.sibang.site/api/auth/signup', {
    method: 'POST',
    headers: { Accept: 'application/json', 'Content-Type': 'application/json' },
    body: JSON.stringify({
      loginId: 'broker-user',
      username: '김중개',
      password: 'password123!',
      confirmPassword: 'password123!',
    }),
  });
});

test('blocks broker signup when password confirmation does not match', async () => {
  window.history.replaceState({}, '', '/login');
  global.fetch = jest.fn();
  render(<App />);

  fireEvent.click(await screen.findByRole('button', { name: '사업자 로그인' }));
  fireEvent.click(screen.getByRole('button', { name: '중개사 가입 신청' }));
  fireEvent.change(screen.getByLabelText('아이디'), { target: { value: 'broker-user' } });
  fireEvent.change(screen.getByLabelText('사용자 이름'), { target: { value: '김중개' } });
  fireEvent.change(screen.getByLabelText('비밀번호', { selector: '#broker-signup-password' }), { target: { value: 'password123!' } });
  fireEvent.change(screen.getByLabelText('비밀번호 확인'), { target: { value: 'different-password' } });
  fireEvent.change(screen.getByLabelText('공인중개사 자격증'), { target: { files: [new File(['license'], 'license.pdf', { type: 'application/pdf' })] } });
  fireEvent.click(screen.getByRole('button', { name: '가입 신청하기' }));

  expect(await screen.findByRole('alert')).toHaveTextContent('비밀번호가 일치하지 않아요.');
  expect(global.fetch).not.toHaveBeenCalled();
});

test('returns to business login after broker signup succeeds without a frontend-only license file', async () => {
  window.history.replaceState({}, '', '/login');
  global.fetch = jest.fn().mockResolvedValue({ ok: true, status: 201, json: async () => ({ id: 11 }) });
  render(<App />);

  fireEvent.click(await screen.findByRole('button', { name: '사업자 로그인' }));
  fireEvent.click(screen.getByRole('button', { name: '중개사 가입 신청' }));
  fireEvent.change(screen.getByLabelText('아이디'), { target: { value: 'broker-user' } });
  fireEvent.change(screen.getByLabelText('사용자 이름'), { target: { value: '김중개' } });
  fireEvent.change(screen.getByLabelText('비밀번호', { selector: '#broker-signup-password' }), { target: { value: 'password123!' } });
  fireEvent.change(screen.getByLabelText('비밀번호 확인'), { target: { value: 'password123!' } });
  fireEvent.click(screen.getByRole('button', { name: '가입 신청하기' }));

  expect(await screen.findByRole('heading', { name: '사업자 로그인' })).toBeInTheDocument();
  expect(screen.getByRole('status')).toHaveTextContent('가입이 완료됐어요. 사업자 로그인을 진행해 주세요.');
});

test('uses the Spring Boot endpoint for the browser Kakao redirect', () => {
  expect(getKakaoLoginStartUrl()).toBe('https://www.sibang.site/api/auth/kakao');
});

test('stores tokens returned from the Spring Boot Kakao login response', async () => {
  global.fetch = jest.fn().mockResolvedValue({
    ok: true,
    json: async () => ({
      id: 1,
      username: '김정묵',
      accessToken: 'access-token',
      refreshToken: 'refresh-token',
      TokenType: 'Bearer',
    }),
  });

  await exchangeKakaoCode('kakao-code');

  expect(global.fetch).toHaveBeenCalledWith('https://www.sibang.site/api/auth/login/kakao?code=kakao-code');
  expect(localStorage.getItem('sibang.tokenType')).toBe('Bearer');
  expect(localStorage.getItem('sibang.username')).toBe('김정묵');
  expect(getCurrentUsername()).toBe('김정묵');
  expect(getAuthorizationHeader()).toEqual({ Authorization: 'Bearer access-token' });
});

test('logs in a business user through the Spring Boot login endpoint', async () => {
  global.fetch = jest.fn().mockResolvedValue({
    ok: true,
    json: async () => ({
      id: 8,
      accessToken: 'business-access-token',
      refreshToken: 'business-refresh-token',
      TokenType: 'Bearer',
    }),
  });

  const loginResponse = await loginBusinessUser({ loginId: 'broker-user', password: 'password' });

  expect(global.fetch).toHaveBeenCalledWith('https://www.sibang.site/api/auth/login', {
    method: 'POST',
    headers: { Accept: 'application/json', 'Content-Type': 'application/json' },
    body: JSON.stringify({ loginId: 'broker-user', password: 'password' }),
  });
  expect(loginResponse).toMatchObject({ id: 8, username: 'broker-user', accessToken: 'business-access-token' });
  expect(localStorage.getItem('sibang.accessToken')).toBe('business-access-token');
  expect(localStorage.getItem('sibang.username')).toBe('broker-user');
});

test('shows the business console after business login succeeds', async () => {
  localStorage.clear();
  window.history.replaceState({}, '', '/login');
  global.fetch = jest.fn().mockResolvedValue({
    ok: true,
    json: async () => ({ id: 8, accessToken: 'business-access-token', refreshToken: 'business-refresh-token' }),
  });

  render(<App />);
  fireEvent.click(await screen.findByRole('button', { name: '사업자 로그인' }));
  fireEvent.change(screen.getByLabelText('아이디'), { target: { value: 'broker-user' } });
  fireEvent.change(screen.getByLabelText('비밀번호'), { target: { value: 'password' } });
  fireEvent.click(screen.getByRole('button', { name: '로그인' }));

  expect(await screen.findByRole('heading', { name: '매물 등록' })).toBeInTheDocument();
  expect(screen.getAllByText('관리자')).toHaveLength(2);
});

test('restores the signed-in user name from the current user API', async () => {
  localStorage.clear();
  localStorage.setItem('sibang.accessToken', 'access-token');
  localStorage.setItem('sibang.userId', '4');
  window.history.replaceState({}, '', '/');
  global.fetch = jest.fn().mockResolvedValue({
    ok: true,
    status: 200,
    json: async () => ({ userId: 4, username: '김정묵', role: 'USER' }),
  });

  render(<App />);

  expect(await screen.findByText('김정묵')).toBeInTheDocument();
  expect(localStorage.getItem('sibang.username')).toBe('김정묵');
  expect(global.fetch).toHaveBeenCalledWith(
    'https://www.sibang.site/api/users/me',
    expect.objectContaining({ method: 'GET' }),
  );
});

test('refresh token 재발급이 실패하면 로그인 화면으로 전환한다', async () => {
  localStorage.clear();
  localStorage.setItem('sibang.accessToken', 'access-token');
  localStorage.setItem('sibang.userId', '4');
  window.history.replaceState({}, '', '/');
  global.fetch = jest.fn().mockResolvedValue({
    ok: true,
    status: 200,
    text: async () => JSON.stringify({ userId: 4, username: '김정묵', role: 'USER' }),
  });

  render(<App />);
  expect(await screen.findByText('김정묵')).toBeInTheDocument();

  fireEvent(window, new Event(AUTH_SESSION_EXPIRED_EVENT));

  expect(await screen.findByRole('button', { name: '카카오로 시작하기' })).toBeInTheDocument();
  expect(screen.getByRole('alert')).toHaveTextContent('로그인 세션이 만료되었어요. 다시 로그인해 주세요.');
});
