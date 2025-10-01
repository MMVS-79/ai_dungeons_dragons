"use client";
import { useRef, useState, useEffect } from "react";
import styles from "./Home.module.css";

interface Dragon {
  id: number;
  name: string;
  hp: number;
  max_hp: number;
}

export default function Home() {
  const dragonRef = useRef<HTMLDivElement>(null);
  const hitRef = useRef<HTMLDivElement>(null);
  const knightRef = useRef<HTMLImageElement>(null);

  const [dragon, setDragon] = useState<Dragon | null>(null);
  const [loading, setLoading] = useState(true);
  const ATTACK_DAMAGE = 10;

  // Fetch dragon stats on mount
  useEffect(() => {
    fetchDragonStats();
  }, []);

  const fetchDragonStats = async () => {
    try {
      const response = await fetch("/api/dragon");
      const data = await response.json();

      if (data.success) {
        setDragon(data.dragon);
      }
    } catch (error) {
      console.error("Failed to fetch dragon:", error);
    } finally {
      setLoading(false);
    }
  };

  const triggerAttack = async () => {
    const dragonEl = dragonRef.current;
    const hit = hitRef.current;
    const knight = knightRef.current;

    if (dragonEl) {
      dragonEl.classList.remove(styles.wiggle);
      void dragonEl.offsetWidth;
      dragonEl.classList.add(styles.wiggle);
    }

    if (hit) {
      hit.classList.remove(styles.flash);
      void hit.offsetWidth;
      hit.classList.add(styles.flash);
    }

    if (knight) {
      knight.classList.remove(styles.jab);
      void knight.offsetWidth;
      knight.classList.add(styles.jab);
    }

    // NEW: Database update
    try {
      const response = await fetch("/api/dragon", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({ damage: ATTACK_DAMAGE })
      });

      const data = await response.json();

      if (data.success) {
        setDragon(data.dragon);

        if (data.dragon.hp <= 0) {
          alert("Dragon defeated! 🎉");
        }
      }
    } catch (error) {
      console.error("Attack failed:", error);
    }
  };

  if (loading) {
    return <div className={styles.loading}>Loading dragon stats...</div>;
  }

  return (
    <div>
      <div className={styles.container}>
        <div className={`${styles.layer} ${styles.background}`}></div>
        <div
          ref={dragonRef}
          className={styles.dragon}
        ></div>
        <img
          ref={knightRef}
          src="/Knight.png"
          alt="Knight"
          className={styles.knight}
        />
        <div
          ref={hitRef}
          className={styles.hit}
        ></div>
      </div>

      {/* NEW: HP Display */}
      {dragon && (
        <div className={styles.hpDisplay}>
          <h2>{dragon.name}</h2>
          <div className={styles.hpBar}>
            <div
              className={styles.hpFill}
              style={{ width: `${(dragon.hp / dragon.max_hp) * 100}%` }}
            />
          </div>
          <p className={styles.hpText}>
            {dragon.hp} / {dragon.max_hp} HP
          </p>
        </div>
      )}

      {/* Added disabled state */}
      <button
        onClick={triggerAttack}
        className={styles.attackButton}
        disabled={dragon?.hp === 0}
      >
        {dragon?.hp === 0 ? "Dragon Defeated!" : "Attack!"}
      </button>
    </div>
  );
}
