import { fireEvent, render, screen } from '@testing-library/react';
import ReviewCard from './ReviewCard';

const longReview = '학교와 가깝고 채광이 좋아서 만족했습니다. 관리도 빠르게 처리해 주셨고 주변이 조용해서 생활하기 편했어요. 다음 학기에도 계속 살고 싶은 매물입니다.';
const wrappedReview = '학교랑 가까운 건 정말 좋았는데 밤에는 골목이 조금 어두워서 아쉬웠어요.';
const unbrokenReview = '□□□□ㄴㅁㄴㅇㅁㄴㅇㅁㄴㅇㅁㄴㅇㅁㄴㅇㅁㄴㅇㅁㄴㅇㅁㄴㅇㅁㄴㅇㅁㄴㅇㅁㄴㅇㅁㄴㅇㅁㄴㅇㅁㄴㅇㅁㄴㅇㅁㄴㅇㅁㄴㅇㅁㄴㅇ';

function mockReviewTextHeight({ clientHeight, scrollHeight }) {
  jest.spyOn(HTMLElement.prototype, 'clientHeight', 'get').mockImplementation(function getClientHeight() {
    return this.classList?.contains('review-card__text') ? clientHeight : 0;
  });
  jest.spyOn(HTMLElement.prototype, 'scrollHeight', 'get').mockImplementation(function getScrollHeight() {
    return this.classList?.contains('review-card__text') ? scrollHeight : 0;
  });
}

afterEach(() => {
  jest.restoreAllMocks();
});

test('긴 리뷰는 말줄임 처리하고 더보기로 전체 내용을 표시한다', () => {
  mockReviewTextHeight({ clientHeight: 72, scrollHeight: 132 });

  render(<ReviewCard review={{ id: 1, initial: '김', name: '김시립', rating: 5, period: '2026.07', text: longReview }} />);

  expect(screen.getByRole('button', { name: '더 보기' })).toBeInTheDocument();
  fireEvent.click(screen.getByRole('button', { name: '더 보기' }));

  expect(screen.getByText(longReview)).toHaveClass('is-expanded');
  expect(screen.getByRole('button', { name: '접기' })).toBeInTheDocument();
});

test('3줄 안에 들어가는 리뷰는 글자 수가 길어도 더보기를 표시하지 않는다', () => {
  mockReviewTextHeight({ clientHeight: 72, scrollHeight: 72 });

  render(<ReviewCard review={{ id: 2, initial: '이', name: '이시립', rating: 4, period: '2026.07', text: wrappedReview }} />);

  expect(screen.queryByRole('button', { name: '더 보기' })).not.toBeInTheDocument();
});

test('공백 없이 긴 리뷰도 접힌 본문으로 렌더링하고 더보기로 펼친다', () => {
  mockReviewTextHeight({ clientHeight: 72, scrollHeight: 160 });

  render(<ReviewCard review={{ id: 5, initial: '김', name: '김*묵', rating: 5, period: '2026.07', text: unbrokenReview }} />);

  expect(screen.getByText(unbrokenReview)).toHaveClass('review-card__text', 'is-collapsed');
  expect(screen.getByRole('button', { name: '더 보기' })).toHaveAttribute('aria-expanded', 'false');

  fireEvent.click(screen.getByRole('button', { name: '더 보기' }));

  expect(screen.getByText(unbrokenReview)).toHaveClass('is-expanded');
  expect(screen.getByRole('button', { name: '접기' })).toHaveAttribute('aria-expanded', 'true');
});

test('리뷰 카드 더보기는 큰 CTA가 아닌 인라인 텍스트 액션으로 구분한다', () => {
  mockReviewTextHeight({ clientHeight: 72, scrollHeight: 160 });

  render(<ReviewCard review={{ id: 6, initial: '김', name: '김*묵', rating: 5, period: '2026년 작성', text: unbrokenReview }} />);

  expect(screen.getByRole('button', { name: '더 보기' })).toHaveClass('review-card__more--inline');
});

test('내 리뷰는 강조하고 수정과 삭제 버튼을 제공한다', () => {
  const onEdit = jest.fn();
  const onDelete = jest.fn();

  render(<ReviewCard review={{ id: 3, initial: '박', name: '박시립', rating: 5, period: '2026.07', text: '내가 쓴 리뷰입니다.' }} isMine onEdit={onEdit} onDelete={onDelete} />);

  expect(screen.getByText('내 리뷰')).toBeInTheDocument();
  expect(screen.getByText('내가 쓴 리뷰입니다.').closest('article')).toHaveClass('is-mine');
  const editButton = screen.getByRole('button', { name: '리뷰 수정' });
  const deleteButton = screen.getByRole('button', { name: '리뷰 삭제' });

  expect(editButton).toHaveAttribute('title', '리뷰 수정');
  expect(deleteButton).toHaveAttribute('title', '리뷰 삭제');
  expect(editButton).toHaveTextContent('');
  expect(deleteButton).toHaveTextContent('');

  fireEvent.click(editButton);
  fireEvent.click(deleteButton);

  expect(onEdit).toHaveBeenCalledTimes(1);
  expect(onDelete).toHaveBeenCalledTimes(1);
});

test('거주 정보와 작성일을 분리해 표시한다', () => {
  render(<ReviewCard review={{ id: 4, initial: '아', name: '아*유', residenceLabel: '현재 거주자 / 저층', rating: 5, period: '2023년 작성', text: longReview }} />);

  expect(screen.getByText('현재 거주자 / 저층')).toBeInTheDocument();
  expect(screen.getByText('2023년 작성')).toBeInTheDocument();
});
