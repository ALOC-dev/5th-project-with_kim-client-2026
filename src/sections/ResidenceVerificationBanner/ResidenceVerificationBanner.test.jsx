import { fireEvent, render, screen } from '@testing-library/react';
import ResidenceVerificationBanner from './ResidenceVerificationBanner';

const matchedHistory = [
  { address: '서울특별시 동대문구 전농동 152-73', current: false, matchStatus: 'NOT_FOUND' },
  { address: '경기도 하남시 신평로73번길 35-7', current: true, matchStatus: 'MATCHED', houseId: 12 },
  { address: '서울특별시 동대문구 회기로18길 46', current: false, matchStatus: 'MATCHED', houseId: 11 },
];

test('매칭된 현재 거주 주소를 배너에 표시하고 리뷰 작성을 요청할 수 있다', () => {
  const onReview = jest.fn();
  render(<ResidenceVerificationBanner verification={{ isVerified: true, history: matchedHistory }} onReview={onReview} onDismiss={jest.fn()} />);

  expect(screen.getByText('경기도 하남시 신평로73번길 35-7, 실거주 인증되어 있어요')).toBeInTheDocument();
  expect(screen.queryByText('서울특별시 동대문구 전농동 152-73, 실거주 인증되어 있어요')).not.toBeInTheDocument();

  fireEvent.click(screen.getByRole('button', { name: '리뷰 쓰고 혜택 받기' }));
  expect(onReview).toHaveBeenCalledWith(matchedHistory[1]);
});

test('매칭된 주소가 없으면 실거주 인증 배너를 표시하지 않는다', () => {
  const { container } = render(<ResidenceVerificationBanner verification={{ isVerified: false, status: 'COMPLETED', history: [
    { address: '경기도 하남시 덕풍동 365-18', current: true, matchStatus: 'NOT_FOUND' },
  ] }} onDismiss={jest.fn()} />);

  expect(container.firstChild).toBeNull();
});
