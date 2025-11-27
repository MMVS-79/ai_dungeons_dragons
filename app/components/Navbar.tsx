"use client";

import { useState, useEffect } from "react";
import { usePathname } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import { useSession, signOut } from "next-auth/react";
import styles from "./Navbar.module.css";

export default function Navbar() {
  const [menuOpen, setMenuOpen] = useState(false);
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [isMounted, setIsMounted] = useState(false);
  const pathname = usePathname();

  const { data: session, status } = useSession();

  const handleSignOut = async () => {
    await signOut({ callbackUrl: "/" });
  };

  // Detect campaign page
  const pathSegments = pathname?.split("/") || [];
  const isCampaignPage =
    pathSegments[1] === "campaigns" &&
    pathSegments[2] &&
    pathSegments[2] !== "new";

  useEffect(() => {
    setIsCollapsed(Boolean(isCampaignPage));
    setIsMounted(true);
  }, [isCampaignPage]);

  // Update navbar height
  useEffect(() => {
    const updateNavbarHeight = () => {
      const isMobile = window.innerWidth <= 1024;
      let height;

      if (isCollapsed) {
        height = isMobile ? "60px" : "60px";
      } else {
        height = isMobile ? "80px" : "160px";
      }

      document.documentElement.style.setProperty("--navbar-height", height);
    };

    updateNavbarHeight();
    window.addEventListener("resize", updateNavbarHeight);
    return () => window.removeEventListener("resize", updateNavbarHeight);
  }, [isCollapsed]);

  if (!isMounted) return null;

  return (
    <>
      {/* Collapsed top bar for campaign pages */}
      {isCampaignPage && isCollapsed && (
        <div
          className={styles.collapsedBar}
          onClick={() => setIsCollapsed(false)}
        >
          <div className={styles.collapsedBrand}>
            <Image
              src="/icons/white_logo_circle.png"
              alt="Logo"
              className={styles.collapsedLogo}
              width={64}
              height={64}
            />
            <span className={styles.collapsedProjectName}>DumbgeonsAI</span>
          </div>

          <div className={styles.collapsedCenter}>
            <span className={styles.expandText}>
              Click to expand navigation bar
            </span>
            <Image
              className={styles.Arrow}
              src="/icons/down_arrow.png"
              alt="expand navigation bar"
              width={20}
              height={10}
            />
          </div>
        </div>
      )}

      <nav
        className={`${styles.navbar} ${isCollapsed ? styles.collapsed : ""}`}
      >
        {/* Brand */}
        <div className={styles.brand}>
          <Link href="/" className={styles.logoLink}>
            <Image
              src="/icons/white_logo_circle.png"
              alt="Logo"
              className={styles.logo}
              width={64}
              height={64}
            />
            <span className={styles.projectName}>DumbgeonsAI</span>
          </Link>
        </div>

        {/* Desktop Buttons */}
        <div className={styles.buttons}>
          <Link href="/campaigns" className={styles.button}>
            Play Campaign
          </Link>

          <Link href="/#about-us" className={styles.button}>
            About Us
          </Link>

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
              <Image
                src="/icons/login_icon.png"
                alt="Login icon"
                className={styles.loginIcon}
                width={20}
                height={20}
              />
              Login
            </Link>
          )}
        </div>

        {/* Hamburger */}
        <div
          className={styles.hamburger}
          onClick={() => setMenuOpen(!menuOpen)}
        >
          <div className={menuOpen ? styles.bar1 : ""}></div>
          <div className={menuOpen ? styles.bar2 : ""}></div>
          <div className={menuOpen ? styles.bar3 : ""}></div>
        </div>

        {/* Collapse strip */}
        {isCampaignPage && !isCollapsed && (
          <div
            className={styles.collapseStrip}
            onClick={() => setIsCollapsed(true)}
          >
            <Image
              className={styles.Arrow}
              src="/icons/up_arrow.png"
              alt="collapse navigation bar"
              width={20}
              height={10}
            />
          </div>
        )}

        {/* Mobile slide-out menu */}
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
              <Image
                src="/icons/login_icon.png"
                alt="Login icon"
                className={styles.loginIcon}
                width={20}
                height={20}
              />
              Login
            </Link>
          )}
        </div>
      </nav>

      {!isCollapsed && <div className={styles.navbarSpacer}></div>}
    </>
  );
}
