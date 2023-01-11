import { Request } from 'express';
import { z, ZodType } from 'zod';

export const RequestSchema: ZodType<Request> = z.any();
