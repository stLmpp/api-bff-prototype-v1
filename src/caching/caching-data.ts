import { z } from 'zod';

export const CachingDataSchema = z.object({
  expiry: z.number().nullable(),
  value: z.any(),
});

export type CachingData = z.infer<typeof CachingDataSchema>;
