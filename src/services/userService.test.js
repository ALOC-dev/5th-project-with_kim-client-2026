import { deferResidenceVerification, getResidenceVerification, getUserProfile, normalizeResidenceVerification, uploadResidenceVerification } from './userService';

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
      classBuildingIds: ['it', 'science'],
      maxDeposit: 2000,
      maxMonthlyRent: 60,
      leaseTypes: ['MONTHLY', 'JEONSE'],
      notifications: {
        conditionListingAlert: true,
        wishPriceChangeAlert: false,
      },
    }),
  });

  const profile = await getUserProfile();

  expect(global.fetch).toHaveBeenCalledWith('https://www.sibang.site/api/auth/my', expect.objectContaining({ method: 'GET' }));
  expect(profile).toMatchObject({
    classBuildingIds: ['it', 'science'],
    primaryClassBuildingId: 'it',
    secondaryClassBuildingId: 'science',
    maxDeposit: 2000,
    maxMonthlyRent: 60,
    leaseTypes: ['MONTHLY', 'JEONSE'],
    conditionListingAlert: true,
    wishPriceChangeAlert: false,
  });
});
