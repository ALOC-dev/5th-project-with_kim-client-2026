import { fireEvent, render, screen } from '@testing-library/react';
import ReviewCard from './ReviewCard';

const longReview = '학교와 가깝고 채광이 좋아서 만족했습니다. 관리도 빠르게 처리해 주셨고 주변이 조용해서 생활하기 편했어요. 다음 학기에도 계속 살고 싶은 매물입니다.';
const wrappedReview = '학교랑 가까운 건 정말 좋았는데 밤에는 골목이 조금 어두워서 아쉬웠어요.';

test('긴 리뷰는 말줄임 처리하고 더보기로 전체 내용을 표시한다', () => {
  render(<ReviewCard review={{ id: 1, initial: '김', name: '김시립', rating: 5, period: '2026.07', text: longReview }} />);

  expect(screen.getByRole('button', { name: '더 보기' })).toBeInTheDocument();
  fireEvent.click(screen.getByRole('button', { name: '더 보기' }));

  expect(screen.getByText(longReview)).toHaveClass('is-expanded');
  expect(screen.getByRole('button', { name: '접기' })).toBeInTheDocument();
});

test('두 줄로 접힐 수 있는 리뷰에도 더보기를 표시한다', () => {
  render(<ReviewCard review={{ id: 2, initial: '이', name: '이시립', rating: 4, period: '2026.07', text: wrappedReview }} />);

  expect(screen.getByRole('button', { name: '더 보기' })).toBeInTheDocument();
});

test('내 리뷰는 강조하고 수정과 삭제 버튼을 제공한다', () => {
  const onEdit = jest.fn();
  const onDelete = jest.fn();

  render(<ReviewCard review={{ id: 3, initial: '박', name: '박시립', rating: 5, period: '2026.07', text: '내가 쓴 리뷰입니다.' }} isMine onEdit={onEdit} onDelete={onDelete} />);

  expect(screen.getByText('내 리뷰')).toBeInTheDocument();
  expect(screen.getByText('내가 쓴 리뷰입니다.').closest('article')).toHaveClass('is-mine');
  fireEvent.click(screen.getByRole('button', { name: '리뷰 수정' }));
  fireEvent.click(screen.getByRole('button', { name: '리뷰 삭제' }));

  expect(onEdit).toHaveBeenCalledTimes(1);
  expect(onDelete).toHaveBeenCalledTimes(1);
});

test('거주 정보와 작성일을 분리해 표시한다', () => {
  render(<ReviewCard review={{ id: 4, initial: '아', name: '아*유', residenceLabel: '현재 거주자 / 저층', rating: 5, period: '2023년 작성', text: longReview }} />);

  expect(screen.getByText('현재 거주자 / 저층')).toBeInTheDocument();
  expect(screen.getByText('2023년 작성')).toBeInTheDocument();
});
