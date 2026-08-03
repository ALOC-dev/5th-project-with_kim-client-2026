import { act, renderHook, waitFor } from '@testing-library/react';
import * as services from '../services';
import { getRequiredOnboardingMode, getVisibleRequiredOnboardingMode, useUserPreferences } from './useUserPreferences';

jest.mock('../services', () => ({
  ...jest.requireActual('../services'),
  getUserProfile: jest.fn(),
  updateUserPreferences: jest.fn(),
}));

const basePreferences = {
  classBuildingIds: [],
  primaryClassBuildingId: null,
  maxDeposit: null,
  maxMonthlyRent: null,
  budgetConfigured: false,
};

beforeEach(() => {
  window.localStorage.clear();
  jest.clearAllMocks();
});

test('does not require onboarding when both class building and budget are configured', () => {
  expect(getRequiredOnboardingMode({
    ...basePreferences,
    primaryClassBuildingId: 'it',
    maxDeposit: 1000,
    maxMonthlyRent: 50,
    budgetConfigured: true,
  })).toBeNull();
});

test('only requires the missing onboarding step', () => {
  expect(getRequiredOnboardingMode({ ...basePreferences, primaryClassBuildingId: 'it' })).toBe('budget');
  expect(getRequiredOnboardingMode({
    ...basePreferences,
    maxDeposit: 1000,
    maxMonthlyRent: 50,
    budgetConfigured: true,
  })).toBe('building');
});

test('건물은 설정됐지만 월세 보증금, 월세, 전세금이 모두 null이면 예산 2단계가 필요하다', () => {
  expect(getRequiredOnboardingMode({
    ...basePreferences,
    primaryClassBuildingId: '14',
    maxDeposit: null,
    maxMonthlyRent: null,
    maxJeonse: null,
    budgetConfigured: true,
  })).toBe('budget');
});

test('requires the full onboarding flow when neither setting exists', () => {
  expect(getRequiredOnboardingMode(basePreferences)).toBe('all');
});

test('keeps existing saved budget values compatible when the configured flag is absent', () => {
  expect(getRequiredOnboardingMode({ ...basePreferences, primaryClassBuildingId: 'it', maxDeposit: 1000, maxMonthlyRent: 50, budgetConfigured: undefined })).toBeNull();
});

test('requires all onboarding steps when the server explicitly returns null settings', () => {
  expect(getRequiredOnboardingMode({
    ...basePreferences,
    primaryClassBuildingId: null,
    preferredSchoolBuildingId: null,
    prefersMonthlyRent: null,
    prefersJeonse: null,
    maxDeposit: null,
    budgetConfigured: false,
  })).toBe('all');
});

test('ignores a legacy deferred flag that is not tied to the current missing settings', () => {
  expect(getVisibleRequiredOnboardingMode({
    ...basePreferences,
    onboardingDeferred: true,
    onboardingDeferredMode: null,
  })).toBe('all');
});

test('keeps onboarding hidden when the current missing settings were explicitly deferred', () => {
  expect(getVisibleRequiredOnboardingMode({
    ...basePreferences,
    onboardingDeferred: true,
    onboardingDeferredMode: 'all',
  })).toBeNull();
});

test('requests the current user profile for an authenticated session without a stored user id', async () => {
  services.getUserProfile.mockResolvedValue({
    id: 4,
    preferredSchoolBuildingId: null,
    budgetConfigured: false,
  });

  renderHook(() => useUserPreferences(null, true));

  await waitFor(() => expect(services.getUserProfile).toHaveBeenCalledTimes(1));
  expect(JSON.parse(window.localStorage.getItem('sibang.user-preferences.4'))).toMatchObject({
    preferredSchoolBuildingId: null,
    budgetConfigured: false,
  });
});

test('이전에 저장된 예산 나중에 설정 플래그는 다음 접속의 예산 2단계를 숨기지 않는다', async () => {
  window.localStorage.setItem('sibang.user-preferences.4', JSON.stringify({
    primaryClassBuildingId: '14',
    onboardingDeferred: true,
    onboardingDeferredMode: 'budget',
  }));
  services.getUserProfile.mockResolvedValue({
    id: 4,
    primaryClassBuildingId: '14',
    maxDeposit: null,
    maxMonthlyRent: null,
    maxJeonse: null,
    budgetConfigured: false,
  });

  const { result } = renderHook(() => useUserPreferences(4, true));

  await waitFor(() => expect(services.getUserProfile).toHaveBeenCalledTimes(1));
  await waitFor(() => expect(result.current.requiredOnboardingMode).toBe('budget'));
  expect(JSON.parse(window.localStorage.getItem('sibang.user-preferences.4'))).not.toHaveProperty('onboardingDeferred');
  expect(JSON.parse(window.localStorage.getItem('sibang.user-preferences.4'))).not.toHaveProperty('onboardingDeferredMode');
});

test('저장할 때 실제 변경한 설정만 PATCH 서비스에 전달한다', async () => {
  services.getUserProfile.mockResolvedValue({
    id: 4,
    primaryClassBuildingId: null,
    budgetConfigured: false,
  });
  const changes = {
    classBuildingIds: ['14', '10'],
    primaryClassBuildingId: '14',
    secondaryClassBuildingId: '10',
    hasSecondaryClassBuilding: true,
  };
  const { result } = renderHook(() => useUserPreferences(4, true));

  await waitFor(() => expect(services.getUserProfile).toHaveBeenCalledTimes(1));
  await act(async () => {
    await result.current.savePreferences(changes);
  });

  expect(services.updateUserPreferences).toHaveBeenCalledWith(changes);
  expect(result.current.preferences).toMatchObject(changes);
});
