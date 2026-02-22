import { useItem } from "../context/item";
import { useMap } from "../context/map";
import { useJson } from "../context/json";
import IdPanel from "./id-panel";
import JsonPanel from "./json-panel";
import { useState } from "react";
import {
    IconCube,
    IconFileText,
    IconPoint,
    IconLine,
    IconRefresh,
    IconClock,
    IconMap,
} from "@tabler/icons-react";
import styles from "../styles/upper-controls.module.css";

export default function UpperControls() {
    const [isIdPanelVisible, setIsIdPanelVisible] = useState(false);
    const [isJsonPanelVisible, setIsJsonPanelVisible] = useState(false);
    const { items, addObject, deleteItem, focusItem, updateVoxel } = useItem();
    const { compileMode, setCompileMode, isMapVisible, setIsMapVisible } = useMap();
    const { jsonItems, addJson, deleteJson, focusJson, colorChangeJson } = useJson();

    const handleColorChange = (id: number) => {
        console.log("Color change requested for", id);
    };

    return (
        <>
            <div className={styles.toolbar}>
                <button
                    className={`${styles.toolbarButton} ${isIdPanelVisible ? styles.toolbarButtonActive : ""}`}
                    onClick={() => {
                        setIsIdPanelVisible(!isIdPanelVisible);
                        if (!isIdPanelVisible) setIsJsonPanelVisible(false);
                    }}
                >
                    <IconCube size={16} /> ID
                </button>
                <button
                    className={`${styles.toolbarButton} ${isJsonPanelVisible ? styles.toolbarButtonActive : ""}`}
                    onClick={() => {
                        setIsJsonPanelVisible(!isJsonPanelVisible);
                        if (!isJsonPanelVisible) setIsIdPanelVisible(false);
                    }}
                >
                    <IconFileText size={16} /> JSON
                </button>
                <button className={styles.toolbarButton}>
                    <IconPoint size={16} /> 点
                </button>
                <button className={styles.toolbarButton}>
                    <IconLine size={16} /> 直線
                </button>
            </div>

            {isIdPanelVisible && (
                <IdPanel
                    items={items}
                    onAdd={() => addObject("voxel")}
                    onDelete={deleteItem}
                    onFocus={focusItem}
                    onUpdate={updateVoxel}
                    onColorChange={handleColorChange}
                />
            )}

            {isJsonPanelVisible && (
                <JsonPanel
                    jsonItems={jsonItems}
                    onAdd={addJson}
                    onDelete={deleteJson}
                    onFocus={focusJson}
                    onColorChange={colorChangeJson}
                />
            )}

            <div className={styles.rightControls}>
                <button
                    className={styles.circleButton}
                    onClick={() => setCompileMode(!compileMode)}
                    title="Toggle Compile Mode"
                >
                    <IconRefresh size={20} />
                </button>
                <button className={styles.circleButton}>
                    <IconClock size={20} />
                </button>
                <button
                    className={styles.circleButton}
                    onClick={() => setIsMapVisible(!isMapVisible)}
                    title="Toggle Map"
                >
                    <IconMap size={20} />
                </button>
            </div>
        </>
    );
}
