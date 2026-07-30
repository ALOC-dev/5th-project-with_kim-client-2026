import { applyRegistrySubmissionToListing, buildHouseSearchParams, buildRegistrySubmissionMetadata, getListingDetail, getListings, getRegistrySubmission, isRegistrySubmissionPending, pollRegistrySubmission, shouldRefreshListingAfterRegistrySubmission, uploadRegistryDocument } from './listingService';

test('loads the first 30 houses through the deployed house search API', async () => {
  global.fetch = jest.fn().mockResolvedValue({
    ok: true,
    status: 200,
    json: async () => ({ content: [{ houseId: 1, address: '서울특별시 동대문구 전농동', deposit: 5000000, monthlyRent: 550000, managementFee: 60000, contractType: 'MONTHLY', direction: 'SOUTH', roomNumber: 1, area: 24.2, floor: 3 }] }),
  });

  const listings = await getListings();

  expect(global.fetch).toHaveBeenCalledWith('https://www.sibang.site/api/houses/search?page=0&size=30', expect.objectContaining({ method: 'GET' }));
  expect(listings).toHaveLength(1);
  expect(listings[0]).toMatchObject({ id: '1', dealType: '월세', deposit: '500', rent: '55', area: '24.2㎡', floor: '3층', roomType: '원룸', direction: '남향', maintenance: '월 6만원', features: ['남향'] });
});

test('converts visible filter values into house search query parameters', () => {
  const params = buildHouseSearchParams({
    dealType: '월세', depositLimit: 1000, rentLimit: 60, roomType: '원룸', options: { parking: true },
  });

  expect(params.toString()).toBe('page=0&size=30&contractType=MONTHLY&maxDeposit=10000000&maxMonthlyRent=600000&minRoomNumber=1&maxRoomNumber=1&minParking=1');
});

test('loads a selected listing through its house detail endpoint', async () => {
  global.fetch = jest.fn().mockResolvedValue({
    ok: true,
    status: 200,
    json: async () => ({
      houseId: 7,
      address: '서울 동대문구 휘경동 43-12',
      deposit: 10000000,
      monthlyRent: 700000,
      contractType: 'MONTHLY',
      analysisStatus: 'COMPLETE',
      riskScore: 47,
      riskLevel: 'WARNING',
      mortgageTotal: 54000000,
      jeonseRate: 58.31,
      lhEligible: true,
      hugEligible: false,
      metadata: { restaurantCount: 12 },
      imageUrls: [],
    }),
  });

  const listing = await getListingDetail('7');

  expect(global.fetch).toHaveBeenCalledWith('https://www.sibang.site/api/houses/7', expect.objectContaining({ method: 'GET' }));
  expect(listing).toMatchObject({
    id: '7',
    deposit: '1,000',
    rent: '70',
    safetyScore: 47,
    registryUpload: { status: 'ANALYZED' },
    risk: {
      level: '주의',
      mortgage: '5,400만원',
      ratio: '58.31%',
      lh: '가능',
      hug: '불가',
    },
  });
});

test('applies analyzed registry submission values to a listing', () => {
  const listing = {
    id: '7',
    title: '서울 동대문구 휘경동 43-12',
    safetyScore: null,
    risk: { level: '미확인', mortgage: '미확인', ratio: '미확인', lh: '미확인', hug: '미확인' },
  };
  const submission = {
    submissionId: 'sub_123',
    status: 'ANALYZED',
    riskLevel: 'WARNING',
    riskScore: 47,
    analysis: {
      mortgageTotal: 54000000,
      jeonseRate: 58.31,
      lhEligible: true,
      hugEligible: false,
    },
  };

  expect(applyRegistrySubmissionToListing(listing, submission)).toMatchObject({
    id: '7',
    safetyScore: 47,
    registryUpload: submission,
    risk: {
      level: '주의',
      mortgage: '5,400만원',
      ratio: '58.31%',
      lh: '가능',
      hug: '불가',
    },
  });
});

test('derives five risk levels from the registry risk score', () => {
  const listing = { id: '7', risk: { level: '미확인' } };

  expect(applyRegistrySubmissionToListing(listing, { status: 'ANALYZED', riskScore: 10, analysis: {} }).risk.level).toBe('매우 위험');
  expect(applyRegistrySubmissionToListing(listing, { status: 'ANALYZED', riskScore: 30, analysis: {} }).risk.level).toBe('위험');
  expect(applyRegistrySubmissionToListing(listing, { status: 'ANALYZED', riskScore: 50, analysis: {} }).risk.level).toBe('주의');
  expect(applyRegistrySubmissionToListing(listing, { status: 'ANALYZED', riskScore: 70, analysis: {} }).risk.level).toBe('양호');
  expect(applyRegistrySubmissionToListing(listing, { status: 'ANALYZED', riskScore: 90, analysis: {} }).risk.level).toBe('안전');
});

test('builds registry submission metadata from the selected listing and logged-in user', () => {
  const metadata = buildRegistrySubmissionMetadata(
    { id: '7', houseId: '7', address: '서울 동대문구 전농동 295-1', deposit: '500', depositAmount: 5000000, contractType: 'MONTHLY' },
    '3',
    { ownerName: '김철수' },
  );

  expect(metadata).toEqual({
    ownerName: '김철수',
    owner: '김철수',
    tenantName: '김정묵',
    address: '서울 동대문구 전농동 295-1',
    houseId: '7',
    userId: '3',
    deposit: 5000000,
    leaseType: 'WOLSE',
  });
});

test('builds registry submission lease type as JEONSE from jeonse contract type', () => {
  const metadata = buildRegistrySubmissionMetadata(
    { id: '8', address: '서울 동대문구 전농동 583-2', deposit: '13,000', contractType: 'JEONSE' },
    '4',
    { owner: '박철수' },
  );

  expect(metadata.leaseType).toBe('JEONSE');
});

