import Image from "next/image";
import Link from "next/link";
import styles from "./HeroSection.module.css";

interface HeroSectionProps {
  title: string;
  subtitle: string;
  description?: string;
  buttonText: string;
  buttonLink: string;
  backgroundImage: string;
  overlayOpacity?: number; // 0-100, default 70
  showSecondaryButton?: boolean;
  secondaryButtonText?: string;
  secondaryButtonLink?: string;
}

export default function HeroSection({
  title,
  subtitle,
  description,
  buttonText,
  buttonLink,
  backgroundImage,
  overlayOpacity = 70,
  showSecondaryButton = false,
  secondaryButtonText,
  secondaryButtonLink,
}: HeroSectionProps) {
  return (
    <section className={styles.heroSection}>
      {/* Background Image */}
      <div className={styles.heroBackground}>
        <Image
          src={backgroundImage}
          alt="Hero Background"
          fill
          style={{ objectFit: "cover" }}
          priority
          quality={100}
        />
        {/* Dark overlay for better text readability */}
        <div
          className={styles.heroOverlay}
          style={{
            background: `linear-gradient(
              to bottom,
              rgba(0, 0, 0, ${overlayOpacity / 100 - 0.1}) 0%,
              rgba(0, 0, 0, ${overlayOpacity / 100}) 100%
            )`,
          }}
        ></div>
      </div>

      {/* Hero Content */}
      <div className={styles.heroContent}>
        <h1 className={styles.heroTitle}>{title}</h1>
        <p className={styles.heroSubtitle}>{subtitle}</p>
        {description && <p className={styles.heroDescription}>{description}</p>}

        {/* Buttons Container */}
        <div className={styles.buttonContainer}>
          <Link href={buttonLink} className={styles.primaryButton}>
            {buttonText}
          </Link>

          {showSecondaryButton &&
            secondaryButtonText &&
            secondaryButtonLink && (
              <Link
                href={secondaryButtonLink}
                className={styles.secondaryButton}
              >
                {secondaryButtonText}
              </Link>
            )}
        </div>
      </div>
    </section>
  );
}
