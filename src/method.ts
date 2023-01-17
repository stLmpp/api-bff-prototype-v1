import { z } from 'zod';

export const MethodSchema = z.union([
  z.literal('GET'),
  z.literal('POST'),
  z.literal('PUT'),
  z.literal('PATCH'),
  z.literal('DELETE'),
]);

export type Method = z.infer<typeof MethodSchema>;
