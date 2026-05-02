import { eventTypes, users } from "./collections";
import type { EventTypeDoc, UserDoc } from "./types";

export async function findUserByUsername(username: string): Promise<UserDoc | null> {
  const u = (await users()).findOne({ username: username.toLowerCase() });
  return u;
}

export async function resolveUserAndEventType(
  username: string,
  eventSlug: string,
): Promise<{ user: UserDoc; eventType: EventTypeDoc } | null> {
  const user = await findUserByUsername(username);
  if (!user) return null;
  const eventType = await (await eventTypes()).findOne({
    userId: user._id,
    slug: eventSlug,
    active: true,
  });
  if (!eventType) return null;
  return { user, eventType };
}

export async function listActiveEventTypes(userId: UserDoc["_id"]): Promise<EventTypeDoc[]> {
  return (await eventTypes())
    .find({ userId, active: true })
    .sort({ position: 1 })
    .toArray();
}
