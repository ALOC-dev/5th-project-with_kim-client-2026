import { useEffect, useState } from 'react';
import { defaultUserPreferences } from '../constants/preferences';
import { getUserProfile, updateUserPreferences } from '../services';

function getStorageKey(userId) {
  return `sibang.user-preferences.${userId}`;
}

function readPreferences(userId) {
  if (!userId) return defaultUserPreferences;

  try {
    const saved = window.localStorage.getItem(getStorageKey(userId));
    return saved ? { ...defaultUserPreferences, ...JSON.parse(saved) } : defaultUserPreferences;
  } catch {
    return defaultUserPreferences;
  }
}

export function getRequiredOnboardingMode(preferences) {
  const hasClassBuilding = Boolean(preferences.primaryClassBuildingId || preferences.classBuildingIds?.length);
  const hasBudget = preferences.budgetConfigured === true || (preferences.budgetConfigured === undefined && preferences.maxDeposit !== null && preferences.maxDeposit !== undefined && preferences.maxMonthlyRent !== null && preferences.maxMonthlyRent !== undefined);

  if (!hasClassBuilding && !hasBudget) return 'all';
  if (!hasClassBuilding) return 'building';
  if (!hasBudget) return 'budget';
  return null;
}

export function useUserPreferences(userId, isAuthenticated) {
  const [preferences, setPreferences] = useState(() => readPreferences(userId));

  useEffect(() => {
    let active = true;
    const localPreferences = readPreferences(userId);
    setPreferences(localPreferences);

    if (!userId || !isAuthenticated) return () => { active = false; };

    getUserProfile()
      .then((profile) => {
        if (!active || !profile) return;
        const nextPreferences = mergeUserPreferences(localPreferences, profile);
        setPreferences(nextPreferences);
        window.localStorage.setItem(getStorageKey(userId), JSON.stringify(nextPreferences));
      })
      .catch(() => {
        // Keep the locally saved preferences when the profile API is unavailable.
      });

    return () => { active = false; };
  }, [userId, isAuthenticated]);

  const savePreferences = async (changes) => {
    const nextPreferences = { ...preferences, ...changes };
    setPreferences(nextPreferences);

    if (userId) {
      window.localStorage.setItem(getStorageKey(userId), JSON.stringify(nextPreferences));
      await updateUserPreferences(nextPreferences);
    }

    return nextPreferences;
  };

  return {
    preferences,
    savePreferences,
    requiredOnboardingMode: isAuthenticated && !preferences.onboardingDeferred ? getRequiredOnboardingMode(preferences) : null,
  };
}

export function mergeUserPreferences(localPreferences, remotePreferences) {
  return { ...defaultUserPreferences, ...localPreferences, ...remotePreferences };
}
