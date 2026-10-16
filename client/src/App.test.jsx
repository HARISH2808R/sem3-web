import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Provider, useDispatch, useSelector } from 'react-redux';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { AuthContext, DoctorCard, TimeSlot, AppointmentCard, Doctors, BookAppointment } from './App';
import { api } from './api';
import { createAppointment, fetchDoctors } from './store';

jest.mock('react-redux', () => ({
  ...jest.requireActual('react-redux'),
  useDispatch: jest.fn(),
  useSelector: jest.fn()
}));
jest.mock('./api', () => ({ api: { get: jest.fn(), post: jest.fn() } }));
jest.mock('./store', () => ({
  store: {},
  cancelAppointment: jest.fn(), createAppointment: jest.fn(payload => ({ type: 'test/create', payload })),
  fetchAppointments: jest.fn(), fetchDoctors: jest.fn(filters => ({ type: 'test/doctors', filters })),
  rescheduleAppointment: jest.fn()
}));

const doctor = { id: 1, name: 'Dr. Ravi Kumar', specialty: 'Cardiology', qualification: 'MBBS, MD', experience: 8, rating: 4.8, fee: 500 };
const appointment = { id: 12, doctorName: 'Dr. Ravi Kumar', date: '2026-11-02', time: '10:00 AM', patientName: 'Hari', phone: '9876543210', status: 'Confirmed' };

beforeEach(() => {
  useDispatch.mockReturnValue(jest.fn(action => ({ unwrap: () => Promise.resolve({ id: 42, ...action?.payload }) })));
  useSelector.mockImplementation(selector => selector({ doctors: [doctor], appointments: [], loading: false, error: '' }));
  api.get.mockResolvedValue({ data: { slots: ['10:00 AM', '11:00 AM'], dates: ['2026-11-02'] } });
});

test('renders doctor card details and profile link', () => {
  render(<MemoryRouter><DoctorCard doctor={doctor} /></MemoryRouter>);
  expect(screen.getByRole('heading', { name: 'Dr. Ravi Kumar' })).toBeInTheDocument();
  expect(screen.getByText(/Cardiology/)).toBeInTheDocument();
  expect(screen.getByText('₹500')).toBeInTheDocument();
  expect(screen.getByRole('link', { name: /view profile/i })).toHaveAttribute('href', '/doctor/1');
});

test('doctor search and specialty filter dispatch selected filters', async () => {
  const dispatch = jest.fn(); useDispatch.mockReturnValue(dispatch);
  render(<MemoryRouter><Doctors /></MemoryRouter>);
  await userEvent.type(screen.getByRole('textbox', { name: /search doctor/i }), 'Ravi');
  await userEvent.selectOptions(screen.getByLabelText(/filter by specialty/i), 'Cardiology');
  await userEvent.click(screen.getByRole('button', { name: 'Search' }));
  expect(dispatch).toHaveBeenCalledWith(expect.objectContaining({ filters: { search: 'Ravi', specialty: 'Cardiology' } }));
});

test('shows loading and API error states on doctors page', () => {
  useSelector.mockImplementation(selector => selector({ doctors: [], loading: true, error: 'Server unavailable', appointments: [] }));
  render(<MemoryRouter><Doctors /></MemoryRouter>);
  expect(screen.getByText(/loading/i)).toBeInTheDocument();
  expect(screen.getByText('Server unavailable')).toBeInTheDocument();
});

test('time slot selection toggles selected styling and calls handler', async () => {
  const onClick = jest.fn();
  render(<TimeSlot time="10:00 AM" selected={false} onClick={onClick} />);
  const slot = screen.getByRole('button', { name: '10:00 AM' });
  await userEvent.click(slot);
  expect(onClick).toHaveBeenCalledTimes(1);
  const selected = render(<TimeSlot time="11:00 AM" selected onClick={onClick} />);
  expect(selected.getByRole('button', { name: '11:00 AM' })).toHaveClass('selected');
});

test('appointment card invokes cancellation callback with appointment id', async () => {
  const onCancel = jest.fn(); const onReschedule = jest.fn();
  render(<AppointmentCard item={appointment} onCancel={onCancel} onReschedule={onReschedule} />);
  expect(screen.getByText('Confirmed')).toBeInTheDocument();
  await userEvent.click(screen.getByRole('button', { name: 'Cancel' }));
  expect(onCancel).toHaveBeenCalledWith(12);
});

test('appointment card invokes reschedule callback with appointment', async () => {
  const onReschedule = jest.fn();
  render(<AppointmentCard item={appointment} onCancel={jest.fn()} onReschedule={onReschedule} />);
  await userEvent.click(screen.getByRole('button', { name: 'Reschedule' }));
  expect(onReschedule).toHaveBeenCalledWith(appointment);
});

test('appointment form loads slots and validates required time slot', async () => {
  render(<MemoryRouter initialEntries={['/book-appointment?doctorId=1']}><AuthContext.Provider value={{ token: 'test-token' }}><BookAppointment /></AuthContext.Provider></MemoryRouter>);
  await waitFor(() => expect(screen.getByRole('button', { name: '10:00 AM' })).toBeInTheDocument());
  await userEvent.type(screen.getByLabelText('Patient name'), 'Hari');
  await userEvent.type(screen.getByLabelText('Email'), 'hari@example.com');
  await userEvent.type(screen.getByLabelText('Phone number'), '9876543210');
  fireEvent.change(screen.getByLabelText('Date'), { target: { value: '2026-11-02' } });
  await userEvent.click(screen.getByRole('button', { name: 'Confirm booking' }));
  expect(await screen.findByText('Please select a time slot.')).toBeInTheDocument();
});

test('appointment booking submits selected doctor, date, slot and patient details', async () => {
  const dispatch = jest.fn(action => ({ unwrap: () => Promise.resolve({ id: 42 }) }));
  useDispatch.mockReturnValue(dispatch);
  render(<MemoryRouter initialEntries={['/book-appointment?doctorId=1']}><AuthContext.Provider value={{ token: 'test-token' }}><Routes><Route path="/book-appointment" element={<BookAppointment />} /><Route path="/appointment/:id" element={<p>Booking complete</p>} /></Routes></AuthContext.Provider></MemoryRouter>);
  await waitFor(() => expect(screen.getByRole('button', { name: '10:00 AM' })).toBeInTheDocument());
  await userEvent.type(screen.getByLabelText('Patient name'), 'Hari');
  await userEvent.type(screen.getByLabelText('Email'), 'hari@example.com');
  await userEvent.type(screen.getByLabelText('Phone number'), '9876543210');
  fireEvent.change(screen.getByLabelText('Date'), { target: { value: '2026-11-02' } });
  await userEvent.click(screen.getByRole('button', { name: '10:00 AM' }));
  await userEvent.click(screen.getByRole('button', { name: 'Confirm booking' }));
  expect(await screen.findByText('Booking complete')).toBeInTheDocument();
  expect(createAppointment).toHaveBeenCalledWith(expect.objectContaining({ doctorId: 1, date: '2026-11-02', time: '10:00 AM', patientName: 'Hari', email: 'hari@example.com', phone: '9876543210' }));
});
