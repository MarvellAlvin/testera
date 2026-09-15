--- src/components/UI.tsx (原始)


+++ src/components/UI.tsx (修改后)
// Shared UI components: ErrorBoundary, Confetti, Skeleton, KeyboardShortcuts

import React, { useEffect, useRef, useState, useCallback } from 'react';

// ===== ERROR BOUNDARY =====
interface ErrorBoundaryProps {
  children: React.ReactNode;
  fallback?: React.ReactNode;
}

interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends React.Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('[ErrorBoundary]', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return this.props.fallback || (
        <div className="flex flex-col items-center justify-center p-8 text-center">
          <div className="text-4xl mb-4">⚠️</div>
          <h3 className="text-lg font-bold text-[#F5F5F5] mb-2">Terjadi Kesalahan</h3>
          <p className="text-sm text-[#9CA3AF] mb-4">{this.state.error?.message}</p>
          <button
            onClick={() => this.setState({ hasError: false, error: null })}
            className="px-4 py-2 rounded-xl bg-[#22C55E] text-white text-sm font-medium"
          >
            Coba Lagi
          </button>
        </div>
      );
    }
    return this.props.children;
  }
}

// ===== CONFETTI =====
interface ConfettiProps {
  active: boolean;
  onComplete?: () => void;
}

interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  color: string;
  size: number;
  rotation: number;
  rotationSpeed: number;
  life: number;
}

export function Confetti({ active, onComplete }: ConfettiProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const particlesRef = useRef<Particle[]>([]);
  const animFrameRef = useRef<number>(0);

  useEffect(() => {
    if (!active) return;

    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;

    const colors = ['#22C55E', '#FB923C', '#3B82F6', '#EAB308', '#EF4444', '#A855F7'];

    // Create particles
    particlesRef.current = Array.from({ length: 30 }, () => ({
      x: canvas.width / 2 + (Math.random() - 0.5) * 200,
      y: canvas.height / 2,
      vx: (Math.random() - 0.5) * 12,
      vy: -Math.random() * 15 - 5,
      color: colors[Math.floor(Math.random() * colors.length)],
      size: Math.random() * 8 + 4,
      rotation: Math.random() * 360,
      rotationSpeed: (Math.random() - 0.5) * 10,
      life: 1,
    }));

    let startTime = Date.now();
    const duration = 1200;

    const animate = () => {
      const elapsed = Date.now() - startTime;
      if (elapsed > duration) {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        onComplete?.();
        return;
      }

      ctx.clearRect(0, 0, canvas.width, canvas.height);

      particlesRef.current.forEach(p => {
        p.x += p.vx;
        p.y += p.vy;
        p.vy += 0.5; // gravity
        p.rotation += p.rotationSpeed;
        p.life = 1 - (elapsed / duration);

        ctx.save();
        ctx.translate(p.x, p.y);
        ctx.rotate((p.rotation * Math.PI) / 180);
        ctx.globalAlpha = p.life;
        ctx.fillStyle = p.color;
        ctx.fillRect(-p.size / 2, -p.size / 2, p.size, p.size * 0.6);
        ctx.restore();
      });

      animFrameRef.current = requestAnimationFrame(animate);
    };

    animate();

    return () => {
      cancelAnimationFrame(animFrameRef.current);
    };
  }, [active, onComplete]);

  if (!active) return null;

  return (
    <canvas
      ref={canvasRef}
      className="fixed inset-0 pointer-events-none z-[100]"
    />
  );
}

// ===== SKELETON LOADER =====
interface SkeletonProps {
  className?: string;
  variant?: 'text' | 'circle' | 'rect' | 'card';
}

export function Skeleton({ className = '', variant = 'rect' }: SkeletonProps) {
  const baseClasses = 'bg-[#2C2C2E] animate-pulse rounded';

  switch (variant) {
    case 'text':
      return <div className={`${baseClasses} h-4 ${className}`} />;
    case 'circle':
      return <div className={`${baseClasses} rounded-full ${className}`} />;
    case 'card':
      return (
        <div className={`${baseClasses} p-4 rounded-xl ${className}`}>
          <div className="flex items-center gap-3 mb-3">
            <div className="w-10 h-10 rounded-full bg-[#2C2C2E] animate-pulse" />
            <div className="flex-1">
              <div className="h-4 bg-[#2C2C2E] animate-pulse rounded w-3/4 mb-2" />
              <div className="h-3 bg-[#2C2C2E] animate-pulse rounded w-1/2" />
            </div>
          </div>
          <div className="h-3 bg-[#2C2C2E] animate-pulse rounded w-full mb-2" />
          <div className="h-3 bg-[#2C2C2E] animate-pulse rounded w-2/3" />
        </div>
      );
    default:
      return <div className={`${baseClasses} ${className}`} />;
  }
}

