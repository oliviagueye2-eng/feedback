"use client";

import { useEffect, useRef } from "react";
import { MOUTHS } from "../(public)/_feedback/SatisfactionFace";
import styles from "./footerFaces.module.css";

type Level = 1 | 2 | 3 | 4 | 5;
const LEVELS: Level[] = [1, 2, 3, 4, 5];

/** Share of the pit the faces fill once they have all fallen. */
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
export function FooterFaces() {
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

  return <div ref={pitRef} className={styles.pit} aria-hidden="true" />;
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
  const count = Math.floor((width * height * FILL) / (Math.PI * radius * radius));
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
  // the soft shadow would be too slow to redraw 60 times a second on small phones.
  // Style "plein" (2026-10-16): a disc of the level's colour, the face in white.
  const SPRITE = 24; // drawing units: the 24 × 24 box of SatisfactionFace
  const MARGIN = 4; // room for the shadow around the disc
  const scale = (Math.max(radius * 1.15, 20) / 10) * dpr;
  const sprites = Object.fromEntries(
    LEVELS.map((n) => {
      const sprite = document.createElement("canvas");
      sprite.width = sprite.height = Math.ceil((SPRITE + 2 * MARGIN) * scale);
      const g = sprite.getContext("2d")!;
      g.scale(scale, scale);
      g.translate(MARGIN, MARGIN);
      g.shadowColor = "rgb(0 0 0 / 0.35)";
      g.shadowBlur = 3 * scale;
      g.fillStyle = colors[n];
      g.beginPath();
      g.arc(12, 12, 10, 0, Math.PI * 2);
      g.fill();
      g.shadowColor = "transparent";
      g.fillStyle = g.strokeStyle = "#fff";
      g.lineWidth = 1.2;
      g.lineCap = "round";
      g.lineJoin = "round";
      g.beginPath();
      g.arc(8.6, 9.6, 1.1, 0, Math.PI * 2);
      g.arc(15.4, 9.6, 1.1, 0, Math.PI * 2);
      g.fill();
      g.stroke(mouths[n]);
      return [n, sprite];
    }),
  ) as Record<Level, HTMLCanvasElement>;

  function draw(face: FaceBody) {
    const r = face.circleRadius ?? radius;
    const size = (r / 10) * (SPRITE + 2 * MARGIN); // the disc (radius 10) matches the body
    ctx.save();
    ctx.translate(face.position.x, face.position.y);
    ctx.rotate(face.angle);
    ctx.drawImage(sprites[face.level], -size / 2, -size / 2, size, size);
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
