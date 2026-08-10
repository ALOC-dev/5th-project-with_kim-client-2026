import { getInfrastructuresByCategory } from './infrastructureService';

test('카테고리별 인프라를 조회한다', async () => {
  const infrastructures = [{ infrastructureId: 1366, category: 'CCTV', latitude: 37.5759, longitude: 127.029 }];
  global.fetch = jest.fn().mockResolvedValue({
    ok: true,
    status: 200,
    json: async () => infrastructures,
  });

  await expect(getInfrastructuresByCategory('CCTV')).resolves.toEqual(infrastructures);
  expect(global.fetch).toHaveBeenCalledWith(
    'https://www.sibang.site/api/infrastructures/category/CCTV',
    expect.objectContaining({ method: 'GET' }),
  );
});

test('감싸진 인프라 응답도 배열로 정규화한다', async () => {
  const infrastructures = [{ infrastructureId: 1367, category: 'CCTV' }];
  global.fetch = jest.fn().mockResolvedValue({
    ok: true,
    status: 200,
    json: async () => ({ data: infrastructures }),
  });

  await expect(getInfrastructuresByCategory('CCTV')).resolves.toEqual(infrastructures);
});
