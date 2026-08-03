import { useEffect, useState } from 'react';
import { defaultUserPreferences } from '../constants/preferences';
import { getUserProfile, updateUserPreferences } from '../services';

function getStorageKey(userId) {
  return `sibang.user-preferences.${userId}`;
}

function getPersistedPreferences(preferences) {
  const {
    onboardingDeferred,
    onboardingDeferredMode,
    ...persistedPreferences
  } = preferences;
  return persistedPreferences;
}

function persistPreferences(userId, preferences) {
  window.localStorage.setItem(
    getStorageKey(userId),
    JSON.stringify(getPersistedPreferences(preferences)),
  );
}

function readPreferences(userId) {
  if (!userId) return defaultUserPreferences;

  try {
    const saved = window.localStorage.getItem(getStorageKey(userId));
    return saved
      ? { ...defaultUserPreferences, ...getPersistedPreferences(JSON.parse(saved)) }
      : defaultUserPreferences;
  } catch {
    return defaultUserPreferences;
  }
}

export function getRequiredOnboardingMode(preferences) {
  const hasClassBuilding = Boolean(preferences.primaryClassBuildingId || preferences.classBuildingIds?.length);
  const hasBudgetValue = [preferences.maxDeposit, preferences.maxMonthlyRent, preferences.maxJeonse]
    .some((value) => value !== null && value !== undefined);
  const hasBudget = preferences.budgetConfigured !== false && hasBudgetValue;

  if (!hasClassBuilding && !hasBudget) return 'all';
  if (!hasClassBuilding) return 'building';
  if (!hasBudget) return 'budget';
  return null;
}

export function getVisibleRequiredOnboardingMode(preferences) {
  const requiredMode = getRequiredOnboardingMode(preferences);
  if (!requiredMode) return null;

  const deferredForCurrentMode = preferences.onboardingDeferred === true
    && preferences.onboardingDeferredMode === requiredMode;
  return deferredForCurrentMode ? null : requiredMode;
}

export function useUserPreferences(userId, isAuthenticated) {
  const [preferences, setPreferences] = useState(() => readPreferences(userId));

  useEffect(() => {
    let active = true;
    const localPreferences = readPreferences(userId);
    setPreferences(localPreferences);

    if (!isAuthenticated) return () => { active = false; };

    getUserProfile()
      .then((profile) => {
        if (!active || !profile) return;
        const nextPreferences = mergeUserPreferences(localPreferences, profile);
        setPreferences(nextPreferences);
        const profileUserId = profile.id ?? userId;
        if (profileUserId) {
          persistPreferences(profileUserId, nextPreferences);
        }
      })
      .catch(() => {
        // Keep the locally saved preferences when the profile API is unavailable.
      });

    return () => { active = false; };
  }, [userId, isAuthenticated]);

  const savePreferences = async (changes) => {
    const nextPreferences = { ...preferences, ...changes };
    if (changes.onboardingDeferred === true && !changes.onboardingDeferredMode) {
      nextPreferences.onboardingDeferredMode = getRequiredOnboardingMode(preferences);
    } else if (changes.onboardingDeferred === false) {
      nextPreferences.onboardingDeferredMode = null;
    }
    setPreferences(nextPreferences);

    if (userId) {
      persistPreferences(userId, nextPreferences);
      await updateUserPreferences(changes);
    }

    return nextPreferences;
  };

  return {
    preferences,
    savePreferences,
    requiredOnboardingMode: isAuthenticated ? getVisibleRequiredOnboardingMode(preferences) : null,
  };
}

export function mergeUserPreferences(localPreferences, remotePreferences) {
  return { ...defaultUserPreferences, ...localPreferences, ...remotePreferences };
}
