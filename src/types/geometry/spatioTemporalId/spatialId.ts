import { RangeId } from "@airbee-project/kasane-client";
import { z } from "zod";

const IndexSchema = z.union([z.number(), z.tuple([z.number(), z.number()])]);

export const TemporalIdSchema = z.object({ i: z.number(), t: IndexSchema });
export type TemporalId = z.infer<typeof TemporalIdSchema>;

/** 値の範囲は client の RangeId で検証する */
export const SpatialIdSchema = z
  .object({
    z: z.number(),
    f: IndexSchema,
    x: IndexSchema,
    y: IndexSchema,
    temporalId: TemporalIdSchema.optional(),
  })
  .superRefine((id, ctx) => {
    try {
      toRangeId(id);
    } catch (e) {
      ctx.addIssue({ code: "custom", message: (e as Error).message });
    }
  });
export type SpatialId = z.infer<typeof SpatialIdSchema>;

/** 値が不正なら SpatialIdError を投げる */
export function toRangeId({ z, f, x, y, temporalId }: SpatialId): RangeId {
  const id = RangeId.create(z, f, x, y);
  return temporalId ? id.withTime(temporalId.i, temporalId.t) : id;
}

export function fromRangeId(id: RangeId): SpatialId {
  const value = ([min, max]: [number, number]) =>
    min === max ? min : ([min, max] as [number, number]);
  return {
    z: id.z,
    f: value(id.f),
    x: value(id.x),
    y: value(id.y),
    temporalId: id.isWholeTime()
      ? undefined
      : { i: id.interval.seconds(), t: value(id.t) },
  };
}
