import {
	IconChevronDown,
	IconPlayerPauseFilled,
	IconPlayerPlayFilled,
} from "@tabler/icons-react";
import styles from "./time-controls.module.scss";

/**
 * タイムコントロールパネル用プロパティ
 */
interface TimeControlsProps {
	isPlaying: boolean;
	onPlayPause: () => void;
	speed: number;
	onSpeedChange: (speed: number) => void;
}

/**
 * 再生速度リスト
 */
const SPEEDS = [
	{ label: "x1", value: 1 },
	{ label: "x10", value: 10 },
	{ label: "1min/s", value: 60 },
	{ label: "1hr/s", value: 3600 },
	{ label: "1day/s", value: 86400 },
	{ label: "1mo/s", value: 2592000 },
];

/**
 * 画面下部の時間操作コントロールパネル（再生/停止、再生速度の変更）
 */
export default function TimeControls({
	isPlaying,
	onPlayPause,
	speed,
	onSpeedChange,
}: TimeControlsProps) {
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
					{SPEEDS.map((s) => (
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
}
