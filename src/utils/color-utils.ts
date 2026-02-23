import { Color } from "deck.gl";

export function rgbaCss(c: Color | [number, number, number, number]): string {
    if (Array.isArray(c)) {
        const [r, g, b, a = 255] = c;
        return `rgba(${r},${g},${b},${a / 255})`;
    }
    return String(c);
}
