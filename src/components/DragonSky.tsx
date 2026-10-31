/**
 * DragonSky: pastel purple dragons that wander around the welcome screen.
 *
 * Each dragon picks a random spot to fly to and steers toward it with a limited
 * turning speed, so its path is made of smooth, looping curves that are never
 * the same twice. It also picks a new destination now and then, so it
 * sometimes doubles back or swoops off the edge and returns.
 *
 * The animation runs outside React (it moves the elements directly each frame)
 * so it stays smooth. Positions snap to the pixel grid for a retro stepping
 * look, and each dragon flaps by swapping between two sprite frames.
 *
 * Visitors who prefer reduced motion get dragons that rest in place.
 *
 * To change how many dragons there are, how big or fast: edit `DRAGONS`.
 */
import { useLayoutEffect, useRef } from 'react';
import { DRAGON_WINGS_DOWN, DRAGON_WINGS_UP } from '../art/sprites';
import { PixelSprite } from './PixelSprite';

/** Settings for one dragon. */
interface DragonSpec {
  /** Size of each sprite pixel, in multiples of `--px`. */
  scale: number;
  /** Flight speed, in screen pixels per second. */
  speed: number;
  /** How sharply it can turn, in radians per second (lower = wider loops). */
  turnRate: number;
  /** Seconds for one full wing flap. */
  flapSeconds: number;
  /** 0 to 1. Smaller, fainter dragons look farther away. */
  opacity: number;
  /** Where it starts, as a fraction of the screen (0 to 1). */
  start: { x: number; y: number };
}

const DRAGONS: readonly DragonSpec[] = [
  { scale: 0.9, speed: 60, turnRate: 1.3, flapSeconds: 0.5, opacity: 1, start: { x: 0.2, y: 0.3 } },
  { scale: 0.7, speed: 46, turnRate: 1.7, flapSeconds: 0.42, opacity: 0.85, start: { x: 0.78, y: 0.22 } },
  { scale: 0.55, speed: 38, turnRate: 2, flapSeconds: 0.36, opacity: 0.7, start: { x: 0.55, y: 0.78 } },
];

/** A point on the screen, in pixels. */
interface Point {
  x: number;
  y: number;
}

/** Everything the animation needs to remember about one dragon. */
interface Flyer {
  spec: DragonSpec;
  /** Outer element, moved around the screen. */
  mover: HTMLElement;
  /** Inner element, flipped to face left or right. */
  flipper: HTMLElement;
  position: Point;
  /** Direction of travel in radians (0 = right, positive = down). */
  heading: number;
  /** The spot it is currently flying toward. */
  target: Point;
  facingLeft: boolean;
  /** Offsets the gentle up-and-down bobbing so dragons aren't in sync. */
  bobPhase: number;
}

