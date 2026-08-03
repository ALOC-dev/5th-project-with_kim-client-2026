import { fireEvent, render, screen } from '@testing-library/react';
import BusinessPage from './BusinessPage';

test('registers a listing and shows it in the business listing overview', () => {
  render(<BusinessPage username="박민준" onLogout={jest.fn()} />);

  expect(screen.getByRole('heading', { name: '매물 등록' })).toBeInTheDocument();

  fireEvent.change(screen.getByLabelText('매물 이름'), { target: { value: '청량리 신축 원룸' } });
  fireEvent.change(screen.getByLabelText('주소'), { target: { value: '서울 동대문구 청량리동 235-4' } });
  fireEvent.click(screen.getByRole('button', { name: /등록 완료/ }));

  expect(screen.getByRole('heading', { name: '등록 매물 확인', level: 1 })).toBeInTheDocument();
  expect(screen.getByText('청량리 신축 원룸')).toBeInTheDocument();
  expect(screen.getByText(/서울 동대문구 청량리동 235-4/)).toBeInTheDocument();
});
