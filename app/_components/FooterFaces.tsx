"use client";

import { useEffect, useRef } from "react";
import { MOUTHS } from "../(public)/_feedback/SatisfactionFace";
import styles from "./footerFaces.module.css";

type Level = 1 | 2 | 3 | 4 | 5;
const LEVELS: Level[] = [1, 2, 3, 4, 5];

/** Share of the pit the faces fill once they have all fallen, unless the page sets --faces-fill on the pit. */
const FILL = 0.7;
/** Distance, in px, within which a touch pushes the faces away. */
const PUSH_RADIUS = 130;

/**
 * The bottom of the footer: the site's satisfaction faces fall into a pit and
 * pile up; a touch (or the mouse) blows them away, then they fall back.
 * Decorative only (aria-hidden). Nothing at all when the phone asks for reduced
 * motion. The physics library (matter-js) is loaded only once the footer comes
 * into view, and the simulation pauses whenever the pit is off screen.
 */
export function FooterFaces({ className }: { className?: string }) {
  const pitRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const pit = pitRef.current;
    if (!pit) return;
    if (matchMedia("(prefers-reduced-motion: reduce)").matches) {
      pit.hidden = true;
      return;
    }

    let cleanup = () => {};
    let cancelled = false;

    const starter = new IntersectionObserver(
      async ([entry]) => {
        if (!entry.isIntersecting) return;
        starter.disconnect();
        const Matter = await import("matter-js");
        if (!cancelled) cleanup = start(pit, Matter);
      },
      { rootMargin: "0px 0px 200px 0px" },
    );
    starter.observe(pit);

    return () => {
      cancelled = true;
      starter.disconnect();
      cleanup();
    };
  }, []);

  return <div ref={pitRef} className={`${styles.pit} ${className ?? ""}`} aria-hidden="true" />;
}

type FaceBody = Matter.Body & { level: Level };

