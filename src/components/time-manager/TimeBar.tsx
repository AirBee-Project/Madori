import type React from "react";
import { useEffect, useRef, useState } from "react";
import { useTimeStore } from "../../stores/timeStore";

/**
 * 表示範囲に基づいて適切な目盛りの刻み幅（秒数）を取得する
 */
function getTickInterval(viewDuration: number): number {
  if (viewDuration > 31536000 * 5) return 31536000;
  if (viewDuration > 31536000) return 2628000 * 3;
  if (viewDuration > 2628000 * 2) return 2628000;
  if (viewDuration > 86400 * 10) return 86400 * 5;
  if (viewDuration > 86400 * 2) return 86400;
  if (viewDuration > 3600 * 12) return 3600 * 6;
  if (viewDuration > 3600 * 2) return 3600;
  return 60 * 10;
}

/**
 * 刻み幅に基づいて適切なラベル文字列を作成する
 */
function formatTickLabel(timestamp: number, tickInterval: number): string {
  const date = new Date(timestamp * 1000);
  if (tickInterval >= 31536000) {
    return `${date.getFullYear()}年`;
  }
  if (tickInterval >= 86400) {
    return `${date.getMonth() + 1}/${date.getDate()}`;
  }
  return `${date.getHours()}:${date.getMinutes().toString().padStart(2, "0")}`;
}

/**
 * ブラウザの横幅を測定するフック
 */
function useCanvasDimensions(
  containerRef: React.RefObject<HTMLDivElement | null>,
) {
  const [dimensions, setDimensions] = useState({ width: 800, height: 44 });

  useEffect(() => {
    if (!containerRef.current) return;
    const resizeObserver = new ResizeObserver((entries) => {
      for (const entry of entries) {
        setDimensions({
          width: entry.contentRect.width,
          height: entry.contentRect.height,
        });
      }
    });
    resizeObserver.observe(containerRef.current);
    return () => resizeObserver.disconnect();
  }, [containerRef]);

  return dimensions;
}

/**
 * 表示範囲を管理するフック
 */
function useTimeRange(currentTime: number) {
  const [viewDuration, setViewDuration] = useState(86400 * 2);
  const [viewCenter, setViewCenter] = useState(currentTime);

  useEffect(() => {
    const startTime = viewCenter - viewDuration / 2;
    const endTime = viewCenter + viewDuration / 2;
    const buffer = viewDuration * 0.05;

    if (currentTime < startTime - buffer || currentTime > endTime + buffer) {
      setViewCenter(currentTime);
    }
  }, [currentTime, viewDuration, viewCenter]);

  return { viewDuration, setViewDuration, viewCenter, setViewCenter };
}

/**
 * 時間軸目盛りと現在インジケーターを描画するフック
 */
function useDrawTimeline(
  canvasRef: React.RefObject<HTMLCanvasElement | null>,
  dimensions: { width: number; height: number },
  viewCenter: number,
  viewDuration: number,
) {
  useEffect(() => {
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext("2d");
    if (!canvas || !ctx) return;

    const { width, height } = dimensions;
    const dpr = window.devicePixelRatio || 1;
    const targetWidth = Math.floor(width * dpr);
    const targetHeight = Math.floor(height * dpr);

    if (canvas.width !== targetWidth || canvas.height !== targetHeight) {
      canvas.width = targetWidth;
      canvas.height = targetHeight;
      canvas.style.width = `${width}px`;
      canvas.style.height = `${height}px`;
    }

    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.clearRect(0, 0, width, height);

    const startTime = viewCenter - viewDuration / 2;
    const endTime = viewCenter + viewDuration / 2;
    const timePerPixel = viewDuration / width;

    ctx.fillStyle = "#4b5563";
    ctx.textAlign = "center";
    ctx.textBaseline = "top";
    ctx.font = "600 10px 'Noto Sans JP', sans-serif";

    const tickInterval = getTickInterval(viewDuration);

    const firstTick = Math.ceil(startTime / tickInterval) * tickInterval;

    for (let t = firstTick; t <= endTime; t += tickInterval) {
      const x = (t - startTime) / timePerPixel;

      ctx.beginPath();
      ctx.moveTo(x, height - 12);
      ctx.lineTo(x, height);
      ctx.strokeStyle = "#d1d5db";
      ctx.stroke();

      const label = formatTickLabel(t, tickInterval);
      ctx.fillText(label, x, height - 26);
    }
  }, [viewCenter, viewDuration, dimensions, canvasRef]);
}

/**
 * Canvasベースの時間軸表示・操作盤コンポーネント（タイムバー）
 */
