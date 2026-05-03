import { z } from "zod";

const schema = z.object({
  MONGODB_URI: z.string().min(1),
  NEXTAUTH_SECRET: z.string().min(1),
  NEXTAUTH_URL: z.url(),
  APP_URL: z.url(),
  COMPOSIO_API_KEY: z.string().min(1),

  RESEND_API_KEY: z.string().min(1),
  EMAIL_FROM: z.string().min(1),
  DATA_ENCRYPTION_KEY: z.string().min(44),

  STRIPE_CONNECT_CLIENT_ID: z.string().optional(),
  STRIPE_SECRET_KEY: z.string().optional(),
  STRIPE_WEBHOOK_SECRET: z.string().optional(),
  STRIPE_PUBLISHABLE_KEY: z.string().optional(),
  PLATFORM_FEE_BPS: z.coerce.number().int().min(0).max(10_000).default(0),
  GIPHY_API_KEY: z.string().optional(),
});

type Env = z.infer<typeof schema>;

let parsed: Env | null = null;

export function env(): Env {
  if (parsed) return parsed;
  const result = schema.safeParse(process.env);
  if (!result.success) {
    if (process.env.NEXT_PHASE === "phase-production-build") {
      return new Proxy({} as Env, {
        get: (_, key: string) => process.env[key] ?? "build-placeholder",
      });
    }
    const missing = result.error.issues.map((i) => i.path.join(".")).join(", ");
    throw new Error(`Missing/invalid env vars: ${missing}`);
  }
  parsed = result.data;
  return parsed;
}

export function paymentsConfigured(): { stripe: boolean; nowpayments: boolean } {
  const e = env();
  return {
    stripe: Boolean(e.STRIPE_SECRET_KEY && e.STRIPE_WEBHOOK_SECRET),
    nowpayments: true,
  };
}
