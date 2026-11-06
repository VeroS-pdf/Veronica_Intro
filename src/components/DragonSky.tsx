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
 * The dragons can be clicked. A click makes yellow sparkles pop out, knocks the
 * dragon back a little, and then it zooms off at high speed for about five
 * seconds before settling back to its usual pace. A click on a dragon is used up
 * by the dragon, so on the lock screen it plays with the dragon instead of
 * unlocking.
 *
 * Visitors who prefer reduced motion get dragons that rest in place (and can't be clicked).
 *
 * To change how many dragons there are, how big or fast: edit `DRAGONS`.
 * To change what a click does (knock-back, speed-up, sparkles): edit `CLICK` and `SPARKLES`.
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

/** What happens to a dragon when it is clicked. */
const CLICK = {
  /** Seconds the dragon is knocked backward (it stops flying forward meanwhile). */
  recoilSeconds: 0.3,
  /** How far back it is knocked, in art pixels. */
  recoilPixels: 9,
  /** How long the speed-up lasts in total, counted from the click. */
  boostSeconds: 5,
  /** Top speed during the speed-up, as a multiple of the dragon's normal speed. */
  boostSpeed: 2.8,
  /** How much faster it can turn during the speed-up, so it still steers when going fast. */
  boostTurn: 1.5,
  /** Seconds to build up from the knock-back to full speed... */
  rampUpSeconds: 0.6,
  /** ...and to ease back to normal at the end. */
  rampDownSeconds: 1.4,
  /** The wings flap this many times faster at full effort. */
  boostFlap: 1.9,
};

/** The yellow sparkles that burst out of a clicked dragon. */
const SPARKLES = {
  count: 12,
  /** Seconds each sparkle lives. */
  life: 0.9,
  /** How far they fly out, in art pixels (each picks a distance between the two). */
  minReach: 9,
  maxReach: 24,
};

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
  /** Seconds since the dragon was last clicked (a huge number if it never was). */
  boostAge: number;
  /** How much faster than normal the wings are flapping right now (1 = normal). */
  flapFactor: number;
}

/** One sparkle in flight. */
interface Sparkle {
  element: HTMLElement;
  /** Where it was born, and how far it travels in total, in pixels. */
  x: number;
  y: number;
  dx: number;
  dy: number;
  age: number;
}