// ===== KEYBOARD SHORTCUTS HOOK =====
interface Shortcut {
  key: string;
  ctrl?: boolean;
  shift?: boolean;
  alt?: boolean;
  action: () => void;
  description: string;
}

export function useKeyboardShortcuts(shortcuts: Shortcut[]) {
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      // Don't trigger in input fields
      const target = e.target as HTMLElement;
      if (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.tagName === 'SELECT') {
        return;
      }

      shortcuts.forEach(shortcut => {
        const matchKey = e.key.toLowerCase() === shortcut.key.toLowerCase();
        const matchCtrl = shortcut.ctrl ? (e.ctrlKey || e.metaKey) : true;
        const matchShift = shortcut.shift ? e.shiftKey : true;
        const matchAlt = shortcut.alt ? e.altKey : true;

        if (matchKey && matchCtrl && matchShift && matchAlt) {
          e.preventDefault();
          shortcut.action();
        }
      });
    };

    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [shortcuts]);
}

// ===== HAPTIC FEEDBACK =====
export function hapticFeedback(type: 'light' | 'medium' | 'heavy' = 'light'): void {
  if ('vibrate' in navigator) {
    switch (type) {
      case 'light': navigator.vibrate(10); break;
      case 'medium': navigator.vibrate(25); break;
      case 'heavy': navigator.vibrate(50); break;
    }
  }
}

// ===== TOAST NOTIFICATION =====
interface Toast {
  id: string;
  message: string;
  type: 'success' | 'error' | 'info' | 'warning';
  duration?: number;
  action?: { label: string; onClick: () => void };
}

let toastListeners: ((toasts: Toast[]) => void)[] = [];
let currentToasts: Toast[] = [];

export function showToast(toast: Omit<Toast, 'id'>): void {
  const id = `toast-${Date.now()}`;
  const newToast = { ...toast, id };
  currentToasts = [...currentToasts, newToast];
  toastListeners.forEach(l => l(currentToasts));

  setTimeout(() => {
    currentToasts = currentToasts.filter(t => t.id !== id);
    toastListeners.forEach(l => l(currentToasts));
  }, toast.duration || 3000);
}

export function ToastContainer() {
  const [toasts, setToasts] = useState<Toast[]>([]);

  useEffect(() => {
    toastListeners.push(setToasts);
    return () => {
      toastListeners = toastListeners.filter(l => l !== setToasts);
    };
  }, []);

  return (
    <div className="fixed bottom-24 left-4 right-4 z-50 flex flex-col gap-2 pointer-events-none">
      {toasts.map(toast => (
        <div
          key={toast.id}
          className={`pointer-events-auto px-4 py-3 rounded-xl shadow-lg flex items-center gap-3 animate-slide-up ${
            toast.type === 'success' ? 'bg-[#22C55E]/90 text-white' :
            toast.type === 'error' ? 'bg-[#EF4444]/90 text-white' :
            toast.type === 'warning' ? 'bg-[#EAB308]/90 text-black' :
            'bg-[#3B82F6]/90 text-white'
          }`}
        >
          <span className="text-sm flex-1">{toast.message}</span>
          {toast.action && (
            <button
              onClick={toast.action.onClick}
              className="text-xs font-bold underline"
            >
              {toast.action.label}
            </button>
          )}
        </div>
      ))}
    </div>
  );
}

// ===== UNDO SNACKBAR =====
interface UndoSnackbarProps {
  visible: boolean;
  label: string;
  onUndo: () => void;
  onDismiss: () => void;
}

export function UndoSnackbar({ visible, label, onUndo, onDismiss }: UndoSnackbarProps) {
  useEffect(() => {
    if (visible) {
      const timer = setTimeout(onDismiss, 5000);
      return () => clearTimeout(timer);
    }
  }, [visible, onDismiss]);

  if (!visible) return null;

  return (
    <div className="fixed bottom-24 left-4 right-4 z-50 animate-slide-up">
      <div className="bg-[#1C1C1E] border border-[#2C2C2E] rounded-xl px-4 py-3 shadow-lg flex items-center gap-3">
        <span className="text-sm text-[#F5F5F5] flex-1">{label}</span>
        <button
          onClick={onUndo}
          className="px-3 py-1 rounded-lg bg-[#22C55E]/20 text-[#22C55E] text-xs font-bold"
        >
          UNDO
        </button>
      </div>
    </div>
  );
}
