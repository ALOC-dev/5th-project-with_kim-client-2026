import { apiRequest } from './apiClient';
import { getCurrentUsername } from './authService';

const fallbackPositions = [
  { left: '30%', top: '28%' }, { left: '57%', top: '50%' }, { left: '24%', top: '56%' },
  { left: '40%', top: '18%' }, { left: '67%', top: '68%' },
];

const contractTypeLabels = { MONTHLY: '월세', MONTHLY_RENT: '월세', JEONSE: '전세', SALE: '매매' };
const directionLabels = { NORTH: '북향', SOUTH: '남향', EAST: '동향', WEST: '서향' };
const searchContractTypes = { 월세: 'MONTHLY', 전세: 'JEONSE' };
const defaultHouseSearchArea = {
  centerLat: '37.583866',
  centerLng: '127.058777',
  radius: '1000',
};
const unrestrictedHouseSearchLimits = {
  deposit: 30000,
  monthlyRent: 100,
};
const registryLeaseTypes = { MONTHLY: 'WOLSE', MONTHLY_RENT: 'WOLSE', WOLSE: 'WOLSE', JEONSE: 'JEONSE', 전세: 'JEONSE', 월세: 'WOLSE' };
const pendingRegistrySubmissionStatuses = new Set(['QUEUED', 'PROCESSING', 'PENDING', 'IN_PROGRESS', 'SUBMITTED']);
const houseAnalysisStatusLabels = { COMPLETE: 'ANALYZED', COMPLETED: 'ANALYZED', ANALYZED: 'ANALYZED' };
const riskLevelLabels = { SAFE: '안전', LOW: '안전', WARNING: '주의', CAUTION: '주의', MEDIUM: '주의', DANGER: '위험', HIGH: '위험', RISK: '위험' };

function getRoomType(roomNumber) {
  if (roomNumber === null || roomNumber === undefined) return '정보 없음';
  return { 1: '원룸', 2: '투룸', 3: '쓰리룸' }[roomNumber] || `${roomNumber}룸`;
}

function formatAmountInManwon(value) {
  if (value === null || value === undefined) return null;
  const amount = Number(value);
  if (Number.isNaN(amount)) return null;

  // The houses API returns all monetary amounts in won.
  const manwon = amount / 10000;
  return Number.isInteger(manwon) ? manwon.toLocaleString('ko-KR') : manwon.toFixed(1);
}

export function mapHouseToListing(house, index = 0) {
  const dealType = contractTypeLabels[house.contractType] || house.contractType || '매물';
  const houseId = house.houseId ?? house.id;
  const roomType = getRoomType(house.roomNumber);
  const direction = directionLabels[house.direction] || house.direction || '정보 없음';
  const registryUpload = buildRegistryUploadFromHouse(house);
  const riskScore = firstFiniteNumber(house.riskScore);
  // TODO: 실제 시세·치안 점수 응답이 연결되면 임시 기본값을 제거합니다.
  const marketSafetyScore = firstFiniteNumber(house.marketSafetyScore, house.marketScore) ?? 5;
  const securitySafetyScore = firstFiniteNumber(house.securitySafetyScore, house.securityScore, house.crimeScore) ?? 5;
  const isJeonse = house.contractType === 'JEONSE';
  const depositAmount = house.deposit ?? (isJeonse ? house.price : null);
  const monthlyRentAmount = house.monthlyRent ?? (!isJeonse ? house.price : null);

  return {
    id: String(houseId),
    buildingId: house.buildingId ?? null,
    houseId: String(houseId),
    title: house.address || `매물 ${houseId}`,
    summary: house.description || '등록된 매물 설명이 없습니다.',
    dealType,
    contractType: house.contractType ?? null,
    depositAmount,
    deposit: formatAmountInManwon(depositAmount) || '정보 없음',
    rent: formatAmountInManwon(monthlyRentAmount),
    address: house.address || '주소 정보 없음',
    walkingMinutes: house.campusWalkMinutes ?? null,
    distance: house.campusDistanceMeters ?? null,
    position: fallbackPositions[index % fallbackPositions.length],
    safetyScore: riskScore ?? null,
    marketSafetyScore,
    securitySafetyScore,
    marketDiff: '정보 없음',
    marketPrice: formatAmountInManwon(house.price) ? `${formatAmountInManwon(house.price)}만원` : '정보 없음',
    area: house.area ? `${house.area}㎡` : '정보 없음',
    supplyArea: house.area ? `${house.area}㎡` : '정보 없음',
    floor: house.floor ? `${house.floor}층` : '정보 없음',
    maintenance: formatAmountInManwon(house.managementFee) ? `월 ${formatAmountInManwon(house.managementFee)}만원` : '정보 없음',
    buildingType: roomType,
    roomNumber: house.roomNumber ?? null,
    roomType,
    direction,
    metadata: house.metadata ?? null,
    facilities: house.facilities ?? house.nearbyFacilities ?? house.metadata?.facilities ?? [],
    features: [direction, house.toilet ? `화장실 ${house.toilet}개` : null].filter(Boolean),
    reviews: 0,
    rating: 0,
    agent: { name: '정보 없음', office: '등록된 중개사 정보 없음', license: '' },
    risk: buildRiskSummary(house, riskScore),
    registryUpload,
    imageUrls: house.imageUrls || [],
    latitude: house.latitude,
    longitude: house.longitude,
  };
}

