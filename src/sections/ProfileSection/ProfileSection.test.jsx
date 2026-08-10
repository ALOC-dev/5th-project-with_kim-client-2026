import { fireEvent, render, screen, within } from '@testing-library/react';
import ProfileSection from './ProfileSection';

const preferences = {
  classBuildingIds: ['14'],
  primaryClassBuildingId: '14',
  secondaryClassBuildingId: null,
  hasSecondaryClassBuilding: false,
  maxDeposit: 3000,
  maxMonthlyRent: 60,
  maxJeonse: 20000,
  leaseTypes: ['MONTHLY', 'JEONSE'],
  budgetConfigured: true,
  conditionListingAlert: true,
  wishPriceChangeAlert: true,
};

function getPreferenceCard(title) {
  return screen.getByText(title).closest('.profile-section__preference');
}

test('월세와 전세 예산을 별도 카드로 표시한다', () => {
  render(<ProfileSection preferences={preferences} username="김시대" />);

  expect(getPreferenceCard('내 월세 예산')).toHaveTextContent('보증금 3,000만원 · 월세 60만원 이하');
  expect(getPreferenceCard('내 전세 예산')).toHaveTextContent('전세금 20,000만원 이하');
  expect(screen.queryByText('내 월 예산')).not.toBeInTheDocument();
});

test('선택하지 않은 계약 유형은 해당 카드에 미설정으로 표시한다', () => {
  render(
    <ProfileSection
      preferences={{ ...preferences, leaseTypes: ['MONTHLY'] }}
      username="김시대"
    />,
  );

  expect(getPreferenceCard('내 월세 예산')).toHaveTextContent('보증금 3,000만원 · 월세 60만원 이하');
  expect(getPreferenceCard('내 전세 예산')).toHaveTextContent('아직 설정하지 않았어요');
});

test('월세와 전세 예산 카드의 변경 버튼은 기존 예산 설정을 연다', () => {
  const onOpenBudgetSettings = jest.fn();
  render(
    <ProfileSection
      preferences={preferences}
      username="김시대"
      onOpenBudgetSettings={onOpenBudgetSettings}
    />,
  );

  fireEvent.click(within(getPreferenceCard('내 월세 예산')).getByRole('button', { name: '변경' }));
  fireEvent.click(within(getPreferenceCard('내 전세 예산')).getByRole('button', { name: '변경' }));

  expect(onOpenBudgetSettings).toHaveBeenCalledTimes(2);
});
