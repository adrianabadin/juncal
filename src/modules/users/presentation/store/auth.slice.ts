import { createSlice, PayloadAction } from "@reduxjs/toolkit";
import { Role } from "@users/domain/enums/Role";

interface AuthState {
  userId: string | null;
  name: string | null;
  role: Role | null;
  isActive: boolean;
}

const initialState: AuthState = {
  userId: null,
  name: null,
  role: null,
  isActive: false,
};

const authSlice = createSlice({
  name: "auth",
  initialState,
  reducers: {
    setSession(_state, action: PayloadAction<AuthState>) {
      return action.payload;
    },
    clearSession() {
      return initialState;
    },
  },
});

export const { setSession, clearSession } = authSlice.actions;
export default authSlice.reducer;
