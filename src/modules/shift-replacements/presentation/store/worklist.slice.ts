import { createSlice, PayloadAction } from "@reduxjs/toolkit";
import { RequestState } from "@shift-replacements/domain/enums/RequestState";

export interface ShiftDto {
  id: string;
  date: string;
  state: RequestState;
  specialtyId: string;
  requesterId: string;
  applicantId: string | null;
}

interface WorklistState {
  selectedSpecialtyId: string | null;
  openShifts: ShiftDto[];
  postulatedShifts: ShiftDto[];
}

const initialState: WorklistState = {
  selectedSpecialtyId: null,
  openShifts: [],
  postulatedShifts: [],
};

const worklistSlice = createSlice({
  name: "worklist",
  initialState,
  reducers: {
    setSelectedSpecialty(state, action: PayloadAction<string | null>) {
      state.selectedSpecialtyId = action.payload;
    },
    setOpenShifts(state, action: PayloadAction<ShiftDto[]>) {
      state.openShifts = action.payload;
    },
    setPostulatedShifts(state, action: PayloadAction<ShiftDto[]>) {
      state.postulatedShifts = action.payload;
    },
  },
});

export const { setSelectedSpecialty, setOpenShifts, setPostulatedShifts } =
  worklistSlice.actions;
export default worklistSlice.reducer;
