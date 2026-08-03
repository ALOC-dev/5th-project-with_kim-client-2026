import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import OnboardingSection from './OnboardingSection';

test('월세와 전세를 함께 선택하고 각각의 슬라이더 예산을 저장한다', async () => {
  const onSave = jest.fn().mockResolvedValue(undefined);
  const onClose = jest.fn();

  render(<OnboardingSection
    mode="budget"
    preferences={{
      classBuildingIds: ['it'],
      primaryClassBuildingId: 'it',
      maxDeposit: 1000,
      maxMonthlyRent: 50,
      leaseTypes: ['MONTHLY'],
      budgetConfigured: false,
    }}
    onClose={onClose}
    onDefer={jest.fn()}
    onSave={onSave}
  />);

  expect(screen.getByRole('button', { name: '월세' })).toHaveAttribute('aria-pressed', 'true');
  expect(screen.getByRole('button', { name: '전세' })).toHaveAttribute('aria-pressed', 'false');
  fireEvent.click(screen.getByRole('button', { name: '전세' }));
  const depositSlider = screen.getByRole('slider', { name: '최대 보증금' });
  const monthlyRentSlider = screen.getByRole('slider', { name: '최대 월세' });
  const jeonseSlider = screen.getByRole('slider', { name: '최대 전세금' });

  expect(depositSlider).toHaveAttribute('step', '1000');
  expect(monthlyRentSlider).toHaveAttribute('step', '10');
  expect(jeonseSlider).toHaveAttribute('step', '2000');

  fireEvent.change(depositSlider, { target: { value: '3000' } });
  fireEvent.change(monthlyRentSlider, { target: { value: '70' } });
  fireEvent.change(jeonseSlider, { target: { value: '14000' } });
  fireEvent.click(screen.getByRole('button', { name: '저장' }));

  await waitFor(() => expect(onSave).toHaveBeenCalledWith(expect.objectContaining({
    leaseTypes: ['MONTHLY', 'JEONSE'],
    maxDeposit: 3000,
    maxMonthlyRent: 70,
    maxJeonse: 14000,
    budgetConfigured: true,
  })));
  expect(onClose).toHaveBeenCalled();
});

test('예산만 비어 있으면 온보딩 2단계로 표시하고 null 값은 슬라이더 기본값으로 시작한다', () => {
  render(<OnboardingSection
    mode="budget"
    preferences={{
      classBuildingIds: ['14'],
      primaryClassBuildingId: '14',
      maxDeposit: null,
      maxMonthlyRent: null,
      maxJeonse: null,
      leaseTypes: [],
      budgetConfigured: false,
    }}
    onClose={jest.fn()}
    onDefer={jest.fn()}
    onSave={jest.fn()}
  />);

  expect(screen.getByText('2 / 3 단계')).toBeInTheDocument();
  fireEvent.click(screen.getByRole('button', { name: '월세' }));
  expect(screen.getByRole('slider', { name: '최대 보증금' })).toHaveValue('1000');
  expect(screen.getByRole('slider', { name: '최대 월세' })).toHaveValue('50');
});

test('예산만 설정하는 2단계에서도 나중에 설정하기로 예산 설정을 미룰 수 있다', async () => {
  const onDefer = jest.fn().mockResolvedValue(undefined);
  const onClose = jest.fn();

  render(<OnboardingSection
    mode="budget"
    preferences={{
      classBuildingIds: ['14'],
      primaryClassBuildingId: '14',
      secondaryClassBuildingId: null,
      hasSecondaryClassBuilding: false,
      maxDeposit: null,
      maxMonthlyRent: null,
      maxJeonse: null,
      leaseTypes: [],
      budgetConfigured: false,
    }}
    onClose={onClose}
    onDefer={onDefer}
    onSave={jest.fn()}
  />);

  fireEvent.click(screen.getByRole('button', { name: '나중에 설정하기' }));

  await waitFor(() => expect(onDefer).toHaveBeenCalledWith(expect.objectContaining({
    classBuildingIds: ['14'],
    primaryClassBuildingId: '14',
    onboardingDeferredMode: 'budget',
  })));
  expect(onClose).toHaveBeenCalledTimes(1);
});

test('수업 건물을 두 페이지로 나누고 실제 건물 ID를 저장한다', async () => {
  const onSave = jest.fn().mockResolvedValue(undefined);

  render(<OnboardingSection
    mode="building"
    preferences={{
      classBuildingIds: [],
      primaryClassBuildingId: null,
      secondaryClassBuildingId: null,
      hasSecondaryClassBuilding: false,
      maxDeposit: 1000,
      maxMonthlyRent: 50,
      leaseTypes: ['MONTHLY'],
      budgetConfigured: false,
      onboardingCompleted: false,
      onboardingDeferred: false,
    }}
    onClose={jest.fn()}
    onDefer={jest.fn()}
    onSave={onSave}
  />);

  ['정보기술관', '시대인재관', '건설공학관', '미래관', '21세기관', '법학관']
    .forEach((name) => expect(screen.getByRole('button', { name: new RegExp(name) })).toBeInTheDocument());
  expect(screen.queryByRole('button', { name: /인문학관/ })).not.toBeInTheDocument();

  fireEvent.click(screen.getByRole('button', { name: '2' }));

  ['인문학관', '과학기술관', '100주년 기념관', '음악관', '조형관', '창공관']
    .forEach((name) => expect(screen.getByRole('button', { name: new RegExp(name) })).toBeInTheDocument());
  expect(screen.queryByRole('button', { name: /정보기술관/ })).not.toBeInTheDocument();

  fireEvent.click(screen.getByRole('button', { name: '1' }));
  fireEvent.click(screen.getByRole('button', { name: /정보기술관/ }));
  fireEvent.click(screen.getByRole('button', { name: '정보기술관에서만 수업을 들어요.' }));
  fireEvent.click(screen.getByRole('button', { name: '저장' }));

  await waitFor(() => expect(onSave).toHaveBeenCalledWith(expect.objectContaining({
    classBuildingIds: ['14'],
    primaryClassBuildingId: '14',
    secondaryClassBuildingId: null,
  })));
});

