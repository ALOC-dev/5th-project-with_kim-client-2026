import { mapHouseToListing } from '../services/listingService';

// Spring Boot GET /api/houses/{houseId} HouseResponse와 같은 구조의 임시 매물 응답입니다.
// TODO: API 연동 필요 - GET '-'
// 설명: houseId, buildingId, 주소, 가격, 면적, 계약 조건, 메타데이터와 이미지 URL을 포함하는 매물 상세 응답이 필요합니다.
export const mockHouseResponses = [
  {
    houseId: 1001, buildingId: 501, address: '서울특별시 동대문구 서울시립대로29길 42-4', price: null, deposit: 500, monthlyRent: 45,
    area: 23, roomNumber: 1, toilet: 1, managementFee: 5, contractType: 'MONTHLY', floor: 3, direction: 'SOUTH',
    description: '학교와 가까운 신축급 원룸입니다. 풀옵션과 남향 채광을 갖췄어요.',
    metadata: { martCount: 2, convenienceStoreCount: 4, parkingCount: 1, subwayCount: 1, bankCount: 2, POCount: 1, restaurantCount: 16, cafeCount: 9, hospitalCount: 2, pharmacyCount: 3 },
    imageUrls: [],
  },
  {
    houseId: 1002, buildingId: 502, address: '서울특별시 동대문구 이문동 330-14', price: null, deposit: 1000, monthlyRent: 50,
    area: 26, roomNumber: 1, toilet: 1, managementFee: 7, contractType: 'MONTHLY', floor: 4, direction: 'EAST',
    description: '조용한 주택가에 있는 분리형 원룸으로, 통학이 편리합니다.',
    metadata: { martCount: 1, convenienceStoreCount: 3, parkingCount: 1, subwayCount: 1, bankCount: 2, POCount: 1, restaurantCount: 12, cafeCount: 7, hospitalCount: 1, pharmacyCount: 2 },
    imageUrls: [],
  },
  {
    houseId: 1003, buildingId: 503, address: '서울특별시 동대문구 이문동 349-24', price: null, deposit: 12000, monthlyRent: null,
    area: 38, roomNumber: 2, toilet: 1, managementFee: 8, contractType: 'JEONSE', floor: 2, direction: 'SOUTH',
    description: '수납공간이 넉넉한 리모델링 투룸입니다. 실거주 학생 리뷰가 좋은 매물이에요.',
    metadata: { martCount: 2, convenienceStoreCount: 5, parkingCount: 1, subwayCount: 1, bankCount: 3, POCount: 1, restaurantCount: 18, cafeCount: 11, hospitalCount: 2, pharmacyCount: 3 },
    imageUrls: [],
  },
  {
    houseId: 1004, buildingId: 504, address: '서울특별시 동대문구 서울시립대로 112-1 501호', price: null, deposit: 300, monthlyRent: 40,
    area: 20, roomNumber: 1, toilet: 1, managementFee: 4, contractType: 'MONTHLY', floor: 5, direction: 'WEST',
    description: '대학가에 인접한 밝은 원룸입니다. 관리가 잘 되어 바로 입주할 수 있어요.',
    metadata: { martCount: 2, convenienceStoreCount: 4, parkingCount: 1, subwayCount: 1, bankCount: 2, POCount: 1, restaurantCount: 14, cafeCount: 8, hospitalCount: 2, pharmacyCount: 2 },
    imageUrls: [],
  },
];

const presentationDetails = [
  { title: '시립대 인근 신축 원룸', features: ['엘리베이터', 'CCTV', '풀옵션'], supplyArea: '31㎡ (9평)', maintenance: '매월 5만원', walkingMinutes: 7, distance: '520m', safetyScore: 8.5, marketDiff: '-5%', marketPrice: '48만원', reviews: 8, rating: 4.5, agent: { name: '김철수', office: '전농공인중개사무소', license: '경력 12년 · 서울 제12345호' }, risk: { level: '안전', mortgage: '없음', ratio: '62%', lh: '가능', hug: '확인 필요' } },
  { title: '이문동 조용한 분리형 원룸', features: ['엘리베이터', 'CCTV', '주차 가능'], supplyArea: '33㎡ (10평)', maintenance: '매월 7만원', walkingMinutes: 5, distance: '390m', safetyScore: 9.2, marketDiff: '-8%', marketPrice: '54만원', reviews: 11, rating: 4.8, agent: { name: '박민준', office: '시립대공인중개사', license: '경력 15년 · 서울 제34567호' }, risk: { level: '안전', mortgage: '없음', ratio: '58%', lh: '가능', hug: '가능' } },
  { title: '이문동 리모델링 투룸', deposit: '1.2억', features: ['엘리베이터', '주차 가능'], supplyArea: '43㎡ (13평)', maintenance: '매월 8만원', walkingMinutes: 10, distance: '780m', safetyScore: 7.8, marketDiff: '-2%', marketPrice: '1.25억', reviews: 4, rating: 4.1, agent: { name: '이수진', office: '회기공인중개사무소', license: '서울 제22345호' }, risk: { level: '보통', mortgage: '확인 필요', ratio: '71%', lh: '가능', hug: '확인 필요' } },
  { title: '서울시립대로 캠퍼스 뷰 원룸', features: ['엘리베이터', 'CCTV', '반려동물 가능'], supplyArea: '24㎡ (7평)', maintenance: '매월 4만원', walkingMinutes: 6, distance: '460m', safetyScore: 8.9, marketDiff: '-3%', marketPrice: '42만원', reviews: 6, rating: 4.4, agent: { name: '오민지', office: '이문공인중개사무소', license: '서울 제73456호' }, risk: { level: '안전', mortgage: '없음', ratio: '55%', lh: '가능', hug: '가능' } },
];

export const mapListings = mockHouseResponses.map((house, index) => ({
  ...mapHouseToListing(house, index),
  ...presentationDetails[index],
}));
