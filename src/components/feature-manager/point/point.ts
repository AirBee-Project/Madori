import {z} from "zod";

export const PointSchema = z.object({
    latitude: z.number().min(-90, "緯度は-90から90の間で入力してください").max(90, "緯度は-90から90の間で入力してください"),
    longitude: z.number().min(-180, "経度は-180から180の間で入力してください").max(180, "経度は-180から180の間で入力してください"),
    altitude: z.number().min(0, "高度は0以上で入力してください")
});

export type Point = z.infer<typeof PointSchema>;