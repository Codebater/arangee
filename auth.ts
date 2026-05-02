import NextAuth, { CredentialsSignin } from "next-auth";
import Credentials from "next-auth/providers/credentials";
import { ObjectId } from "mongodb";
import { env } from "@/lib/env";
import { users } from "@/lib/collections";
import { verifyPassword } from "@/lib/users";
import { loginSchema } from "@/lib/validation";

class EmailNotVerifiedError extends CredentialsSignin {
  code = "email_not_verified";
}

export const { handlers, auth, signIn, signOut } = NextAuth({
  secret: env().NEXTAUTH_SECRET,
  session: { strategy: "jwt", maxAge: 30 * 24 * 60 * 60 },
  providers: [
    Credentials({
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(raw) {
        const parsed = loginSchema.safeParse(raw);
        if (!parsed.success) return null;
        const user = await (await users()).findOne({
          email: parsed.data.email.toLowerCase(),
        });
        if (!user) return null;
        const ok = await verifyPassword(parsed.data.password, user.passwordHash);
        if (!ok) return null;
        if (!user.emailVerifiedAt) throw new EmailNotVerifiedError();
        return { id: user._id.toString(), email: user.email, name: user.name };
      },
    }),
  ],
  pages: { signIn: "/login" },
  callbacks: {
    authorized: ({ auth }) => !!auth?.user,
    async jwt({ token, user }) {
      if (user) token.id = user.id;
      return token;
    },
    async session({ session, token }) {
      if (token?.id) session.user.id = token.id as string;
      return session;
    },
  },
});

export { ObjectId };
