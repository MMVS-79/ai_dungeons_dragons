import styles from "./home.module.css";

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
              <img
                src="webpage-images/20 Dice image.png"
                alt="D&D Illustration"
              />
            </div>
          </div>
        </div>

        {/* About Us Section */}
        <section id="about-us" className={styles.aboutUs}>
          <h2>Our Team</h2>
          <h3>
            Programming projects should be fun so why not create an interactive
            llm driven story DnD narrator!
          </h3>
          <div className={styles.aboutUsGrid}>
            <div className={styles.profile}>
              <img
                src="webpage-images/profile_test.png"
                alt="name1"
                className={styles.memberPicture}
              />
              <p className={styles.memberName}> Name 1 </p>
              <p className={styles.memberRole}> Role 1 </p>
              <p className={styles.memberBackground}> background 1 </p>
              <div className={styles.profileLinks}>
                <a href="https://linkedin.com" target="_blank">
                  <img src="./icons/icon_linkedin.png" />
                </a>
                <a
                  href="https://github.com/MMVS-79/ai_dungeons_dragons"
                  target="_blank"
                >
                  <img src="./icons/icon_github.png" />
                </a>
              </div>
            </div>

            <div className={styles.profile}>
              <img
                src="webpage-images/profile_test.png"
                alt="name1"
                className={styles.memberPicture}
              />
              <p className={styles.memberName}> Name 1 </p>
              <p className={styles.memberRole}> Role 1 </p>
              <p className={styles.memberBackground}> background 1 </p>
              <div className={styles.profileLinks}>
                <a href="https://linkedin.com" target="_blank">
                  <img src="./icons/icon_linkedin.png" />
                </a>
                <a
                  href="https://github.com/MMVS-79/ai_dungeons_dragons"
                  target="_blank"
                >
                  <img src="./icons/icon_github.png" />
                </a>
              </div>
            </div>

            <div className={styles.profile}>
              <img
                src="webpage-images/profile_test.png"
                alt="name1"
                className={styles.memberPicture}
              />
              <p className={styles.memberName}> Name 1 </p>
              <p className={styles.memberRole}> Role 1 </p>
              <p className={styles.memberBackground}> background 1 </p>
              <div className={styles.profileLinks}>
                <a href="https://linkedin.com" target="_blank">
                  <img src="./icons/icon_linkedin.png" />
                </a>
                <a
                  href="https://github.com/MMVS-79/ai_dungeons_dragons"
                  target="_blank"
                >
                  <img src="./icons/icon_github.png" />
                </a>
              </div>
            </div>

            <div className={styles.profile}>
              <img
                src="webpage-images/profile_test.png"
                alt="name1"
                className={styles.memberPicture}
              />
              <p className={styles.memberName}> Name 1 </p>
              <p className={styles.memberRole}> Role 1 </p>
              <p className={styles.memberBackground}> background 1 </p>
              <div className={styles.profileLinks}>
                <a href="https://linkedin.com" target="_blank">
                  <img src="./icons/icon_linkedin.png" />
                </a>
                <a
                  href="https://github.com/MMVS-79/ai_dungeons_dragons"
                  target="_blank"
                >
                  <img src="./icons/icon_github.png" />
                </a>
              </div>
            </div>

            <div className={styles.profile}>
              <img
                src="webpage-images/profile_test.png"
                alt="name1"
                className={styles.memberPicture}
              />
              <p className={styles.memberName}> Name 1 </p>
              <p className={styles.memberRole}> Role 1 </p>
              <p className={styles.memberBackground}> background 1 </p>
              <div className={styles.profileLinks}>
                <a href="https://linkedin.com" target="_blank">
                  <img src="./icons/icon_linkedin.png" />
                </a>
                <a
                  href="https://github.com/MMVS-79/ai_dungeons_dragons"
                  target="_blank"
                >
                  <img src="./icons/icon_github.png" />
                </a>
              </div>
            </div>

            <div className={styles.profile}>
              <img
                src="webpage-images/profile_test.png"
                alt="name1"
                className={styles.memberPicture}
              />
              <p className={styles.memberName}> Name 1 </p>
              <p className={styles.memberRole}> Role 1 </p>
              <p className={styles.memberBackground}> background 1 </p>
              <div className={styles.profileLinks}>
                <a href="https://linkedin.com" target="_blank">
                  <img src="./icons/icon_linkedin.png" />
                </a>
                <a
                  href="https://github.com/MMVS-79/ai_dungeons_dragons"
                  target="_blank"
                >
                  <img src="./icons/icon_github.png" />
                </a>
              </div>
            </div>
          </div>
        </section>
      </main>
    </>
  );
}
