import { useTime } from "../../context/time";
import styles from "./footer-controls.module.scss";
import TimeAxis from "../time-axis";
import TimeControls from "../time-controls/time-controls";

export default function FooterControls() {
	const {
		currentTime,
		setCurrentTime,
		isPlaying,
		setIsPlaying,
		playbackSpeed,
		setPlaybackSpeed,
	} = useTime();

	return (
		<div className={styles.container}>
			<div className={styles.topRow}>
				<div className={styles.timestamp}>
					{new Date(currentTime * 1000).toLocaleString()}
				</div>

				<div className={styles.controlsCenter}>
					<TimeControls
						isPlaying={isPlaying}
						onPlayPause={() => setIsPlaying(!isPlaying)}
						speed={playbackSpeed}
						onSpeedChange={setPlaybackSpeed}
					/>
				</div>
			</div>

			<div className={styles.timelineBar}>
				<TimeAxis currentTime={currentTime} onTimeChange={setCurrentTime} />
			</div>
		</div>
	);
}
