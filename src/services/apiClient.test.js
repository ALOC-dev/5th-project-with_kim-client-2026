import { apiRequest } from './apiClient';

function jsonResponse(body, status = 200) {
  return {
    ok: status >= 200 && status < 300,
    status,
    json: async () => body,
    text: async () => JSON.stringify(body),
  };
}

function createJwt(payload) {
  return `header.${window.btoa(JSON.stringify(payload))}.signature`;
}

beforeEach(() => {
  localStorage.clear();
  global.fetch = jest.fn();
});

test('만료된 access token은 요청 전에 refresh token으로 재발급한다', async () => {
  localStorage.setItem('sibang.accessToken', createJwt({ exp: Math.floor(Date.now() / 1000) - 60 }));
  localStorage.setItem('sibang.refreshToken', 'refresh-token');
  localStorage.setItem('sibang.tokenType', 'Bearer');
  global.fetch
    .mockResolvedValueOnce(jsonResponse({ accessToken: 'new-access-token', refreshToken: 'new-refresh-token', tokenType: 'Bearer' }))
    .mockResolvedValueOnce(jsonResponse({ userId: 4 }));

  await expect(apiRequest('/api/users/me')).resolves.toEqual({ userId: 4 });

  expect(global.fetch.mock.calls[0]).toEqual([
    'https://www.sibang.site/api/auth/reissue',
    expect.objectContaining({
      method: 'POST',
      body: JSON.stringify({ refreshToken: 'refresh-token' }),
    }),
  ]);
  expect(global.fetch.mock.calls[1][1].headers.Authorization).toBe('Bearer new-access-token');
  expect(localStorage.getItem('sibang.refreshToken')).toBe('new-refresh-token');
});

test('API가 401을 반환하면 access token을 재발급하고 원 요청을 한 번 재시도한다', async () => {
  localStorage.setItem('sibang.accessToken', 'old-access-token');
  localStorage.setItem('sibang.refreshToken', 'refresh-token');
  localStorage.setItem('sibang.tokenType', 'Bearer');
  global.fetch
    .mockResolvedValueOnce(jsonResponse({ message: 'expired' }, 401))
    .mockResolvedValueOnce(jsonResponse({ accessToken: 'new-access-token' }))
    .mockResolvedValueOnce(jsonResponse({ userId: 4 }));

  await expect(apiRequest('/api/users/me')).resolves.toEqual({ userId: 4 });

  expect(global.fetch).toHaveBeenCalledTimes(3);
  expect(global.fetch.mock.calls[0][1].headers.Authorization).toBe('Bearer old-access-token');
  expect(global.fetch.mock.calls[2][1].headers.Authorization).toBe('Bearer new-access-token');
});

test('JWT가 아닌 access token도 발급 후 24시간이 지나면 재발급한다', async () => {
  localStorage.setItem('sibang.accessToken', 'opaque-access-token');
  localStorage.setItem('sibang.refreshToken', 'refresh-token');
  localStorage.setItem('sibang.accessTokenIssuedAt', String(Date.now() - (24 * 60 * 60 * 1000) - 1000));
  global.fetch
    .mockResolvedValueOnce(jsonResponse({ accessToken: 'new-access-token' }))
    .mockResolvedValueOnce(jsonResponse({ userId: 4 }));

  await apiRequest('/api/users/me');

  expect(global.fetch.mock.calls[0][0]).toBe('https://www.sibang.site/api/auth/reissue');
});

test('JWT 만료 시각이 더 길어도 로그인 후 24시간이 지나면 재발급한다', async () => {
  localStorage.setItem('sibang.accessToken', createJwt({ exp: Math.floor(Date.now() / 1000) + (7 * 24 * 60 * 60) }));
  localStorage.setItem('sibang.refreshToken', 'refresh-token');
  localStorage.setItem('sibang.accessTokenIssuedAt', String(Date.now() - (24 * 60 * 60 * 1000) - 1000));
  global.fetch
    .mockResolvedValueOnce(jsonResponse({ accessToken: 'new-access-token' }))
    .mockResolvedValueOnce(jsonResponse({ userId: 4 }));

  await apiRequest('/api/users/me');

  expect(global.fetch.mock.calls[0][0]).toBe('https://www.sibang.site/api/auth/reissue');
});

test('여러 요청이 동시에 401을 받아도 access token 재발급은 한 번만 호출한다', async () => {
  localStorage.setItem('sibang.accessToken', 'old-access-token');
  localStorage.setItem('sibang.refreshToken', 'refresh-token');
  localStorage.setItem('sibang.tokenType', 'Bearer');
  global.fetch.mockImplementation((url, options) => {
    if (url.endsWith('/api/auth/reissue')) {
      return Promise.resolve(jsonResponse({ accessToken: 'new-access-token' }));
    }
    if (options.headers.Authorization === 'Bearer old-access-token') {
      return Promise.resolve(jsonResponse({ message: 'expired' }, 401));
    }
    return Promise.resolve(jsonResponse({ ok: true }));
  });

  await Promise.all([apiRequest('/api/users/me'), apiRequest('/api/houses/wishlist')]);

  const reissueCalls = global.fetch.mock.calls.filter(([url]) => url.endsWith('/api/auth/reissue'));
  expect(reissueCalls).toHaveLength(1);
});
