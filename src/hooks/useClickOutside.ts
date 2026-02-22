import { useEffect } from "react";

export function useClickOutside<T extends HTMLElement>(
    ref: React.RefObject<T | null>,
    handler: () => void
) {
    useEffect(() => {
        const el = ref?.current;
        if (!el) return;

        const listener = (event: MouseEvent | TouchEvent | PointerEvent) => {
            if (!el.contains(event.target as Node)) {
                handler();
            }
        };

        document.addEventListener("pointerdown", listener);
        return () => {
            document.removeEventListener("pointerdown", listener);
        };
    }, [ref, handler]);
}
