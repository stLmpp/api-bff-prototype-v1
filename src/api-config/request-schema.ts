import { type Request } from 'express';
import { z, type ZodType } from 'zod';

export const RequestSchema: ZodType<Request> = z.any();
