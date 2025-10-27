import Navbar from "./components/Navbar";
import styles from "./page.module.css";

export default function Landing() {
  return (
    <>
      <Navbar />
      <main className={styles.mainGrid}>
        <div className={styles.hero}>
          <h1>Your Adventure Awaits You</h1>
          <p>
            Step into the tavern with nothing but your imagination—our intelligent Game Master takes it from there. No prep, no spreadsheets—just fair rulings, smart prompts, and a living world that remembers each adventure. Start your campaign, roll the dice, and let your story unfold..
          </p>
        </div>

        <div className={styles.heroImage}>
          <img src="20 Dice image.png" alt="D&D Illustration" />
        </div>

        {/* Story section */}
        <section id="story" className={styles.section}>
          <h2>Story</h2>
          <p>
            Dive into a living, breathing adventure where your choices shape the journey. Powered by advanced AI, our game brings a D&D-style narrative to life interactive, button-based decisions with dice based results. Every choice you make creates branching paths, unexpected encounters, and unique outcomes, making each playthrough a one-of-a-kind story.
          </p>
        </section>

        {/* Character section */}
        <section id="character" className={styles.section}>
          <h2>Characters</h2>
          <p>
            Create your hero and bring them to life. Choose your character’s race, class, and background, shaping who they are and how they interact with the world. From cunning rogues to mighty warriors, every decision influences your abilities, story opportunities, and the way the adventure unfolds—just like in a classic D&D campaign.
          </p>
        </section>
      </main>
    </>
  );
}
