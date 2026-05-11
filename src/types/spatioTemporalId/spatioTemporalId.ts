import { z } from "zod";
import { SpatialIdSchema } from "./spatialId";
import { TemporalIdSchema } from "./temporalId";

/**
 * 時空間ID
 */
export const SpatioTemporalIdSchema = z.object({
  spatialId: SpatialIdSchema,
  temporalId: TemporalIdSchema.optional(),
});

/**
 * 時空間IDの型定義
 */
export type SpatioTemporalId = z.infer<typeof SpatioTemporalIdSchema>;
