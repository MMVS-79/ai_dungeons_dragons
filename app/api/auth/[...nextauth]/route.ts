// app/api/auth/[...nextauth]/route.ts
import NextAuth from "next-auth";
import GoogleProvider from "next-auth/providers/google";

// TEMPORARY: Hard-code for testing (REMOVE BEFORE COMMITTING!)
const GOOGLE_CLIENT_ID = process.env.GOOGLE_CLIENT_ID || "487437135541-ntj9ha0akcp3vq5kc7mccob59vk0tf5t.apps.googleusercontent.com";
const GOOGLE_CLIENT_SECRET = process.env.GOOGLE_CLIENT_SECRET || "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";
const NEXTAUTH_SECRET = process.env.NEXTAUTH_SECRET || "w4x5k+9J9fPq7G3kT+0wC4YFJxM/7H9qvN5l6TQYbUg=";



// Debug: Check if env vars are loaded
console.log("Environment check:");
console.log("GOOGLE_CLIENT_ID exists:", !!GOOGLE_CLIENT_ID && GOOGLE_CLIENT_ID !== "your-client-id-here");
console.log("GOOGLE_CLIENT_SECRET exists:", !!GOOGLE_CLIENT_SECRET && GOOGLE_CLIENT_SECRET !== "your-client-secret-here");
console.log("NEXTAUTH_SECRET exists:", !!NEXTAUTH_SECRET);
console.log("NEXTAUTH_URL:", process.env.NEXTAUTH_URL || "http://localhost:3000");

const handler = NextAuth({
  providers: [
    GoogleProvider({
      clientId: GOOGLE_CLIENT_ID,
      clientSecret: GOOGLE_CLIENT_SECRET,
      authorization: {
        params: {
          prompt: "consent",
          access_type: "offline",
          response_type: "code"
        }
      }
    }),
  ],
  pages: {
    signIn: '/login',
    error: '/login',
  },
  callbacks: {
    async session({ session, token }) {
      if (session.user) {
        session.user.id = token.sub!;
      }
      return session;
    },
  },
  debug: true,
  secret: NEXTAUTH_SECRET,
});

export { handler as GET, handler as POST };