--- src/hooks/usePullToRefresh.tsx (原始)


+++ src/hooks/usePullToRefresh.tsx (修改后)
// Pull to Refresh Hook
import { useState, useRef, useEffect } from 'react';

interface PullToRefreshOptions {
  onRefresh: () => Promise<void>;
  threshold?: number;
  maxPull?: number;
}

export function usePullToRefresh({ onRefresh, threshold = 80, maxPull = 120 }: PullToRefreshOptions) {
  const [pullDistance, setPullDistance] = useState(0);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isPulling, setIsPulling] = useState(false);
  const startY = useRef(0);
  const currentY = useRef(0);

  const handleTouchStart = (e: React.TouchEvent) => {
    if (isRefreshing) return;
    startY.current = e.touches[0].clientY;
    setIsPulling(true);
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (!isPulling || isRefreshing) return;

    currentY.current = e.touches[0].clientY;
    const distance = currentY.current - startY.current;

    if (distance > 0) {
      // Only allow pull if at top of scroll
      const scrollContainer = e.currentTarget as HTMLElement;
      if (scrollContainer.scrollTop === 0) {
        const pullAmount = Math.min(distance * 0.5, maxPull);
        setPullDistance(pullAmount);
      }
    }
  };

  const handleTouchEnd = async () => {
    if (!isPulling) return;

    setIsPulling(false);

    if (pullDistance >= threshold && !isRefreshing) {
      setIsRefreshing(true);
      try {
        await onRefresh();
      } catch (error) {
        console.error('Refresh failed:', error);
      } finally {
        setIsRefreshing(false);
        setPullDistance(0);
      }
    } else {
      setPullDistance(0);
    }
  };

  return {
    pullDistance,
    isRefreshing,
    handlers: {
      onTouchStart: handleTouchStart,
      onTouchMove: handleTouchMove,
      onTouchEnd: handleTouchEnd,
    },
  };
}

// Pull to Refresh Indicator Component
export function PullToRefreshIndicator({
  pullDistance,
  isRefreshing,
  threshold
}: {
  pullDistance: number;
  isRefreshing: boolean;
  threshold: number;
}) {
  const isReady = pullDistance >= threshold;
  const rotation = isRefreshing ? 360 : (pullDistance / threshold) * 180;

  return (
    <div
      className="flex items-center justify-center overflow-hidden transition-all duration-200"
      style={{
        height: isRefreshing ? '60px' : `${pullDistance}px`,
        opacity: pullDistance > 0 || isRefreshing ? 1 : 0,
      }}
    >
      <div className="flex items-center gap-2">
        <svg
          width="24"
          height="24"
          viewBox="0 0 24 24"
          fill="none"
          className={`transition-transform ${isRefreshing ? 'animate-spin' : ''}`}
          style={{ transform: `rotate(${rotation}deg)` }}
        >
          <path
            d="M12 2V6M12 18V22M6 12H2M22 12H18M17.66 6.34L20.5 3.5M3.5 20.5L6.34 17.66M6.34 6.34L3.5 3.5M20.5 20.5L17.66 17.66"
            stroke={isReady ? '#22C55E' : '#9CA3AF'}
            strokeWidth="2"
            strokeLinecap="round"
          />
        </svg>
        <span className={`text-sm ${isReady ? 'text-[#22C55E]' : 'text-[#9CA3AF]'}`}>
          {isRefreshing ? 'Memuat...' : isReady ? 'Lepas untuk refresh' : 'Tarik untuk refresh'}
        </span>
      </div>
    </div>
  );
}
