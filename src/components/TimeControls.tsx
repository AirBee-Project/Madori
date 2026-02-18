import React from 'react';
import { IconPlayerPlayFilled, IconPlayerPauseFilled, IconChevronDown } from '@tabler/icons-react';

interface TimeControlsProps {
    isPlaying: boolean;
    onPlayPause: () => void;
    speed: number;
    onSpeedChange: (speed: number) => void;
}

const TimeControls: React.FC<TimeControlsProps> = ({
    isPlaying,
    onPlayPause,
    speed,
    onSpeedChange,
}) => {
    const speeds = [
        { label: 'x1', value: 1 },
        { label: 'x10', value: 10 },
        { label: '1min/s', value: 60 },
        { label: '1hr/s', value: 3600 },
        { label: '1day/s', value: 86400 },
        { label: '1mo/s', value: 2592000 },
    ];

    return (
        <div className="flex items-center gap-0">
            <button
                onClick={onPlayPause}
                className="text-black hover:text-gray-700 transition-colors p-1 -translate-x-1/2"
                title={isPlaying ? 'Pause' : 'Play'}
            >
                {isPlaying ? (
                    <IconPlayerPauseFilled size={24} className="text-black" />
                ) : (
                    <IconPlayerPlayFilled size={24} className="text-black" />
                )}
            </button>

            <div className="relative group">
                <select
                    value={speed}
                    onChange={(e) => onSpeedChange(Number(e.target.value))}
                    className="appearance-none bg-white pl-3 pr-7 py-1 rounded-full shadow-md text-sm font-bold text-black cursor-pointer focus:outline-none focus:ring-2 focus:ring-[#0F766E]/20 hover:bg-gray-50 transition-colors"
                >
                    {speeds.map((s) => (
                        <option key={s.value} value={s.value}>
                            {s.label}
                        </option>
                    ))}
                </select>
                <div className="absolute right-2 top-1/2 -translate-y-1/2 pointer-events-none text-black">
                    <IconChevronDown size={14} stroke={3} />
                </div>
            </div>
        </div>
    );
};

export default TimeControls;
