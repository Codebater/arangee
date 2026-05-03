import { DAVClient } from "tsdav";
import { buildIcsForBooking } from "./ics";

const ICLOUD_SERVER = "https://caldav.icloud.com";

interface IcloudCalendar {
  url: string;
  displayName?: string;
  ctag?: string;
  components?: string[];
  // tsdav may include other fields; we only use the above
}

export async function connectIcloud(
  email: string,
  appPassword: string,
): Promise<{ client: DAVClient; calendars: IcloudCalendar[] }> {
  const client = new DAVClient({
    serverUrl: ICLOUD_SERVER,
    credentials: { username: email.trim(), password: appPassword.replace(/\s+/g, "") },
    authMethod: "Basic",
    defaultAccountType: "caldav",
  });
  await client.login();
  const calendars = (await client.fetchCalendars()) as unknown as IcloudCalendar[];
  return { client, calendars };
}

export function pickPrimaryCalendar(calendars: IcloudCalendar[]): IcloudCalendar | null {
  if (!calendars.length) return null;
  // Prefer one that supports VEVENT
  const eventCals = calendars.filter(
    (c) => !c.components || c.components.length === 0 || c.components.includes("VEVENT"),
  );
  const pool = eventCals.length ? eventCals : calendars;
  // Prefer one with a typical default name
  const defaults = ["Home", "Calendar", "Personal", "Privat"];
  for (const name of defaults) {
    const m = pool.find((c) => (c.displayName ?? "").toLowerCase() === name.toLowerCase());
    if (m) return m;
  }
  return pool[0] ?? null;
}

export async function mirrorEvent(args: {
  email: string;
  appPassword: string;
  calendarUrl: string;
  uid: string;
  summary: string;
  description: string;
  startUtc: Date;
  endUtc: Date;
  location?: string;
  attendeeEmail: string;
  attendeeName: string;
  organizerEmail: string;
  organizerName: string;
}): Promise<{ url: string; etag: string }> {
  const client = new DAVClient({
    serverUrl: ICLOUD_SERVER,
    credentials: { username: args.email, password: args.appPassword },
    authMethod: "Basic",
    defaultAccountType: "caldav",
  });
  await client.login();

  const ics = buildIcsForBooking({
    uid: args.uid,
    startUtc: args.startUtc,
    endUtc: args.endUtc,
    summary: args.summary,
    description: args.description,
    location: args.location,
    organizer: { name: args.organizerName, email: args.organizerEmail },
    attendee: { name: args.attendeeName, email: args.attendeeEmail },
  });

  const result = (await client.createCalendarObject({
    calendar: { url: args.calendarUrl },
    filename: `${args.uid}.ics`,
    iCalString: ics,
  })) as unknown as { url?: string; etag?: string; headers?: Record<string, string> };

  const url = result.url ?? `${args.calendarUrl}${args.uid}.ics`;
  const etag = result.etag ?? result.headers?.etag ?? "";
  return { url, etag };
}

export async function unmirrorEvent(args: {
  email: string;
  appPassword: string;
  objectUrl: string;
  etag: string;
}): Promise<void> {
  const client = new DAVClient({
    serverUrl: ICLOUD_SERVER,
    credentials: { username: args.email, password: args.appPassword },
    authMethod: "Basic",
    defaultAccountType: "caldav",
  });
  await client.login();
  await client.deleteCalendarObject({
    calendarObject: { url: args.objectUrl, etag: args.etag },
  });
}