export function DragonSky() {
  const skyRef = useRef<HTMLDivElement>(null);
  const moverRefs = useRef<(HTMLDivElement | null)[]>([]);

  // Layout effect: dragons are positioned before the first paint, so there is no flash at the corner.
  useLayoutEffect(() => {
    const sky = skyRef.current;
    if (!sky) return;

    const bounds = { width: sky.clientWidth, height: sky.clientHeight };
    const observer = new ResizeObserver(([entry]) => {
      bounds.width = entry.contentRect.width;
      bounds.height = entry.contentRect.height;
    });
    observer.observe(sky);

    /** One art pixel in screen pixels; movement snaps to this grid. */
    const readPixel = () => parseFloat(getComputedStyle(sky).getPropertyValue('--px')) || 4;
    let snap = readPixel();
    const onResize = () => {
      snap = readPixel();
    };
    window.addEventListener('resize', onResize);

    /** A random place to fly to; the margin lets dragons sometimes leave the screen and return. */
    const pickTarget = (): Point => ({
      x: bounds.width * (-0.08 + Math.random() * 1.16),
      y: bounds.height * (0.04 + Math.random() * 0.92),
    });

    const flyers: Flyer[] = [];
    DRAGONS.forEach((spec, index) => {
      const mover = moverRefs.current[index];
      const flipper = mover?.firstElementChild as HTMLElement | null;
      if (!mover || !flipper) return;
      flyers.push({
        spec,
        mover,
        flipper,
        position: { x: spec.start.x * bounds.width, y: spec.start.y * bounds.height },
        heading: Math.random() * Math.PI * 2,
        target: pickTarget(),
        facingLeft: false,
        bobPhase: Math.random() * Math.PI * 2,
      });
    });

    /** Moves the dragon's elements to match its current position and facing. */
    const draw = (flyer: Flyer, seconds: number) => {
      const bob = Math.sin(seconds * 2.4 + flyer.bobPhase) * snap * 1.5;
      const x = Math.round(flyer.position.x / snap) * snap;
      const y = Math.round((flyer.position.y + bob) / snap) * snap;
      flyer.mover.style.transform = `translate(${x}px, ${y}px)`;
      flyer.flipper.style.transform = `translate(-50%, -50%) scaleX(${flyer.facingLeft ? -1 : 1})`;
    };

    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    let frame = 0;

    if (prefersReducedMotion) {
      flyers.forEach((flyer) => draw(flyer, 0));
    } else {
      let lastTime = performance.now();

      const tick = (now: number) => {
        const dt = Math.min(0.05, (now - lastTime) / 1000);
        lastTime = now;

        // Skip while the window is hidden (zero size), e.g. minimised to the taskbar.
        if (bounds.width > 0 && bounds.height > 0) {
          for (const flyer of flyers) {
            const { spec } = flyer;
            const dx = flyer.target.x - flyer.position.x;
            const dy = flyer.target.y - flyer.position.y;

            // Pick a new destination on arrival, or occasionally just because.
            const turningRadius = spec.speed / spec.turnRate;
            const arrived = Math.hypot(dx, dy) < turningRadius * 2 + 20;
            if (arrived || Math.random() < dt * 0.12) flyer.target = pickTarget();

            // Turn toward the destination, but only as fast as the dragon is able to.
            let turn = Math.atan2(dy, dx) - flyer.heading;
            turn = Math.atan2(Math.sin(turn), Math.cos(turn)); // wrap to -PI..PI
            const maxTurn = spec.turnRate * dt;
            flyer.heading += Math.max(-maxTurn, Math.min(maxTurn, turn));

            flyer.position.x += Math.cos(flyer.heading) * spec.speed * dt;
            flyer.position.y += Math.sin(flyer.heading) * spec.speed * dt;

            // Only flip once it is clearly heading sideways, so it doesn't flicker.
            const sideways = Math.cos(flyer.heading);
            if (Math.abs(sideways) > 0.3) flyer.facingLeft = sideways < 0;

            draw(flyer, now / 1000);
          }
        }
        frame = requestAnimationFrame(tick);
      };
      frame = requestAnimationFrame(tick);
    }

    return () => {
      cancelAnimationFrame(frame);
      observer.disconnect();
      window.removeEventListener('resize', onResize);
    };
  }, []);

  return (
    <div className="sky" ref={skyRef} aria-hidden="true">
      {DRAGONS.map((spec, index) => (
        <div
          key={index}
          className="dragon"
          ref={(element) => {
            moverRefs.current[index] = element;
          }}
          style={{ opacity: spec.opacity }}
        >
          <div className="dragon__flipper" style={{ ['--flap' as string]: `${spec.flapSeconds}s` }}>
            <PixelSprite sprite={DRAGON_WINGS_UP} scale={spec.scale} className="dragon__frame dragon__frame--up" />
            <PixelSprite sprite={DRAGON_WINGS_DOWN} scale={spec.scale} className="dragon__frame dragon__frame--down" />
          </div>
        </div>
      ))}
    </div>
  );
}
