import { getResidenceVerification } from './userService';

test('실거주 인증 API가 연결되기 전에는 인증 완료 상태를 임의로 반환하지 않는다', async () => {
  await expect(getResidenceVerification()).resolves.toBeNull();
});
