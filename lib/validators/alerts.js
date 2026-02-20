import { z } from 'zod';

export const verifyAlertBodySchema = z.object({
  alertId: z.union([z.number().int().positive(), z.string().min(1)]),
  isApproved: z.boolean(),
  notes: z.string().optional().nullable(),
});
