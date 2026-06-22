/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useEffect, useRef } from "react";
import { VibeType } from "../types";

interface VibeCanvasProps {
  vibe: VibeType;
  isMuted: boolean;
}

interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  size: number;
  alpha: number;
  color: string;
  angle?: number;
  speed?: number;
}

export default function VibeCanvas({ vibe, isMuted }: VibeCanvasProps) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);
  const mouseRef = useRef({ x: -1000, y: -1000, active: false });

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    // Fluid resize observer setup
    let width = canvas.width;
    let height = canvas.height;

    const resizeObserver = new ResizeObserver((entries) => {
      for (const entry of entries) {
        const { width: entryWidth, height: entryHeight } = entry.contentRect;
        width = Math.floor(entryWidth);
        height = Math.floor(entryHeight);
        canvas.width = width;
        canvas.height = height;
      }
    });

    if (containerRef.current) {
      resizeObserver.observe(containerRef.current);
    }

    // Initialize particles based on selected vibe
    let particles: Particle[] = [];
    const initParticles = () => {
      particles = [];
      const count = vibe === "cosmic" ? 80 : vibe === "cyberpunk" ? 60 : vibe === "ancient_forest" ? 50 : 40;
      
      for (let i = 0; i < count; i++) {
        particles.push(createParticle(vibe, width, height, true));
      }
    };

    const createParticle = (
      v: VibeType,
      w: number,
      h: number,
      randomY = false
    ): Particle => {
      const px = Math.random() * w;
      const py = randomY ? Math.random() * h : (v === "cyberpunk" ? -10 : h + 10);
      
      switch (v) {
        case "cosmic":
          return {
            x: px,
            y: py,
            vx: (Math.random() - 0.5) * 0.4,
            vy: (Math.random() - 0.5) * 0.4,
            size: Math.random() * 2 + 0.5,
            alpha: Math.random() * 0.7 + 0.3,
            color: Math.random() > 0.6 ? "#e879f9" : "#60a5fa" // purple / blue stars
          };
        case "cyberpunk":
          return {
            x: px,
            y: randomY ? Math.random() * h : -10,
            vx: 0,
            vy: Math.random() * 3 + 1, // downfalls
            size: Math.random() * 1.5 + 0.5,
            alpha: Math.random() * 0.5 + 0.2,
            color: Math.random() > 0.6 ? "#22d3ee" : "#f43f5e" // cyan / pink tech rain
          };
        case "ancient_forest":
          return {
            x: px,
            y: randomY ? Math.random() * h : h + 10,
            vx: (Math.random() - 0.5) * 0.3 + 0.1, // drift gently right
            vy: -(Math.random() * 0.6 + 0.2), // float up
            size: Math.random() * 3 + 1,
            alpha: Math.random() * 0.5 + 0.3,
            color: Math.random() > 0.7 ? "#fbbf24" : "#34d399", // gold pollen / green leaves
            angle: Math.random() * Math.PI * 2,
            speed: Math.random() * 0.02
          };
        case "solar":
          return {
            x: px,
            y: py,
            vx: (Math.random() - 0.5) * 0.6,
            vy: (Math.random() - 0.5) * 0.6,
            size: Math.random() * 4 + 2,
            alpha: Math.random() * 0.4 + 0.1,
            color: "#f97316", // hot plasma dots
            angle: Math.random() * Math.PI,
            speed: 0.05
          };
      }
    };

    initParticles();

    // Pulse rings triggered on clicks
    interface ClickPulse {
      x: number;
      y: number;
      radius: number;
      maxRadius: number;
      alpha: number;
      color: string;
    }
    let clickPulses: ClickPulse[] = [];

    const handleCanvasClick = (e: MouseEvent) => {
      const rect = canvas.getBoundingClientRect();
      const clickX = e.clientX - rect.left;
      const clickY = e.clientY - rect.top;

      let pulseColor = "#60a5fa";
      if (vibe === "cyberpunk") pulseColor = "#22d3ee";
      if (vibe === "ancient_forest") pulseColor = "#34d399";
      if (vibe === "solar") pulseColor = "#f97316";

      clickPulses.push({
        x: clickX,
        y: clickY,
        radius: 5,
        maxRadius: 120,
        alpha: 0.9,
        color: pulseColor,
      });

      // Maintain max pulses count
      if (clickPulses.length > 5) {
        clickPulses.shift();
      }
    };

    canvas.addEventListener("click", handleCanvasClick);

    // Animation Loop
    let animationId: number;
    let fadeOffset = 0;

    const render = () => {
      ctx.clearRect(0, 0, width, height);
      
      fadeOffset += 0.005;

      // 1. Draw Vibe Background Specific Visuals (Ambient wave generators)
      if (vibe === "solar") {
        // Draw deep expanding solar core at coordinates (center left)
        const gradient = ctx.createRadialGradient(
          width * 0.3,
          height * 0.5,
          10,
          width * 0.3,
          height * 0.5,
          Math.min(width, height) * 0.8
        );
        gradient.addColorStop(0, "rgba(254, 215, 170, 0.08)");
        gradient.addColorStop(0.5, "rgba(249, 115, 22, 0.03)");
        gradient.addColorStop(1, "rgba(0, 0, 0, 0)");
        ctx.fillStyle = gradient;
        ctx.fillRect(0, 0, width, height);

        // Slow hot wave lines
        ctx.beginPath();
        ctx.strokeStyle = "rgba(234, 88, 12, 0.08)";
        ctx.lineWidth = 2;
        for (let x = 0; x < width; x += 3) {
          const y = height * 0.6 + Math.sin(x * 0.005 + fadeOffset) * 20 + Math.cos(x * 0.002 - fadeOffset) * 10;
          if (x === 0) ctx.moveTo(x, y);
          else ctx.lineTo(x, y);
        }
        ctx.stroke();
      } else if (vibe === "cosmic") {
        // Cosmic slow sweeping dust aurora
        const dustGrad = ctx.createLinearGradient(0, 0, width, height);
        dustGrad.addColorStop(0, "rgba(139, 92, 246, 0.02)");
        dustGrad.addColorStop(0.5, "rgba(236, 72, 153, 0.01)");
        dustGrad.addColorStop(1, "rgba(0, 0, 0, 0)");
        ctx.fillStyle = dustGrad;
        ctx.fillRect(0, 0, width, height);
      } else if (vibe === "cyberpunk") {
        // Neon horizon glow gridLines
        ctx.strokeStyle = "rgba(34, 211, 238, 0.02)";
        ctx.lineWidth = 1;
        const gridStep = 40;
        
        // Horizontal perspective lines
        for (let y = height * 0.4; y < height; y += (height - y) * 0.15 + 4) {
          ctx.beginPath();
          ctx.moveTo(0, y);
          ctx.lineTo(width, y);
          ctx.stroke();
        }
      } else if (vibe === "ancient_forest") {
        // Gentle sunrays through digital canopy
        ctx.beginPath();
        ctx.strokeStyle = "rgba(52, 211, 153, 0.03)";
        ctx.lineWidth = 50;
        ctx.moveTo(width * 0.8, -100);
        ctx.lineTo(width * 0.2, height + 100);
        ctx.moveTo(width * 0.9, -100);
        ctx.lineTo(width * 0.4, height + 100);
        ctx.stroke();
      }

      // 2. Draw active pulses
      clickPulses.forEach((p, idx) => {
        p.radius += (p.maxRadius - p.radius) * 0.05;
        p.alpha -= 0.015;
        if (p.alpha <= 0) {
          clickPulses.splice(idx, 1);
          return;
        }

        ctx.strokeStyle = p.color;
        ctx.lineWidth = 1.5;
        ctx.globalAlpha = p.alpha;
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2);
        ctx.stroke();
        ctx.globalAlpha = 1.0; // Reset
      });

      // 3. Move and Draw Particles
      particles.forEach((p, index) => {
        // Move
        p.x += p.vx;
        p.y += p.vy;

        // Custom organic sine movements
        if (vibe === "ancient_forest" && p.angle !== undefined && p.speed !== undefined) {
          p.angle += p.speed;
          p.x += Math.sin(p.angle) * 0.15;
        }

        // Interaction with mouse
        if (mouseRef.current.active) {
          const dx = mouseRef.current.x - p.x;
          const dy = mouseRef.current.y - p.y;
          const dist = Math.sqrt(dx * dx + dy * dy);
          
          if (dist < 100) {
            const force = (100 - dist) / 100 * 0.5; // pull particles gently
            p.x += (dx / dist) * force;
            p.y += (dy / dist) * force;
          }
        }

        // Canvas wrap limits
        if (p.x < -20 || p.x > width + 20 || p.y < -20 || p.y > height + 20) {
          particles[index] = createParticle(vibe, width, height, false);
          return;
        }

        // Sketch
        ctx.fillStyle = p.color;
        
        if (vibe === "cyberpunk") {
          // Draw techno vertical lines for digital grid water
          ctx.fillStyle = p.color;
          ctx.globalAlpha = p.alpha;
          ctx.fillRect(p.x, p.y, p.size, p.size * 6);
        } else if (vibe === "ancient_forest") {
          // Leaf shape or soft glow circles
          ctx.globalAlpha = p.alpha;
          ctx.beginPath();
          ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
          ctx.fill();
        } else {
          ctx.globalAlpha = p.alpha;
          ctx.beginPath();
          ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
          ctx.fill();
        }
      });
      ctx.globalAlpha = 1.0; // Reset

      animationId = requestAnimationFrame(render);
    };

    render();

    // Mouse Tracking listeners
    const handleMouseMove = (e: MouseEvent) => {
      const rect = canvas.getBoundingClientRect();
      mouseRef.current.x = e.clientX - rect.left;
      mouseRef.current.y = e.clientY - rect.top;
      mouseRef.current.active = true;
    };

    const handleMouseLeave = () => {
      mouseRef.current.active = false;
    };

    canvas.addEventListener("mousemove", handleMouseMove);
    canvas.addEventListener("mouseleave", handleMouseLeave);

    return () => {
      cancelAnimationFrame(animationId);
      resizeObserver.disconnect();
      canvas.removeEventListener("click", handleCanvasClick);
      canvas.removeEventListener("mousemove", handleMouseMove);
      canvas.removeEventListener("mouseleave", handleMouseLeave);
    };
  }, [vibe]);

  return (
    <div id="canvas-wrapper" ref={containerRef} className="absolute inset-0 z-0">
      <canvas
        id="vibe-canvas"
        ref={canvasRef}
        className="block w-full h-full pointer-events-auto transition-all duration-700"
      />
    </div>
  );
}
