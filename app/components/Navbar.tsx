"use client";

import { useState, useEffect } from "react";
import { usePathname } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import styles from "./Navbar.module.css";

export default function Navbar() {
  const [menuOpen, setMenuOpen] = useState(false);
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [isMounted, setIsMounted] = useState(false);
  const pathname = usePathname();

  // Check if we're on a campaign page (exclude /campaigns/new)
  const pathSegments = pathname?.split("/") || [];
  const isCampaignPage = pathSegments[1] === "campaigns" && pathSegments[2] && pathSegments[2] !== "new";

  // Set collapsed state based on page on mount
  useEffect(() => {
    setIsCollapsed(Boolean(isCampaignPage));
    setIsMounted(true);
  }, [isCampaignPage]);

  // different navbar height based on collapsed vs expanded
  useEffect(() => {
    const updateNavbarHeight = () => {
      const isMobile = window.innerWidth <= 1024;
      let height;

      if (isCollapsed) {
        height = isMobile ? '60px' : '60px';   // collaped mobile : collapsed desktop
      } else {
        height = isMobile ? '80px' : '160px'; // expanded mobile : expanded desktop
      }

      document.documentElement.style.setProperty('--navbar-height', height);
    };

    // run on mount + when collapsed state changes
    updateNavbarHeight();

    // also run on resize
    window.addEventListener('resize', updateNavbarHeight);
    return () => window.removeEventListener('resize', updateNavbarHeight);
  }, [isCollapsed]);

  // Don't render until mounted to prevent flash
  if (!isMounted) {
    return null;
  }

  return (
    <>
      {/* Collapsed state bar - only show on campaign pages when collapsed */}
      {isCampaignPage && isCollapsed && (
        <div 
          className={styles.collapsedBar}
          onClick={() => setIsCollapsed(false)}
        >
          <div className={styles.collapsedBrand}>
            <Image
              src="/icons/white logo - circle.png"
              alt="Logo"
              className={styles.collapsedLogo}
              width={64}
              height={64}
            />
            <span className={styles.collapsedProjectName}>Dumbgeons & Dragons</span>
          </div>
          <div className={styles.collapsedCenter}>
            <span className={styles.expandText}>Click to expand navigation bar</span>
            <Image className={styles.Arrow} src="/icons/down_arrow.png" alt="expand navigation bar arrow" width={20} height={10} />
          </div>
        </div>
      )}

      {/* Main navbar */}
      <nav className={`${styles.navbar} ${isCollapsed ? styles.collapsed : ""}`}>
        {/* Brand Section */}
        <div className={styles.brand}>
          <Link href="/" className={styles.logoLink}>
            <Image
              src="/icons/white logo - circle.png"
              alt="Logo"
              className={styles.logo}
              width={64}
              height={64}
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
            <Image
              src="/icons/Login icon.png"
              alt="Logo"
              className={styles.loginIcon}
              width={20} 
              height={20}
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

        {/* Collapse button strip - only show on campaign pages when expanded */}
        {isCampaignPage && !isCollapsed && (
          <div 
            className={styles.collapseStrip}
            onClick={() => setIsCollapsed(true)}
          >
            <Image className={styles.Arrow} src="/icons/up_arrow.png" alt="collapse navigation bar arrow" width={20} height={10} />
          </div>
        )}

        {/* Slide-out mobile menu */}
        <div className={`${styles.mobileMenu} ${menuOpen ? styles.open : ""}`}>
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
          <Link
            href="/#about-us"
            className={styles.mobileButton}
            onClick={() => setMenuOpen(false)}
          >
            About Us
          </Link>
          <Link
            href="/login"
            className={`${styles.mobileButton} ${styles.login}`}
            onClick={() => setMenuOpen(false)}
          >
            <Image
              src="/icons/Login icon.png"
              alt="Logo"
              className={styles.loginIcon}
              width={20}
              height={20}
            />
            Login
          </Link>
        </div>
      </nav>
      
      {/* Spacer to prevent content from going under navbar when expanded */}
      {!isCollapsed && <div className={styles.navbarSpacer}></div>}
    </>
  );
}
