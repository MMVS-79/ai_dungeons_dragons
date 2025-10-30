"use client";

import { useState } from "react";
import Link from "next/link";
import styles from "./Navbar.module.css";

export default function Navbar() {
  const [menuOpen, setMenuOpen] = useState(false);

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
          <span className={styles.projectName}>Dumbgeons & Dragons</span>
        </Link>
      </div>

      {/* Buttons (desktop only) */}
      <div className={styles.buttons}>
        <Link href="/campaigns" className={styles.button}>
          Play Campaign
        </Link>
        <Link href="/#about-us" className={styles.button}>
          About Us
        </Link>
        <Link href="/login" className={`${styles.button} ${styles.login}`}>
          <img
            src="/icons/Login icon.png"
            alt="Logo"
            className={styles.loginIcon}
          />
          Login
        </Link>
      </div>

      {/* Hamburger (mobile only) */}
      <div className={styles.hamburger} onClick={() => setMenuOpen(!menuOpen)}>
        <div className={menuOpen ? styles.bar1 : ""}></div>
        <div className={menuOpen ? styles.bar2 : ""}></div>
        <div className={menuOpen ? styles.bar3 : ""}></div>
      </div>

      {/* Slide-out mobile menu */}
      <div className={`${styles.mobileMenu} ${menuOpen ? styles.open : ""}`}>
        {/* Add a close hamburger inside mobile menu */}
        <div className={styles.hamburger} onClick={() => setMenuOpen(false)}>
          <div></div>
          <div></div>
          <div></div>
        </div>
        <Link
          href="/campaigns"
          className={styles.mobileButton}
          onClick={() => setMenuOpen(false)}
        >
          Play Campaign
        </Link>
        <a
          href="/#about-us"
          className={styles.mobileButton}
          onClick={() => setMenuOpen(false)}
        >
          About Us
        </a>
        <Link
          href="/login"
          className={`${styles.mobileButton} ${styles.login}`}
          onClick={() => setMenuOpen(false)}
        >
          <img
            src="/icons/Login icon.png"
            alt="Logo"
            className={styles.loginIcon}
          />
          Login
        </Link>
      </div>
    </nav>
  );
}
