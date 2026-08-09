import {
  clearListingMemoryCache,
  loadListingDetailWithCache,
  loadListingSearchWithCache,
  readListingDetailCache,
  readListingSearchCache,
  writeListingDetailCache,
} from './listingMemoryCache';

beforeEach(() => {
  clearListingMemoryCache();
});

test('같은 검색 키는 성공한 결과를 다시 요청하지 않는다', async () => {
  const loader = jest.fn().mockResolvedValue([{ id: '1' }]);

  await loadListingSearchWithCache('search-a', loader);
  await expect(loadListingSearchWithCache('search-a', loader)).resolves.toEqual([{ id: '1' }]);

  expect(loader).toHaveBeenCalledTimes(1);
  expect(readListingSearchCache('search-a')).toEqual([{ id: '1' }]);
});

test('동시에 같은 검색 키를 요청하면 진행 중인 요청을 공유한다', async () => {
  let resolveLoader;
  const loader = jest.fn().mockReturnValue(new Promise((resolve) => {
    resolveLoader = resolve;
  }));

  const firstRequest = loadListingSearchWithCache('search-a', loader);
  const secondRequest = loadListingSearchWithCache('search-a', loader);
  resolveLoader([{ id: '1' }]);

  await expect(Promise.all([firstRequest, secondRequest])).resolves.toEqual([[{ id: '1' }], [{ id: '1' }]]);
  expect(loader).toHaveBeenCalledTimes(1);
});

test('서로 다른 검색 키는 별도로 캐시한다', async () => {
  const loader = jest.fn((key) => Promise.resolve([{ id: key }]));

  await expect(loadListingSearchWithCache('search-a', () => loader('search-a'))).resolves.toEqual([{ id: 'search-a' }]);
  await expect(loadListingSearchWithCache('search-b', () => loader('search-b'))).resolves.toEqual([{ id: 'search-b' }]);

  expect(loader).toHaveBeenCalledTimes(2);
  expect(readListingSearchCache('search-a')).toEqual([{ id: 'search-a' }]);
  expect(readListingSearchCache('search-b')).toEqual([{ id: 'search-b' }]);
});

test('같은 상세 키는 성공한 결과를 다시 요청하지 않는다', async () => {
  const loader = jest.fn().mockResolvedValue({ id: '1', title: '상세' });

  await loadListingDetailWithCache('1', loader);
  await expect(loadListingDetailWithCache(1, loader)).resolves.toMatchObject({ id: '1', title: '상세' });

  expect(loader).toHaveBeenCalledTimes(1);
  expect(readListingDetailCache(1)).toMatchObject({ id: '1', title: '상세' });
});

test('상세 목록을 명시적으로 캐시한다', () => {
  const listing = { id: 7, title: '명시적 캐시' };

  writeListingDetailCache(listing);

  expect(readListingDetailCache('7')).toBe(listing);
});

test('실패한 상세 요청은 다음 호출에서 다시 시도한다', async () => {
  const loader = jest.fn()
    .mockRejectedValueOnce(new Error('failed'))
    .mockResolvedValueOnce({ id: '1', title: '상세' });

  await expect(loadListingDetailWithCache('1', loader)).rejects.toThrow('failed');
  await expect(loadListingDetailWithCache('1', loader)).resolves.toMatchObject({ id: '1' });

  expect(loader).toHaveBeenCalledTimes(2);
});
