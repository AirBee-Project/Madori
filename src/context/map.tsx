import { FlyToInterpolator, type MapViewState } from "@deck.gl/core";
import {
	createContext,
	type ReactNode,
	useCallback,
	useContext,
	useMemo,
	useState,
} from "react";

const INITIAL_VIEW_STATE: MapViewState = {
	longitude: 0,
	latitude: 0,
	zoom: 1,
	pitch: 0,
	bearing: 0,
};

type MapContextType = {
	viewState: MapViewState;
	setViewState: (vs: MapViewState) => void;
	isMapVisible: boolean;
	setIsMapVisible: (v: boolean) => void;
	compileMode: boolean;
	setCompileMode: (v: boolean) => void;
	flyTo: (lon: number, lat: number, zoom?: number, pitch?: number) => void;
};

const MapContext = createContext<MapContextType | undefined>(undefined);

export const MapProvider = ({ children }: { children: ReactNode }) => {
	const [viewState, setViewState] = useState<MapViewState>(INITIAL_VIEW_STATE);
	const [isMapVisible, setIsMapVisible] = useState(true);
	const [compileMode, setCompileMode] = useState(true);

	const flyTo = useCallback(
		(lon: number, lat: number, zoom = 17, pitch = 45) => {
			setViewState({
				longitude: lon,
				latitude: lat,
				zoom,
				pitch,
				bearing: 0,
				transitionDuration: 1000,
				transitionInterpolator: new FlyToInterpolator(),
			});
		},
		[],
	);

	const contextValue = useMemo(
		() => ({
			viewState,
			setViewState,
			isMapVisible,
			setIsMapVisible,
			compileMode,
			setCompileMode,
			flyTo,
		}),
		[viewState, isMapVisible, compileMode, flyTo],
	);

	return (
		<MapContext.Provider value={contextValue}>{children}</MapContext.Provider>
	);
};

export const useMap = () => {
	const context = useContext(MapContext);
	if (!context) throw new Error("useMap must be used within a MapProvider");
	return context;
};
