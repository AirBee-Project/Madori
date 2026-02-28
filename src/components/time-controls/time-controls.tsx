import {
	IconChevronDown,
	IconPlayerPauseFilled,
	IconPlayerPlayFilled,
} from "@tabler/icons-react";
import type React from "react";
import styles from "./time-controls.module.scss";

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
		{ label: "x1", value: 1 },
		{ label: "x10", value: 10 },
		{ label: "1min/s", value: 60 },
		{ label: "1hr/s", value: 3600 },
		{ label: "1day/s", value: 86400 },
		{ label: "1mo/s", value: 2592000 },
	];

	return (
		<div className={styles.container}>
			<button
				type="button"
				onClick={onPlayPause}
				className={styles.playButton}
				title={isPlaying ? "Pause" : "Play"}
			>
				{isPlaying ? (
					<IconPlayerPauseFilled size={24} className={styles.playIcon} />
				) : (
					<IconPlayerPlayFilled size={24} className={styles.playIcon} />
				)}
			</button>

			<div className={styles.speedWrapper}>
				<select
					value={speed}
					onChange={(e) => onSpeedChange(Number(e.target.value))}
					className={styles.speedSelect}
				>
					{speeds.map((s) => (
						<option key={s.value} value={s.value}>
							{s.label}
						</option>
					))}
				</select>
				<div className={styles.chevronIcon}>
					<IconChevronDown size={14} stroke={3} />
				</div>
			</div>
		</div>
	);
};

export default TimeControls;
