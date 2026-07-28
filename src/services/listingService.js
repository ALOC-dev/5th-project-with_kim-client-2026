import { apiRequest } from './apiClient';

const fallbackPositions = [
  { left: '30%', top: '28%' }, { left: '57%', top: '50%' }, { left: '24%', top: '56%' },
  { left: '40%', top: '18%' }, { left: '67%', top: '68%' },
];

const contractTypeLabels = { MONTHLY: '월세', MONTHLY_RENT: '월세', JEONSE: '전세', SALE: '매매' };
const directionLabels = { NORTH: '북향', SOUTH: '남향', EAST: '동향', WEST: '서향' };
const searchContractTypes = { 월세: 'MONTHLY', 전세: 'JEONSE' };

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
  return {
    id: String(houseId),
    buildingId: house.buildingId ?? null,
    title: house.address || `매물 ${houseId}`,
    summary: house.description || '등록된 매물 설명이 없습니다.',
    dealType,
    deposit: formatAmountInManwon(house.deposit) || '정보 없음',
    rent: formatAmountInManwon(house.monthlyRent),
    address: house.address || '주소 정보 없음',
    walkingMinutes: null,
    distance: null,
    position: fallbackPositions[index % fallbackPositions.length],
    safetyScore: null,
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
    features: [direction, house.toilet ? `화장실 ${house.toilet}개` : null].filter(Boolean),
    reviews: 0,
    rating: 0,
    agent: { name: '정보 없음', office: '등록된 중개사 정보 없음', license: '' },
    risk: { level: '미확인', mortgage: '미확인', ratio: '미확인', lh: '미확인', hug: '미확인' },
    imageUrls: house.imageUrls || [],
    latitude: house.latitude,
    longitude: house.longitude,
  };
}

function appendManwonPrice(params, key, amount) {
  if (Number.isFinite(amount)) params.set(key, String(amount * 10000));
}

export function buildHouseSearchParams(filters = {}) {
  const params = new URLSearchParams({ page: '0', size: '30' });

  if (searchContractTypes[filters.dealType]) params.set('contractType', searchContractTypes[filters.dealType]);
  appendManwonPrice(params, 'maxDeposit', filters.depositLimit);
  appendManwonPrice(params, 'maxMonthlyRent', filters.rentLimit);

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

export async function getListings(filters = {}) {
  const params = buildHouseSearchParams(filters);
  const response = await apiRequest(`/api/houses/search?${params}`);
  return (response.content || []).map(mapHouseToListing);
}

export async function getListingDetail(listingId) {
  const response = await apiRequest(`/api/houses/${listingId}`);
  return mapHouseToListing(response);
}

export async function toggleFavorite(listingId, isFavorite) {
  if (isFavorite) return apiRequest(`/api/wishlist/${listingId}`, { method: 'POST' });
  return apiRequest(`/api/wishlist/${listingId}`, { method: 'DELETE' });
}

export async function getMyWishList() {
  return apiRequest('/api/wishlist/my');
}

export async function submitInquiry(listingId, message) {
  // TODO: API 연동 필요 - POST '-'
  // 설명: 매물 담당자에게 보낼 문의 내용과 문의 생성 결과를 기대합니다.
  return Promise.resolve({ listingId, message });
}

export async function uploadRegistryDocument(listingId, file) {
  // TODO: API 연동 필요 - POST '-'
  // 설명: 매물 ID와 등기부등본 파일을 multipart/form-data로 전송하고 위험도 분석 완료 상태를 기대합니다.
  return Promise.resolve({ listingId, fileName: file.name, status: 'completed' });
}
