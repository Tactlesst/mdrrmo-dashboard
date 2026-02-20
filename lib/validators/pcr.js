import { z } from 'zod';

const optionalStringToNull = z.preprocess(
  (v) => (v === '' || v === undefined ? null : v),
  z.string().nullable().optional()
);

export const pcrCreateBodySchema = z.object({
  patientName: z.string().optional(),
  date: z.string().optional(),
  location: z.string().optional(),
  recorder: z.string().optional(),
  poi: z.any().optional(),
  alertId: z.union([z.number().int().positive(), z.string().min(1)]).optional().nullable(),
  caseType: z.string().min(1),
}).passthrough();

export const pcrUpdateBodySchema = z.object({
  patient_name: z.string().optional(),
  date: z.string().optional(),
  location: z.string().optional(),
  recorder: z.string().optional(),
  full_form: z.object({
    caseType: z.string().min(1),
  }).passthrough(),
  alert_id: z.union([z.number().int().positive(), z.string().min(1)]).optional().nullable(),
}).passthrough();

export const pcrUpdateByIdBodySchema = z.object({
  patient_name: z.string().optional(),
  date: z.string().optional(),
  location: z.string().optional(),
  recorder: z.string().optional(),
  full_form: z.object({
    caseType: z.string().min(1),
  }).passthrough(),
}).passthrough();

export function normalizeAlertId(value) {
  if (value === null || value === undefined || value === '') return null;
  const n = Number(value);
  return Number.isFinite(n) ? n : null;
}
