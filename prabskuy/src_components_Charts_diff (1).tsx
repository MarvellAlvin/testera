--- src/components/Charts.tsx (原始)
// Custom Canvas Charts: Pie Chart, Line Chart, Bar Chart
// Zero allocation in draw lambda, animated

import React, { useRef, useEffect, useMemo } from 'react';

// ===== PIE CHART =====
interface PieSlice {
  label: string;
  value: number;
  color: string;
  icon?: string;
}

interface PieChartProps {
   PieSlice[];
  size?: number;
  showLegend?: boolean;
  emptyLabel?: string;
}

const PIE_COLORS = ['#22C55E', '#FB923C', '#3B82F6', '#A855F7', '#EAB308', '#EF4444', '#06B6D4', '#F97316'];

export function PieChart({ data, size = 180, showLegend = true, emptyLabel = 'Belum ada data' }: PieChartProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animRef = useRef<number>(0);
  const progressRef = useRef(0);

  const total = useMemo(() => data.reduce((sum, d) => sum + d.value, 0), [data]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const dpr = window.devicePixelRatio || 1;
    canvas.width = size * dpr;
    canvas.height = size * dpr;
    ctx.scale(dpr, dpr);

    progressRef.current = 0;
    const startTime = Date.now();
    const duration = 500;

    const draw = () => {
      const elapsed = Date.now() - startTime;
      progressRef.current = Math.min(elapsed / duration, 1);
      const ease = 1 - Math.pow(1 - progressRef.current, 3); // easeOutCubic

      ctx.clearRect(0, 0, size, size);
      const cx = size / 2;
      const cy = size / 2;
      const radius = size / 2 - 8;
      const innerRadius = radius * 0.6;

      if (total === 0) {
        // Empty state
        ctx.beginPath();
        ctx.arc(cx, cy, radius, 0, Math.PI * 2);
        ctx.arc(cx, cy, innerRadius, 0, Math.PI * 2, true);
        ctx.fillStyle = '#2C2C2E';
        ctx.fill();

        ctx.fillStyle = '#9CA3AF';
        ctx.font = '12px -apple-system, sans-serif';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(emptyLabel, cx, cy);
        return;
      }

      let startAngle = -Math.PI / 2;
      const totalAngle = Math.PI * 2 * ease;

      data.forEach((slice, i) => {
        const sliceAngle = (slice.value / total) * totalAngle;
        const color = slice.color || PIE_COLORS[i % PIE_COLORS.length];

        ctx.beginPath();
        ctx.moveTo(cx + Math.cos(startAngle) * innerRadius, cy + Math.sin(startAngle) * innerRadius);
        ctx.arc(cx, cy, radius, startAngle, startAngle + sliceAngle);
        ctx.arc(cx, cy, innerRadius, startAngle + sliceAngle, startAngle, true);
        ctx.closePath();
        ctx.fillStyle = color;
        ctx.fill();

        startAngle += sliceAngle;
      });

      // Center text
      ctx.fillStyle = '#F5F5F5';
      ctx.font = 'bold 14px -apple-system, sans-serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText('Total', cx, cy - 8);
      ctx.font = '11px -apple-system, sans-serif';
      ctx.fillStyle = '#9CA3AF';
      ctx.fillText(`${data.length} kategori`, cx, cy + 8);

      if (progressRef.current < 1) {
        animRef.current = requestAnimationFrame(draw);
      }
    };

    draw();
    return () => cancelAnimationFrame(animRef.current);
  }, [data, size, total, emptyLabel]);

  return (
    <div className="flex flex-col items-center gap-3">
      <canvas
        ref={canvasRef}
        style={{ width: size, height: size }}
        className="rounded-full"
      />
      {showLegend && data.length > 0 && (
        <div className="w-full space-y-1.5">
          {data.map((slice, i) => (
            <div key={i} className="flex items-center gap-2">
              <div
                className="w-3 h-3 rounded-sm shrink-0"
                style={{ backgroundColor: slice.color || PIE_COLORS[i % PIE_COLORS.length] }}
              />
              <span className="text-xs text-[#9CA3AF] flex-1 truncate">
                {slice.icon && <span className="mr-1">{slice.icon}</span>}
                {slice.label}
              </span>
              <span className="text-xs font-medium text-[#F5F5F5]">
                {total > 0 ? Math.round((slice.value / total) * 100) : 0}%
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ===== LINE CHART =====
interface LinePoint {
  label: string;
  value: number;
}

interface LineChartProps {
   LinePoint[];
  height?: number;
  color?: string;
  showLabels?: boolean;
  emptyLabel?: string;
}

export function LineChart({ data, height = 120, color = '#22C55E', showLabels = true, emptyLabel = 'Belum ada data' }: LineChartProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animRef = useRef<number>(0);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const dpr = window.devicePixelRatio || 1;
    const width = canvas.parentElement?.clientWidth || 300;
    canvas.width = width * dpr;
    canvas.height = height * dpr;
    canvas.style.width = `${width}px`;
    canvas.style.height = `${height}px`;
    ctx.scale(dpr, dpr);

    const padding = { top: 10, right: 10, bottom: showLabels ? 20 : 5, left: 10 };
    const chartWidth = width - padding.left - padding.right;
    const chartHeight = height - padding.top - padding.bottom;

    const startTime = Date.now();
    const duration = 600;

    const draw = () => {
      const elapsed = Date.now() - startTime;
      const progress = Math.min(elapsed / duration, 1);
      const ease = 1 - Math.pow(1 - progress, 3);

      ctx.clearRect(0, 0, width, height);

      if (data.length === 0) {
        ctx.fillStyle = '#9CA3AF';
        ctx.font = '12px -apple-system, sans-serif';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(emptyLabel, width / 2, height / 2);
        return;
      }

      const maxVal = Math.max(...data.map(d => d.value), 1);
      const minVal = Math.min(...data.map(d => d.value), 0);
      const range = maxVal - minVal || 1;

      // Grid lines
      ctx.strokeStyle = '#2C2C2E';
      ctx.lineWidth = 0.5;
      for (let i = 0; i <= 3; i++) {
        const y = padding.top + (chartHeight / 3) * i;
        ctx.beginPath();
        ctx.moveTo(padding.left, y);
        ctx.lineTo(width - padding.right, y);
        ctx.stroke();
      }

      // Points
      const points = data.map((d, i) => ({
        x: padding.left + (i / Math.max(data.length - 1, 1)) * chartWidth,
        y: padding.top + chartHeight - ((d.value - minVal) / range) * chartHeight,
      }));

      // Animated line (draw up to progress)
      const visibleCount = Math.ceil(points.length * ease);

      if (visibleCount > 1) {
        // Gradient fill
        const gradient = ctx.createLinearGradient(0, padding.top, 0, height - padding.bottom);
        gradient.addColorStop(0, color + '30');
        gradient.addColorStop(1, color + '00');

        // Fill area
        ctx.beginPath();
        ctx.moveTo(points[0].x, height - padding.bottom);
        for (let i = 0; i < visibleCount; i++) {
          ctx.lineTo(points[i].x, points[i].y);
        }
        ctx.lineTo(points[visibleCount - 1].x, height - padding.bottom);
        ctx.closePath();
        ctx.fillStyle = gradient;
        ctx.fill();

        // Line
        ctx.beginPath();
        ctx.moveTo(points[0].x, points[0].y);
        for (let i = 1; i < visibleCount; i++) {
          ctx.lineTo(points[i].x, points[i].y);
        }
        ctx.strokeStyle = color;
        ctx.lineWidth = 2;
        ctx.lineJoin = 'round';
        ctx.stroke();

        // Dots
        for (let i = 0; i < visibleCount; i++) {
          ctx.beginPath();
          ctx.arc(points[i].x, points[i].y, 3, 0, Math.PI * 2);
          ctx.fillStyle = color;
          ctx.fill();
          ctx.strokeStyle = '#121212';
          ctx.lineWidth = 1.5;
          ctx.stroke();
        }
      }

      // Labels
      if (showLabels && data.length > 0) {
        ctx.fillStyle = '#9CA3AF';
        ctx.font = '9px -apple-system, sans-serif';
        ctx.textAlign = 'center';
        const step = Math.max(1, Math.floor(data.length / 6));
        for (let i = 0; i < data.length; i += step) {
          ctx.fillText(data[i].label, points[i].x, height - 4);
        }
      }

      if (progress < 1) {
        animRef.current = requestAnimationFrame(draw);
      }
    };

    draw();
    return () => cancelAnimationFrame(animRef.current);
  }, [data, height, color, showLabels, emptyLabel]);

  return (
    <div className="w-full">
      <canvas ref={canvasRef} className="w-full" />
    </div>
  );
}

// ===== HEATMAP (GitHub-style) =====
interface HeatmapProps {
   { date: string; value: number }[];
  weeks?: number;
}

export function Heatmap({ data, weeks = 12 }: HeatmapProps) {
  const dataMap = useMemo(() => {
    const map = new Map<string, number>();
    data.forEach(d => map.set(d.date, d.value));
    return map;
  }, [data]);

  const cells = useMemo(() => {
    const result: { date: string; value: number; dayOfWeek: number }[] = [];
    const today = new Date();

    for (let i = weeks * 7 - 1; i >= 0; i--) {
      const d = new Date(today);
      d.setDate(d.getDate() - i);
      const dateStr = d.toISOString().split('T')[0];
      result.push({
        date: dateStr,
        value: dataMap.get(dateStr) || 0,
        dayOfWeek: d.getDay(),
      });
    }
    return result;
  }, [dataMap, weeks]);

  const maxVal = useMemo(() => Math.max(...cells.map(c => c.value), 1), [cells]);

  const getColor = (value: number): string => {
    if (value === 0) return '#1C1C1E';
    const intensity = value / maxVal;
    if (intensity < 0.25) return '#22C55E30';
    if (intensity < 0.5) return '#22C55E50';
    if (intensity < 0.75) return '#22C55E80';
    return '#22C55E';
  };

  // Group by weeks
  const weekColumns: typeof cells[] = [];
  for (let i = 0; i < cells.length; i += 7) {
    weekColumns.push(cells.slice(i, i + 7));
  }

  return (
    <div className="flex gap-[3px] overflow-x-auto pb-2">
      {weekColumns.map((week, wi) => (
        <div key={wi} className="flex flex-col gap-[3px]">
          {week.map((cell, di) => (
            <div
              key={cell.date}
              className="w-3 h-3 rounded-sm transition-colors"
              style={{ backgroundColor: getColor(cell.value) }}
              title={`${cell.date}: ${cell.value}`}
            />
          ))}
        </div>
      ))}
    </div>
  );
}

// ===== COMPARISON BAR =====
interface ComparisonBarProps {
  label1: string;
  value1: number;
  label2: string;
  value2: number;
  color1?: string;
  color2?: string;
}

export function ComparisonBar({ label1, value1, label2, value2, color1 = '#22C55E', color2 = '#FB923C' }: ComparisonBarProps) {
  const max = Math.max(value1, value2, 1);

  return (
    <div className="space-y-2">
      <div className="flex items-center gap-2">
        <span className="text-[10px] text-[#9CA3AF] w-16 text-right">{label1}</span>
        <div className="flex-1 h-4 bg-[#2C2C2E] rounded-full overflow-hidden">
          <div
            className="h-full rounded-full transition-all duration-500"
            style={{ width: `${(value1 / max) * 100}%`, backgroundColor: color1 }}
          />
        </div>
      </div>
      <div className="flex items-center gap-2">
        <span className="text-[10px] text-[#9CA3AF] w-16 text-right">{label2}</span>
        <div className="flex-1 h-4 bg-[#2C2C2E] rounded-full overflow-hidden">
          <div
            className="h-full rounded-full transition-all duration-500"
            style={{ width: `${(value2 / max) * 100}%`, backgroundColor: color2 }}
          />
        </div>
      </div>
    </div>
  );
}


+++ src/components/Charts.tsx (修改后)
// Custom Canvas Charts: Pie Chart, Line Chart, Bar Chart
// Zero allocation in draw lambda, animated

import React, { useRef, useEffect, useMemo } from 'react';

// ===== PIE CHART =====
interface PieSlice {
  label: string;
  value: number;
  color: string;
  icon?: string;
}

interface PieChartProps {
   PieSlice[];
  size?: number;
  showLegend?: boolean;
  emptyLabel?: string;
}

const PIE_COLORS = ['#22C55E', '#FB923C', '#3B82F6', '#A855F7', '#EAB308', '#EF4444', '#06B6D4', '#F97316'];

export function PieChart({ data, size = 180, showLegend = true, emptyLabel = 'Belum ada data' }: PieChartProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animRef = useRef<number>(0);
  const progressRef = useRef(0);

  const total = useMemo(() => data.reduce((sum, d) => sum + d.value, 0), [data]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const dpr = window.devicePixelRatio || 1;
    canvas.width = size * dpr;
    canvas.height = size * dpr;
    ctx.scale(dpr, dpr);

    progressRef.current = 0;
    const startTime = Date.now();
    const duration = 500;

    const draw = () => {
      const elapsed = Date.now() - startTime;
      progressRef.current = Math.min(elapsed / duration, 1);
      const ease = 1 - Math.pow(1 - progressRef.current, 3); // easeOutCubic

      ctx.clearRect(0, 0, size, size);
      const cx = size / 2;
      const cy = size / 2;
      const radius = size / 2 - 8;
      const innerRadius = radius * 0.6;

      if (total === 0) {
        // Empty state
        ctx.beginPath();
        ctx.arc(cx, cy, radius, 0, Math.PI * 2);
        ctx.arc(cx, cy, innerRadius, 0, Math.PI * 2, true);
        ctx.fillStyle = '#2C2C2E';
        ctx.fill();

        ctx.fillStyle = '#9CA3AF';
        ctx.font = '12px -apple-system, sans-serif';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(emptyLabel, cx, cy);
        return;
      }

      let startAngle = -Math.PI / 2;
      const totalAngle = Math.PI * 2 * ease;

      // Draw pie slices
      data.forEach((slice, i) => {
        const sliceAngle = (slice.value / total) * totalAngle;
        const color = slice.color || PIE_COLORS[i % PIE_COLORS.length];

        ctx.beginPath();
        ctx.moveTo(cx + Math.cos(startAngle) * innerRadius, cy + Math.sin(startAngle) * innerRadius);
        ctx.arc(cx, cy, radius, startAngle, startAngle + sliceAngle);
        ctx.arc(cx, cy, innerRadius, startAngle + sliceAngle, startAngle, true);
        ctx.closePath();
        ctx.fillStyle = color;
        ctx.fill();

        // Draw label on slice if slice is large enough
        if (sliceAngle > 0.3) { // Only show label if slice is > ~17% of circle
          const midAngle = startAngle + sliceAngle / 2;
          const labelRadius = (radius + innerRadius) / 2;
          const labelX = cx + Math.cos(midAngle) * labelRadius;
          const labelY = cy + Math.sin(midAngle) * labelRadius;

          ctx.fillStyle = '#FFFFFF';
          ctx.font = 'bold 10px -apple-system, sans-serif';
          ctx.textAlign = 'center';
          ctx.textBaseline = 'middle';

          // Show icon if available
          if (slice.icon) {
            ctx.font = '14px -apple-system, sans-serif';
            ctx.fillText(slice.icon, labelX, labelY - 6);
          }

          // Show percentage
          const percentage = Math.round((slice.value / total) * 100);
          ctx.font = 'bold 9px -apple-system, sans-serif';
          ctx.fillText(`${percentage}%`, labelX, labelY + (slice.icon ? 6 : 0));
        }

        startAngle += sliceAngle;
      });

      // Center text
      ctx.fillStyle = '#F5F5F5';
      ctx.font = 'bold 14px -apple-system, sans-serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText('Total', cx, cy - 8);
      ctx.font = '11px -apple-system, sans-serif';
      ctx.fillStyle = '#9CA3AF';
      ctx.fillText(`${data.length} kategori`, cx, cy + 8);

      if (progressRef.current < 1) {
        animRef.current = requestAnimationFrame(draw);
      }
    };

    draw();
    return () => cancelAnimationFrame(animRef.current);
  }, [data, size, total, emptyLabel]);

  return (
    <div className="flex flex-col items-center gap-3">
      <canvas
        ref={canvasRef}
        style={{ width: size, height: size }}
        className="rounded-full"
      />
      {showLegend && data.length > 0 && (
        <div className="w-full space-y-1.5">
          {data.map((slice, i) => (
            <div key={i} className="flex items-center gap-2">
              <div
                className="w-3 h-3 rounded-sm shrink-0"
                style={{ backgroundColor: slice.color || PIE_COLORS[i % PIE_COLORS.length] }}
              />
              <span className="text-xs text-[#9CA3AF] flex-1 truncate">
                {slice.icon && <span className="mr-1">{slice.icon}</span>}
                {slice.label}
              </span>
              <span className="text-xs font-medium text-[#F5F5F5]">
                {total > 0 ? Math.round((slice.value / total) * 100) : 0}%
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ===== LINE CHART =====
interface LinePoint {
  label: string;
  value: number;
}

interface LineChartProps {
   LinePoint[];
  height?: number;
  color?: string;
  showLabels?: boolean;
  emptyLabel?: string;
}

export function LineChart({ data, height = 120, color = '#22C55E', showLabels = true, emptyLabel = 'Belum ada data' }: LineChartProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animRef = useRef<number>(0);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const dpr = window.devicePixelRatio || 1;
    const width = canvas.parentElement?.clientWidth || 300;
    canvas.width = width * dpr;
    canvas.height = height * dpr;
    canvas.style.width = `${width}px`;
    canvas.style.height = `${height}px`;
    ctx.scale(dpr, dpr);

    const padding = { top: 10, right: 10, bottom: showLabels ? 20 : 5, left: 10 };
    const chartWidth = width - padding.left - padding.right;
    const chartHeight = height - padding.top - padding.bottom;

    const startTime = Date.now();
    const duration = 600;

    const draw = () => {
      const elapsed = Date.now() - startTime;
      const progress = Math.min(elapsed / duration, 1);
      const ease = 1 - Math.pow(1 - progress, 3);

      ctx.clearRect(0, 0, width, height);

      if (data.length === 0) {
        ctx.fillStyle = '#9CA3AF';
        ctx.font = '12px -apple-system, sans-serif';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(emptyLabel, width / 2, height / 2);
        return;
      }

      const maxVal = Math.max(...data.map(d => d.value), 1);
      const minVal = Math.min(...data.map(d => d.value), 0);
      const range = maxVal - minVal || 1;

      // Grid lines
      ctx.strokeStyle = '#2C2C2E';
      ctx.lineWidth = 0.5;
      for (let i = 0; i <= 3; i++) {
        const y = padding.top + (chartHeight / 3) * i;
        ctx.beginPath();
        ctx.moveTo(padding.left, y);
        ctx.lineTo(width - padding.right, y);
        ctx.stroke();
      }

      // Points
      const points = data.map((d, i) => ({
        x: padding.left + (i / Math.max(data.length - 1, 1)) * chartWidth,
        y: padding.top + chartHeight - ((d.value - minVal) / range) * chartHeight,
      }));

      // Animated line (draw up to progress)
      const visibleCount = Math.ceil(points.length * ease);

      if (visibleCount > 1) {
        // Gradient fill
        const gradient = ctx.createLinearGradient(0, padding.top, 0, height - padding.bottom);
        gradient.addColorStop(0, color + '30');
        gradient.addColorStop(1, color + '00');

        // Fill area
        ctx.beginPath();
        ctx.moveTo(points[0].x, height - padding.bottom);
        for (let i = 0; i < visibleCount; i++) {
          ctx.lineTo(points[i].x, points[i].y);
        }
        ctx.lineTo(points[visibleCount - 1].x, height - padding.bottom);
        ctx.closePath();
        ctx.fillStyle = gradient;
        ctx.fill();

        // Line
        ctx.beginPath();
        ctx.moveTo(points[0].x, points[0].y);
        for (let i = 1; i < visibleCount; i++) {
          ctx.lineTo(points[i].x, points[i].y);
        }
        ctx.strokeStyle = color;
        ctx.lineWidth = 2;
        ctx.lineJoin = 'round';
        ctx.stroke();

        // Dots
        for (let i = 0; i < visibleCount; i++) {
          ctx.beginPath();
          ctx.arc(points[i].x, points[i].y, 3, 0, Math.PI * 2);
          ctx.fillStyle = color;
          ctx.fill();
          ctx.strokeStyle = '#121212';
          ctx.lineWidth = 1.5;
          ctx.stroke();
        }
      }

      // Labels
      if (showLabels && data.length > 0) {
        ctx.fillStyle = '#9CA3AF';
        ctx.font = '9px -apple-system, sans-serif';
        ctx.textAlign = 'center';
        const step = Math.max(1, Math.floor(data.length / 6));
        for (let i = 0; i < data.length; i += step) {
          ctx.fillText(data[i].label, points[i].x, height - 4);
        }
      }

      if (progress < 1) {
        animRef.current = requestAnimationFrame(draw);
      }
    };

    draw();
    return () => cancelAnimationFrame(animRef.current);
  }, [data, height, color, showLabels, emptyLabel]);

  return (
    <div className="w-full">
      <canvas ref={canvasRef} className="w-full" />
    </div>
  );
}

// ===== HEATMAP (GitHub-style) =====
interface HeatmapProps {
   { date: string; value: number }[];
  weeks?: number;
}

export function Heatmap({ data, weeks = 12 }: HeatmapProps) {
  const dataMap = useMemo(() => {
    const map = new Map<string, number>();
    data.forEach(d => map.set(d.date, d.value));
    return map;
  }, [data]);

  const cells = useMemo(() => {
    const result: { date: string; value: number; dayOfWeek: number }[] = [];
    const today = new Date();

    for (let i = weeks * 7 - 1; i >= 0; i--) {
      const d = new Date(today);
      d.setDate(d.getDate() - i);
      const dateStr = d.toISOString().split('T')[0];
      result.push({
        date: dateStr,
        value: dataMap.get(dateStr) || 0,
        dayOfWeek: d.getDay(),
      });
    }
    return result;
  }, [dataMap, weeks]);

  const maxVal = useMemo(() => Math.max(...cells.map(c => c.value), 1), [cells]);

  const getColor = (value: number): string => {
    if (value === 0) return '#1C1C1E';
    const intensity = value / maxVal;
    if (intensity < 0.25) return '#22C55E30';
    if (intensity < 0.5) return '#22C55E50';
    if (intensity < 0.75) return '#22C55E80';
    return '#22C55E';
  };

  // Group by weeks
  const weekColumns: typeof cells[] = [];
  for (let i = 0; i < cells.length; i += 7) {
    weekColumns.push(cells.slice(i, i + 7));
  }

  return (
    <div className="flex gap-[3px] overflow-x-auto pb-2">
      {weekColumns.map((week, wi) => (
        <div key={wi} className="flex flex-col gap-[3px]">
          {week.map((cell, di) => (
            <div
              key={cell.date}
              className="w-3 h-3 rounded-sm transition-colors"
              style={{ backgroundColor: getColor(cell.value) }}
              title={`${cell.date}: ${cell.value}`}
            />
          ))}
        </div>
      ))}
    </div>
  );
}

// ===== COMPARISON BAR =====
interface ComparisonBarProps {
  label1: string;
  value1: number;
  label2: string;
  value2: number;
  color1?: string;
  color2?: string;
}

export function ComparisonBar({ label1, value1, label2, value2, color1 = '#22C55E', color2 = '#FB923C' }: ComparisonBarProps) {
  const max = Math.max(value1, value2, 1);

  return (
    <div className="space-y-2">
      <div className="flex items-center gap-2">
        <span className="text-[10px] text-[#9CA3AF] w-16 text-right">{label1}</span>
        <div className="flex-1 h-4 bg-[#2C2C2E] rounded-full overflow-hidden">
          <div
            className="h-full rounded-full transition-all duration-500"
            style={{ width: `${(value1 / max) * 100}%`, backgroundColor: color1 }}
          />
        </div>
      </div>
      <div className="flex items-center gap-2">
        <span className="text-[10px] text-[#9CA3AF] w-16 text-right">{label2}</span>
        <div className="flex-1 h-4 bg-[#2C2C2E] rounded-full overflow-hidden">
          <div
            className="h-full rounded-full transition-all duration-500"
            style={{ width: `${(value2 / max) * 100}%`, backgroundColor: color2 }}
          />
        </div>
      </div>
    </div>
  );
}