test('가장 많이 듣는 장소와 2순위 장소를 각각 선택해 유지한다', async () => {
  const onSave = jest.fn().mockResolvedValue(undefined);

  render(<OnboardingSection
    mode="building"
    preferences={{
      classBuildingIds: [],
      primaryClassBuildingId: null,
      secondaryClassBuildingId: null,
      hasSecondaryClassBuilding: false,
      maxDeposit: null,
      maxMonthlyRent: null,
      leaseTypes: [],
      budgetConfigured: false,
    }}
    onClose={jest.fn()}
    onDefer={jest.fn()}
    onSave={onSave}
  />);

  fireEvent.click(screen.getByRole('button', { name: /정보기술관/ }));
  expect(screen.getByRole('button', { name: /1순위\s+정보기술관/ })).toBeInTheDocument();

  fireEvent.click(screen.getByRole('button', { name: /시대인재관/ }));
  expect(screen.getByRole('button', { name: /2순위\s+시대인재관/ })).toBeInTheDocument();
  fireEvent.click(screen.getByRole('button', { name: '저장' }));

  await waitFor(() => expect(onSave).toHaveBeenCalledWith(expect.objectContaining({
    classBuildingIds: ['14', '10'],
    primaryClassBuildingId: '14',
    secondaryClassBuildingId: '10',
    hasSecondaryClassBuilding: true,
  })));
  expect(onSave.mock.calls[0][0]).not.toHaveProperty('maxDeposit');
});

function renderFullOnboarding(overrides = {}) {
  const props = {
    preferences: {
      classBuildingIds: [],
      primaryClassBuildingId: null,
      secondaryClassBuildingId: null,
      hasSecondaryClassBuilding: false,
      maxDeposit: null,
      maxMonthlyRent: null,
      leaseTypes: [],
      budgetConfigured: false,
      onboardingCompleted: false,
      onboardingDeferred: false,
    },
    onClose: jest.fn(),
    onDefer: jest.fn().mockResolvedValue(undefined),
    onSave: jest.fn().mockResolvedValue(undefined),
    ...overrides,
  };

  render(<OnboardingSection {...props} />);
  return props;
}

function selectPrimaryBuildingOnly() {
  fireEvent.click(screen.getByRole('button', { name: /정보기술관/ }));
  fireEvent.click(screen.getByRole('button', { name: '정보기술관에서만 수업을 들어요.' }));
  fireEvent.click(screen.getByRole('button', { name: '다음' }));
}

test('건물 단계에서 나중에 설정하면 설정값을 저장하지 않는다', async () => {
  const { onSave, onDefer, onClose } = renderFullOnboarding();

  fireEvent.click(screen.getByRole('button', { name: '나중에 설정하기' }));

  await waitFor(() => expect(onDefer).toHaveBeenCalledTimes(1));
  expect(onSave).not.toHaveBeenCalled();
  expect(onClose).toHaveBeenCalledTimes(1);
});

test('예산 단계에서 나중에 설정하면 앞에서 선택한 1순위 건물만 저장한다', async () => {
  const { onSave, onDefer, onClose } = renderFullOnboarding();
  selectPrimaryBuildingOnly();

  fireEvent.click(screen.getByRole('button', { name: '나중에 설정하기' }));

  await waitFor(() => expect(onDefer).toHaveBeenCalledWith(expect.objectContaining({
    classBuildingIds: ['14'],
    primaryClassBuildingId: '14',
    secondaryClassBuildingId: null,
    hasSecondaryClassBuilding: false,
    onboardingDeferredMode: 'budget',
  })));
  expect(onDefer.mock.calls[0][0]).not.toHaveProperty('leaseTypes');
  expect(onDefer.mock.calls[0][0]).not.toHaveProperty('maxDeposit');
  expect(onSave).not.toHaveBeenCalled();
  expect(onDefer).toHaveBeenCalledTimes(1);
  expect(onClose).toHaveBeenCalledTimes(1);
});

test('예산 단계의 다음 버튼은 건물과 월세 설정을 한 번에 저장한다', async () => {
  const { onSave } = renderFullOnboarding();
  selectPrimaryBuildingOnly();

  fireEvent.click(screen.getByRole('button', { name: '월세' }));
  fireEvent.change(screen.getByRole('slider', { name: '최대 보증금' }), { target: { value: '2000' } });
  fireEvent.change(screen.getByRole('slider', { name: '최대 월세' }), { target: { value: '60' } });
  fireEvent.click(screen.getByRole('button', { name: '다음' }));

  await waitFor(() => expect(onSave).toHaveBeenCalledWith(expect.objectContaining({
    classBuildingIds: ['14'],
    primaryClassBuildingId: '14',
    leaseTypes: ['MONTHLY'],
    maxDeposit: 2000,
    maxMonthlyRent: 60,
    maxJeonse: null,
    budgetConfigured: true,
  })));
  expect(onSave).toHaveBeenCalledTimes(1);
  await waitFor(() => expect(screen.getByRole('heading', { name: '설정이 완료됐어요' })).toBeInTheDocument());
});
