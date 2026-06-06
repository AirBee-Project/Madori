import { create } from "zustand";
import { devtools } from "zustand/middleware";
import { immer } from "zustand/middleware/immer";

interface TimeState {
  currentTime: number;
  isPlaying: boolean;
  playbackSpeed: number;
  minTime: number;
  maxTime: number;
}

interface TimeAction {
  setCurrentTime: (time: number | ((prev: number) => number)) => void;
  setIsPlaying: (isPlaying: boolean) => void;
  setPlaybackSpeed: (speed: number) => void;
}

/**
 * 表示時刻の状態管理フック
 */
export const useTimeStore = create<TimeState & TimeAction>()(
  devtools(
    immer((set) => ({
      currentTime: 1735689600,
      isPlaying: false,
      playbackSpeed: 1,
      minTime: 0,
      maxTime: 1893456000, // 2030-01-01 00:00:00 UTC (09:00:00 JST)

      setCurrentTime: (time) =>
        set(
          (state) => {
            const nextTime =
              typeof time === "function" ? time(state.currentTime) : time;
            state.currentTime = Math.max(
              state.minTime,
              Math.min(nextTime, state.maxTime),
            );
          },
          false,
          "setCurrentTime",
        ),

      setIsPlaying: (isPlaying) =>
        set(
          (state) => {
            state.isPlaying = isPlaying;
          },
          false,
          "setIsPlaying",
        ),

      setPlaybackSpeed: (playbackSpeed) =>
        set(
          (state) => {
            state.playbackSpeed = playbackSpeed;
          },
          false,
          "setPlaybackSpeed",
        ),
    })),
  ),
);
