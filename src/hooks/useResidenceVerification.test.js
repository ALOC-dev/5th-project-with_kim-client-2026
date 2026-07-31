import { canAutoOpenResidenceVerification } from './useResidenceVerification';

test('does not open residence verification before required onboarding is complete', () => {
  expect(canAutoOpenResidenceVerification({
    isAuthenticated: true,
    requiredOnboardingMode: 'all',
    onboardingMode: 'all',
    shouldAutoOpen: true,
    status: null,
  })).toBe(false);
});

test('does not open residence verification while onboarding is visible', () => {
  expect(canAutoOpenResidenceVerification({
    isAuthenticated: true,
    requiredOnboardingMode: null,
    onboardingMode: 'building',
    shouldAutoOpen: true,
    status: null,
  })).toBe(false);
});

test('opens residence verification only when the verification status is null', () => {
  expect(canAutoOpenResidenceVerification({
    isAuthenticated: true,
    requiredOnboardingMode: null,
    onboardingMode: null,
    shouldAutoOpen: true,
    status: null,
  })).toBe(true);

  expect(canAutoOpenResidenceVerification({
    isAuthenticated: true,
    requiredOnboardingMode: null,
    onboardingMode: null,
    shouldAutoOpen: true,
    status: 'NOT_SUBMITTED',
  })).toBe(false);
});