export default function TimeBar() {
  const currentTime = useTimeStore((state) => state.currentTime);
  const minTime = useTimeStore((state) => state.minTime);
  const maxTime = useTimeStore((state) => state.maxTime);
  const setCurrentTime = useTimeStore((state) => state.setCurrentTime);

  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);

  const dimensions = useCanvasDimensions(containerRef);
  const { viewDuration, setViewDuration, viewCenter, setViewCenter } =
    useTimeRange(currentTime);

  useDrawTimeline(canvasRef, dimensions, viewCenter, viewDuration);

  const [isDragging, setIsDragging] = useState(false);
  const dragStartX = useRef<number>(0);
  const lastMouseX = useRef<number>(0);
  const isClick = useRef<boolean>(true);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const handleWheel = (e: WheelEvent) => {
      e.preventDefault();
      e.stopPropagation();

      const zoomFactor = 1.15;
      const direction = e.deltaY > 0 ? 1 : -1;

      let newDuration = viewDuration;
      if (direction > 0) {
        newDuration *= zoomFactor;
      } else {
        newDuration /= zoomFactor;
      }

      const minDuration = 60;
      const maxDuration = (maxTime - minTime) * 1.5;
      newDuration = Math.max(minDuration, Math.min(newDuration, maxDuration));

      const rect = container.getBoundingClientRect();
      const mouseX = e.clientX - rect.left;
      const width = rect.width;

      const oldStartTime = viewCenter - viewDuration / 2;
      const timeAtMouse = oldStartTime + (mouseX / width) * viewDuration;

      const newStartTime = timeAtMouse - (mouseX / width) * newDuration;
      const newCenter = newStartTime + newDuration / 2;

      const clampedCenter = Math.max(minTime, Math.min(newCenter, maxTime));

      setViewCenter(clampedCenter);
      setViewDuration(newDuration);
    };

    container.addEventListener("wheel", handleWheel, { passive: false });
    return () => {
      container.removeEventListener("wheel", handleWheel);
    };
  }, [
    viewDuration,
    viewCenter,
    minTime,
    maxTime,
    setViewCenter,
    setViewDuration,
  ]);

  const handleMouseDown = (e: React.MouseEvent) => {
    setIsDragging(true);
    isClick.current = true;
    dragStartX.current = e.clientX;
    lastMouseX.current = e.clientX;
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (isDragging && containerRef.current) {
      const deltaX = e.clientX - lastMouseX.current;

      if (Math.abs(e.clientX - dragStartX.current) > 5) {
        isClick.current = false;
      }

      lastMouseX.current = e.clientX;

      const width = dimensions.width;
      const timePerPixel = viewDuration / width;
      const deltaTime = -deltaX * timePerPixel;

      setViewCenter((prev) => {
        const nextCenter = prev + deltaTime;
        return Math.max(minTime, Math.min(nextCenter, maxTime));
      });
    }
  };

  const handleMouseUp = (e: React.MouseEvent) => {
    setIsDragging(false);

    if (isClick.current && containerRef.current) {
      const rect = containerRef.current.getBoundingClientRect();
      const mouseX = e.clientX - rect.left;
      const width = rect.width;

      const startTime = viewCenter - viewDuration / 2;
      const clickedTime = startTime + (mouseX / width) * viewDuration;

      const clampedTime = Math.max(minTime, Math.min(clickedTime, maxTime));
      setCurrentTime(clampedTime);
    }
  };

  const handleMouseLeave = () => {
    setIsDragging(false);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "ArrowLeft") {
      e.preventDefault();
      setCurrentTime((prev) => Math.max(minTime, prev - 60));
    } else if (e.key === "ArrowRight") {
      e.preventDefault();
      setCurrentTime((prev) => Math.min(maxTime, prev + 60));
    }
  };

  const formattedValueText = new Date(currentTime * 1000).toLocaleString(
    "ja-JP",
    {
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
    },
  );

  const startTime = viewCenter - viewDuration / 2;
  const timePerPixel = viewDuration / dimensions.width;
  const currentX = (currentTime - startTime) / timePerPixel;

  return (
    <div
      ref={containerRef}
      role="slider"
      aria-label="タイムライン再生位置"
      aria-valuenow={currentTime}
      aria-valuemin={minTime}
      aria-valuemax={maxTime}
      aria-valuetext={formattedValueText}
      tabIndex={0}
      style={{
        position: "relative",
        width: "100%",
        height: "100%",
        background: "transparent",
        cursor: isDragging ? "grabbing" : "grab",
        userSelect: "none",
      }}
      onMouseDown={handleMouseDown}
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
      onMouseLeave={handleMouseLeave}
      onKeyDown={handleKeyDown}
    >
      <canvas
        ref={canvasRef}
        style={{
          width: "100%",
          height: "100%",
          display: "block",
        }}
      />
      {currentX >= 0 && currentX <= dimensions.width && (
        <div
          style={{
            position: "absolute",
            top: 0,
            bottom: 0,
            left: 0,
            width: "2px",
            backgroundColor: "#0f766e",
            pointerEvents: "none",
            transform: `translateX(${currentX}px)`,
          }}
        />
      )}
    </div>
  );
}
