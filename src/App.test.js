import { render, screen } from '@testing-library/react';
import App from './App.jsx';
import { exchangeKakaoCode, getAuthorizationHeader, getKakaoLoginStartUrl } from './services';

test('renders the Kakao login start page', async () => {
  window.history.replaceState({}, '', '/login');
  render(<App />);
  expect(await screen.findByText('카카오로 시작하기')).toBeInTheDocument();
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
