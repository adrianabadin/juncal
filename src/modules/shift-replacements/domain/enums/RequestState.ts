export const RequestState = {
  OPEN: "OPEN",
  POSTULATED: "POSTULATED",
  CONFIRMED: "CONFIRMED",
  REJECTED: "REJECTED",
} as const;

export type RequestState = (typeof RequestState)[keyof typeof RequestState];

export const isRequestState = (v: string): v is RequestState =>
  v === RequestState.OPEN || v === RequestState.POSTULATED ||
  v === RequestState.CONFIRMED || v === RequestState.REJECTED;