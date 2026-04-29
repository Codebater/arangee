import { composio, CalendarConnectionError } from "./composio";
import { env } from "./env";

export interface BusyInterval {
  start: Date;
  end: Date;
}

export interface CalendarSummary {
  id: string;
  summary: string;
  primary: boolean;
}

export async function initiateGoogleConnection(userId: string, callbackUrl: string) {
  const req = await composio().connectedAccounts.initiate(
    userId,
    env().COMPOSIO_GOOGLE_AUTH_CONFIG_ID,
    { callbackUrl },
  );
  // req.redirectUrl is string | null per SDK types; cast to string for redirect flow
  return { redirectUrl: req.redirectUrl as string, connectionId: req.id };
}

export async function getConnection(connectionId: string) {
  const acc = await composio().connectedAccounts.get(connectionId);
  return { id: acc.id, status: acc.status as string };
}

export async function listCalendars(userId: string): Promise<CalendarSummary[]> {
  const res = await composio().tools.execute("GOOGLECALENDAR_LIST_CALENDARS", {
    userId,
    arguments: {},
    dangerouslySkipVersionCheck: true,
  });
  if (!res.successful) throw new CalendarConnectionError(res.error ?? "list_calendars failed");
  const items = (res.data as { items?: unknown[] }).items ?? [];
  return (items as Array<{ id: string; summary: string; primary?: boolean }>).map((c) => ({
    id: c.id,
    summary: c.summary,
    primary: !!c.primary,
  }));
}

export async function getBusyTimes(
  userId: string,
  calendarId: string,
  start: Date,
  end: Date,
  timezone: string,
): Promise<BusyInterval[]> {
  const res = await composio().tools.execute("GOOGLECALENDAR_FIND_FREE_SLOTS", {
    userId,
    arguments: {
      time_min: start.toISOString(),
      time_max: end.toISOString(),
      items: [{ id: calendarId }],
      timezone,
    },
    dangerouslySkipVersionCheck: true,
  });
  if (!res.successful) throw new CalendarConnectionError(res.error ?? "find_free_slots failed");
  const calendars = (
    res.data as {
      calendars?: Record<string, { busy?: Array<{ start: string; end: string }> }>;
    }
  ).calendars ?? {};
  const cal = calendars[calendarId];
  const busy = cal?.busy ?? [];
  return busy.map((b) => ({ start: new Date(b.start), end: new Date(b.end) }));
}

// ---------------------------------------------------------------------------
// Write API
// ---------------------------------------------------------------------------

export interface CreateEventInput {
  summary: string;
  description: string;
  startUtc: Date;
  durationMinutes: number;
  attendees: Array<{ email: string; displayName?: string }>;
  withMeet: boolean;
}

export interface CreatedEvent {
  googleEventId: string;
  meetLink: string | null;
}

export async function createCalendarEvent(
  userId: string,
  calendarId: string,
  input: CreateEventInput,
): Promise<CreatedEvent> {
  const res = await composio().tools.execute("GOOGLECALENDAR_CREATE_EVENT", {
    userId,
    arguments: {
      calendar_id: calendarId,
      summary: input.summary,
      description: input.description,
      start_datetime: input.startUtc.toISOString(),
      timezone: "UTC",
      event_duration_minutes: input.durationMinutes,
      attendees: input.attendees.map((a) => ({ email: a.email, displayName: a.displayName })),
      create_meeting_room: input.withMeet,
      send_updates: "all",
    },
    dangerouslySkipVersionCheck: true,
  });
  if (!res.successful) throw new CalendarConnectionError(res.error ?? "create_event failed");
  const data = res.data as {
    id?: string;
    htmlLink?: string;
    hangoutLink?: string;
    conferenceData?: { entryPoints?: Array<{ entryPointType: string; uri: string }> };
  };
  const meetEntry = data.conferenceData?.entryPoints?.find((e) => e.entryPointType === "video");
  const meetLink = data.hangoutLink ?? meetEntry?.uri ?? null;
  if (!data.id) throw new CalendarConnectionError("create_event: missing event id");
  return { googleEventId: data.id, meetLink };
}

export async function deleteCalendarEvent(userId: string, calendarId: string, eventId: string) {
  const res = await composio().tools.execute("GOOGLECALENDAR_DELETE_EVENT", {
    userId,
    arguments: { calendar_id: calendarId, event_id: eventId, send_updates: "all" },
    dangerouslySkipVersionCheck: true,
  });
  if (!res.successful) throw new CalendarConnectionError(res.error ?? "delete_event failed");
}
