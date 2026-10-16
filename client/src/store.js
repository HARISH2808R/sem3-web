import { configureStore, createAsyncThunk, createSlice } from "@reduxjs/toolkit";
import { api, cachedGet } from "./api";

export const fetchDoctors = createAsyncThunk("hospital/fetchDoctors", async (filters = {}) => {
  const params = new URLSearchParams(filters).toString();
  const key = `doctors_cache_v2_${params || "all"}`;
  const res = await cachedGet(key, () => api.get(`/doctors${params ? `?${params}` : ""}`));
  return res.data;
});
export const fetchAppointments = createAsyncThunk("hospital/fetchAppointments", async () => (await api.get("/appointments")).data);
export const createAppointment = createAsyncThunk("hospital/createAppointment", async payload => (await api.post("/appointments", payload)).data);
export const rescheduleAppointment = createAsyncThunk("hospital/rescheduleAppointment", async ({ id, date, time }) => (await api.patch(`/appointments/${id}`, { date, time })).data);
export const cancelAppointment = createAsyncThunk("hospital/cancelAppointment", async id => {
  await api.delete(`/appointments/${id}`);
  return id;
});

const slice = createSlice({
  name: "hospital",
  initialState: { doctors: [], appointments: [], loading: false, error: "" },
  reducers: {},
  extraReducers: builder => {
    builder
      .addCase(fetchDoctors.pending, s => { s.loading = true; s.error = ""; })
      .addCase(fetchDoctors.fulfilled, (s, a) => { s.loading = false; s.doctors = a.payload; })
      .addCase(fetchDoctors.rejected, (s, a) => { s.loading = false; s.error = a.error.message; })
      .addCase(fetchAppointments.pending, s => { s.loading = true; s.error = ""; })
      .addCase(fetchAppointments.fulfilled, (s, a) => { s.loading = false; s.appointments = a.payload; })
      .addCase(fetchAppointments.rejected, (s, a) => { s.loading = false; s.error = a.error.message; })
      .addCase(createAppointment.fulfilled, (s, a) => { s.appointments.unshift(a.payload); })
      .addCase(rescheduleAppointment.fulfilled, (s, a) => {
        s.appointments = s.appointments.map(item => item.id === a.payload.id ? a.payload : item);
      })
      .addCase(cancelAppointment.fulfilled, (s, a) => {
        s.appointments = s.appointments.filter(item => item.id !== a.payload);
      });
  }
});

const loggerMiddleware = () => next => action => {
  console.log("[Appointment action]", action.type);
  return next(action);
};

export const store = configureStore({
  reducer: slice.reducer,
  middleware: getDefaultMiddleware => getDefaultMiddleware().concat(loggerMiddleware)
});
