import { deferResidenceVerification, getResidenceVerification, getUserProfile, normalizeResidenceVerification, updateUserPreferences, uploadResidenceVerification } from './userService';

test('실거주 인증 결과를 GET API에서 조회한다', async () => {
  global.fetch = jest.fn().mockResolvedValue({
    ok: true,
    status: 200,
    json: async () => ({ isVerified: false, history: [] }),
  });

  await expect(getResidenceVerification()).resolves.toEqual({ isVerified: false, history: [] });
  expect(global.fetch).toHaveBeenCalledWith('https://www.sibang.site/api/residence-verifications', expect.objectContaining({ method: 'GET' }));
});

test('주민등록초본 PDF를 multipart file로 업로드한다', async () => {
  const file = new File(['resident document'], 'resident.pdf', { type: 'application/pdf' });
  global.fetch = jest.fn().mockResolvedValue({
    ok: true,
    status: 201,
    json: async () => ({ status: 'SUBMITTED' }),
  });

  await uploadResidenceVerification(file);

  const [, options] = global.fetch.mock.calls[0];
  expect(global.fetch).toHaveBeenCalledWith('https://www.sibang.site/api/residence-verifications', expect.objectContaining({ method: 'POST' }));
  expect(options.body).toBeInstanceOf(FormData);
  expect(options.body.get('file')).toBe(file);
});

test('실거주 인증을 나중에 할 때 PATCH API를 호출한다', async () => {
  global.fetch = jest.fn().mockResolvedValue({
    ok: true,
    status: 204,
    text: async () => '',
  });

  await expect(deferResidenceVerification()).resolves.toBeNull();
  expect(global.fetch).toHaveBeenCalledWith(
    'https://www.sibang.site/api/residence-verifications/defer',
    expect.objectContaining({ method: 'PATCH' }),
  );
});

test('실거주 인증 응답의 상태와 주소 이력을 화면용 데이터로 변환한다', () => {
  expect(normalizeResidenceVerification({
    status: 'COMPLETED',
    uploadedAt: '2026-07-31T23:59:59.307511',
    error: null,
    addresses: [{
      id: 1,
      rawAddress: '서울특별시 동대문구 회기동 62-8 제502호',
      roadAddress: '서울특별시 동대문구 회기로18길 46 제502호',
      current: true,
      residenceYears: ['2007', '2009'],
      matchStatus: 'MATCHED',
      houseId: 12,
    }],
  })).toMatchObject({
    status: 'COMPLETED',
    uploadedAt: '2026-07-31T23:59:59.307511',
    isVerified: true,
    history: [{
      address: '서울특별시 동대문구 회기로18길 46 제502호',
      period: '2007 · 2009',
      current: true,
      matchStatus: 'MATCHED',
      houseId: 12,
    }],
  });
});

test('내 정보 API에서 수업 건물, 예산, 계약 유형, 알림 설정을 조회한다', async () => {
  global.fetch = jest.fn().mockResolvedValue({
    ok: true,
    status: 200,
    json: async () => ({
      id: 4,
      loginId: 'kakao_5004018154',
      username: '김정묵',
      department: null,
      preferredSchoolBuildingId: 3,
      preferredDeposit: 15000,
      budget: 80,
      prefersMonthlyRent: true,
      prefersJeonse: true,
      notificationEnabled: true,
      role: 'USER',
    }),
  });

  const profile = await getUserProfile();

  expect(global.fetch).toHaveBeenCalledWith('https://www.sibang.site/api/users/me', expect.objectContaining({ method: 'GET' }));
  expect(profile).toMatchObject({
    username: '김정묵',
    classBuildingIds: ['3'],
    primaryClassBuildingId: '3',
    maxDeposit: 15000,
    maxMonthlyRent: 80,
    leaseTypes: ['MONTHLY', 'JEONSE'],
    conditionListingAlert: true,
    wishPriceChangeAlert: true,
    budgetConfigured: true,
  });
});

test('내 정보 API의 userId를 화면용 id로 정규화한다', async () => {
  global.fetch = jest.fn().mockResolvedValue({
    ok: true,
    status: 200,
    json: async () => ({ userId: 4, username: '김정묵' }),
  });

  await expect(getUserProfile()).resolves.toMatchObject({
    id: 4,
    userId: 4,
    username: '김정묵',
  });
});

test('내 정보 API의 null 설정값은 온보딩 판정을 위해 그대로 유지한다', async () => {
  global.fetch = jest.fn().mockResolvedValue({
    ok: true,
    status: 200,
    json: async () => ({
      id: 4,
      username: '김정묵',
      preferredSchoolBuildingId: null,
      preferredDeposit: null,
      budget: null,
      prefersMonthlyRent: null,
      prefersJeonse: null,
      notificationEnabled: null,
    }),
  });

  await expect(getUserProfile()).resolves.toMatchObject({
    classBuildingIds: [],
    primaryClassBuildingId: null,
    maxDeposit: null,
    maxMonthlyRent: null,
    leaseTypes: [],
    budgetConfigured: false,
  });
});

test('1순위 수업 건물만 preferredSchoolBuildingId로 저장한다', async () => {
  global.fetch = jest.fn().mockResolvedValue({
    ok: true,
    status: 200,
    json: async () => ({ preferredSchoolBuildingId: 14 }),
  });

  await updateUserPreferences({
    classBuildingIds: ['14', '10'],
    primaryClassBuildingId: '14',
    secondaryClassBuildingId: '10',
    hasSecondaryClassBuilding: true,
  });

  expect(global.fetch).toHaveBeenCalledWith(
    'https://www.sibang.site/api/users/me',
    expect.objectContaining({
      method: 'PATCH',
      body: JSON.stringify({ preferredSchoolBuildingId: 14 }),
    }),
  );
});

test('월세만 선택하면 보증금과 월세를 저장하고 전세금은 비운다', async () => {
  global.fetch = jest.fn().mockResolvedValue({
    ok: true,
    status: 200,
    json: async () => ({}),
  });

  await updateUserPreferences({
    leaseTypes: ['MONTHLY'],
    maxDeposit: 1000,
    maxMonthlyRent: 50,
  });

  expect(global.fetch).toHaveBeenCalledWith(
    'https://www.sibang.site/api/users/me',
    expect.objectContaining({
      method: 'PATCH',
      body: JSON.stringify({
        preferredDeposit: 1000,
        preferredMonthlyRent: 50,
        preferredJeonse: null,
      }),
    }),
  );
});

test('월세와 전세를 모두 선택하면 보증금, 월세, 전세금을 함께 저장한다', async () => {
  global.fetch = jest.fn().mockResolvedValue({
    ok: true,
    status: 200,
    json: async () => ({}),
  });

  await updateUserPreferences({
    leaseTypes: ['MONTHLY', 'JEONSE'],
    maxDeposit: 15000,
    maxMonthlyRent: 70,
    maxJeonse: 20000,
  });

  expect(global.fetch).toHaveBeenCalledWith(
    'https://www.sibang.site/api/users/me',
    expect.objectContaining({
      method: 'PATCH',
      body: JSON.stringify({
        preferredDeposit: 15000,
        preferredMonthlyRent: 70,
        preferredJeonse: 20000,
      }),
    }),
  );
});
