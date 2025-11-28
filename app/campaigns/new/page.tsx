"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import styles from "./newCampaign.module.css";

type Step = "campaignName" | "name" | "race" | "class" | "preview";

interface Race {
  id: number;
  name: string;
  health: number;
  attack: number;
  defense: number;
}

interface Class {
  id: number;
  name: string;
  health: number;
  attack: number;
  defense: number;
}

export default function NewCampaignPage() {
  const router = useRouter();
  const [currentStep, setCurrentStep] = useState<Step>("campaignName");

  // Campaign data
  const [campaignName, setCampaignName] = useState("");

  // Character data
  const [characterName, setCharacterName] = useState("");
  const [selectedRace, setSelectedRace] = useState<Race | null>(null);
  const [selectedClass, setSelectedClass] = useState<Class | null>(null);

  // Database data for race/class options
  const [dbRaces, setDbRaces] = useState<Race[]>([]);
  const [dbClasses, setDbClasses] = useState<Class[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [fetchError, setFetchError] = useState<string | null>(null);
  const [isCreating, setIsCreating] = useState(false);

  // Track which steps have been completed
  const [completedSteps, setCompletedSteps] = useState<Set<Step>>(new Set());

  // Fetch races and classes from database on mount
  useEffect(() => {
    const fetchData = async () => {
      try {
        const [racesRes, classesRes] = await Promise.all([
          fetch("/api/races"),
          fetch("/api/classes"),
        ]);

        if (!racesRes.ok || !classesRes.ok) {
          throw new Error("Failed to load character options");
        }

        const { races } = await racesRes.json();
        const { classes } = await classesRes.json();
        setDbRaces(races);
        setDbClasses(classes);
      } catch {
        setFetchError(
          "Failed to load character options. Please refresh the page.",
        );
      } finally {
        setIsLoading(false);
      }
    };
    fetchData();
  }, []);

  const steps: Step[] = ["campaignName", "name", "race", "class", "preview"];

  const getStepLabel = (step: Step): string => {
    switch (step) {
      case "campaignName":
        return "Campaign";
      case "name":
        return "Name";
      case "race":
        return "Race";
      case "class":
        return "Class";
      case "preview":
        return "Preview";
    }
  };

  const calculateFinalStats = () => {
    return {
      hp: (selectedRace?.health || 0) + (selectedClass?.health || 0),
      attack: (selectedRace?.attack || 0) + (selectedClass?.attack || 0),
      defense: (selectedRace?.defense || 0) + (selectedClass?.defense || 0),
    };
  };

  const canProceed = (): boolean => {
    switch (currentStep) {
      case "campaignName":
        return campaignName.trim().length > 0;
      case "name":
        return characterName.trim().length > 0;
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

  // Check if a step can be accessed
  const canAccessStep = (step: Step): boolean => {
    const stepIndex = steps.indexOf(step);
    const currentIndex = steps.indexOf(currentStep);

    // Can access current step
    if (stepIndex === currentIndex) return true;

    // Can access previous completed steps
    if (stepIndex < currentIndex) return true;

    // Can access next step only if current step is completed
    if (stepIndex === currentIndex + 1 && completedSteps.has(currentStep))
      return true;

    return false;
  };

  const handleNext = () => {
    if (!canProceed()) return;

    // Mark current step as completed
    setCompletedSteps((prev) => new Set([...prev, currentStep]));

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

  const handleStartCampaign = async () => {
    if (isCreating) return; // Prevent double clicks

    try {
      if (!selectedRace?.id || !selectedClass?.id) {
        throw new Error("Invalid race or class selection");
      }

      setIsCreating(true);

      // Fetch race data to get sprite_path
      const raceResponse = await fetch(`/api/races`);
      const { races } = await raceResponse.json();
      const raceData = races.find((r: any) => r.id === selectedRace.id);

      // Create campaign via API (accountId derived from session on server)
      const response = await fetch("/api/campaigns", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          campaignName: campaignName,
          campaignDescription: `A ${selectedRace.name} ${selectedClass.name} adventure`,
          character: {
            name: characterName,
            raceId: selectedRace.id,
            classId: selectedClass.id,
            spritePath:
              raceData?.sprite_path || "characters/player/warrior.png",
          },
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to create campaign");
      }

      const { campaign } = await response.json();
      router.push(`/campaigns/${campaign.id}`);
    } catch {
      setIsCreating(false);
      alert("Failed to create campaign. Please try again.");
    }
  };

  const finalStats = calculateFinalStats();

  return (
    <>
      <div className={styles.pageContainer}>
        {/* Side Panel */}
        <div className={styles.sidePanel}>
          <h2 className={styles.sidePanelTitle}>Create Character</h2>
          <div className={styles.stepsList}>
            {steps.map((step, index) => {
              const isAccessible = canAccessStep(step);
              const isCompleted = completedSteps.has(step);

              return (
                <div
                  key={step}
                  className={`${styles.stepItem} ${
                    currentStep === step ? styles.activeStep : ""
                  } ${isCompleted ? styles.completedStep : ""} ${
                    !isAccessible ? styles.disabledStep : ""
                  }`}
                  onClick={() => isAccessible && setCurrentStep(step)}
                  style={{ cursor: isAccessible ? "pointer" : "not-allowed" }}
                >
                  <div className={styles.stepNumber}>{index + 1}</div>
                  <div className={styles.stepLabel}>{getStepLabel(step)}</div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Main Content */}
        <div className={styles.mainContent}>
          {currentStep === "campaignName" && (
            <div className={styles.stepContent}>
              <h1 className={styles.stepTitle}>Campaign Name</h1>
              <p className={styles.stepDescription}>
                Choose a name for your adventure
              </p>
              <input
                type="text"
                className={styles.nameInput}
                placeholder="Enter campaign name..."
                value={campaignName}
                onChange={(e) => setCampaignName(e.target.value)}
                autoFocus
              />
            </div>
          )}

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

          {currentStep === "race" && (
            <div className={styles.stepContent}>
              <h1 className={styles.stepTitle}>Choose Your Race</h1>
              <p className={styles.stepDescription}>
                Each race provides different base stats
              </p>

              {isLoading ? (
                <p>Loading races...</p>
              ) : fetchError ? (
                <p className={styles.errorMessage}>{fetchError}</p>
              ) : (
                <div className={styles.optionsContainer}>
                  {dbRaces.map((race) => (
                    <div
                      key={race.id}
                      className={`${styles.optionCard} ${
                        selectedRace?.id === race.id ? styles.selected : ""
                      }`}
                      onClick={() => setSelectedRace(race)}
                    >
                      <h3 className={styles.optionTitle}>{race.name}</h3>
                      <div className={styles.bonuses}>
                        <div className={styles.bonus}>HP: {race.health}</div>
                        <div className={styles.bonus}>ATK: {race.attack}</div>
                        <div className={styles.bonus}>DEF: {race.defense}</div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {currentStep === "class" && (
            <div className={styles.stepContent}>
              <h1 className={styles.stepTitle}>Choose Your Class</h1>
              <p className={styles.stepDescription}>
                Each class provides different base stats
              </p>

              {isLoading ? (
                <p>Loading classes...</p>
              ) : fetchError ? (
                <p className={styles.errorMessage}>{fetchError}</p>
              ) : (
                <div className={styles.optionsContainer}>
                  {dbClasses.map((cls) => (
                    <div
                      key={cls.id}
                      className={`${styles.optionCard} ${
                        selectedClass?.id === cls.id ? styles.selected : ""
                      }`}
                      onClick={() => setSelectedClass(cls)}
                    >
                      <h3 className={styles.optionTitle}>{cls.name}</h3>
                      <div className={styles.bonuses}>
                        <div className={styles.bonus}>HP: {cls.health}</div>
                        <div className={styles.bonus}>ATK: {cls.attack}</div>
                        <div className={styles.bonus}>DEF: {cls.defense}</div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {currentStep === "preview" && (
            <div className={styles.stepContent}>
              <h1 className={styles.stepTitle}>Campaign Preview</h1>
              <p className={styles.stepDescription}>
                Review your campaign and character before starting
              </p>

              <div className={styles.previewContainer}>
                <div className={styles.previewSection}>
                  <h3 className={styles.previewLabel}>Campaign Name</h3>
                  <p className={styles.previewValue}>{campaignName}</p>
                </div>

                <div className={styles.previewSection}>
                  <h3 className={styles.previewLabel}>Character Name</h3>
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
                      <span className={styles.finalStatValue}>
                        {finalStats.hp}
                      </span>
                    </div>
                    <div className={styles.finalStat}>
                      <span>Attack:</span>
                      <span className={styles.finalStatValue}>
                        {finalStats.attack}
                      </span>
                    </div>
                    <div className={styles.finalStat}>
                      <span>Defense:</span>
                      <span className={styles.finalStatValue}>
                        {finalStats.defense}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Navigation Buttons */}
          <div className={styles.navigationButtons}>
            {currentStep !== "campaignName" && (
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
                disabled={isCreating}
              >
                {isCreating ? "Creating..." : "Start Campaign"}
              </button>
            )}
          </div>
        </div>
      </div>
    </>
  );
}