test('builds registry submission deposit from visible manwon value when raw deposit is missing', () => {
  const metadata = buildRegistrySubmissionMetadata(
    { id: '8', address: '서울 동대문구 전농동 583-2', deposit: '13,000' },
    '4',
    { owner: '박철수' },
  );

  expect(metadata.deposit).toBe(130000000);
  expect(metadata.owner).toBe('박철수');
});

test('submits registry analysis as multipart form data', async () => {
  localStorage.setItem('sibang.accessToken', 'access-token');
  localStorage.setItem('sibang.tokenType', 'Bearer');
  const pdf = new File(['registry'], 'registry.pdf', { type: 'application/pdf' });
  global.fetch = jest.fn().mockResolvedValue({
    ok: true,
    status: 200,
    json: async () => ({ submissionId: 9, status: 'SUBMITTED' }),
  });

  const response = await uploadRegistryDocument('7', pdf, {
    owner: '김철수',
    tenantName: '김정묵',
    address: '서울 동대문구 전농동 295-1',
    houseId: '7',
    userId: '3',
    deposit: 5000000,
    leaseType: 'WOLSE',
    publicPrice: 10000,
    price: 20000,
  });

  const [, request] = global.fetch.mock.calls[0];
  expect(global.fetch).toHaveBeenCalledWith('https://www.sibang.site/api/submissions', expect.objectContaining({ method: 'POST' }));
  expect(request.headers).toMatchObject({ Accept: 'application/json', Authorization: 'Bearer access-token' });
  expect(request.headers).not.toHaveProperty('Content-Type');
  expect(request.body.get('file')).toBe(pdf);
  expect(request.body.get('owner')).toBe('김철수');
  expect(request.body.get('tenantName')).toBe('김정묵');
  expect(request.body.get('address')).toBe('서울 동대문구 전농동 295-1');
  expect(request.body.get('houseId')).toBe('7');
  expect(request.body.get('userId')).toBe('3');
  expect(request.body.get('deposit')).toBe('5000000');
  expect(request.body.get('leaseType')).toBe('WOLSE');
  expect(request.body.get('publicPrice')).toBe('10000');
  expect(request.body.get('price')).toBe('20000');
  expect(response).toEqual({ submissionId: 9, status: 'SUBMITTED' });
});

test('loads registry analysis submission status by submission id', async () => {
  global.fetch = jest.fn().mockResolvedValue({
    ok: true,
    status: 200,
    json: async () => ({ submissionId: 'sub_123', status: 'QUEUED', analysis: null }),
  });

  const submission = await getRegistrySubmission('sub_123');

  expect(global.fetch).toHaveBeenCalledWith('https://www.sibang.site/api/submissions/sub_123', expect.objectContaining({ method: 'GET' }));
  expect(submission).toEqual({ submissionId: 'sub_123', status: 'QUEUED', analysis: null });
});

test('recognizes only waiting statuses as pending registry submissions', () => {
  expect(isRegistrySubmissionPending({ status: 'QUEUED' })).toBe(true);
  expect(isRegistrySubmissionPending({ status: 'PROCESSING' })).toBe(true);
  expect(isRegistrySubmissionPending({ status: 'ANALYZED' })).toBe(false);
  expect(isRegistrySubmissionPending({ status: 'NEEDS_MORE_DOCS' })).toBe(false);
});

test('refreshes listing after any non-waiting registry submission status', () => {
  expect(shouldRefreshListingAfterRegistrySubmission({ status: 'QUEUED' })).toBe(false);
  expect(shouldRefreshListingAfterRegistrySubmission({ status: 'SUBMITTED' })).toBe(false);
  expect(shouldRefreshListingAfterRegistrySubmission({ status: 'ANALYZED' })).toBe(true);
  expect(shouldRefreshListingAfterRegistrySubmission({ status: 'NEEDS_MORE_DOCS' })).toBe(true);
  expect(shouldRefreshListingAfterRegistrySubmission({ status: 'FAILED' })).toBe(true);
});

test('polls registry submission status until the analysis is complete', async () => {
  global.fetch = jest.fn()
    .mockResolvedValueOnce({ ok: true, status: 200, json: async () => ({ submissionId: 'sub_123', status: 'QUEUED', analysis: null }) })
    .mockResolvedValueOnce({ ok: true, status: 200, json: async () => ({ submissionId: 'sub_123', status: 'ANALYZED', analysis: { riskLevel: 'SAFE' } }) });

  const submission = await pollRegistrySubmission('sub_123', { intervalMs: 0, maxAttempts: 3 });

  expect(global.fetch).toHaveBeenCalledTimes(2);
  expect(submission).toEqual({ submissionId: 'sub_123', status: 'ANALYZED', analysis: { riskLevel: 'SAFE' } });
});

test('polls registry submission status every 10 seconds by default', async () => {
  const originalSetTimeout = global.setTimeout;
  global.setTimeout = jest.fn((callback) => {
    callback();
    return 1;
  });
  global.fetch = jest.fn()
    .mockResolvedValueOnce({ ok: true, status: 200, json: async () => ({ submissionId: 'sub_123', status: 'QUEUED', analysis: null }) })
    .mockResolvedValueOnce({ ok: true, status: 200, json: async () => ({ submissionId: 'sub_123', status: 'ANALYZED', analysis: { riskLevel: 'SAFE' } }) });

  try {
    await pollRegistrySubmission('sub_123', { maxAttempts: 2 });
    expect(global.setTimeout).toHaveBeenCalledWith(expect.any(Function), 10000);
  } finally {
    global.setTimeout = originalSetTimeout;
  }
});
