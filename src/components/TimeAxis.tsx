import React, { useRef, useEffect, useState } from "react";

interface TimeAxisProps {
  currentTime: number;
  onTimeChange: (time: number) => void;
  minTime?: number;
  maxTime?: number;
}

const TimeAxis: React.FC<TimeAxisProps> = ({
  currentTime,
  onTimeChange,
  minTime = 0,
  maxTime = 1800000000,
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  const [viewDuration, setViewDuration] = useState(31536000 * 2);
  const [viewCenter, setViewCenter] = useState(
    currentTime > 0 ? currentTime : 1735689600,
  );
  const [dimensions, setDimensions] = useState({ width: 800, height: 50 });

  const [isDragging, setIsDragging] = useState(false);
  const dragStartX = useRef<number>(0);
  const lastMouseX = useRef<number>(0);
  const isClick = useRef<boolean>(true);
  // キャンバス再描画の最適化: 前回のレンダリング状態を記録
  const lastRenderStateRef = useRef<{
    viewCenter: number;
    viewDuration: number;
    currentTime: number;
    width: number;
    height: number;
  } | null>(null);

  useEffect(() => {
    if (!containerRef.current) return;
    const resizeObserver = new ResizeObserver((entries) => {
      for (let entry of entries) {
        setDimensions({
          width: entry.contentRect.width,
          height: entry.contentRect.height,
        });
      }
    });
    resizeObserver.observe(containerRef.current);
    return () => resizeObserver.disconnect();
  }, []);

  useEffect(() => {
    const startTime = viewCenter - viewDuration / 2;
    const endTime = viewCenter + viewDuration / 2;

    const buffer = viewDuration * 0.05;
    if (currentTime < startTime - buffer || currentTime > endTime + buffer) {
      setViewCenter(currentTime);
    }
  }, [currentTime, viewDuration, viewCenter]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const width = dimensions.width;
    const height = dimensions.height;

    // 再描画が必要かチェック（前回のレンダリング状態と比較）
    const currentState = {
      viewCenter,
      viewDuration,
      currentTime,
      width,
      height,
    };
    const lastState = lastRenderStateRef.current;

    if (
      lastState &&
      lastState.viewCenter === currentState.viewCenter &&
      lastState.viewDuration === currentState.viewDuration &&
      lastState.currentTime === currentState.currentTime &&
      lastState.width === currentState.width &&
      lastState.height === currentState.height
    ) {
      return; // 再描画不要
    }

    lastRenderStateRef.current = currentState;

    canvas.width = width;
    canvas.height = height;

    ctx.clearRect(0, 0, width, height);
    const startTime = viewCenter - viewDuration / 2;
    const endTime = viewCenter + viewDuration / 2;
    const timePerPixel = viewDuration / width;

    ctx.fillStyle = "#333";
    ctx.textAlign = "center";
    ctx.textBaseline = "top";
    ctx.font = "10px sans-serif";

    let tickInterval = 3600;
    if (viewDuration > 31536000 * 5) tickInterval = 31536000;
    else if (viewDuration > 31536000) tickInterval = 2628000 * 3;
    else if (viewDuration > 2628000 * 2) tickInterval = 2628000;
    else if (viewDuration > 86400 * 10) tickInterval = 86400 * 5;
    else if (viewDuration > 86400 * 2) tickInterval = 86400;
    else if (viewDuration > 3600 * 12) tickInterval = 3600 * 6;
    else if (viewDuration > 3600 * 2) tickInterval = 3600;
    else tickInterval = 60 * 10;

    const firstTick = Math.ceil(startTime / tickInterval) * tickInterval;

    for (let t = firstTick; t <= endTime; t += tickInterval) {
      const x = (t - startTime) / timePerPixel;

      ctx.beginPath();
      ctx.moveTo(x, height - 15);
      ctx.lineTo(x, height);
      ctx.strokeStyle = "#999";
      ctx.stroke();

      const date = new Date(t * 1000);
      let label = "";
      if (tickInterval >= 31536000) label = date.getFullYear().toString();
      else if (tickInterval >= 2628000)
        label = `${date.getMonth() + 1}/${date.getDate()}`;
      else if (tickInterval >= 86400)
        label = `${date.getMonth() + 1}/${date.getDate()}`;
      else
        label = `${date.getHours()}:${date.getMinutes().toString().padStart(2, "0")}`;

      ctx.fillText(label, x, height - 28);
    }

    const currentX = (currentTime - startTime) / timePerPixel;
    if (currentX >= -10 && currentX <= width + 10) {
      ctx.strokeStyle = "#0F766E";
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(currentX, 0);
      ctx.lineTo(currentX, height);
      ctx.stroke();
      ctx.lineWidth = 1;
    }
  }, [viewCenter, viewDuration, currentTime, dimensions]);

  const handleWheel = (e: React.WheelEvent) => {
    e.stopPropagation();
    e.preventDefault();

    const zoomFactor = 1.1;
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

    if (containerRef.current) {
      const rect = containerRef.current.getBoundingClientRect();
      const mouseX = e.clientX - rect.left;
      const width = rect.width;

      const oldStartTime = viewCenter - viewDuration / 2;
      const timeAtMouse = oldStartTime + (mouseX / width) * viewDuration;

      const newStartTime = timeAtMouse - (mouseX / width) * newDuration;
      const newCenter = newStartTime + newDuration / 2;

      setViewCenter(newCenter);
      setViewDuration(newDuration);
    }
  };

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

      setViewCenter((prev) => prev + deltaTime);
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
      onTimeChange(clickedTime);
    }
  };

  const handleMouseLeave = () => {
    setIsDragging(false);
  };

  return (
    <div
      ref={containerRef}
      style={{
        width: "100%",
        height: "100%",
        background: "transparent",
        cursor: isDragging ? "grabbing" : "grab",
      }}
      onWheel={handleWheel}
      onMouseDown={handleMouseDown}
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
      onMouseLeave={handleMouseLeave}
    >
      <canvas
        ref={canvasRef}
        width={800}
        height={50}
        style={{ width: "100%", height: "100%" }}
      />
    </div>
  );
};

export default TimeAxis;
