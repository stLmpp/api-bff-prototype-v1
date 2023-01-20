import { z, type ZodObject, type ZodType } from 'zod';

import { ErrorResponseStatusCodeSchema } from '../error-response.js';

const ApiConfigValidationInParamsSchema: ZodType<
  ZodObject<Record<string, ZodType>>
> = z.any();
const ApiConfigValidationInBodySchema: ZodType<ZodType> = z.any();

export const ApiConfigValidationSchema = z.object({
  in: z
    .object({
      params: ApiConfigValidationInParamsSchema.optional(),
      query: ApiConfigValidationInParamsSchema.optional(),
      headers: ApiConfigValidationInParamsSchema.optional(),
      body: ApiConfigValidationInBodySchema.optional(),
    })
    .optional(),
  out: z
    .object({
      ok: ApiConfigValidationInBodySchema.optional(),
      errors: z
        .record(
          z.union([ErrorResponseStatusCodeSchema, z.literal('default')]),
          ApiConfigValidationInBodySchema.optional()
        )
        .optional(),
    })
    .optional(),
});
