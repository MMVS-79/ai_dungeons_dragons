// app/login/page.tsx
"use client";

import { signIn } from "next-auth/react";
import { useRouter } from "next/navigation";
import styles from "./login.module.css";

export default function LoginPage() {
  const router = useRouter();

  const handleGoogleSignIn = async () => {
    try {
      const result = await signIn("google", {
        callbackUrl: "/Campaigns",
        redirect: false,
      });

      if (result?.ok) {
        router.push("/Campaigns");
      }
    } catch (error) {
      console.error("Sign in error:", error);
    }
  };

  return (
    <div className={styles.container}>
      <div className={styles.loginCard}>
        <img
          src="/icons/white logo - circle.png"
          alt="Logo"
          className={styles.logo}
        />
        <h1 className={styles.title}>DumbgeonsAI</h1>
        <p className={styles.subtitle}>Sign in to start your adventure</p>

        <button onClick={handleGoogleSignIn} className={styles.googleButton}>
          <img
            src="/icons/google-icon.svg"
            alt="Google"
            className={styles.googleIcon}
          />
          Continue with Google
        </button>

        <p className={styles.terms}>
          By continuing, you agree to our Terms of Service and Privacy Policy
        </p>
      </div>
    </div>
  );
}