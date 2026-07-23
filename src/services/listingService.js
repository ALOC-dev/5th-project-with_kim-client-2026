import { apiRequest } from './apiClient';

const fallbackPositions = [
  { left: '30%', top: '28%' }, { left: '57%', top: '50%' }, { left: '24%', top: '56%' },
  { left: '40%', top: '18%' }, { left: '67%', top: '68%' },
];

const contractTypeLabels = { MONTHLY: '월세', MONTHLY_RENT: '월세', JEONSE: '전세', SALE: '매매' };

function formatPrice(value) {
  return value === null || value === undefined ? '-' : Number(value).toLocaleString('ko-KR');
}

export function mapHouseToListing(house, index = 0) {
  const dealType = contractTypeLabels[house.contractType] || house.contractType || '매물';
  const houseId = house.houseId ?? house.id;
  return {
    id: String(houseId),
    title: house.address || `매물 ${houseId}`,
    summary: house.description || '등록된 매물 설명이 없습니다.',
    dealType,
    deposit: formatPrice(house.deposit),
    rent: house.monthlyRent ? formatPrice(house.monthlyRent) : null,
    address: house.address || '주소 정보 없음',
    walkingMinutes: null,
    distance: null,
    position: fallbackPositions[index % fallbackPositions.length],
    safetyScore: 0,
    marketDiff: '미분석',
    marketPrice: '정보 없음',
    area: house.area ? `${house.area}㎡` : '정보 없음',
    supplyArea: house.area ? `${house.area}㎡` : '정보 없음',
    floor: house.floor ? `${house.floor}층` : '정보 없음',
    maintenance: house.managementFee ? `월 ${formatPrice(house.managementFee)}원` : '정보 없음',
    buildingType: `${dealType} · 방 ${house.roomNumber || '-'}개`,
    features: [house.direction, house.toilet ? `화장실 ${house.toilet}개` : null].filter(Boolean),
    reviews: 0,
    rating: 0,
    agent: { name: '정보 없음', office: '등록된 중개사 정보 없음', license: '' },
    risk: { level: '미확인', mortgage: '미확인', ratio: '미확인', lh: '미확인', hug: '미확인' },
    imageUrls: house.imageUrls || [],
    latitude: house.latitude,
    longitude: house.longitude,
  };
}

export async function getListings(filters = {}) {
  const params = new URLSearchParams({ page: '0', size: '20' });
  if (filters.dealType === '월세') params.set('contractType', 'MONTHLY');
  if (filters.dealType === '전세') params.set('contractType', 'JEONSE');

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
