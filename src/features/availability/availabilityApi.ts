import { apiFetch } from "../../lib/api/client";

export const DEFAULT_OUT_OF_OFFICE_MESSAGE =
  "This is outside of normal business hours. There may be a delayed response.";

export type AvailabilityMode = "SCHEDULE" | "AVAILABLE" | "AWAY";
export type AvailabilitySettings = {
  timezone: string | null;
  hours: { day: number; start: string; end: string }[];
  mode: AvailabilityMode;
  overrideUntil: string | null;
  silenceWhenUnavailable: boolean;
  outOfOfficeMessage: string | null;
};
export type ManagerAvailability = {
  available: boolean;
  effectiveMode: AvailabilityMode;
  notice: string | null;
  sendingAllowed: boolean;
  notificationsSilenced: boolean;
  evaluatedAt: string;
};
type SettingsResponse = {
  settings: AvailabilitySettings;
  availability: ManagerAvailability;
};

export const availabilityApi = {
  own: () => apiFetch<SettingsResponse>("/availability/me"),
  update: (settings: AvailabilitySettings) =>
    apiFetch<SettingsResponse>("/availability/me", {
      method: "PUT",
      body: JSON.stringify(settings),
    }),
  conversation: (conversationId: string) =>
    apiFetch<{
      managerId: string | null;
      availability: ManagerAvailability | null;
    }>(`/availability/conversations/${encodeURIComponent(conversationId)}`),
};
