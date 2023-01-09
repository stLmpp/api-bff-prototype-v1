import { z } from 'zod';

export const ParamTypeSchema = z.union([
  z.literal('body'),
  z.literal('params'),
  z.literal('headers'),
  z.literal('query'),
]);

export type ParamType = z.infer<typeof ParamTypeSchema>;
