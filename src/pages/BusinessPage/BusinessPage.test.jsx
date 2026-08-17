import { fireEvent, render, screen } from '@testing-library/react';
import BusinessPage from './BusinessPage';

test('registers a listing and shows it in the business listing overview', () => {
  render(<BusinessPage username="박민준" onLogout={jest.fn()} />);

  expect(screen.getByRole('heading', { name: '매물 등록' })).toBeInTheDocument();

  const description = screen.getByLabelText('매물 설명');
  expect(description.tagName).toBe('TEXTAREA');
  expect(description).toHaveAttribute('maxLength', '200');
  expect(screen.getByText('0/200')).toBeInTheDocument();
  fireEvent.change(description, { target: { value: '청량리 신축 원룸' } });
  expect(screen.getByText('9/200')).toBeInTheDocument();
  expect(screen.getByLabelText('시 선택')).toHaveValue('서울특별시');
  fireEvent.change(screen.getByLabelText('구 선택'), { target: { value: '강남구' } });
  expect(screen.getByLabelText('동 선택')).toHaveValue('역삼동');
  fireEvent.change(screen.getByLabelText('동 선택'), { target: { value: '삼성동' } });
  fireEvent.change(screen.getByLabelText('지번'), { target: { value: '235-4' } });
  fireEvent.change(screen.getByLabelText('건축 연도'), { target: { value: '2018' } });
  fireEvent.click(screen.getByRole('button', { name: /등록 완료/ }));

  expect(screen.getByRole('heading', { name: '등록 매물 확인', level: 1 })).toBeInTheDocument();
  expect(screen.getByText('청량리 신축 원룸')).toBeInTheDocument();
  expect(screen.getByText(/서울특별시 강남구 삼성동 235-4/)).toBeInTheDocument();
  expect(screen.getByText(/2018년 건축/)).toBeInTheDocument();
});

test('registers a listing with a road-name address', () => {
  render(<BusinessPage username="박민준" onLogout={jest.fn()} />);

  fireEvent.change(screen.getByLabelText('매물 설명'), { target: { value: '회기동 역세권 원룸' } });
  fireEvent.click(screen.getByRole('button', { name: '신주소 (도로명)' }));

  expect(screen.queryByLabelText('동 선택')).not.toBeInTheDocument();
  fireEvent.change(screen.getByLabelText('도로명'), { target: { value: '회기로' } });
  fireEvent.change(screen.getByLabelText('건물번호'), { target: { value: '18-7' } });
  fireEvent.change(screen.getByLabelText('건축 연도'), { target: { value: '2020' } });
  fireEvent.click(screen.getByRole('button', { name: /등록 완료/ }));

  expect(screen.getByText(/서울특별시 동대문구 회기로 18-7/)).toBeInTheDocument();
});

test('forces the room count to one for a studio building type', () => {
  render(<BusinessPage username="박민준" onLogout={jest.fn()} />);

  fireEvent.change(screen.getByLabelText('방 개수'), { target: { value: '3개' } });
  expect(screen.getByLabelText('방 개수')).toHaveValue('3개');

  fireEvent.change(screen.getByLabelText('건물 유형'), { target: { value: '원룸' } });

  expect(screen.getByLabelText('방 개수')).toHaveValue('1개');
  expect(screen.getByLabelText('방 개수')).toBeDisabled();
});

test('selects the number of bathrooms', () => {
  render(<BusinessPage username="박민준" onLogout={jest.fn()} />);

  expect(screen.getByLabelText('화장실 개수')).toHaveValue('1개');
  fireEvent.change(screen.getByLabelText('화장실 개수'), { target: { value: '2개' } });

  expect(screen.getByLabelText('화장실 개수')).toHaveValue('2개');
});

test('uploads a broker license image or PDF', () => {
  render(<BusinessPage username="박민준" onLogout={jest.fn()} />);
  const license = new File(['license'], '공인중개사-자격증.pdf', { type: 'application/pdf' });
  const input = screen.getByLabelText('담당 공인중개사 자격증');

  expect(input).toHaveAttribute('accept', 'image/*,application/pdf,.pdf');
  fireEvent.change(input, { target: { files: [license] } });

  expect(screen.getByText('공인중개사-자격증.pdf')).toBeInTheDocument();
});
