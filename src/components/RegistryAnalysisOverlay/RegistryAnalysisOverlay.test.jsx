import { act, render, screen } from '@testing-library/react';
import RegistryAnalysisOverlay from './RegistryAnalysisOverlay';

test('등기부등본 분석 대기 중에는 스피너와 증가하는 진행률을 보여준다', () => {
  jest.useFakeTimers();

  render(<RegistryAnalysisOverlay status="QUEUED" />);

  expect(screen.getByRole('status')).toHaveTextContent('등기부등본을 분석하고 있어요');
  expect(screen.getByLabelText('등기부등본 분석 진행률')).toHaveAttribute('aria-valuenow', '12');

  act(() => {
    jest.advanceTimersByTime(3000);
  });

  expect(Number(screen.getByLabelText('등기부등본 분석 진행률').getAttribute('aria-valuenow'))).toBeGreaterThan(12);

  jest.useRealTimers();
});

test.each([
  ['ANALYZED', '분석이 끝났어요'],
  ['NEEDS_MORE_DOCS', '분석이 끝났어요'],
  ['FAILED', '분석이 끝났어요'],
])('등기부등본 분석 최종 상태 %s에서는 분석 종료 메시지를 보여준다', (status, message) => {
  render(<RegistryAnalysisOverlay status={status} />);

  expect(screen.getByRole('status')).toHaveTextContent(message);
  expect(screen.getByLabelText('등기부등본 분석 진행률')).toHaveAttribute('aria-valuenow', '100');
});
