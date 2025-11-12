// app/api/auth/[...nextauth]/route.ts
import NextAuth from "next-auth";
import GoogleProvider from "next-auth/providers/google";

const GOOGLE_CLIENT_ID = process.env.GOOGLE_CLIENT_ID;
const GOOGLE_CLIENT_SECRET = process.env.GOOGLE_CLIENT_SECRET;
const NEXTAUTH_SECRET = process.env.NEXTAUTH_SECRET;

// Fail early with a helpful message if required env is missing
if (!GOOGLE_CLIENT_ID || !GOOGLE_CLIENT_SECRET || !NEXTAUTH_SECRET) {
  throw new Error(
    "Missing required NEXTAUTH env vars. Ensure GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET and NEXTAUTH_SECRET are set."
  );
}

const handler = NextAuth({
  providers: [
    GoogleProvider({
      clientId: GOOGLE_CLIENT_ID,
      clientSecret: GOOGLE_CLIENT_SECRET,
      authorization: {
        params: {
          prompt: "consent",        // shows consent screen (useful for refresh tokens)
          access_type: "offline",   // request refresh token
          response_type: "code",
        },
      },
    }),
  ],
  pages: {
    signIn: "/login",
    error: "/login",
  },

  callbacks: {
    async session({ session, token }) {
      // token.sub should be the user id from provider (string). Add it to session safely.
      if (session.user && token.sub) {
        // If using TS, augment Session type to include `user.id`.
        (session.user as any).id = token.sub;
      }
      return session;
    },
    // Optionally add `jwt` callback if you need to persist custom token claims
  },

  debug: process.env.NODE_ENV !== "production",
  secret: NEXTAUTH_SECRET,
});

export { handler as GET, handler as POST };