/** Eases from 0 to 1 as `t` goes from 0 to 1 (flat at both ends, so speed changes are smooth). */
function ease(t: number): number {
  const clamped = Math.max(0, Math.min(1, t));
  return clamped * clamped * (3 - 2 * clamped);
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
        boostAge: Infinity,
        flapFactor: 1,
      });
    });

    // --- Sparkles ----------------------------------------------------------------------------
    const sparkles: Sparkle[] = [];

    /** Puts a sparkle where it belongs for its age: it flies out fast, then slows to a stop. */
    const placeSparkle = (sparkle: Sparkle) => {
      const progress = 1 - (1 - sparkle.age / SPARKLES.life) ** 2;
      const x = Math.round((sparkle.x + sparkle.dx * progress) / snap) * snap;
      const y = Math.round((sparkle.y + sparkle.dy * progress) / snap) * snap;
      sparkle.element.style.transform = `translate(${x}px, ${y}px)`;
      // In its last moments it winks on and off before disappearing.
      const winking = sparkle.age / SPARKLES.life > 0.65 && Math.floor(sparkle.age * 18) % 2 === 1;
      sparkle.element.style.opacity = winking ? '0.25' : '1';
    };

    /** A burst of sparkles flying out from a point (in pixels, measured inside the sky). */
    const burst = (x: number, y: number) => {
      for (let i = 0; i < SPARKLES.count; i++) {
        const angle = (i / SPARKLES.count) * Math.PI * 2 + Math.random() * 0.6;
        const reach = (SPARKLES.minReach + Math.random() * (SPARKLES.maxReach - SPARKLES.minReach)) * snap;
        const element = document.createElement('div');
        // A mix of big plus-shaped sparkles, small ones, and single-pixel specks.
        element.className = `sparkle${i % 4 === 0 ? ' sparkle--big' : i % 4 === 2 ? ' sparkle--dot' : ''}`;
        sky.appendChild(element);
        const sparkle: Sparkle = { element, x, y, dx: Math.cos(angle) * reach, dy: Math.sin(angle) * reach, age: 0 };
        placeSparkle(sparkle);
        sparkles.push(sparkle);
      }
    };

    /** Removes finished sparkles and moves the rest along. */
    const updateSparkles = (dt: number) => {
      for (let i = sparkles.length - 1; i >= 0; i--) {
        const sparkle = sparkles[i];
        sparkle.age += dt;
        if (sparkle.age >= SPARKLES.life) {
          sparkle.element.remove();
          sparkles.splice(i, 1);
        } else {
          placeSparkle(sparkle);
        }
      }
    };

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
    const removeClickListeners: (() => void)[] = [];

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

            // After a click: first the dragon is knocked back, then it speeds up and slowly calms down again.
            let speedFactor = 1;
            let turnFactor = 1;
            let flapFactor = 1;
            let knockback = 0; // pixels per second, backward
            if (flyer.boostAge < CLICK.boostSeconds) {
              flyer.boostAge += dt;
              const age = flyer.boostAge;
              if (age < CLICK.recoilSeconds) {
                // Thrown back quickly, then slowing to a stop; it holds its heading and doesn't fly forward.
                speedFactor = 0;
                turnFactor = 0;
                flapFactor = CLICK.boostFlap;
                knockback = ((2 * CLICK.recoilPixels * snap) / CLICK.recoilSeconds) * (1 - age / CLICK.recoilSeconds);
              } else {
                const rampUp = ease((age - CLICK.recoilSeconds) / CLICK.rampUpSeconds);
                const rampDown = 1 - ease((age - (CLICK.boostSeconds - CLICK.rampDownSeconds)) / CLICK.rampDownSeconds);
                const strength = rampUp * rampDown;
                speedFactor = 1 + (CLICK.boostSpeed - 1) * strength;
                turnFactor = 1 + (CLICK.boostTurn - 1) * strength;
                flapFactor = 1 + (CLICK.boostFlap - 1) * strength;
              }
            }
            // Wings: only touch the style when the flapping speed has really changed.
            if (Math.abs(flyer.flapFactor - flapFactor) > 0.05) {
              flyer.flapFactor = flapFactor;
              flyer.flipper.style.setProperty('--flap', `${spec.flapSeconds / flapFactor}s`);
            }

            // Pick a new destination on arrival, or occasionally just because.
            // (A fast dragon swings wider, so it needs more room before it counts as arrived.)
            const turningRadius = (spec.speed * Math.max(1, speedFactor)) / (spec.turnRate * Math.max(1, turnFactor));
            const arrived = Math.hypot(dx, dy) < turningRadius * 2 + 20;
            if (arrived || Math.random() < dt * 0.12) flyer.target = pickTarget();

            // Turn toward the destination, but only as fast as the dragon is able to.
            let turn = Math.atan2(dy, dx) - flyer.heading;
            turn = Math.atan2(Math.sin(turn), Math.cos(turn)); // wrap to -PI..PI
            const maxTurn = spec.turnRate * turnFactor * dt;
            flyer.heading += Math.max(-maxTurn, Math.min(maxTurn, turn));

            const travel = spec.speed * speedFactor * dt - knockback * dt;
            flyer.position.x += Math.cos(flyer.heading) * travel;
            flyer.position.y += Math.sin(flyer.heading) * travel;

            // Only flip once it is clearly heading sideways, so it doesn't flicker.
            const sideways = Math.cos(flyer.heading);
            if (Math.abs(sideways) > 0.3) flyer.facingLeft = sideways < 0;

            draw(flyer, now / 1000);
          }
        }
        updateSparkles(dt);
        frame = requestAnimationFrame(tick);
      };
      frame = requestAnimationFrame(tick);

      // Clicking a dragon sets off sparkles and the knock-back / speed-up above.
      for (const flyer of flyers) {
        const onClick = (event: MouseEvent) => {
          event.stopPropagation(); // the dragon uses up the click (so it doesn't also unlock the lock screen)
          flyer.boostAge = 0;
          const rect = sky.getBoundingClientRect();
          burst(event.clientX - rect.left, event.clientY - rect.top);
        };
        flyer.mover.addEventListener('click', onClick);
        removeClickListeners.push(() => flyer.mover.removeEventListener('click', onClick));
      }
    }

    return () => {
      cancelAnimationFrame(frame);
      removeClickListeners.forEach((remove) => remove());
      sparkles.forEach((sparkle) => sparkle.element.remove());
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
