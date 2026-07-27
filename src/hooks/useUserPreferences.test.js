import { getRequiredOnboardingMode } from './useUserPreferences';

const basePreferences = {
  classBuildingIds: [],
  primaryClassBuildingId: null,
  maxDeposit: null,
  maxMonthlyRent: null,
  budgetConfigured: false,
};

test('does not require onboarding when both class building and budget are configured', () => {
  expect(getRequiredOnboardingMode({ ...basePreferences, primaryClassBuildingId: 'it', budgetConfigured: true })).toBeNull();
});

test('only requires the missing onboarding step', () => {
  expect(getRequiredOnboardingMode({ ...basePreferences, primaryClassBuildingId: 'it' })).toBe('budget');
  expect(getRequiredOnboardingMode({ ...basePreferences, budgetConfigured: true })).toBe('building');
});

test('requires the full onboarding flow when neither setting exists', () => {
  expect(getRequiredOnboardingMode(basePreferences)).toBe('all');
});

test('keeps existing saved budget values compatible when the configured flag is absent', () => {
  expect(getRequiredOnboardingMode({ ...basePreferences, primaryClassBuildingId: 'it', maxDeposit: 1000, maxMonthlyRent: 50, budgetConfigured: undefined })).toBeNull();
});
