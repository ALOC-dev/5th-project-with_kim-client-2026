import { getResidenceVerification, getUserProfile } from './userService';

test('실거주 인증 API가 연결되기 전에는 인증 완료 상태를 임의로 반환하지 않는다', async () => {
  await expect(getResidenceVerification()).resolves.toBeNull();
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
