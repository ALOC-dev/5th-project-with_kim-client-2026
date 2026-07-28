import { fireEvent, render, screen } from '@testing-library/react';
import ReviewFormModal from './ReviewFormModal';

const listing = { id: 1, title: '리모델링 원룸', address: '전농동 345-67', imageUrls: [] };

test('실거주 미인증 사용자는 2단계 작성 후 인증 없이 등록을 선택할 수 있다', async () => {
  const onSubmit = jest.fn().mockResolvedValue();
  render(<ReviewFormModal listing={listing} verification={{ isVerified: false }} isSubmitting={false} error="" onClose={jest.fn()} onSubmit={onSubmit} />);

  fireEvent.click(screen.getByRole('button', { name: '다음' }));
  expect(screen.getByText('아직 실거주 인증이 안 됐어요')).toBeInTheDocument();
  fireEvent.click(screen.getByRole('button', { name: '인증 없이 계속' }));
  fireEvent.click(screen.getByRole('button', { name: '청결 5점' }));
  fireEvent.click(screen.getByRole('button', { name: '관리 4점' }));
  fireEvent.click(screen.getByRole('button', { name: '위치 5점' }));
  fireEvent.click(screen.getByRole('button', { name: '가격 4점' }));
  fireEvent.change(screen.getByPlaceholderText('좋았던 점과 아쉬운 점을 자유롭게 남겨주세요.'), { target: { value: '학교와 가까워서 편리해요.' } });
  fireEvent.click(screen.getByRole('button', { name: '리뷰 등록하기' }));

  expect(onSubmit).toHaveBeenCalledWith({
    cleanlinessRating: 5,
    managementRating: 4,
    locationRating: 5,
    priceRating: 4,
    text: '학교와 가까워서 편리해요.',
  });
});

test('리뷰 수정은 기존 점수와 내용을 채운 상태로 시작한다', async () => {
  const onSubmit = jest.fn().mockResolvedValue();
  render(
    <ReviewFormModal
      listing={listing}
      verification={{ isVerified: true }}
      initialReview={{ ratings: { cleanlinessRating: 4, managementRating: 3, locationRating: 5, priceRating: 4 }, text: '기존 리뷰입니다.' }}
      isSubmitting={false}
      error=""
      onClose={jest.fn()}
      onSubmit={onSubmit}
    />,
  );

  fireEvent.click(screen.getByRole('button', { name: '다음' }));
  expect(screen.getByDisplayValue('기존 리뷰입니다.')).toBeInTheDocument();
  fireEvent.change(screen.getByDisplayValue('기존 리뷰입니다.'), { target: { value: '수정한 리뷰입니다.' } });
  fireEvent.click(screen.getByRole('button', { name: '리뷰 수정하기' }));

  expect(onSubmit).toHaveBeenCalledWith({
    cleanlinessRating: 4,
    managementRating: 3,
    locationRating: 5,
    priceRating: 4,
    text: '수정한 리뷰입니다.',
  });
});
