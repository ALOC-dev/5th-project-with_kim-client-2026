import { apiRequest } from './apiClient';

export async function getUserProfile() {
  const response = await apiRequest('/api/users/me');
  return normalizeUserProfile(response);
}

export function normalizeUserProfile(response) {
  const source = response?.data && typeof response.data === 'object' ? response.data : response || {};
  const profile = {};
  const usesUserMeBuilding = hasOwn(source, 'preferredSchoolBuildingId');
  const preferredSchoolBuildingId = source.preferredSchoolBuildingId;
  const classBuildingIds = usesUserMeBuilding
    ? preferredSchoolBuildingId == null ? [] : [String(preferredSchoolBuildingId)]
    : normalizeBuildingIds(source.classBuildingIds ?? source.buildingIds ?? source.classBuildings);
  const primaryClassBuildingId = usesUserMeBuilding
    ? preferredSchoolBuildingId == null ? null : String(preferredSchoolBuildingId)
    : source.primaryClassBuildingId ?? source.primaryBuildingId ?? classBuildingIds[0];
  const secondaryClassBuildingId = usesUserMeBuilding
    ? null
    : source.secondaryClassBuildingId ?? source.secondaryBuildingId ?? classBuildingIds[1];
  const usesPreferredDeposit = hasOwn(source, 'preferredDeposit');
  const usesPreferredMonthlyRent = hasOwn(source, 'preferredMonthlyRent');
  const usesPreferredJeonse = hasOwn(source, 'preferredJeonse');
  const usesUserMeBudget = hasOwn(source, 'budget') && (source.budget === null || typeof source.budget !== 'object');
  const maxDeposit = usesPreferredDeposit
    ? source.preferredDeposit
    : firstDefined(source.maxDeposit, source.depositBudget, source.budget?.maxDeposit, source.budget?.deposit);
  const maxMonthlyRent = usesPreferredMonthlyRent
    ? source.preferredMonthlyRent
    : usesUserMeBudget
      ? source.budget
      : firstDefined(source.maxMonthlyRent, source.monthlyRentBudget, source.budget?.maxMonthlyRent, source.budget?.monthlyRent);
  const maxJeonse = usesPreferredJeonse
    ? source.preferredJeonse
    : firstDefined(source.maxJeonse, source.jeonseBudget, source.budget?.maxJeonse, source.budget?.jeonse);
  const leaseTypes = normalizeLeaseTypes(source);
  const usesUserMeLeaseTypes = hasOwn(source, 'prefersMonthlyRent') || hasOwn(source, 'prefersJeonse');
  const usesUserMeBudgetPreferences = usesPreferredDeposit || usesPreferredMonthlyRent || usesPreferredJeonse || usesUserMeBudget || usesUserMeLeaseTypes;
  const notificationSource = source.notifications || source.notificationSettings || source.alertSettings || {};
  const conditionListingAlert = firstBoolean(
    notificationSource.conditionListingAlert,
    notificationSource.conditionMatchedListing,
    notificationSource.newListingAlert,
    source.conditionListingAlert,
    source.conditionMatchedListing,
    source.newListingAlert,
    source.notificationEnabled,
  );
  const wishPriceChangeAlert = firstBoolean(
    notificationSource.wishPriceChangeAlert,
    notificationSource.wishPriceAlert,
    notificationSource.favoritePriceAlert,
    source.wishPriceChangeAlert,
    source.wishPriceAlert,
    source.favoritePriceAlert,
    source.notificationEnabled,
  );

  ['id', 'loginId', 'username', 'department', 'role'].forEach((key) => {
    if (hasOwn(source, key)) profile[key] = source[key];
  });

  if (usesUserMeBuilding || classBuildingIds.length) {
    profile.classBuildingIds = classBuildingIds;
    profile.primaryClassBuildingId = primaryClassBuildingId || null;
    profile.secondaryClassBuildingId = secondaryClassBuildingId || null;
    profile.hasSecondaryClassBuilding = Boolean(secondaryClassBuildingId);
  }
  if (usesPreferredDeposit || maxDeposit !== undefined) profile.maxDeposit = maxDeposit;
  if (usesPreferredMonthlyRent || usesUserMeBudget || maxMonthlyRent !== undefined) profile.maxMonthlyRent = maxMonthlyRent;
  if (usesPreferredJeonse || maxJeonse !== undefined) profile.maxJeonse = maxJeonse;
  if (usesUserMeBudgetPreferences) {
    profile.budgetConfigured = !(
      source.preferredDeposit == null
      && source.preferredMonthlyRent == null
      && source.preferredJeonse == null
      && source.budget == null
      && source.prefersMonthlyRent == null
      && source.prefersJeonse == null
    );
  } else if (maxDeposit !== undefined || maxMonthlyRent !== undefined || maxJeonse !== undefined) {
    profile.budgetConfigured = source.budgetConfigured ?? source.budget?.configured ?? true;
  }
  if (usesUserMeLeaseTypes || leaseTypes.length) profile.leaseTypes = leaseTypes;
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

  if (source.monthly === true || source.wolse === true || source.monthlyRentEnabled === true || source.prefersMonthlyRent === true) normalized.push('MONTHLY');
  if (source.jeonse === true || source.jeonseEnabled === true || source.prefersJeonse === true) normalized.push('JEONSE');
  if (hasOwn(source, 'preferredMonthlyRent') && source.preferredMonthlyRent != null) normalized.push('MONTHLY');
  if (hasOwn(source, 'preferredJeonse') && source.preferredJeonse != null) normalized.push('JEONSE');
  return Array.from(new Set(normalized));
}

