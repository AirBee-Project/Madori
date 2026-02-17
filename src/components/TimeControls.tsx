import React from 'react';

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
        { label: '1x', value: 1 },
        { label: '10x', value: 10 },
        { label: '1min/s', value: 60 },
        { label: '1hr/s', value: 3600 },
        { label: '1day/s', value: 86400 },
        { label: '1month/s', value: 2592000 },
    ];

    return (
        <div className="flex items-center space-x-4 bg-white p-2 rounded shadow-sm border border-gray-200">
            <button
                onClick={onPlayPause}
                className={`px-4 py-2 rounded font-bold text-white transition-colors duration-200 ${isPlaying ? 'bg-red-500 hover:bg-red-600' : 'bg-green-500 hover:bg-green-600'
                    }`}
            >
                {isPlaying ? 'Pause' : 'Play'}
            </button>

            <div className="flex items-center space-x-2">
                <span className="text-sm text-gray-600">Speed:</span>
                <select
                    value={speed}
                    onChange={(e) => onSpeedChange(Number(e.target.value))}
                    className="p-2 border border-gray-300 rounded bg-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                    {speeds.map((s) => (
                        <option key={s.value} value={s.value}>
                            {s.label}
                        </option>
                    ))}
                </select>
            </div>
        </div>
    );
};

export default TimeControls;
