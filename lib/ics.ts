interface IcsArgs {
  uid: string;
  startUtc: Date;
  endUtc: Date;
  summary: string;
  description?: string;
  location?: string;
  organizer: { name: string; email: string };
  attendee: { name: string; email: string };
  url?: string;
  status?: "CONFIRMED" | "CANCELLED" | "TENTATIVE";
  sequence?: number;
}

function pad(n: number): string {
  return String(n).padStart(2, "0");
}

function fmtUtc(d: Date): string {
  return (
    d.getUTCFullYear().toString() +
    pad(d.getUTCMonth() + 1) +
    pad(d.getUTCDate()) +
    "T" +
    pad(d.getUTCHours()) +
    pad(d.getUTCMinutes()) +
    pad(d.getUTCSeconds()) +
    "Z"
  );
}

function escape(text: string): string {
  return text
    .replace(/\\/g, "\\\\")
    .replace(/\n/g, "\\n")
    .replace(/,/g, "\\,")
    .replace(/;/g, "\\;");
}

function fold(line: string): string {
  // RFC 5545: fold lines longer than 75 octets with CRLF + space
  if (line.length <= 75) return line;
  const parts: string[] = [];
  let i = 0;
  while (i < line.length) {
    parts.push(line.slice(i, i + 73));
    i += 73;
  }
  return parts.join("\r\n ");
}

export function buildIcsForBooking(args: IcsArgs): string {
  const now = new Date();
  const lines: string[] = [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "PRODID:-//WeSchedule//WeSchedule v2//EN",
    "CALSCALE:GREGORIAN",
    "METHOD:REQUEST",
    "BEGIN:VEVENT",
    `UID:${args.uid}@weschedule.net`,
    `DTSTAMP:${fmtUtc(now)}`,
    `DTSTART:${fmtUtc(args.startUtc)}`,
    `DTEND:${fmtUtc(args.endUtc)}`,
    `SUMMARY:${escape(args.summary)}`,
  ];
  if (args.description) lines.push(fold(`DESCRIPTION:${escape(args.description)}`));
  if (args.location) lines.push(fold(`LOCATION:${escape(args.location)}`));
  if (args.url) lines.push(fold(`URL:${args.url}`));
  lines.push(`STATUS:${args.status ?? "CONFIRMED"}`);
  lines.push(`SEQUENCE:${args.sequence ?? 0}`);
  lines.push(
    fold(
      `ORGANIZER;CN=${escape(args.organizer.name)}:mailto:${args.organizer.email}`,
    ),
  );
  lines.push(
    fold(
      `ATTENDEE;CN=${escape(args.attendee.name)};RSVP=TRUE:mailto:${args.attendee.email}`,
    ),
  );
  lines.push("END:VEVENT");
  lines.push("END:VCALENDAR");
  return lines.join("\r\n");
}
