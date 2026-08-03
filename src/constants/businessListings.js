export const INITIAL_BUSINESS_LISTINGS = [
  {
    id: 'demo-1',
    title: '전농동 리모델링 원룸',
    address: '전농동 345-67',
    leaseType: 'MONTHLY',
    deposit: 1000,
    monthlyRent: 50,
    managementFee: 7,
    status: '학생 노출 중',
    imageCount: 2,
    updatedAt: '오늘 등록',
  },
  {
    id: 'demo-2',
    title: '청량리 신축 오피스텔',
    address: '청량리동 235-4',
    leaseType: 'JEONSE',
    deposit: 13000,
    monthlyRent: 0,
    managementFee: 10,
    status: '학생 노출 중',
    imageCount: 1,
    updatedAt: '어제 등록',
  },
];

export const BUSINESS_OPTIONS = [
  { id: 'fullOption', label: '풀옵션' },
  { id: 'elevator', label: '엘리베이터' },
  { id: 'cctv', label: 'CCTV' },
  { id: 'doorLock', label: '도어락' },
  { id: 'parking', label: '주차' },
  { id: 'vehicle', label: '차량' },
  { id: 'pets', label: '반려동물' },
  { id: 'airConditioner', label: '에어컨' },
];
