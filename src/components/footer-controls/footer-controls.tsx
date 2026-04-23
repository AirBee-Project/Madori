import { useTime } from "../../context/time";
import TimeAxis from "../time-axis/time-axis";
import TimeControls from "../time-controls/time-controls";
import styles from "./footer-controls.module.scss";

/**
 * 下部の時間操作パネル
 */
export default function FooterControls() {
	const {
		currentTime,
		setCurrentTime,
		isPlaying,
		setIsPlaying,
		playbackSpeed,
		setPlaybackSpeed,
	} = useTime();

	/**
	 * 現在時間の変換
	 */

	const formattedTime = new Date(currentTime * 1000).toLocaleString();

	/**
	 * 再生状態を反転させる
	 */
	const handleTogglePlay = () => {
		setIsPlaying(!isPlaying);
	};

	return (
		<div className={styles.container}>
			<div className={styles.topRow}>
				<div className={styles.timestamp}>
					{formattedTime}
				</div>

				<div className={styles.controlsCenter}>
					<TimeControls
						isPlaying={isPlaying}
						onPlayPause={handleTogglePlay}
						speed={playbackSpeed}
						onSpeedChange={setPlaybackSpeed}
					/>
				</div>
			</div>
			<div className={styles.timelineBar}>
				<TimeAxis 
					currentTime={currentTime} 
					onTimeChange={setCurrentTime} 
				/>
			</div>
		</div>
	);
}
