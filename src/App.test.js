import { fireEvent, render, screen } from '@testing-library/react';
import App from './App.jsx';
import { exchangeKakaoCode, getAuthorizationHeader, getKakaoLoginStartUrl } from './services';

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
});

test('uses the Spring Boot endpoint for the browser Kakao redirect', () => {
  expect(getKakaoLoginStartUrl()).toBe('https://www.sibang.site/api/auth/kakao');
});

test('stores tokens returned from the Spring Boot Kakao login response', async () => {
  global.fetch = jest.fn().mockResolvedValue({
    ok: true,
    json: async () => ({
      id: 1,
      accessToken: 'access-token',
      refreshToken: 'refresh-token',
      TokenType: 'Bearer',
    }),
  });

  await exchangeKakaoCode('kakao-code');

  expect(global.fetch).toHaveBeenCalledWith('https://www.sibang.site/api/auth/login/kakao?code=kakao-code');
  expect(localStorage.getItem('sibang.tokenType')).toBe('Bearer');
  expect(getAuthorizationHeader()).toEqual({ Authorization: 'Bearer access-token' });
});