function buildRegistryUploadFromHouse(house) {
  if (!house.analysisStatus) return undefined;
  const status = String(house.analysisStatus).toUpperCase();
  return {
    status: houseAnalysisStatusLabels[status] || status,
  };
}

export function applyRegistrySubmissionToListing(listing, submission) {
  if (!listing || !submission) return listing;
  const analysis = submission.analysis || {};
  const riskScore = firstFiniteNumber(submission.riskScore, analysis.riskScore);
  const riskSource = {
    ...analysis,
    riskLevel: submission.riskLevel ?? analysis.riskLevel,
  };

  return {
    ...listing,
    safetyScore: riskScore ?? listing.safetyScore,
    registryUpload: submission,
    risk: {
      ...listing.risk,
      ...buildRiskSummary(riskSource, riskScore),
    },
  };
}

function buildRiskSummary(source = {}, riskScore) {
  return {
    level: formatRiskLevel(source.riskLevel, riskScore),
    mortgage: formatMortgageTotal(source.mortgageTotal),
    ratio: formatRatio(source.jeonseRate),
    lh: formatEligibility(source.lhEligible),
    hug: formatEligibility(source.hugEligible),
  };
}

function firstFiniteNumber(...values) {
  for (const value of values) {
    const number = Number(value);
    if (Number.isFinite(number)) return number;
  }
  return undefined;
}

function formatRiskLevel(value, score) {
  const scoreLevel = formatRiskLevelByScore(score);
  if (scoreLevel) return scoreLevel;
  if (!value) return '미확인';
  return riskLevelLabels[String(value).toUpperCase()] || value;
}

function formatRiskLevelByScore(score) {
  const number = Number(score);
  if (!Number.isFinite(number)) return '';
  if (number < 20) return '매우 위험';
  if (number < 40) return '위험';
  if (number < 60) return '주의';
  if (number < 80) return '양호';
  return '안전';
}

function formatMortgageTotal(value) {
  if (value === null || value === undefined) return '미확인';
  const amount = Number(value);
  if (!Number.isFinite(amount)) return '미확인';
  if (amount <= 0) return '없음';
  const manwon = formatAmountInManwon(amount);
  return manwon ? `${manwon}만원` : '미확인';
}

function formatRatio(value) {
  if (value === null || value === undefined) return '미확인';
  const ratio = Number(value);
  if (!Number.isFinite(ratio)) return '미확인';
  return `${Number.isInteger(ratio) ? ratio : ratio.toFixed(2).replace(/0+$/, '').replace(/\.$/, '')}%`;
}

