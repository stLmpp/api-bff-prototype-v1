import { z } from 'zod';

const ErrorResponseErrorObjectSchema = z.object({
  path: z.string(),
  message: z.string(),
  type: z.union([
    z.literal('body'),
    z.literal('params'),
    z.literal('headers'),
    z.literal('query'),
  ]),
});

export const ErrorResponseSchema = z.object({
  status: z.number().min(400).max(599),
  errors: z.array(ErrorResponseErrorObjectSchema).optional(),
  error: z.string().optional(),
  code: z.string(),
  message: z.string(),
});

export type ErrorResponse = z.infer<typeof ErrorResponseSchema>;
export type ErrorResponseErrorObject = z.infer<
  typeof ErrorResponseErrorObjectSchema
>;
