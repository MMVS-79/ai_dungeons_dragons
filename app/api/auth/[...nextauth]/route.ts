// app/api/auth/[...nextauth]/route.ts
import NextAuth, { AuthOptions } from "next-auth";
import GoogleProvider from "next-auth/providers/google";

/**
 * NextAuth Authentication API Route
 * ===================================
 *
 * Handles Google OAuth authentication for the application.
 *
 * Endpoints:
 *   GET  /api/auth/[...nextauth] - NextAuth dynamic routes (signin, callback, etc.)
 *   POST /api/auth/[...nextauth] - NextAuth authentication processing
 *
 * Authentication Flow:
 *   1. User clicks "Continue with Google" on login page
 *   2. Redirected to Google OAuth consent screen
 *   3. After approval, callback returns to /api/auth/callback/google
 *   4. Session created with user information from Google
 *   5. User redirected to /campaigns page
 *
 * Session Data:
 *   session.user.id    - Google OAuth user ID (from token.sub)
 *   session.user.name  - User's display name
 *   session.user.email - User's email address
 *   session.user.image - Profile picture URL
 *
 * Configuration:
 *   Required environment variables:
 *   - GOOGLE_CLIENT_ID: OAuth 2.0 client ID from Google Cloud Console
 *   - GOOGLE_CLIENT_SECRET: OAuth 2.0 client secret
 *   - NEXTAUTH_SECRET: Random string for session encryption
 *
 * Pages:
 *   Custom pages defined for better UX:
 *   - signIn: /login (custom branded login page)
 *   - error: /login (shows errors on login page)
 *
 * Callbacks:
 *   - session(): Adds user.id from JWT token to session object
 *
 * Security:
 *   - Uses 'offline' access for refresh tokens
 *   - Forces consent screen each time (can be changed)
 *   - Debug mode enabled in development
 */

const GOOGLE_CLIENT_ID = process.env.GOOGLE_CLIENT_ID;
const GOOGLE_CLIENT_SECRET = process.env.GOOGLE_CLIENT_SECRET;
const NEXTAUTH_SECRET = process.env.NEXTAUTH_SECRET;

// Fail early with a helpful message if required env is missing
if (!GOOGLE_CLIENT_ID || !GOOGLE_CLIENT_SECRET || !NEXTAUTH_SECRET) {
  throw new Error(
    "Missing required NEXTAUTH env vars. Ensure GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET and NEXTAUTH_SECRET are set.",
  );
}

/**
 * NextAuth configuration
 * Exported for use with getServerSession() in API routes
 */
export const authOptions: AuthOptions = {
  providers: [
    GoogleProvider({
      clientId: GOOGLE_CLIENT_ID,
      clientSecret: GOOGLE_CLIENT_SECRET,
      authorization: {
        params: {
          prompt: "consent", // shows consent screen (useful for refresh tokens)
          access_type: "offline", // request refresh token
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
      // session.user is now guaranteed to have an 'id' property due to type augmentation.
      if (session.user && token.sub) {
        session.user.id = token.sub;
      }
      return session;
    },
  },
  debug: process.env.NODE_ENV !== "production",
  secret: NEXTAUTH_SECRET,
};

const handler = NextAuth(authOptions);

export { handler as GET, handler as POST };
