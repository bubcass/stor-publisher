// src/metadata/schema.js
import { z } from 'zod'

// --- Contributor schema (unchanged) ---
export const Contributor = z.object({
  role: z.string(),                         // 'author', 'editor', 'reviewer', …
  given: z.string().optional(),
  family: z.string(),                       // required surname
  email: z.string().email().optional(),
  orcid: z.string().optional(),
  affiliation: z
    .object({
      org: z.string().default('Houses of the Oireachtas'),
      unitCode: z.string().optional(),      // 'PBO', 'LIB', 'COM', 'COMMS', 'COMMISSION', 'OTHER'
      unit: z.string().optional(),          // human label
      committeeCode: z.string().optional(), // e.g. 'COM-FIN'
      country: z.string().optional(),       // e.g. 'IE'
    })
    .optional(),
})

// --- Top-level metadata schema (lenient to avoid breaking initial parse) ---
export const MetadataSchema = z.object({
  title: z.string().min(3, 'Title must be at least 3 characters'),
  subtitle: z.string().optional(),
  abstract: z.string().optional(),

  language: z.string().min(2, 'Language code required'),

  // includes "in_review"
  status: z.enum(['draft', 'in_review', 'published', 'archived']),

  // Make these OPTIONAL here (with defaults) so initial parse never throws.
  // Your export gating should enforce they’re filled (in validateMetadata).
  version: z.string().optional().default(''),
  keywords: z.array(z.string().min(1)).optional().default([]),

  datePublished: z.string().optional(),     // ISO date (YYYY-MM-DD or full ISO)
  dateModified: z.string().optional(),
  doi: z.string().optional(),
  license: z.string().optional(),

  publisher: z.string().default('Houses of the Oireachtas'),

  // renamed from "imprint" → "unit"
  unit: z
    .object({
      unitCode: z.string(),                 // e.g., 'PBO'
      unit: z.string(),                     // display name
      committeeCode: z.string().optional(), // if Committees
    })
    .optional(),

  contributors: z.array(Contributor).default([]),
})