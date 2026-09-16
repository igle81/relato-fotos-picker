export type PickerSource = "google_photos" | "demo";

export type CandidateStatus = "pending" | "rejected";

export type PickedPhoto = {
  id: string;
  filename: string;
  mimeType: string;
  type: "PHOTO" | "VIDEO";
  width?: number;
  height?: number;
  createdAt?: string;
  thumbnailUrl: string;
  source: PickerSource;
};

export type TrayItem = PickedPhoto & {
  status: CandidateStatus;
  authorYes: boolean;
  tutorYes: boolean;
  addedAt: string;
  inviteToken?: string;
};

export type Invite = {
  token: string;
  email: string;
  name: string;
  householdId: string;
  createdAt: string;
  expiresAt: string;
  openedAt?: string;
  completedAt?: string;
};

export type PickingSession = {
  id: string;
  pickerUri: string;
  mediaItemsSet: boolean;
  pollIntervalMs: number;
  timeoutInMs: number;
  expireTime?: string;
};
