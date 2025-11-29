import styles from "./home.module.css";
import Image from "next/image";
import TeamMember from "./components/TeamMember";
import HeroSection from "./components/HeroSection";

// Team member data - easy to update and maintain
const teamMembers = [
  {
    name: "Jason Tieh",
    role: "Frontend Developer",
    background: "",
    imagePath: "/webpage-images/jason.jpg",
    linkedinUrl: "https://www.linkedin.com/in/jason-tieh/",
    githubUrl: "https://github.com/jktieh",
  },
  {
    name: "Cameron Dunn",
    role: "Technical Lead / Project Manager",
    background: "",
    imagePath: "/webpage-images/cameron.png",
    linkedinUrl: "https://www.linkedin.com/in/camdnnn/",
    githubUrl: "https://github.com/camdnnn",
  },
  {
    name: "Edmund Yu",
    role: "Backend Developer & AI",
    background: "",
    imagePath: "/webpage-images/edmund.jpeg",
    linkedinUrl: "https://www.linkedin.com",
    githubUrl: "https://github.com/Nolelle",
  },
  {
    name: "Jason Chiu",
    role: "Fullstack Developer",
    background: "",
    imagePath: "/webpage-images/default.png",
    linkedinUrl: "https://linkedin.com",
    githubUrl: "https://github.com/jaschdev",
  },
  {
    name: "Manuja Senanayake",
    role: "DevOps Engineer",
    background: "",
    imagePath: "/webpage-images/manuja.jpg",
    linkedinUrl: "https://linkedin.com",
    githubUrl: "https://github.com/MMVS-79",
  },
  {
    name: "Le Song",
    role: "Backend Developer",
    background: "",
    imagePath: "/webpage-images/default.png",
    linkedinUrl: "https://linkedin.com",
    githubUrl: "https://github.com/LS-Song-UC",
  },
];

export default function Landing() {
  return (
    <>
      <main className={styles.mainGrid}>
        {/* Hero Section */}
        <HeroSection
          title="Your Adventure Awaits"
          subtitle="Step into the tavern with nothing but your imagination—our intelligent Game Master takes it from there."
          description="No prep, no scheduling, just pure adventure. Roll the dice and let your story unfold."
          buttonText="⚔️ Play Now"
          buttonLink="/campaigns"
          backgroundImage="/webpage-images/hero-background.jpg"
          overlayOpacity={70}
          showSecondaryButton={false}
          secondaryButtonText=""
          secondaryButtonLink=""
        />

        {/* Features Section */}
        <section className={styles.featuresSection}>
          <h2 className={styles.sectionTitle}>Why DumbgeonsAI?</h2>
          <div className={styles.featuresGrid}>
            <div className={styles.featureCard}>
              <div className={styles.featureIcon}>🎲</div>
              <h3 className={styles.featureTitle}>No Prep Required</h3>
              <p className={styles.featureDescription}>
                Jump in and start playing immediately. No rule books, no
                preparation, no hassle.
              </p>
            </div>

            <div className={styles.featureCard}>
              <div className={styles.featureIcon}>🤖</div>
              <h3 className={styles.featureTitle}>AI Dungeon Master</h3>
              <p className={styles.featureDescription}>
                Your personal Game Master that's available 24/7 and never
                cancels sessions.
              </p>
            </div>

            <div className={styles.featureCard}>
              <div className={styles.featureIcon}>📖</div>
              <h3 className={styles.featureTitle}>Dynamic Storytelling</h3>
              <p className={styles.featureDescription}>
                Every choice matters. The world adapts to your decisions and
                remembers your journey.
              </p>
            </div>
          </div>
        </section>

        {/* How It Works Section */}
        <section className={styles.howItWorksSection}>
          <h2 className={styles.sectionTitle}>How It Works</h2>
          <div className={styles.stepsContainer}>
            <div className={styles.step}>
              <div className={styles.stepNumber}>1</div>
              <h3 className={styles.stepTitle}>Start Your Campaign</h3>
              <p className={styles.stepDescription}>
                Our AI generates a unique adventure tailored to your choices.
              </p>
            </div>

            <div className={styles.stepArrow}>→</div>

            <div className={styles.step}>
              <div className={styles.stepNumber}>2</div>
              <h3 className={styles.stepTitle}>Create Your Character</h3>
              <p className={styles.stepDescription}>
                Choose your race, class, and customize your hero in minutes.
              </p>
            </div>

            <div className={styles.stepArrow}>→</div>

            <div className={styles.step}>
              <div className={styles.stepNumber}>3</div>
              <h3 className={styles.stepTitle}>Roll the Dice</h3>
              <p className={styles.stepDescription}>
                Battle enemies, find treasure, and make choices that shape your
                story.
              </p>
            </div>
          </div>
        </section>

        {/* About Us Section */}
        <section id="about-us" className={styles.aboutUs}>
          <h2>Meet Your Dungeon Architects</h2>
          <p className={styles.aboutUsDescription}>
            
          </p>
          <div className={styles.aboutUsGrid}>
            {teamMembers.map((member, index) => (
              <TeamMember
                key={index}
                name={member.name}
                role={member.role}
                background={member.background}
                imagePath={member.imagePath}
                linkedinUrl={member.linkedinUrl}
                githubUrl={member.githubUrl}
              />
            ))}
          </div>
        </section>
      </main>
    </>
  );
}