function start(pit: HTMLDivElement, Matter: typeof import("matter-js")): () => void {
  const { Engine, Bodies, Body, Composite } = Matter;

  const canvas = document.createElement("canvas");
  pit.appendChild(canvas);
  const ctx = canvas.getContext("2d")!;
  const dpr = Math.min(devicePixelRatio || 1, 2);

  // The face colours come from globals.css (--satisfaction-N).
  const css = getComputedStyle(document.documentElement);
  const colors = Object.fromEntries(
    LEVELS.map((n) => [n, css.getPropertyValue(`--satisfaction-${n}`).trim()]),
  ) as Record<Level, string>;
  const mouths = Object.fromEntries(LEVELS.map((n) => [n, new Path2D(MOUTHS[n])])) as Record<Level, Path2D>;

  const engine = Engine.create();
  engine.gravity.y = 1.1;

  let width = 0;
  let height = 0;
  let walls: Matter.Body[] = [];
  const faces: FaceBody[] = [];

  function resize() {
    width = pit.clientWidth;
    height = pit.clientHeight;
    canvas.width = width * dpr;
    canvas.height = height * dpr;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    Composite.remove(engine.world, walls);
    const t = 400;
    walls = [
      Bodies.rectangle(width / 2, height + t / 2, width + 2 * t, t, { isStatic: true }), // floor
      Bodies.rectangle(-t / 2, 0, t, height * 6, { isStatic: true }), // left
      Bodies.rectangle(width + t / 2, 0, t, height * 6, { isStatic: true }), // right
    ];
    Composite.add(engine.world, walls);
  }
  resize();
  const resizer = new ResizeObserver(resize);
  resizer.observe(pit);

  // Rain of faces, a few at a time, from above the pit.
  const radius = Math.max(20, Math.min(width / 16, 34));
  // The page can ask for fewer or more faces, per screen size, with --faces-fill (CSS).
  const fill = parseFloat(getComputedStyle(pit).getPropertyValue("--faces-fill")) || FILL;
  const count = Math.floor((width * height * fill) / (Math.PI * radius * radius));
  const timers: number[] = [];
  for (let i = 0; i < count; i++) {
    timers.push(
      window.setTimeout(() => {
        const face = Bodies.circle(
          radius + Math.random() * (width - 2 * radius),
          -radius - Math.random() * 150,
          radius * (0.85 + Math.random() * 0.3),
          { restitution: 0.35, friction: 0.05, frictionAir: 0.012, density: 0.002 },
        ) as FaceBody;
        face.level = LEVELS[i % LEVELS.length];
        Body.setAngle(face, (Math.random() - 0.5) * 1.5);
        faces.push(face);
        Composite.add(engine.world, face);
      }, i * 30),
    );
  }

  // Touch and mouse: a burst where the finger lands, a push while it moves.
  const pointer = { x: 0, y: 0, lastX: 0, lastY: 0, active: false };
  function place(clientX: number, clientY: number) {
    const rect = canvas.getBoundingClientRect();
    pointer.x = clientX - rect.left;
    pointer.y = clientY - rect.top;
  }
  function push(strength: number) {
    for (const face of faces) {
      const dx = face.position.x - pointer.x;
      const dy = face.position.y - pointer.y;
      const d = Math.hypot(dx, dy);
      if (d === 0 || d > PUSH_RADIUS) continue;
      const f = (1 - d / PUSH_RADIUS) * strength;
      Body.setVelocity(face, {
        x: face.velocity.x + (dx / d) * f,
        y: face.velocity.y + (dy / d) * f - f * 0.6, // a little upwards
      });
      Body.setAngularVelocity(face, (Math.random() - 0.5) * 0.4);
    }
  }
  function down(clientX: number, clientY: number) {
    place(clientX, clientY);
    pointer.lastX = pointer.x;
    pointer.lastY = pointer.y;
    pointer.active = true;
    push(20);
  }
  function move(clientX: number, clientY: number) {
    if (!pointer.active) {
      down(clientX, clientY);
      return;
    }
    place(clientX, clientY);
  }
  const onPointerDown = (e: PointerEvent) => down(e.clientX, e.clientY);
  const onPointerMove = (e: PointerEvent) => move(e.clientX, e.clientY);
  const onTouchStart = (e: TouchEvent) => down(e.touches[0].clientX, e.touches[0].clientY);
  const onTouchMove = (e: TouchEvent) => move(e.touches[0].clientX, e.touches[0].clientY);
  const onLeave = () => (pointer.active = false);
  pit.addEventListener("pointerdown", onPointerDown);
  pit.addEventListener("pointermove", onPointerMove);
  pit.addEventListener("pointerleave", onLeave);
  // Touch events too: they keep coming while the page scrolls, pointer events do not.
  pit.addEventListener("touchstart", onTouchStart, { passive: true });
  pit.addEventListener("touchmove", onTouchMove, { passive: true });
  pit.addEventListener("touchend", onLeave);

  // Each face is drawn once, here, then only copied (rotated) every frame:
  // the relief and the soft shadow would be too slow to redraw 60 times a second on small phones.
  // Same token as the home page hero (2026-10-16): a disc in relief, lit from the top left,
  // with the face in white at 78 % of the disc.
  const lights = Object.fromEntries(
    LEVELS.map((n) => [n, css.getPropertyValue(`--satisfaction-${n}-light`).trim()]),
  ) as Record<Level, string>;
  const SPRITE = 24; // drawing units: the 24 × 24 box of SatisfactionFace
  const MARGIN = 4; // room for the shadow around the disc
  const FACE = (20 * 0.78) / SPRITE; // the face's 24 × 24 box fills 78 % of the disc (diameter 20)
  const scale = (Math.max(radius * 1.15, 20) / 10) * dpr;
  // Two drawings per level: the disc in relief, which never turns (its light
  // stays at the top left, as in the hero), and the face, which turns with the body.
  const sprite = (paint: (g: CanvasRenderingContext2D) => void) => {
    const canvas = document.createElement("canvas");
    canvas.width = canvas.height = Math.ceil((SPRITE + 2 * MARGIN) * scale);
    const g = canvas.getContext("2d")!;
    g.scale(scale, scale);
    g.translate(MARGIN, MARGIN);
    paint(g);
    return canvas;
  };
  const discs = Object.fromEntries(
    LEVELS.map((n) => [
      n,
      sprite((g) => {
        const disc = new Path2D();
        disc.arc(12, 12, 10, 0, Math.PI * 2);
        // The disc, its soft shadow, and the light spot: the hero's « circle at 35% 30% ».
        const light = g.createRadialGradient(9, 8, 0, 9, 8, 19.1);
        light.addColorStop(0, lights[n]);
        light.addColorStop(0.62, colors[n]);
        light.addColorStop(1, colors[n]);
        g.shadowColor = "rgb(0 0 0 / 0.35)";
        g.shadowBlur = 3 * scale;
        g.fillStyle = light;
        g.fill(disc);
        g.shadowColor = "transparent";
        // Relief: a light rim on top, a darker rim at the bottom (the hero's inset shadows).
        g.clip(disc);
        const rim = (dy: number, color: string) => {
          const edge = new Path2D();
          edge.rect(0, 0, SPRITE, SPRITE);
          edge.arc(12, 12 + dy, 10, 0, Math.PI * 2);
          g.fillStyle = color;
          g.fill(edge, "evenodd");
        };
        rim(1.2, "rgb(255 255 255 / 0.25)");
        rim(-1.8, "rgb(0 0 0 / 0.2)");
      }),
    ]),
  ) as Record<Level, HTMLCanvasElement>;
  const faceSprites = Object.fromEntries(
    LEVELS.map((n) => [
      n,
      sprite((g) => {
        // The face, in white.
        g.translate(12 - 12 * FACE, 12 - 12 * FACE);
        g.scale(FACE, FACE);
        g.fillStyle = g.strokeStyle = "#fff";
        g.lineWidth = 1.9;
        g.lineCap = "round";
        g.lineJoin = "round";
        g.beginPath();
        g.arc(8.6, 9.6, 1.4, 0, Math.PI * 2);
        g.arc(15.4, 9.6, 1.4, 0, Math.PI * 2);
        g.fill();
        if (n === 1) g.fill(mouths[n]);
        g.stroke(mouths[n]);
      }),
    ]),
  ) as Record<Level, HTMLCanvasElement>;

  function draw(face: FaceBody) {
    const r = face.circleRadius ?? radius;
    const size = (r / 10) * (SPRITE + 2 * MARGIN); // the disc (radius 10) matches the body
    ctx.save();
    ctx.translate(face.position.x, face.position.y);
    ctx.drawImage(discs[face.level], -size / 2, -size / 2, size, size);
    ctx.rotate(face.angle);
    ctx.drawImage(faceSprites[face.level], -size / 2, -size / 2, size, size);
    ctx.restore();
  }

  let frame = 0;
  let last = performance.now();
  function loop(now: number) {
    frame = requestAnimationFrame(loop);
    const dt = Math.min(now - last, 33);
    last = now;
    if (pointer.active) {
      const speed = Math.hypot(pointer.x - pointer.lastX, pointer.y - pointer.lastY);
      if (speed > 1) push(Math.min(speed * 0.5, 10));
      pointer.lastX = pointer.x;
      pointer.lastY = pointer.y;
    }
    Engine.update(engine, dt);
    ctx.clearRect(0, 0, width, height);
    for (const face of faces) draw(face);
  }

  // Runs only while the pit is on screen.
  const visibility = new IntersectionObserver(([entry]) => {
    cancelAnimationFrame(frame);
    if (entry.isIntersecting) {
      last = performance.now();
      frame = requestAnimationFrame(loop);
    }
  });
  visibility.observe(pit);

  return () => {
    cancelAnimationFrame(frame);
    timers.forEach(clearTimeout);
    visibility.disconnect();
    resizer.disconnect();
    pit.removeEventListener("pointerdown", onPointerDown);
    pit.removeEventListener("pointermove", onPointerMove);
    pit.removeEventListener("pointerleave", onLeave);
    pit.removeEventListener("touchstart", onTouchStart);
    pit.removeEventListener("touchmove", onTouchMove);
    pit.removeEventListener("touchend", onLeave);
    Engine.clear(engine);
    canvas.remove();
  };
}
