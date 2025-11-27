import styles from "./home.module.css";
import Image from "next/image";
import TeamMember from "./components/TeamMember";

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
        {/* Main Info Section */}
        <div className={styles.mainInfo}>
          <h1>Your Adventure Awaits You</h1>

          <div className={styles.mainInfoBody}>
            <p className={styles.mainInfoText}>
              Step into the tavern with nothing but your imagination—our
              intelligent Game Master takes it from there. No prep, no
              spreadsheets—just fair rulings, smart prompts, and a living world
              that remembers each adventure. Start your campaign, roll the dice,
              and let your story unfold..
            </p>
            <div className={styles.mainInfoImage}>
              <Image
                src="/webpage-images/20_dice_image.png"
                alt="D&D Illustration"
                width={512}
                height={512}
              />
            </div>
          </div>
        </div>

        {/* Our Team Section */}
        <section id="our-team" className={styles.aboutUs}>
          <h2>Our Team</h2>
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
