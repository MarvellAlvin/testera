--- src/hooks/useGestures.ts (原始)


+++ src/hooks/useGestures.ts (修改后)
// Gesture Navigation Hook - Swipe gestures for mobile
import { useState, useRef, useEffect } from 'react';

interface GestureOptions {
  onSwipeLeft?: () => void;
  onSwipeRight?: () => void;
  onSwipeUp?: () => void;
  onSwipeDown?: () => void;
  threshold?: number;
}

export function useGestures({ onSwipeLeft, onSwipeRight, onSwipeUp, onSwipeDown, threshold = 50 }: GestureOptions) {
  const touchStart = useRef<{ x: number; y: number } | null>(null);
  const touchEnd = useRef<{ x: number; y: number } | null>(null);

  const handleTouchStart = (e: React.TouchEvent) => {
    touchEnd.current = null;
    touchStart.current = { x: e.targetTouches[0].clientX, y: e.targetTouches[0].clientY };
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    touchEnd.current = { x: e.targetTouches[0].clientX, y: e.targetTouches[0].clientY };
  };

  const handleTouchEnd = () => {
    if (!touchStart.current || !touchEnd.current) return;

    const distanceX = touchStart.current.x - touchEnd.current.x;
    const distanceY = touchStart.current.y - touchEnd.current.y;
    const isHorizontal = Math.abs(distanceX) > Math.abs(distanceY);

    // Horizontal swipe
    if (isHorizontal) {
      if (Math.abs(distanceX) > threshold) {
        if (distanceX > 0) {
          onSwipeLeft?.();
        } else {
          onSwipeRight?.();
        }
      }
    } else {
      // Vertical swipe
      if (Math.abs(distanceY) > threshold) {
        if (distanceY > 0) {
          onSwipeUp?.();
        } else {
          onSwipeDown?.();
        }
      }
    }
  };

  return {
    handlers: {
      onTouchStart: handleTouchStart,
      onTouchMove: handleTouchMove,
      onTouchEnd: handleTouchEnd,
    },
  };
}

// Long Press Hook
export function useLongPress(callback: () => void, ms = 500) {
  const [isLongPress, setIsLongPress] = useState(false);
  const timeoutRef = useRef<ReturnType<typeof setTimeout>>();
  const startTimeoutRef = useRef<ReturnType<typeof setTimeout>>();

  const start = () => {
    startTimeoutRef.current = setTimeout(() => {
      setIsLongPress(true);
      callback();
    }, ms);
  };

  const clear = () => {
    if (startTimeoutRef.current) {
      clearTimeout(startTimeoutRef.current);
    }
    setIsLongPress(false);
  };

  return {
    isLongPress,
    handlers: {
      onMouseDown: start,
      onMouseUp: clear,
      onMouseLeave: clear,
      onTouchStart: start,
      onTouchEnd: clear,
    },
  };
}

// Pinch to Zoom Hook
export function usePinchZoom(minScale = 0.5, maxScale = 3) {
  const [scale, setScale] = useState(1);
  const lastDistance = useRef<number | null>(null);

  const handleTouchMove = (e: React.TouchEvent) => {
    if (e.touches.length === 2) {
      const touch1 = e.touches[0];
      const touch2 = e.touches[1];
      const distance = Math.hypot(
        touch1.clientX - touch2.clientX,
        touch1.clientY - touch2.clientY
      );

      if (lastDistance.current !== null) {
        const delta = distance - lastDistance.current;
        setScale(prev => Math.min(maxScale, Math.max(minScale, prev + delta * 0.01)));
      }

      lastDistance.current = distance;
    }
  };

  const handleTouchEnd = () => {
    lastDistance.current = null;
  };

  return {
    scale,
    handlers: {
      onTouchMove: handleTouchMove,
      onTouchEnd: handleTouchEnd,
    },
  };
}
