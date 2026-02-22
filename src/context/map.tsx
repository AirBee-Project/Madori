import { FlyToInterpolator } from "@deck.gl/core";
import { createContext, type ReactNode, useContext, useState } from "react";

const INITIAL_VIEW_STATE = {
	longitude: 0,
	latitude: 0,
	zoom: 1,
	pitch: 0,
	bearing: 0,
};

type MapContextType = {
	viewState: any;
	setViewState: (vs: any) => void;
	isMapVisible: boolean;
	setIsMapVisible: (v: boolean) => void;
	compileMode: boolean;
	setCompileMode: (v: boolean) => void;
	flyTo: (lon: number, lat: number, zoom?: number, pitch?: number) => void;
};

const MapContext = createContext<MapContextType | undefined>(undefined);

export const MapProvider = ({ children }: { children: ReactNode }) => {
	const [viewState, setViewState] = useState<any>(INITIAL_VIEW_STATE);
	const [isMapVisible, setIsMapVisible] = useState(true);
	const [compileMode, setCompileMode] = useState(true);

	const flyTo = (lon: number, lat: number, zoom = 20, pitch = 45) => {
		setViewState({
			longitude: lon,
			latitude: lat,
			zoom,
			pitch,
			bearing: 0,
			transitionDuration: 1000,
			transitionInterpolator: new FlyToInterpolator(),
		});
	};

	return (
		<MapContext.Provider
			value={{
				viewState,
				setViewState,
				isMapVisible,
				setIsMapVisible,
				compileMode,
				setCompileMode,
				flyTo,
			}}
		>
			{children}
		</MapContext.Provider>
	);
};

export const useMap = () => {
	const context = useContext(MapContext);
	if (!context) throw new Error("useMap must be used within a MapProvider");
	return context;
};