function formatEligibility(value) {
  if (value === true) return '가능';
  if (value === false) return '불가';
  return '미확인';
}

function appendManwonPrice(params, key, amount, unrestrictedLimit) {
  if (Number.isFinite(amount) && amount < unrestrictedLimit) {
    params.set(key, String(amount * 10000));
  }
}

export function buildHouseSearchParams(filters = {}, searchCenter = {}) {
  const latitude = Number(searchCenter.lat);
  const longitude = Number(searchCenter.lng);
  const searchArea = {
    centerLat: Number.isFinite(latitude) ? String(latitude) : defaultHouseSearchArea.centerLat,
    centerLng: Number.isFinite(longitude) ? String(longitude) : defaultHouseSearchArea.centerLng,
    radius: defaultHouseSearchArea.radius,
  };
  const params = new URLSearchParams(searchArea);
  const isMonthly = filters.dealType === '월세';
  const isJeonse = filters.dealType === '전세';
  const jeonseLimit = Number.isFinite(filters.jeonseLimit) ? filters.jeonseLimit : filters.depositLimit;

  if (searchContractTypes[filters.dealType]) params.set('contractType', searchContractTypes[filters.dealType]);
  if (isMonthly) appendManwonPrice(params, 'maxDeposit', filters.depositLimit, unrestrictedHouseSearchLimits.deposit);
  if (isJeonse) appendManwonPrice(params, 'maxDeposit', jeonseLimit, unrestrictedHouseSearchLimits.deposit);
  if (!isJeonse) appendManwonPrice(params, 'maxMonthlyRent', filters.rentLimit, unrestrictedHouseSearchLimits.monthlyRent);

  if (filters.roomType === '원룸') {
    params.set('minRoomNumber', '1');
    params.set('maxRoomNumber', '1');
  }
  if (filters.roomType === '투룸') {
    params.set('minRoomNumber', '2');
    params.set('maxRoomNumber', '2');
  }
  if (filters.options?.parking) params.set('minParking', '1');

  return params;
}

export async function getListings(filters = {}, searchCenter = {}) {
  const params = buildHouseSearchParams(filters, searchCenter);
  const response = await apiRequest(`/api/houses/search?${params}`);
  const houses = Array.isArray(response) ? response : response?.content || [];
  return houses.map(mapHouseToListing);
}

export async function searchHouses(query, topK = 5) {
  const response = await apiRequest('/api/houses/search', {
    method: 'POST',
    body: { query, topK },
  });
  const houses = Array.isArray(response) ? response : response?.content || response?.items || response?.data || [];
  return houses.map(mapHouseToListing);
}

export async function getListingDetail(listingId) {
  const response = await apiRequest(`/api/houses/${listingId}`);
  return mapHouseToListing(response);
}

export async function getSchoolDistances(listingId) {
  const response = await apiRequest(`/api/houses/${listingId}/school-distance`);
  return Array.isArray(response) ? response : [];
}

export function findSchoolDistanceByBuildingId(distances, buildingId) {
  if (!Array.isArray(distances) || buildingId === null || buildingId === undefined) return null;
  return distances.find((distance) => String(distance.schoolBuildingId) === String(buildingId)) || null;
}

export async function toggleFavorite(listingId, shouldFavorite) {
  if (shouldFavorite) return apiRequest(`/api/wishlist/${listingId}`, { method: 'POST' });
  return apiRequest(`/api/wishlist/${listingId}`, { method: 'DELETE' });
}

export async function getMyWishList() {
  const response = await apiRequest('/api/wishlist/my');
  const wishlistItems = normalizeWishListResponse(response);
  const listings = await Promise.all(wishlistItems.map(async (item, index) => {
    const house = getWishListHouse(item);
    if (hasHousePayload(house)) return mapHouseToListing(house, index);
    const houseId = getWishListHouseId(item);
    return houseId ? getListingDetail(houseId) : null;
  }));
  return listings.filter(Boolean);
}

