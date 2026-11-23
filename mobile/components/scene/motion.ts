import { useEffect, useMemo, useRef, useState } from 'react';
import {
  AccessibilityInfo,
  Animated,
  AppState,
  Easing,
  useWindowDimensions,
  type GestureResponderEvent,
} from 'react-native';

export interface SceneParallax {
  /** Touch position across the screen, -1 (left) to 1 (right). */
  x: Animated.Value;
  /** Touch position down the screen, -1 (top) to 1 (bottom). */
  y: Animated.Value;
}

/** 0 → 1 → 0 within one pass, so a single native-driven loop can breathe back and forth. */
const pingPong = (t: number) => (1 - Math.cos(2 * Math.PI * t)) / 2;

const clamp = (n: number) => Math.max(-1, Math.min(1, n));

/** True while the scene should hold still: reduced motion is on, the app is in the background or the screen is hidden. */
export function useCalm(paused = false): boolean {
  const [reduceMotion, setReduceMotion] = useState(false);
  const [active, setActive] = useState(true);

  useEffect(() => {
    let alive = true;
    AccessibilityInfo.isReduceMotionEnabled()
      .then((on) => alive && setReduceMotion(on))
      .catch(() => undefined);
    const motion = AccessibilityInfo.addEventListener('reduceMotionChanged', setReduceMotion);
    const app = AppState.addEventListener('change', (state) => setActive(state === 'active'));
    return () => {
      alive = false;
      motion.remove();
      app.remove();
    };
  }, []);

  return paused || reduceMotion || !active;
}

/**
 * The window size without the keyboard. Android shrinks the window when the keyboard opens, and the scene
 * must not re-layout (or re-render its SVG layers) every time a field gets focus.
 */
export function useStableWindow() {
  const { width, height } = useWindowDimensions();
  const last = useRef({ width, height });
  if (width !== last.current.width || height > last.current.height) {
    last.current = { width, height };
  }
  return last.current;
}

interface LoopOptions {
  /** Ping-pong 0 → 1 → 0 in one pass instead of a linear 0 → 1. */
  bounce?: boolean;
  /** Linear loops only: fraction of the first pass that has already played, so elements start out of step. */
  phase?: number;
}

/** A native-driven looping value. While `calm` it rests at a neutral position (halfway for bouncing loops). */
export function useLoop(duration: number, calm: boolean, { bounce = false, phase = 0 }: LoopOptions = {}) {
  const value = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (calm) {
      value.setValue(bounce ? 0.5 : 0);
      return undefined;
    }

    let head: Animated.CompositeAnimation | undefined;
    let loop: Animated.CompositeAnimation | undefined;
    const run = () => {
      value.setValue(0);
      loop = Animated.loop(
        Animated.timing(value, {
          toValue: 1,
          duration,
          easing: bounce ? pingPong : Easing.linear,
          useNativeDriver: true,
          isInteraction: false,
        }),
      );
      loop.start();
    };

    if (phase > 0 && !bounce) {
      value.setValue(phase);
      head = Animated.timing(value, {
        toValue: 1,
        duration: duration * (1 - phase),
        easing: Easing.linear,
        useNativeDriver: true,
        isInteraction: false,
      });
      head.start(({ finished }) => {
        if (finished) run();
      });
    } else {
      run();
    }

    return () => {
      head?.stop();
      loop?.stop();
    };
  }, [bounce, calm, duration, phase, value]);

  return value;
}

/** Touch-driven parallax: the layers lean toward the finger and settle back when it lifts. */
export function useParallax(calm: boolean) {
  const { width, height } = useStableWindow();
  const parallax = useMemo<SceneParallax>(() => ({ x: new Animated.Value(0), y: new Animated.Value(0) }), []);
  const stamp = useRef(0);

  const handlers = useMemo(() => {
    const settle = () => {
      for (const value of [parallax.x, parallax.y]) {
        Animated.spring(value, {
          toValue: 0,
          stiffness: 60,
          damping: 12,
          mass: 1,
          useNativeDriver: true,
          isInteraction: false,
        }).start();
      }
    };
    const follow = (event: GestureResponderEvent) => {
      const now = Date.now();
      if (calm || now - stamp.current < 40) return;
      stamp.current = now;
      const { pageX, pageY } = event.nativeEvent;
      const to = [clamp((pageX / width) * 2 - 1), clamp((pageY / height) * 2 - 1)];
      [parallax.x, parallax.y].forEach((value, i) => {
        Animated.timing(value, {
          toValue: to[i],
          duration: 180,
          easing: Easing.out(Easing.quad),
          useNativeDriver: true,
          isInteraction: false,
        }).start();
      });
    };
    return { onTouchStart: follow, onTouchMove: follow, onTouchEnd: settle, onTouchCancel: settle };
  }, [calm, height, parallax, width]);

  return { parallax, handlers };
}
