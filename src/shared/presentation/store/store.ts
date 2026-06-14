import { configureStore } from "@reduxjs/toolkit";
import authReducer from "@users/presentation/store/auth.slice";
import worklistReducer from "@shift-replacements/presentation/store/worklist.slice";

export const store = configureStore({
  reducer: {
    auth: authReducer,
    worklist: worklistReducer,
  },
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
