import { RangeId } from "@airbee-project/kasane-client/spatial-id";
import { z } from "zod";
import { RGBAColorSchema } from "../color";

export const SpatialIdGroupSchema = z.object({
  id: z.string(),
  color: RGBAColorSchema,
  spatialIds: z.array(z.custom<RangeId>((v) => v instanceof RangeId)),
});

/**
 * 空間IDグループ
 */
export type SpatialIdGroup = z.infer<typeof SpatialIdGroupSchema>;

export const SpatialIdGroupWithoutIdSchema = SpatialIdGroupSchema.omit({
  id: true,
});

export const SpatialIdGroupPartialSchema = SpatialIdGroupSchema.partial();
