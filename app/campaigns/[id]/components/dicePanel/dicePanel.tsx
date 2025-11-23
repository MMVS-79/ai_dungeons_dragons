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
  const resultRef = useRef<HTMLDivElement>(null);
  const sceneRef = useRef<{
    scene: THREE.Scene;
    camera: THREE.PerspectiveCamera;
    renderer: THREE.WebGLRenderer;
    dice: THREE.Group;
  } | null>(null);
  const faceToNumberMap = useRef<Map<number, number>>(new Map());
  const faceDataRef = useRef<
    Array<{ center: THREE.Vector3; vertices: THREE.Vector3[] }>
  >([]);

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
      1000,
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
    const faceData: Array<{
      center: THREE.Vector3;
      vertices: THREE.Vector3[];
    }> = [];
    faceToNumberMap.current.clear();

    // Create a small plane for each face with the number texture
    for (let i = 0; i < 20; i++) {
      // Get the three vertices of this face
      const idx = i * 9;
      const v1 = new THREE.Vector3(
        positions[idx],
        positions[idx + 1],
        positions[idx + 2],
      );
      const v2 = new THREE.Vector3(
        positions[idx + 3],
        positions[idx + 4],
        positions[idx + 5],
      );
      const v3 = new THREE.Vector3(
        positions[idx + 6],
        positions[idx + 7],
        positions[idx + 8],
      );

      // Calculate center and normal
      const center = new THREE.Vector3()
        .add(v1)
        .add(v2)
        .add(v3)
        .divideScalar(3);
      faceCenters.push(center.clone());

      // Store face data for rotation calculation
      faceData.push({
        center: center.clone(),
        vertices: [v1.clone(), v2.clone(), v3.clone()],
      });

      // const edge1 = new THREE.Vector3().subVectors(v2, v1);
      // const edge2 = new THREE.Vector3().subVectors(v3, v1);
      // const normal = new THREE.Vector3().crossVectors(edge1, edge2).normalize(); // Unused Variable

      // Assign number to this face (1-20)
      const numberForFace = i + 1;
      faceToNumberMap.current.set(i, numberForFace);

      // Create number texture
      const canvas = document.createElement("canvas");
      canvas.width = 256;
      canvas.height = 256;
      const ctx = canvas.getContext("2d")!;

      // Flip horizontally to fix mirroring
      ctx.save();
      ctx.scale(-1, 1);
      ctx.translate(-canvas.width, 0);

      ctx.fillStyle = NUMBER_COLOR;
      ctx.font = "bold 200px Arial";
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.fillText(numberForFace.toString(), 128, 128);

      ctx.restore();

      const texture = new THREE.CanvasTexture(canvas);
      const planeMaterial = new THREE.MeshBasicMaterial({
        map: texture,
        transparent: true,
        side: THREE.DoubleSide,
      });

      // Create small plane for the number
      const planeGeometry = new THREE.PlaneGeometry(0.4, 0.4);
      const plane = new THREE.Mesh(planeGeometry, planeMaterial);

      // Position plane at face center
      plane.position.copy(center.normalize().multiplyScalar(0.8));

      // Find the top vertex (highest Y)
      let topVertex = v1.clone();
      for (const v of [v2, v3]) {
        if (v.y > topVertex.y) {
          topVertex = v.clone();
        }
      }

      // Up vector from center to top vertex
      const upVector = new THREE.Vector3()
        .subVectors(topVertex, center)
        .normalize();

      // Orient plane to face with up vector
      const targetPosition = plane.position.clone().normalize();
      const matrix = new THREE.Matrix4().lookAt(
        new THREE.Vector3(0, 0, 0),
        targetPosition,
        upVector,
      );
      const quaternion = new THREE.Quaternion().setFromRotationMatrix(matrix);
      plane.quaternion.copy(quaternion);

      dice.add(plane);
      faceMeshes.push(plane);
    }

    faceDataRef.current = faceData;

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

  // Calculate rotation to show the face with the given number facing the camera with number upright
  const getRotationForResult = (
    targetNumber: number,
    faceCenters: THREE.Vector3[],
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

    const face = faceDataRef.current[targetFaceIndex];
    const faceCenter = faceCenters[targetFaceIndex].clone().normalize();
    const targetDirection = new THREE.Vector3(0, 0, 1);

    // Find the top vertex (highest Y coordinate)
    let topVertex = face.vertices[0].clone();
    for (const v of face.vertices) {
      if (v.y > topVertex.y) {
        topVertex = v.clone();
      }
    }

    // Create up vector from center to top vertex
    const upVector = new THREE.Vector3()
      .subVectors(topVertex, face.center)
      .normalize();

    // Step 1: Rotate face normal to point at camera
    const quaternion1 = new THREE.Quaternion();
    quaternion1.setFromUnitVectors(faceCenter, targetDirection);

    // Apply first rotation to the up vector
    const rotatedUp = upVector.clone().applyQuaternion(quaternion1);

    // Step 2: Rotate around Z-axis (face normal) to make top point up
    const projectedUp = new THREE.Vector2(rotatedUp.x, rotatedUp.y);
    const targetUp = new THREE.Vector2(0, 1);

    // Calculate angle needed to align with Y-axis (up direction)
    const angle =
      Math.atan2(targetUp.y, targetUp.x) -
      Math.atan2(projectedUp.y, projectedUp.x);

    // Create second rotation around Z-axis
    const quaternion2 = new THREE.Quaternion();
    quaternion2.setFromAxisAngle(new THREE.Vector3(0, 0, 1), angle);

    // Combine both rotations
    const finalQuaternion = quaternion2.multiply(quaternion1);

    // Convert to Euler
    const euler = new THREE.Euler();
    euler.setFromQuaternion(finalQuaternion);

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
