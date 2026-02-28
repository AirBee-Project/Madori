import {
	createContext,
	type ReactNode,
	useContext,
	useEffect,
	useMemo,
	useState,
} from "react";

type TimeContextType = {
	currentTime: number;
	setCurrentTime: React.Dispatch<React.SetStateAction<number>>;
	isPlaying: boolean;
	setIsPlaying: (v: boolean) => void;
	playbackSpeed: number;
	setPlaybackSpeed: (v: number) => void;
};

const TimeContext = createContext<TimeContextType | undefined>(undefined);

export const TimeProvider = ({ children }: { children: ReactNode }) => {
	const [currentTime, setCurrentTime] = useState(0);
	const [isPlaying, setIsPlaying] = useState(false);
	const [playbackSpeed, setPlaybackSpeed] = useState(1);

	useEffect(() => {
		let animationFrameId: number;
		let lastTimestamp: number = 0;

		const animate = (timestamp: number) => {
			if (!lastTimestamp) lastTimestamp = timestamp;

			const deltaTime = (timestamp - lastTimestamp) / 1000;
			lastTimestamp = timestamp;

			if (isPlaying) {
				setCurrentTime((prevTime) => prevTime + deltaTime * playbackSpeed);
			}

			animationFrameId = requestAnimationFrame(animate);
		};

		if (isPlaying) {
			animationFrameId = requestAnimationFrame(animate);
		} else {
			lastTimestamp = 0;
		}

		return () => {
			if (animationFrameId) cancelAnimationFrame(animationFrameId);
		};
	}, [isPlaying, playbackSpeed]);

	const contextValue = useMemo(
		() => ({
			currentTime,
			setCurrentTime,
			isPlaying,
			setIsPlaying,
			playbackSpeed,
			setPlaybackSpeed,
		}),
		[currentTime, isPlaying, playbackSpeed],
	);

	return (
		<TimeContext.Provider value={contextValue}>{children}</TimeContext.Provider>
	);
};

export const useTime = () => {
	const context = useContext(TimeContext);
	if (!context) throw new Error("useTime must be used within a TimeProvider");
	return context;
};
