export const campusBuildings = [
  { id: 'it', name: '정보기술관' },
  { id: 'science', name: '자연과학관' },
  { id: 'humanities', name: '인문대' },
  { id: 'education', name: '사범대' },
  { id: 'business', name: '경영대' },
  { id: 'law', name: '법학관' },
];

export const defaultUserPreferences = {
  classBuildingIds: [],
  primaryClassBuildingId: null,
  secondaryClassBuildingId: null,
  hasSecondaryClassBuilding: false,
  maxDeposit: 1000,
  maxMonthlyRent: 50,
  onboardingCompleted: false,
  onboardingDeferred: false,
};

export const depositOptions = [500, 1000, 2000, null];
export const monthlyRentOptions = [30, 40, 50, 60];
