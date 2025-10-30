"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Navbar from "../../components/Navbar";
import styles from "./newCampaign.module.css";

type Step = "name" | "stats" | "race" | "class" | "preview";

interface Race {
  name: string;
  hpBonus: number;
  attackBonus: number;
  defenseBonus: number;
}

interface Class {
  name: string;
  hpBonus: number;
  attackBonus: number;
  defenseBonus: number;
}

const races: Race[] = [
  { name: "Human", hpBonus: 5, attackBonus: 2, defenseBonus: 2 },
  { name: "Elf", hpBonus: 3, attackBonus: 4, defenseBonus: 1 },
  { name: "Dwarf", hpBonus: 8, attackBonus: 1, defenseBonus: 4 },
];

const classes: Class[] = [
  { name: "Warrior", hpBonus: 10, attackBonus: 3, defenseBonus: 5 },
  { name: "Mage", hpBonus: 5, attackBonus: 8, defenseBonus: 2 },
  { name: "Rogue", hpBonus: 7, attackBonus: 6, defenseBonus: 3 },
];

export default function NewCampaignPage() {
  const router = useRouter();
  const [currentStep, setCurrentStep] = useState<Step>("name");

  // Character data
  const [characterName, setCharacterName] = useState("");
  const [baseHP, setBaseHP] = useState(50);
  const [baseAttack, setBaseAttack] = useState(10);
  const [baseDefense, setBaseDefense] = useState(10);
  const [selectedRace, setSelectedRace] = useState<Race | null>(null);
  const [selectedClass, setSelectedClass] = useState<Class | null>(null);

  const steps: Step[] = ["name", "stats", "race", "class", "preview"];

  const getStepLabel = (step: Step): string => {
    switch (step) {
      case "name":
        return "Name";
      case "stats":
        return "Stats";
      case "race":
        return "Race";
      case "class":
        return "Class";
      case "preview":
        return "Preview";
    }
  };

  const calculateFinalStats = () => {
    const raceBonus = selectedRace || { hpBonus: 0, attackBonus: 0, defenseBonus: 0 };
    const classBonus = selectedClass || { hpBonus: 0, attackBonus: 0, defenseBonus: 0 };

    return {
      hp: baseHP + raceBonus.hpBonus + classBonus.hpBonus,
      attack: baseAttack + raceBonus.attackBonus + classBonus.attackBonus,
      defense: baseDefense + raceBonus.defenseBonus + classBonus.defenseBonus,
    };
  };

  const canProceed = (): boolean => {
    switch (currentStep) {
      case "name":
        return characterName.trim().length > 0;
      case "stats":
        return true;
      case "race":
        return selectedRace !== null;
      case "class":
        return selectedClass !== null;
      case "preview":
        return true;
      default:
        return false;
    }
  };

  const handleNext = () => {
    const currentIndex = steps.indexOf(currentStep);
    if (currentIndex < steps.length - 1) {
      setCurrentStep(steps[currentIndex + 1]);
    }
  };

  const handleBack = () => {
    const currentIndex = steps.indexOf(currentStep);
    if (currentIndex > 0) {
      setCurrentStep(steps[currentIndex - 1]);
    }
  };

  const handleStartCampaign = () => {
    // Generate a campaign ID (in a real app, this would come from your backend)
    const campaignId = Date.now();
    // Navigate to the campaign page
    router.push(`/campaigns/${campaignId}`);
  };

  const finalStats = calculateFinalStats();

  return (
    <>
      <Navbar />
      <div className={styles.pageContainer}>
        {/* Side Panel */}
        <div className={styles.sidePanel}>
          <h2 className={styles.sidePanelTitle}>Create Character</h2>
          <div className={styles.stepsList}>
            {steps.map((step, index) => (
              <div
                key={step}
                className={`${styles.stepItem} ${
                  currentStep === step ? styles.activeStep : ""
                } ${steps.indexOf(currentStep) > index ? styles.completedStep : ""}`}
                onClick={() => setCurrentStep(step)}
              >
                <div className={styles.stepNumber}>{index + 1}</div>
                <div className={styles.stepLabel}>{getStepLabel(step)}</div>
              </div>
            ))}
          </div>
        </div>

        {/* Main Content */}
        <div className={styles.mainContent}>
          {currentStep === "name" && (
            <div className={styles.stepContent}>
              <h1 className={styles.stepTitle}>Character Name</h1>
              <p className={styles.stepDescription}>
                Choose a name for your character
              </p>
              <input
                type="text"
                className={styles.nameInput}
                placeholder="Enter character name..."
                value={characterName}
                onChange={(e) => setCharacterName(e.target.value)}
                autoFocus
              />
            </div>
          )}

          {currentStep === "stats" && (
            <div className={styles.stepContent}>
              <h1 className={styles.stepTitle}>Base Stats</h1>
              <p className={styles.stepDescription}>
                Set your character's base attributes
              </p>

              <div className={styles.statsContainer}>
                <div className={styles.statItem}>
                  <label className={styles.statLabel}>Health Points (HP)</label>
                  <input
                    type="range"
                    min="30"
                    max="100"
                    value={baseHP}
                    onChange={(e) => setBaseHP(Number(e.target.value))}
                    className={styles.slider}
                  />
                  <span className={styles.statValue}>{baseHP}</span>
                </div>

                <div className={styles.statItem}>
                  <label className={styles.statLabel}>Attack</label>
                  <input
                    type="range"
                    min="5"
                    max="20"
                    value={baseAttack}
                    onChange={(e) => setBaseAttack(Number(e.target.value))}
                    className={styles.slider}
                  />
                  <span className={styles.statValue}>{baseAttack}</span>
                </div>

                <div className={styles.statItem}>
                  <label className={styles.statLabel}>Defense</label>
                  <input
                    type="range"
                    min="5"
                    max="20"
                    value={baseDefense}
                    onChange={(e) => setBaseDefense(Number(e.target.value))}
                    className={styles.slider}
                  />
                  <span className={styles.statValue}>{baseDefense}</span>
                </div>
              </div>
            </div>
          )}

          {currentStep === "race" && (
            <div className={styles.stepContent}>
              <h1 className={styles.stepTitle}>Choose Your Race</h1>
              <p className={styles.stepDescription}>
                Each race provides different stat bonuses
              </p>

              <div className={styles.optionsContainer}>
                {races.map((race) => (
                  <div
                    key={race.name}
                    className={`${styles.optionCard} ${
                      selectedRace?.name === race.name ? styles.selected : ""
                    }`}
                    onClick={() => setSelectedRace(race)}
                  >
                    <h3 className={styles.optionTitle}>{race.name}</h3>
                    <div className={styles.bonuses}>
                      <div className={styles.bonus}>HP: +{race.hpBonus}</div>
                      <div className={styles.bonus}>ATK: +{race.attackBonus}</div>
                      <div className={styles.bonus}>DEF: +{race.defenseBonus}</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {currentStep === "class" && (
            <div className={styles.stepContent}>
              <h1 className={styles.stepTitle}>Choose Your Class</h1>
              <p className={styles.stepDescription}>
                Each class provides different stat bonuses
              </p>

              <div className={styles.optionsContainer}>
                {classes.map((cls) => (
                  <div
                    key={cls.name}
                    className={`${styles.optionCard} ${
                      selectedClass?.name === cls.name ? styles.selected : ""
                    }`}
                    onClick={() => setSelectedClass(cls)}
                  >
                    <h3 className={styles.optionTitle}>{cls.name}</h3>
                    <div className={styles.bonuses}>
                      <div className={styles.bonus}>HP: +{cls.hpBonus}</div>
                      <div className={styles.bonus}>ATK: +{cls.attackBonus}</div>
                      <div className={styles.bonus}>DEF: +{cls.defenseBonus}</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {currentStep === "preview" && (
            <div className={styles.stepContent}>
              <h1 className={styles.stepTitle}>Character Preview</h1>
              <p className={styles.stepDescription}>
                Review your character before starting the campaign
              </p>

              <div className={styles.previewContainer}>
                <div className={styles.previewSection}>
                  <h3 className={styles.previewLabel}>Name</h3>
                  <p className={styles.previewValue}>{characterName}</p>
                </div>

                <div className={styles.previewSection}>
                  <h3 className={styles.previewLabel}>Race</h3>
                  <p className={styles.previewValue}>
                    {selectedRace?.name || "None"}
                  </p>
                </div>

                <div className={styles.previewSection}>
                  <h3 className={styles.previewLabel}>Class</h3>
                  <p className={styles.previewValue}>
                    {selectedClass?.name || "None"}
                  </p>
                </div>

                <div className={styles.previewSection}>
                  <h3 className={styles.previewLabel}>Final Stats</h3>
                  <div className={styles.finalStats}>
                    <div className={styles.finalStat}>
                      <span>HP:</span>
                      <span className={styles.finalStatValue}>{finalStats.hp}</span>
                    </div>
                    <div className={styles.finalStat}>
                      <span>Attack:</span>
                      <span className={styles.finalStatValue}>{finalStats.attack}</span>
                    </div>
                    <div className={styles.finalStat}>
                      <span>Defense:</span>
                      <span className={styles.finalStatValue}>{finalStats.defense}</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Navigation Buttons */}
          <div className={styles.navigationButtons}>
            {currentStep !== "name" && (
              <button className={styles.backButton} onClick={handleBack}>
                Back
              </button>
            )}

            {currentStep !== "preview" ? (
              <button
                className={styles.nextButton}
                onClick={handleNext}
                disabled={!canProceed()}
              >
                Next
              </button>
            ) : (
              <button
                className={styles.startButton}
                onClick={handleStartCampaign}
              >
                Start Campaign
              </button>
            )}
          </div>
        </div>
      </div>
    </>
  );
}