import { useRef, useEffect, useState } from "react";
import * as THREE from "three";

const CATEGORY_COLORS: Record<string, number> = {
  education: 0x5B2EFF,
  design: 0xFF5A70,
  fitness: 0x00F0A0,
  tech: 0x0099FF,
  food: 0xFFB347,
  coaching: 0x5B2EFF,
  consulting: 0x0099FF,
  courses: 0x5B2EFF,
  templates: 0xFF5A70,
  "digital guides": 0x00F0A0,
  "live sessions": 0xFFB347,
  default: 0x5B2EFF,
};

function getCategoryColor(category?: string | null): number {
  if (!category) return CATEGORY_COLORS.default;
  const key = category.toLowerCase();
  return CATEGORY_COLORS[key] || CATEGORY_COLORS.default;
}

interface ProductCover3DProps {
  productName: string;
  category?: string | null;
  width?: number;
  height?: number;
  className?: string;
}

export function ProductCover3D({
  productName,
  category,
  width = 300,
  height = 220,
  className = "",
}: ProductCover3DProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [isHovered, setIsHovered] = useState(false);
  const hoverRef = useRef(false);

  useEffect(() => {
    hoverRef.current = isHovered;
  }, [isHovered]);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    let isVisible = true;
    const observer = new IntersectionObserver(
      ([entry]) => { isVisible = entry.isIntersecting; },
      { threshold: 0.1 }
    );
    observer.observe(container);

    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(50, width / height, 0.1, 100);
    camera.position.set(0, 0.3, 3.5);

    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    container.appendChild(renderer.domElement);

    const color = getCategoryColor(category);

    const geometry = new THREE.BoxGeometry(2.2, 1.4, 0.15, 4, 4, 1);
    const material = new THREE.MeshStandardMaterial({
      color,
      metalness: 0.3,
      roughness: 0.4,
    });
    const mesh = new THREE.Mesh(geometry, material);
    mesh.rotation.x = 0.15;
    scene.add(mesh);

    const edgeGeo = new THREE.EdgesGeometry(geometry);
    const edgeMat = new THREE.LineBasicMaterial({ color: 0xffffff, transparent: true, opacity: 0.08 });
    const edges = new THREE.LineSegments(edgeGeo, edgeMat);
    mesh.add(edges);

    const canvas = document.createElement("canvas");
    canvas.width = 512;
    canvas.height = 256;
    const ctx = canvas.getContext("2d")!;
    ctx.fillStyle = "rgba(255,255,255,0.0)";
    ctx.fillRect(0, 0, 512, 256);
    ctx.fillStyle = "#FFFFFF";
    ctx.font = "bold 32px Inter, Arial, sans-serif";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";

    const words = productName.split(" ");
    const lines: string[] = [];
    let currentLine = "";
    for (const word of words) {
      const test = currentLine ? `${currentLine} ${word}` : word;
      if (ctx.measureText(test).width > 440) {
        lines.push(currentLine);
        currentLine = word;
      } else {
        currentLine = test;
      }
    }
    if (currentLine) lines.push(currentLine);

    const lineHeight = 40;
    const startY = 128 - ((lines.length - 1) * lineHeight) / 2;
    lines.forEach((line, i) => {
      ctx.fillText(line, 256, startY + i * lineHeight);
    });

    const texture = new THREE.CanvasTexture(canvas);
    const labelMat = new THREE.MeshBasicMaterial({ map: texture, transparent: true });
    const labelGeo = new THREE.PlaneGeometry(2.1, 1.05);
    const label = new THREE.Mesh(labelGeo, labelMat);
    label.position.z = 0.08;
    mesh.add(label);

    const ambientLight = new THREE.AmbientLight(0xffffff, 0.6);
    scene.add(ambientLight);

    const dirLight = new THREE.DirectionalLight(0xffffff, 0.8);
    dirLight.position.set(2, 3, 4);
    scene.add(dirLight);

    const rimLight = new THREE.DirectionalLight(color, 0.3);
    rimLight.position.set(-2, -1, -2);
    scene.add(rimLight);

    let animId: number;
    const animate = () => {
      animId = requestAnimationFrame(animate);
      if (!isVisible) return;
      const speed = hoverRef.current ? 0.02 : 0.008;
      mesh.rotation.y += speed;
      renderer.render(scene, camera);
    };
    animate();

    return () => {
      observer.disconnect();
      cancelAnimationFrame(animId);
      renderer.dispose();
      geometry.dispose();
      material.dispose();
      edgeGeo.dispose();
      edgeMat.dispose();
      labelGeo.dispose();
      labelMat.dispose();
      texture.dispose();
      if (container.contains(renderer.domElement)) {
        container.removeChild(renderer.domElement);
      }
    };
  }, [productName, category, width, height]);

  return (
    <div
      ref={containerRef}
      className={`flex items-center justify-center ${className}`}
      style={{ width, height }}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    />
  );
}