function normalizeWishListResponse(response) {
  if (Array.isArray(response)) return response;
  if (Array.isArray(response?.content)) return response.content;
  if (Array.isArray(response?.items)) return response.items;
  if (Array.isArray(response?.data)) return response.data;
  return [];
}

function getWishListHouse(item) {
  return item?.house || item?.houseResponse || item?.houseDto || item;
}

function hasHousePayload(house) {
  return Boolean(house && typeof house === 'object' && (house.address || house.contractType || house.deposit !== undefined || house.monthlyRent !== undefined));
}

function getWishListHouseId(item) {
  if (typeof item === 'string' || typeof item === 'number') return item;
  return item?.houseId ?? item?.house?.houseId ?? item?.houseResponse?.houseId ?? item?.houseDto?.houseId ?? item?.id ?? null;
}

export async function submitInquiry(listingId, message) {
  // TODO: API 연동 필요 - POST '-'
  // 설명: 매물 담당자에게 보낼 문의 내용과 문의 생성 결과를 기대합니다.
  return Promise.resolve({ listingId, message });
}

export async function uploadRegistryDocument(listingId, file, metadata = {}) {
  const formData = new FormData();
  formData.append('file', file);
  appendFormValue(formData, 'owner', metadata.owner ?? metadata.ownerName);
  appendFormValue(formData, 'tenantName', metadata.tenantName);
  appendFormValue(formData, 'address', metadata.address);
  appendFormValue(formData, 'houseId', metadata.houseId ?? listingId);
  appendFormValue(formData, 'userId', metadata.userId);
  appendFormValue(formData, 'deposit', metadata.deposit);
  appendFormValue(formData, 'leaseType', metadata.leaseType);
  appendFormValue(formData, 'publicPrice', metadata.publicPrice);
  appendFormValue(formData, 'price', metadata.price);

  return apiRequest('/api/submissions', { method: 'POST', body: formData });
}

export async function getRegistrySubmission(submissionId) {
  return apiRequest(`/api/submissions/${encodeURIComponent(submissionId)}`);
}

export function isRegistrySubmissionPending(submission) {
  return pendingRegistrySubmissionStatuses.has(String(submission?.status || '').toUpperCase());
}

export function shouldRefreshListingAfterRegistrySubmission(submission) {
  return Boolean(submission) && !isRegistrySubmissionPending(submission);
}

export async function pollRegistrySubmission(submissionId, { intervalMs = 10000, maxAttempts = 30 } = {}) {
  let latestSubmission = null;

  for (let attempt = 0; attempt < maxAttempts; attempt += 1) {
    latestSubmission = await getRegistrySubmission(submissionId);
    if (!isRegistrySubmissionPending(latestSubmission)) return latestSubmission;
    if (attempt < maxAttempts - 1 && intervalMs > 0) await wait(intervalMs);
  }

  return latestSubmission;
}

export function buildRegistrySubmissionMetadata(listing, userId, metadata = {}) {
  const owner = metadata.owner ?? metadata.ownerName ?? '';
  const tenantName = metadata.tenantName ?? getCurrentUsername() ?? '';

  return {
    ...metadata,
    owner,
    tenantName,
    address: listing?.address || '',
    houseId: listing?.houseId || listing?.id || '',
    userId,
    deposit: listing?.depositAmount ?? parseManwonToWon(listing?.deposit),
    leaseType: resolveRegistryLeaseType(listing),
  };
}

function resolveRegistryLeaseType(listing) {
  const contractType = listing?.contractType || listing?.dealType;
  return registryLeaseTypes[contractType] ?? undefined;
}

function appendFormValue(formData, key, value) {
  if (value === undefined || value === null || value === '') return;
  formData.append(key, String(value));
}

function parseManwonToWon(value) {
  if (typeof value === 'number') return value * 10000;
  if (!value) return undefined;
  const amount = Number(String(value).replace(/,/g, '').replace(/만원/g, '').trim());
  return Number.isFinite(amount) && amount > 0 ? amount * 10000 : undefined;
}

function wait(ms) {
  return new Promise((resolve) => {
    setTimeout(resolve, ms);
  });
}
