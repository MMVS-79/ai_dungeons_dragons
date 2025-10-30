"use client";

import React, { useRef, useEffect, useState } from "react";
import * as THREE from "three";
import styles from "./dicePanel.module.css";

export default function DicePage() {
  const mountRef = useRef<HTMLDivElement>(null);
  const [rolling, setRolling] = useState(false);
  const [rolledNumber, setRolledNumber] = useState<number | null>(null);

  useEffect(() => {
    const mount = mountRef.current!;
    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x202020);

    const camera = new THREE.PerspectiveCamera(
      75,
      mount.clientWidth / mount.clientHeight,
      0.1,
      1000
    );
    camera.position.set(0, 0, 2);

    const renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setSize(mount.clientWidth, mount.clientHeight);
    mount.appendChild(renderer.domElement);

    // // LIGHTS (NONFUNCTIONAL)
    // const ambient = new THREE.AmbientLight(0xffffff, 0.6);
    // scene.add(ambient);
    // const dirLight = new THREE.DirectionalLight(0xffffff, 1);
    // dirLight.position.set(5, 5, 5);
    // scene.add(dirLight);

    // GEOMETRY — D20 (Icosahedron)
    const geometry = new THREE.IcosahedronGeometry(1, 0);
    const material = new THREE.MeshNormalMaterial({ flatShading: true });
    const dice = new THREE.Mesh(geometry, material);
    scene.add(dice);

    // ANIMATION LOOP
    const animate = () => {
      requestAnimationFrame(animate);

      if (rolling) {
        dice.rotation.x += 0.05;
        dice.rotation.y += 0.05;
      } else {
        // Static position, face aligned
        dice.rotation.set(1.2, 0, 0);
      }

      renderer.render(scene, camera);
    };
    animate();

    // HANDLE RESIZE
    const handleResize = () => {
      camera.aspect = mount.clientWidth / mount.clientHeight;
      camera.updateProjectionMatrix();
      renderer.setSize(mount.clientWidth, mount.clientHeight);
    };
    window.addEventListener("resize", handleResize);

    // CLEANUP
    return () => {
      window.removeEventListener("resize", handleResize);
      mount.removeChild(renderer.domElement);
    };
  }, [rolling]);

  const handleRoll = () => {
    setRolling(true);
    setRolledNumber(null); // hide previous number while rolling

    // Pick a random number 1–20
    const number = Math.floor(Math.random() * 20) + 1;

    setTimeout(() => {
      setRolling(false);
      setRolledNumber(number); // show rolled number
    }, 800);
  };

  return (
    <div className={styles.container} style={{ position: "relative" }}>
      <div ref={mountRef} className={styles.canvasContainer}></div>

      {/* Number overlay */}
      {!rolling && rolledNumber !== null && (
        <div
          style={{
            position: "absolute",
            top: "47%",
            left: "50%",
            transform: "translate(-50%, -50%)",
            fontSize: "96px",
            fontWeight: "bold",
            color: "white",
            pointerEvents: "none",
          }}
        >
          {rolledNumber}
        </div>
      )}

      <button onClick={handleRoll} className={styles.rollButton}>
        Roll Dice
      </button>
    </div>
  );
}
