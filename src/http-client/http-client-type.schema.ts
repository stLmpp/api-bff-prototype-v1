import { z } from 'zod';

export const HttpClientTypeSchema = z.union([
  z.literal('axios'),
  z.literal('got'),
  z.literal('fetch'),
]);

export type HttpClientType = z.infer<typeof HttpClientTypeSchema>;
