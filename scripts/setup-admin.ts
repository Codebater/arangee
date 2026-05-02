/**
 * One-shot script to convert a v1 admin user (or create one fresh) into a
 * fully-formed v2 user with username + bcrypt password hash + verifiedAt.
 *
 * Usage (from project root):
 *   MONGODB_URI="mongodb+srv://..." \
 *   npx tsx scripts/setup-admin.ts <email> <username> <password>
 *
 * If a user with that email already exists, only the missing v2 fields are
 * filled in (existing event types / availability / bookings are preserved).
 * Otherwise a new user is created.
 */

import { MongoClient, ObjectId } from "mongodb";
import bcrypt from "bcryptjs";

async function main() {
  const [, , email, username, password] = process.argv;
  if (!email || !username || !password) {
    console.error("usage: tsx scripts/setup-admin.ts <email> <username> <password>");
    process.exit(1);
  }
  if (password.length < 8) {
    console.error("password must be at least 8 characters");
    process.exit(1);
  }
  const uri = process.env.MONGODB_URI;
  if (!uri) {
    console.error("MONGODB_URI env var is required");
    process.exit(1);
  }

  const client = new MongoClient(uri);
  await client.connect();
  const db = client.db("kalendly");
  const users = db.collection("users");

  const passwordHash = await bcrypt.hash(password, 12);
  const now = new Date();
  const existing = await users.findOne({ email: email.toLowerCase() });

  if (existing) {
    const userId = existing._id as ObjectId;
    const usernameClash = await users.findOne({
      username: username.toLowerCase(),
      _id: { $ne: userId },
    });
    if (usernameClash) {
      console.error(`username "${username}" is already taken by another user`);
      process.exit(1);
    }
    await users.updateOne(
      { _id: userId },
      {
        $set: {
          username: username.toLowerCase(),
          passwordHash,
          emailVerifiedAt: now,
          plan: existing.plan ?? "free",
          updatedAt: now,
        },
      },
    );

    const eventTypes = db.collection("eventTypes");
    const bookings = db.collection("bookings");
    const availability = db.collection("availability");

    const stamped = await Promise.all([
      eventTypes.updateMany({ userId: { $exists: false } }, { $set: { userId } }),
      bookings.updateMany({ userId: { $exists: false } }, { $set: { userId } }),
      availability.updateMany({ userId: { $exists: false } }, { $set: { userId } }),
    ]);

    console.log(
      `migrated existing user ${email} -> @${username}; backfilled ` +
        `eventTypes=${stamped[0].modifiedCount}, ` +
        `bookings=${stamped[1].modifiedCount}, ` +
        `availability=${stamped[2].modifiedCount}`,
    );
  } else {
    const usernameClash = await users.findOne({ username: username.toLowerCase() });
    if (usernameClash) {
      console.error(`username "${username}" is already taken`);
      process.exit(1);
    }
    await users.insertOne({
      _id: new ObjectId(),
      email: email.toLowerCase(),
      username: username.toLowerCase(),
      name: username,
      bio: null,
      defaultTimezone: "UTC",
      passwordHash,
      emailVerifiedAt: now,
      plan: "free",
      createdAt: now,
      updatedAt: now,
    });
    console.log(`created new user ${email} -> @${username}`);
  }

  await client.close();
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
