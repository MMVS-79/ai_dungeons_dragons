"use client";

import { useState } from "react";
import { useSession, signOut } from "next-auth/react";
import Link from "next/link";
import styles from "./Navbar.module.css";

export default function Navbar() {
  const [menuOpen, setMenuOpen] = useState(false);
  const { data: session, status } = useSession();

  const handleSignOut = async () => {
    await signOut({ callbackUrl: "/" });
  };

  return (
    <nav className={styles.navbar}>
      {/* Brand Section */}
      <div className={styles.brand}>
        <Link href="/" className={styles.logoLink}>
          <img
            src="/icons/white logo - circle.png"
            alt="Logo"
            className={styles.logo}
          />
          <span className={styles.projectName}>DumbgeonsAI</span>
        </Link>
      </div>

      {/* Buttons (desktop only) */}
      <div className={styles.buttons}>
        <Link href="/campaigns" className={styles.button}>
          Play Campaign
        </Link>
        <a href="#about-us" className={styles.button}>
          About Us
        </a>
        
        {status === "loading" ? (
          <div className={styles.button}>Loading...</div>
        ) : session ? (
          <>
            <div className={styles.userInfo}>
              {session.user?.image && (
                <img
                  src={session.user.image}
                  alt="Profile"
                  className={styles.profileImage}
                />
              )}
              <span>{session.user?.name}</span>
            </div>
            <button
              onClick={handleSignOut}
              className={`${styles.button} ${styles.login}`}
            >
              Sign Out
            </button>
          </>
        ) : (
          <Link href="/login" className={`${styles.button} ${styles.login}`}>
            <img
              src="/icons/Login icon.png"
              alt="Login"
              className={styles.loginIcon}
            />
            Login
          </Link>
        )}
      </div>

      {/* Hamburger (mobile only) */}
      <div className={styles.hamburger} onClick={() => setMenuOpen(!menuOpen)}>
        <div></div>
        <div></div>
        <div></div>
      </div>

      {/* Slide-out mobile menu */}
      <div className={`${styles.mobileMenu} ${menuOpen ? styles.open : ""}`}>
        <div className={styles.hamburger} onClick={() => setMenuOpen(false)}>
          <div></div>
          <div></div>
          <div></div>
        </div>
        
        <Link
          href="/Campaigns"
          className={styles.mobileButton}
          onClick={() => setMenuOpen(false)}
        >
          Play Campaign
        </Link>
        <a
          href="#about-us"
          className={styles.mobileButton}
          onClick={() => setMenuOpen(false)}
        >
          About Us
        </a>
        
        {session ? (
          <>
            <div className={styles.userInfoMobile}>
              {session.user?.image && (
                <img
                  src={session.user.image}
                  alt="Profile"
                  className={styles.profileImage}
                />
              )}
              <span>{session.user?.name}</span>
            </div>
            <button
              onClick={() => {
                handleSignOut();
                setMenuOpen(false);
              }}
              className={`${styles.mobileButton} ${styles.login}`}
            >
              Sign Out
            </button>
          </>
        ) : (
          <Link
            href="/login"
            className={`${styles.mobileButton} ${styles.login}`}
            onClick={() => setMenuOpen(false)}
          >
            <img
              src="/icons/Login icon.png"
              alt="Login"
              className={styles.loginIcon}
            />
            Login
          </Link>
        )}
      </div>
    </nav>
  );
}