function hasOwn(source, key) {
  return Object.prototype.hasOwnProperty.call(source, key);
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
  return apiRequest('/api/residence-verifications');
}

export async function uploadResidenceVerification(file) {
  const formData = new FormData();
  formData.append('file', file);
  return apiRequest('/api/residence-verifications', { method: 'POST', body: formData });
}

export async function deferResidenceVerification() {
  return apiRequest('/api/residence-verifications/defer', { method: 'PATCH' });
}

export function normalizeResidenceVerification(response) {
  const source = response?.data && typeof response.data === 'object' ? response.data : response || {};
  const historySource = source.addresses
    ?? source.history
    ?? source.residenceHistory
    ?? source.residenceHistories
    ?? source.records;
  const history = Array.isArray(historySource) ? historySource.map(normalizeResidenceHistory).filter((item) => item.address) : [];
  const matchedHistory = history.filter((item) => String(item.matchStatus || '').toUpperCase() === 'MATCHED');
  const status = source.status == null ? null : String(source.status).toUpperCase();
  const result = {
    status,
    uploadedAt: source.uploadedAt ?? null,
    error: source.error ?? null,
    addresses: Array.isArray(source.addresses) ? source.addresses : [],
  };

  if (typeof source.isVerified === 'boolean') result.isVerified = source.isVerified && matchedHistory.length > 0;
  else if (typeof source.verified === 'boolean') result.isVerified = source.verified && matchedHistory.length > 0;
  else if (result.status) result.isVerified = result.status === 'COMPLETED' && matchedHistory.length > 0;
  if (typeof source.isDeferred === 'boolean') result.isDeferred = source.isDeferred;
  if (history.length) {
    result.history = history;
    result.address = matchedHistory.find((item) => item.current)?.address || matchedHistory[0]?.address || history.find((item) => item.current)?.address || history[0].address;
  } else {
    result.history = [];
  }
  if (typeof source.address === 'string') result.address = source.address;
  if (typeof source.rewardMessage === 'string') result.rewardMessage = source.rewardMessage;
  return result;
}

function normalizeResidenceHistory(item) {
  if (typeof item === 'string') return { address: item, period: '', current: false };
  const address = item?.roadAddress || item?.jibunAddress || item?.rawAddress || item?.address || '';
  const years = Array.isArray(item?.residenceYears) ? item.residenceYears.join(' · ') : '';
  const start = item?.startYear ?? item?.fromYear ?? item?.startDate;
  const end = item?.endYear ?? item?.toYear ?? item?.endDate;
  const period = item?.period || years || (start || end ? `${start || ''}~${end || '현재'}` : '');
  return {
    ...item,
    address,
    period,
    current: Boolean(item?.current ?? item?.isCurrent ?? item?.present),
  };
}

export async function updateUserPreferences(preferences) {
  const payload = {};
  const hasBuildingChange = hasOwn(preferences, 'primaryClassBuildingId')
    || hasOwn(preferences, 'classBuildingIds');

  if (hasBuildingChange) {
    const buildingId = preferences.primaryClassBuildingId ?? preferences.classBuildingIds?.[0] ?? null;
    payload.preferredSchoolBuildingId = buildingId == null ? null : Number(buildingId);
  }
  if (hasOwn(preferences, 'leaseTypes')) {
    const includesMonthlyRent = preferences.leaseTypes.includes('MONTHLY');
    const includesJeonse = preferences.leaseTypes.includes('JEONSE');
    payload.preferredDeposit = includesMonthlyRent ? preferences.maxDeposit ?? null : null;
    payload.preferredMonthlyRent = includesMonthlyRent ? preferences.maxMonthlyRent ?? null : null;
    payload.preferredJeonse = includesJeonse ? preferences.maxJeonse ?? null : null;
  } else {
    if (hasOwn(preferences, 'maxDeposit')) payload.preferredDeposit = preferences.maxDeposit;
    if (hasOwn(preferences, 'maxMonthlyRent')) payload.preferredMonthlyRent = preferences.maxMonthlyRent;
    if (hasOwn(preferences, 'maxJeonse')) payload.preferredJeonse = preferences.maxJeonse;
  }
  if (hasOwn(preferences, 'conditionListingAlert')) {
    payload.notificationEnabled = preferences.conditionListingAlert;
  } else if (hasOwn(preferences, 'wishPriceChangeAlert')) {
    payload.notificationEnabled = preferences.wishPriceChangeAlert;
  }

  ['username', 'department', 'newPassword', 'confirmNewPassword'].forEach((key) => {
    if (hasOwn(preferences, key)) payload[key] = preferences[key];
  });

  if (Object.keys(payload).length === 0) return preferences;
  return apiRequest('/api/users/me', { method: 'PATCH', body: payload });
}
