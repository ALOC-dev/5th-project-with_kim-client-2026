import { apiRequest } from './apiClient';

export async function getUserProfile() {
  const response = await apiRequest('/api/auth/my');
  return normalizeUserProfile(response);
}

export function normalizeUserProfile(response) {
  const source = response?.data && typeof response.data === 'object' ? response.data : response || {};
  const profile = {};
  const classBuildingIds = normalizeBuildingIds(source.classBuildingIds ?? source.buildingIds ?? source.classBuildings);
  const primaryClassBuildingId = source.primaryClassBuildingId ?? source.primaryBuildingId ?? classBuildingIds[0];
  const secondaryClassBuildingId = source.secondaryClassBuildingId ?? source.secondaryBuildingId ?? classBuildingIds[1];
  const maxDeposit = firstDefined(source.maxDeposit, source.depositBudget, source.budget?.maxDeposit, source.budget?.deposit);
  const maxMonthlyRent = firstDefined(source.maxMonthlyRent, source.monthlyRentBudget, source.budget?.maxMonthlyRent, source.budget?.monthlyRent);
  const leaseTypes = normalizeLeaseTypes(source);
  const notificationSource = source.notifications || source.notificationSettings || source.alertSettings || {};
  const conditionListingAlert = firstBoolean(
    notificationSource.conditionListingAlert,
    notificationSource.conditionMatchedListing,
    notificationSource.newListingAlert,
    source.conditionListingAlert,
    source.conditionMatchedListing,
    source.newListingAlert,
  );
  const wishPriceChangeAlert = firstBoolean(
    notificationSource.wishPriceChangeAlert,
    notificationSource.wishPriceAlert,
    notificationSource.favoritePriceAlert,
    source.wishPriceChangeAlert,
    source.wishPriceAlert,
    source.favoritePriceAlert,
  );

  if (classBuildingIds.length) {
    profile.classBuildingIds = classBuildingIds;
    profile.primaryClassBuildingId = primaryClassBuildingId || null;
    profile.secondaryClassBuildingId = secondaryClassBuildingId || null;
    profile.hasSecondaryClassBuilding = Boolean(secondaryClassBuildingId);
  }
  if (maxDeposit !== undefined) profile.maxDeposit = maxDeposit;
  if (maxMonthlyRent !== undefined) profile.maxMonthlyRent = maxMonthlyRent;
  if (maxDeposit !== undefined || maxMonthlyRent !== undefined) {
    profile.budgetConfigured = source.budgetConfigured ?? source.budget?.configured ?? true;
  }
  if (leaseTypes.length) profile.leaseTypes = leaseTypes;
  if (conditionListingAlert !== undefined) profile.conditionListingAlert = conditionListingAlert;
  if (wishPriceChangeAlert !== undefined) profile.wishPriceChangeAlert = wishPriceChangeAlert;
  if (typeof source.onboardingCompleted === 'boolean') profile.onboardingCompleted = source.onboardingCompleted;
  if (typeof source.onboardingDeferred === 'boolean') profile.onboardingDeferred = source.onboardingDeferred;

  return profile;
}

function normalizeBuildingIds(value) {
  if (!Array.isArray(value)) return [];
  return value.map((building) => {
    if (typeof building === 'string' || typeof building === 'number') return String(building);
    return building?.id ?? building?.buildingId ?? building?.classBuildingId;
  }).filter(Boolean);
}

function normalizeLeaseTypes(source) {
  const values = source.leaseTypes ?? source.contractTypes ?? source.preferredLeaseTypes ?? source.leaseType ?? source.contractType;
  const normalized = toArray(values).map((value) => {
    const type = String(value).toUpperCase();
    if (['MONTHLY', 'MONTHLY_RENT', 'WOLSE', '월세'].includes(type)) return 'MONTHLY';
    if (['JEONSE', '전세'].includes(type)) return 'JEONSE';
    return null;
  }).filter(Boolean);

  if (source.monthly === true || source.wolse === true || source.monthlyRentEnabled === true) normalized.push('MONTHLY');
  if (source.jeonse === true || source.jeonseEnabled === true) normalized.push('JEONSE');
  return Array.from(new Set(normalized));
}

function toArray(value) {
  if (Array.isArray(value)) return value;
  return value === undefined || value === null || value === '' ? [] : [value];
}

function firstDefined(...values) {
  return values.find((value) => value !== undefined && value !== null);
}

function firstBoolean(...values) {
  return values.find((value) => typeof value === 'boolean');
}

export async function getResidenceVerification() {
  // TODO: API 연동 필요 - GET '-'
  // 설명: 로그인 사용자의 실거주 인증 여부, 인증 주소·거주 이력, 리뷰 혜택 문구를 반환하는 응답이 필요합니다.
  // 인증 API가 연결되기 전에는 완료 상태를 추정하지 않습니다.
  return Promise.resolve(null);
}

export async function updateUserPreferences(preferences) {
  // TODO: API 연동 필요 - PUT '-'
  // 설명: 사용자의 수업 건물 목록, 보증금·월세 예산, 알림 수신 여부 변경 결과를 기대합니다.
  return Promise.resolve(preferences);
}
