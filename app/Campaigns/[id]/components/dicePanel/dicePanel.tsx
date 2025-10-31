"use client";

import React, { useRef, useEffect } from "react";
import * as THREE from "three";
import styles from "./dicePanel.module.css";

interface DicePanelProps {
  isRolling: boolean;
  lastResult: number | null;
}

export default function DicePanel({ isRolling, lastResult }: DicePanelProps) {
  const mountRef = useRef<HTMLDivElement>(null);
  const resultRef = useRef<HTMLDivElement>(null); // Added for text inside box
  const sceneRef = useRef<{
    scene: THREE.Scene;
    camera: THREE.PerspectiveCamera;
    renderer: THREE.WebGLRenderer;
    dice: THREE.Group;
  } | null>(null);
  const faceToNumberMap = useRef<Map<number, number>>(new Map());

  // ===== CUSTOMIZABLE COLORS - CHANGE THESE IN CODE =====
  const DICE_COLOR = 0x000000;
  const EDGE_COLOR = 0xffd700;
  const EDGE_THICKNESS = 4; // required but does not do anything
  const NUMBER_COLOR = "#ffffff";
  // ======================================================

  useEffect(() => {
    if (!mountRef.current) return;

    const mount = mountRef.current;
    const scene = new THREE.Scene();

    const camera = new THREE.PerspectiveCamera(
      75,
      mount.clientWidth / mount.clientHeight,
      0.1,
      1000
    );
    camera.position.set(0, 0, 2.5);

    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setSize(mount.clientWidth, mount.clientHeight);
    mount.appendChild(renderer.domElement);
    renderer.setClearColor(0x000000, 0);

    // Lighting
    const ambient = new THREE.AmbientLight(0xffffff, 0.7);
    scene.add(ambient);
    const dirLight = new THREE.DirectionalLight(0xffffff, 0.8);
    dirLight.position.set(5, 5, 5);
    scene.add(dirLight);

    // Create dice group
    const dice = new THREE.Group();
    scene.add(dice);

    // Create icosahedron
    const geometry = new THREE.IcosahedronGeometry(1, 0);
    const material = new THREE.MeshPhongMaterial({
      color: DICE_COLOR,
      flatShading: true,
      shininess: 30,
    });
    const icosahedron = new THREE.Mesh(geometry, material);
    dice.add(icosahedron);

    // Add edges with custom thickness
    const edges = new THREE.EdgesGeometry(geometry);
    const lineMaterial = new THREE.LineBasicMaterial({
      color: EDGE_COLOR,
      linewidth: EDGE_THICKNESS,
    });
    const wireframe = new THREE.LineSegments(edges, lineMaterial);
    dice.add(wireframe);

    // Get face data and assign numbers 1-20
    const positions = geometry.attributes.position.array;
    const faceMeshes: THREE.Mesh[] = [];
    const faceCenters: THREE.Vector3[] = [];
    faceToNumberMap.current.clear();

    // Create a small plane for each face with the number texture
    for (let i = 0; i < 20; i++) {
      // Get the three vertices of this face
      const idx = i * 9;
      const v1 = new THREE.Vector3(
        positions[idx],
        positions[idx + 1],
        positions[idx + 2]
      );
      const v2 = new THREE.Vector3(
        positions[idx + 3],
        positions[idx + 4],
        positions[idx + 5]
      );
      const v3 = new THREE.Vector3(
        positions[idx + 6],
        positions[idx + 7],
        positions[idx + 8]
      );

      // Calculate center and normal
      const center = new THREE.Vector3()
        .add(v1)
        .add(v2)
        .add(v3)
        .divideScalar(3);
      faceCenters.push(center.clone());

      const edge1 = new THREE.Vector3().subVectors(v2, v1);
      const edge2 = new THREE.Vector3().subVectors(v3, v1);
      const normal = new THREE.Vector3().crossVectors(edge1, edge2).normalize();

      // Assign number to this face (1-20)
      const numberForFace = i + 1;
      faceToNumberMap.current.set(i, numberForFace);

      // Create number texture
      const canvas = document.createElement("canvas");
      canvas.width = 256;
      canvas.height = 256;
      const ctx = canvas.getContext("2d")!;
      ctx.fillStyle = NUMBER_COLOR;
      ctx.font = "bold 200px Arial";
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.fillText(numberForFace.toString(), 128, 128);

      const texture = new THREE.CanvasTexture(canvas);
      const planeMaterial = new THREE.MeshBasicMaterial({
        map: texture,
        transparent: true,
        side: THREE.DoubleSide,
      });

      // Create small plane for the number
      const planeGeometry = new THREE.PlaneGeometry(0.4, 0.4);
      const plane = new THREE.Mesh(planeGeometry, planeMaterial);

      // Position plane at face center, pushed slightly outward (reduced from 1.02 to 1.005)
      plane.position.copy(center.normalize().multiplyScalar(0.8));

      // Orient plane to match face normal
      plane.lookAt(plane.position.clone().add(normal));

      dice.add(plane);
      faceMeshes.push(plane);
    }

    sceneRef.current = { scene, camera, renderer, dice };

    // Animation loop
    let animationId: number;
    const animate = () => {
      animationId = requestAnimationFrame(animate);

      if (isRolling) {
        dice.rotation.x += 0.08;
        dice.rotation.y += 0.08;
        dice.rotation.z += 0.04;
      } else if (lastResult !== null) {
        // Find which face has this number and rotate to show it
        const targetRotation = getRotationForResult(lastResult, faceCenters);
        dice.rotation.set(targetRotation.x, targetRotation.y, targetRotation.z);
      }

      renderer.render(scene, camera);
    };
    animate();

    // Handle resize
    const handleResize = () => {
      if (!mount) return;
      camera.aspect = mount.clientWidth / mount.clientHeight;
      camera.updateProjectionMatrix();
      renderer.setSize(mount.clientWidth, mount.clientHeight);
    };
    window.addEventListener("resize", handleResize);

    // Cleanup
    return () => {
      window.removeEventListener("resize", handleResize);
      cancelAnimationFrame(animationId);
      if (mount.contains(renderer.domElement)) {
        mount.removeChild(renderer.domElement);
      }
      geometry.dispose();
      material.dispose();
      edges.dispose();
      lineMaterial.dispose();
      faceMeshes.forEach((mesh) => {
        mesh.geometry.dispose();
        (mesh.material as THREE.MeshBasicMaterial).map?.dispose();
        (mesh.material as THREE.MeshBasicMaterial).dispose();
      });
    };
  }, [isRolling, lastResult]);

  // Calculate rotation to show the face with the given number facing the camera
  const getRotationForResult = (
    targetNumber: number,
    faceCenters: THREE.Vector3[]
  ): THREE.Euler => {
    // Find the face index that has this number
    let targetFaceIndex = -1;
    for (const [faceIndex, number] of faceToNumberMap.current.entries()) {
      if (number === targetNumber) {
        targetFaceIndex = faceIndex;
        break;
      }
    }

    if (targetFaceIndex === -1 || targetFaceIndex >= faceCenters.length) {
      return new THREE.Euler(0, 0, 0);
    }

    // Get the face center in world space
    const faceCenter = faceCenters[targetFaceIndex].clone().normalize();

    // We want this face to point toward camera (which is at positive Z)
    // Camera looks down -Z axis, so we want face normal to point to +Z
    const targetDirection = new THREE.Vector3(0, 0, 1);

    // Create a quaternion that rotates faceCenter to targetDirection
    const quaternion = new THREE.Quaternion();
    quaternion.setFromUnitVectors(faceCenter, targetDirection);

    // Convert quaternion to euler
    const euler = new THREE.Euler();
    euler.setFromQuaternion(quaternion);

    return euler;
  };

  // === Show or hide result text smoothly inside the dice box ===
  useEffect(() => {
    if (resultRef.current) {
      resultRef.current.style.opacity = lastResult ? "1" : "0";
    }
  }, [lastResult]);

  return (
    <div className={styles.panel}>
      <h2 className={styles.header}>Dice Roll</h2>
      <div ref={mountRef} className={styles.canvasContainer}>
        {/* Result now appears inside the dice box */}
        <div ref={resultRef} className={styles.resultInside}>
          {!isRolling && lastResult !== null && `Result: ${lastResult}`}
        </div>
      </div>
    </div>
  );
}
