
import { describe, it, expect } from 'vitest';
import pvoxelToPolygon from './PureVoxelToPolygon';
import { PureVoxel } from '../types/PureVoxel';

describe('PureVoxelToPolygon Benchmark', () => {
    it('measures performance for large datasets', () => {
        // 1. Setup Data
        const SIZES = [1000, 10000, 100000];

        SIZES.forEach((size) => {
            const voxels: PureVoxel[] = [];
            for (let i = 0; i < size; i++) {
                voxels.push({
                    Z: 14,
                    X: 1000 + (i % 100),
                    Y: 2000 + Math.floor(i / 100),
                    F: i % 10,
                });
            }

            const color: [number, number, number] = [255, 0, 0];

            // 2. Measure Execution Time
            const start = performance.now();
            const polygons = pvoxelToPolygon(voxels, color);
            const end = performance.now();

            const duration = end - start;
            const perVoxel = duration / size;

            console.log(`\n--- Benchmark Results for ${size} voxels ---`);
            console.log(`Total Time: ${duration.toFixed(2)} ms`);
            console.log(`Per Voxel : ${perVoxel.toFixed(4)} ms`);
            console.log(`Total Polygons: ${polygons.length}`);

            // Basic validity check
            expect(polygons.length).toBe(size);
        });
    });
});
