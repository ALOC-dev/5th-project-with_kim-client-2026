import { useEffect, useState } from 'react';
import { defaultUserPreferences } from '../constants/preferences';
import { updateUserPreferences } from '../services';

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

export function useUserPreferences(userId, isAuthenticated) {
  const [preferences, setPreferences] = useState(() => readPreferences(userId));

  useEffect(() => {
    setPreferences(readPreferences(userId));
  }, [userId]);

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
    shouldShowOnboarding: isAuthenticated && !preferences.onboardingCompleted && !preferences.onboardingDeferred,
  };
}
