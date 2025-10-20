"use client";

import Link from "next/link";
import styles from "../../styles/Navbar.module.css";

export default function Navbar() {
  return (
    <nav className={styles.navbar}>
      {/* Brand Section */}
      <div className={styles.brand}>
        <Link href="/" className={styles.logoLink}>
          <img src="/Logo - Circle.png" alt="Logo" className={styles.logo} />
          <span className={styles.projectName}>Dumbgeons & Dragons</span>
        </Link>
      </div>

      {/* Buttons Section */}
      <div className={styles.buttons}>
        <Link href="/dragon-demo" className={styles.button}>
          Fight Demo
        </Link>
        <a href="#story" className={styles.button}>
          Story
        </a>
        <a href="#character" className={styles.button}>
          Characters
        </a>
        <Link href="/campaign-demo" className={styles.button}>
          Campaign Demo
        </Link>
        <Link href="/login" className={`${styles.button} ${styles.login}`}>
          Login
        </Link>
      </div>
    </nav>
  );
}
