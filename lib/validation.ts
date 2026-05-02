import { z } from "zod";
import { usernameSchema } from "./users";

const slugRe = /^[a-z0-9](?:[a-z0-9-]{0,48}[a-z0-9])?$/;

export const customQuestionSchema = z.discriminatedUnion("type", [
  z.object({
    id: z.string().min(1),
    label: z.string().min(1).max(120),
    type: z.literal("short_text"),
    required: z.boolean(),
  }),
  z.object({
    id: z.string().min(1),
    label: z.string().min(1).max(120),
    type: z.literal("long_text"),
    required: z.boolean(),
  }),
  z.object({
    id: z.string().min(1),
    label: z.string().min(1).max(120),
    type: z.literal("select"),
    required: z.boolean(),
    options: z.array(z.string().min(1).max(80)).min(1).max(20),
  }),
]);

export const locationSchema = z.discriminatedUnion("type", [
  z.object({ type: z.literal("google_meet") }),
  z.object({ type: z.literal("phone"), phoneNumber: z.string().min(3).max(40) }),
  z.object({ type: z.literal("custom"), customText: z.string().min(1).max(500) }),
]);

export const refundPolicySchema = z
  .object({
    policy: z.enum(["full", "partial", "none"]),
    partialPercent: z.number().int().min(0).max(100).optional(),
    cutoffHours: z.number().int().min(0).max(24 * 30).optional(),
  })
  .refine((v) => (v.policy === "partial" ? typeof v.partialPercent === "number" : true), {
    message: "partialPercent is required when policy is 'partial'",
    path: ["partialPercent"],
  });

export const eventPaymentConfigSchema = z.object({
  enabled: z.boolean(),
  provider: z.enum(["stripe", "nowpayments"]),
  amount: z.number().int().min(1).max(10_000_000),
  currency: z.string().min(2).max(10),
  description: z.string().max(500).optional(),
  refund: refundPolicySchema,
});

export const eventTypeFormSchema = z.object({
  title: z.string().min(1).max(120),
  description: z.string().max(2000).default(""),
  durationMinutes: z.number().int().min(5).max(8 * 60),
  color: z.enum(["iris", "rose", "amber", "sage", "slate"]),
  location: locationSchema,
  rules: z.object({
    bufferBeforeMin: z.number().int().min(0).max(240),
    bufferAfterMin: z.number().int().min(0).max(240),
    minNoticeMinutes: z.number().int().min(0).max(7 * 24 * 60),
    maxAdvanceDays: z.number().int().min(1).max(365),
    maxBookingsPerDay: z.number().int().min(1).max(50).nullable(),
  }),
  customQuestions: z.array(customQuestionSchema).max(20),
  payment: eventPaymentConfigSchema.optional(),
  active: z.boolean(),
});

export const availabilityFormSchema = z.object({
  timezone: z.string().min(1),
  weeklyHours: z
    .array(
      z.object({
        dayOfWeek: z.number().int().min(0).max(6),
        intervals: z.array(
          z.object({
            start: z.string().regex(/^\d{2}:\d{2}$/),
            end: z.string().regex(/^\d{2}:\d{2}$/),
          }),
        ),
      }),
    )
    .length(7),
  dateOverrides: z.array(
    z.object({
      date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
      intervals: z.array(
        z.object({
          start: z.string().regex(/^\d{2}:\d{2}$/),
          end: z.string().regex(/^\d{2}:\d{2}$/),
        }),
      ),
    }),
  ),
});

export const profileFormSchema = z.object({
  name: z.string().min(1).max(80),
  bio: z.string().max(280).nullable(),
  defaultTimezone: z.string().min(1),
});

export const signupSchema = z.object({
  email: z.email().max(254),
  username: usernameSchema,
  password: z.string().min(8).max(200),
  name: z.string().min(1).max(80),
});

export const loginSchema = z.object({
  email: z.email().max(254),
  password: z.string().min(1).max(200),
});

export const forgotSchema = z.object({
  email: z.email().max(254),
});

export const resetSchema = z.object({
  token: z.string().min(1),
  password: z.string().min(8).max(200),
});

const colorValueRe = /^#[0-9a-fA-F]{3,8}$|^rgba?\([\d.,\s]+\)$/;

export const brandingFormSchema = z.object({
  font: z.enum(["geist", "inter", "manrope", "ibm-plex"]).optional(),
  showBookingMeta: z.boolean().optional(),
  themeTokensLight: z.record(z.string().max(40), z.string().max(40).regex(colorValueRe)).optional(),
  themeTokensDark: z.record(z.string().max(40), z.string().max(40).regex(colorValueRe)).optional(),
});

export const fontChoiceSchema = z.enum(["geist", "inter", "manrope", "ibm-plex"]);

export const profileCardSchema = z.object({
  template: z.enum(["aurora", "constellation", "ribbons", "synthwave"]),
});

export const nowpaymentsKeysSchema = z.object({
  apiKey: z.string().min(8).max(200),
  ipnSecret: z.string().min(8).max(200),
});

export const bookingRequestSchema = z.object({
  username: usernameSchema,
  slug: z.string().regex(slugRe),
  startUtc: z.iso.datetime(),
  guestName: z.string().min(1).max(80),
  guestEmail: z.email().max(254),
  guestTimezone: z.string().min(1),
  customAnswers: z.record(z.string(), z.string().max(2000)),
});
