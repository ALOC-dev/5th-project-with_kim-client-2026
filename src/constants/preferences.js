export const campusBuildings = [
  { id: '14', name: '정보기술관' },
  { id: '10', name: '시대인재관' },
  { id: '2', name: '건설공학관' },
  { id: '22', name: '미래관' },
  { id: '12', name: '21세기관' },
  { id: '15', name: '법학관' },
  { id: '4', name: '인문학관' },
  { id: '11', name: '과학기술관' },
  { id: '25', name: '100주년 기념관' },
  { id: '24', name: '음악관' },
  { id: '13', name: '조형관' },
  { id: '3', name: '창공관' },
];

export const defaultUserPreferences = {
  classBuildingIds: [],
  primaryClassBuildingId: null,
  secondaryClassBuildingId: null,
  hasSecondaryClassBuilding: false,
  maxDeposit: 1000,
  maxMonthlyRent: 50,
  maxJeonse: 10000,
  leaseTypes: ['MONTHLY'],
  budgetConfigured: false,
  onboardingCompleted: false,
  onboardingDeferred: false,
  onboardingDeferredMode: null,
  conditionListingAlert: true,
  wishPriceChangeAlert: true,
};

export const budgetSliderConfig = {
  monthlyDeposit: { min: 0, max: 5000, step: 1000, defaultValue: 1000 },
  monthlyRent: { min: 0, max: 100, step: 10, defaultValue: 50 },
  jeonse: { min: 0, max: 30000, step: 2000, defaultValue: 10000 },
};
