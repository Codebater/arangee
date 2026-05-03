import type { ObjectId } from "mongodb";

export type EventColor = "iris" | "rose" | "amber" | "sage" | "slate";

export type CustomQuestion =
  | { id: string; label: string; type: "short_text" | "long_text"; required: boolean }
  | { id: string; label: string; type: "select"; required: boolean; options: string[] };

export type LocationSpec =
  | { type: "google_meet" }
  | { type: "phone"; phoneNumber: string }
  | { type: "custom"; customText: string };

export type FontChoice = "geist" | "inter" | "manrope" | "ibm-plex";

export interface UserBranding {
  avatarImageId?: ObjectId;
  bannerImageId?: ObjectId;
  themeTokensLight?: Record<string, string>;
  themeTokensDark?: Record<string, string>;
  font?: FontChoice;
  showBookingMeta?: boolean;
  hideBookedSlots?: boolean;
  profileCard?: { template: string; params?: Record<string, string> };
}

export interface UserPaymentConnections {
  stripe?: {
    accountId: string;
    chargesEnabled: boolean;
    detailsSubmitted: boolean;
    connectedAt: Date;
  };
  nowpayments?: {
    apiKeyEnc: string;
    ipnSecretEnc: string;
    connectedAt: Date;
  };
}

export type SubscriptionStatus =
  | "active"
  | "trialing"
  | "past_due"
  | "canceled"
  | "incomplete"
  | "incomplete_expired"
  | "unpaid"
  | "paused";

export interface UserSubscription {
  stripeCustomerId: string;
  stripeSubscriptionId: string;
  status: SubscriptionStatus;
  currentPeriodEnd: Date | null;
  cancelAtPeriodEnd: boolean;
}

export interface UserDonations {
  totalCents: number;
  currency: string;
  latest?: { amount: number; currency: string; paidAt: Date };
}

export type LinkPlatform =
  | "website"
  | "email"
  | "github"
  | "twitter"
  | "linkedin"
  | "instagram"
  | "youtube"
  | "twitch"
  | "tiktok"
  | "discord"
  | "telegram"
  | "mastodon"
  | "bluesky"
  | "custom";

export interface ProfileLink {
  id: string;
  platform: LinkPlatform;
  url: string;
  label?: string;
}

export type BadgeColor =
  | "primary"
  | "blue"
  | "green"
  | "amber"
  | "rose"
  | "slate";

export interface ProfileBadge {
  id: string;
  label: string;
  color: BadgeColor;
}

export type TierBadgeType =
  | "free"
  | "pro"
  | "king"
  | "supporter"
  | "developer";

export interface UserDoc {
  _id: ObjectId;
  email: string;
  username: string;
  name: string;
  bio: string | null;
  defaultTimezone: string;
  passwordHash: string;
  emailVerifiedAt: Date | null;
  plan: "free" | "pro";
  links?: ProfileLink[];
  badges?: ProfileBadge[];
  tierBadges?: TierBadgeType[];
  branding?: UserBranding;
  payments?: UserPaymentConnections;
  subscription?: UserSubscription;
  donations?: UserDonations;
  createdAt: Date;
  updatedAt: Date;
}

export interface VerificationTokenDoc {
  _id: ObjectId;
  userId: ObjectId;
  token: string;
  kind: "email_verify" | "password_reset";
  expiresAt: Date;
  createdAt: Date;
}

export type ConnectionStatus = "ACTIVE" | "EXPIRED" | "FAILED" | "INACTIVE" | "INITIATED";

export type IntegrationProvider = "google_calendar" | "apple_calendar_mirror";

export interface IntegrationDoc {
  _id: ObjectId;
  userId: ObjectId;
  provider: IntegrationProvider;
  status: ConnectionStatus;
  calendarId: string;
  calendarSummary: string;
  connectedAt: Date;
  lastCheckedAt: Date;
  // google_calendar:
  composioConnectionId?: string;
  composioUserId?: string;
  // apple_calendar_mirror:
  appleEmail?: string;
  appleAppPasswordEnc?: string;
  calendarHomeUrl?: string;
}

export type PaymentProviderId = "stripe" | "nowpayments";

export type RefundPolicy = "full" | "partial" | "none";

export interface EventPaymentConfig {
  enabled: boolean;
  provider: PaymentProviderId;
  amount: number;
  currency: string;
  description?: string;
  refund: {
    policy: RefundPolicy;
    partialPercent?: number;
    cutoffHours?: number;
  };
}

export interface EventTypeDoc {
  _id: ObjectId;
  userId: ObjectId;
  slug: string;
  title: string;
  description: string;
  durationMinutes: number;
  color: EventColor;
  location: LocationSpec;
  rules: {
    bufferBeforeMin: number;
    bufferAfterMin: number;
    minNoticeMinutes: number;
    maxAdvanceDays: number;
    maxBookingsPerDay: number | null;
  };
  customQuestions: CustomQuestion[];
  payment?: EventPaymentConfig;
  active: boolean;
  position: number;
  createdAt: Date;
  updatedAt: Date;
}

export interface AvailabilityDoc {
  _id: ObjectId;
  userId: ObjectId;
  timezone: string;
  weeklyHours: Array<{
    dayOfWeek: 0 | 1 | 2 | 3 | 4 | 5 | 6;
    intervals: Array<{ start: string; end: string }>;
  }>;
  dateOverrides: Array<{
    date: string;
    intervals: Array<{ start: string; end: string }>;
  }>;
  updatedAt: Date;
}

export type BookingStatus = "confirmed" | "cancelled" | "rescheduled";

export interface BookingPaymentRecord {
  provider: PaymentProviderId;
  sessionId: string;
  amount: number;
  currency: string;
  paidAt: Date;
  refund?: {
    id: string;
    amount: number;
    refundedAt: Date;
  };
}

export interface BookingDoc {
  _id: ObjectId;
  userId: ObjectId;
  eventTypeSlug: string;
  eventTypeId: ObjectId;
  guestName: string;
  guestEmail: string;
  guestTimezone: string;
  customAnswers: Record<string, string>;
  startUtc: Date;
  endUtc: Date;
  googleEventId: string;
  meetLink: string | null;
  manageToken: string;
  status: BookingStatus;
  payment?: BookingPaymentRecord;
  appleObjectUrl?: string;
  appleObjectEtag?: string;
  rescheduledToBookingId: ObjectId | null;
  createdAt: Date;
  cancelledAt: Date | null;
}

export type PendingBookingStatus = "awaiting" | "completed" | "expired";

export interface PendingBookingDoc {
  _id: ObjectId;
  userId: ObjectId;
  eventTypeId: ObjectId;
  eventTypeSlug: string;
  payload: {
    guestName: string;
    guestEmail: string;
    guestTimezone: string;
    customAnswers: Record<string, string>;
    startUtc: Date;
  };
  provider: PaymentProviderId;
  sessionId: string;
  amount: number;
  currency: string;
  status: PendingBookingStatus;
  bookingId: ObjectId | null;
  expiresAt: Date;
  createdAt: Date;
}

export interface ImageDoc {
  _id: ObjectId;
  ownerUserId: ObjectId;
  contentType: "image/png" | "image/jpeg" | "image/webp" | "image/gif";
  data: Buffer;
  sizeBytes: number;
  width: number;
  height: number;
  kind: "avatar" | "banner";
  createdAt: Date;
}

export interface WebhookEventDoc {
  _id: ObjectId;
  provider: PaymentProviderId;
  externalId: string;
  receivedAt: Date;
}
