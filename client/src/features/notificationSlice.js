// src/features/notificationSlice.js

import { createSlice } from "@reduxjs/toolkit";

const notificationSlice = createSlice({
  name: "notifications",
  initialState: {
    count: 0,
    invitations: [],
  },
  reducers: {
    setCount: (state, action) => {
      state.count = action.payload;
    },
    setInvitations: (state, action) => {
      state.invitations = action.payload;
      state.count = action.payload.length;
    },
  },
});

export const { setCount, setInvitations } = notificationSlice.actions;
export default notificationSlice.reducer;