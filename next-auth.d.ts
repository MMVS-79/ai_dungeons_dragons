import NextAuth, { DefaultSession } from "next-auth";

// 1. Augment the Session type
declare module "next-auth" {
  /**
   * Returned by `useSession`, `getSession` and received as a prop on the `SessionProvider` React Context
   */
  interface Session {
    user: {
      /** The user's unique ID */
      id: string; 
    } & DefaultSession["user"];
  }
}

// 2. Augment the JWT type (optional, but good practice if you use token)
declare module "next-auth/jwt" {
  /** Returned by the `jwt` callback and the `getToken` helper */
  interface JWT {
    id: string; // The user's unique ID from the provider
  }
}