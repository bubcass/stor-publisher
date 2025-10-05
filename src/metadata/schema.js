// src/metadata/schema.js
import { z } from 'zod'

export const ImprintCode = z.enum(['PBO','LRS','COM','CMSN','COMMS','OTHER'])

export const Affiliation = z.object({
  org: z.literal('Houses of the Oireachtas'),
  unit: z.string().min(2),
  unitCode: ImprintCode,
  committeeCode: z.string().optional(),
  // Reserved for the future (URIs)
  unitUri: z.string().url().optional(),
  committeeUri: z.string().url().optional(),
  orgId: z.string().url().optional(),
  country: z.string().length(2).optional(),
})

export const Contributor = z.object({
  role: z.enum(['author','editor','reviewer','translator','contributor']),
  given: z.string().min(1),
  family: z.string().min(1),
  affiliation: Affiliation.optional(),
  orcid: z.string().url().optional(),
  uri: z.string().url().optional(),
  corresponding: z.boolean().optional(),
  email: z.string().email().optional(),
})

export const MetadataSchema = z.object({
  schemaVersion: z.string().default('researchDocument@0.2'),
  title: z.string().min(3),
  subtitle: z.string().optional(),
  abstract: z.string().optional(),
  language: z.string().min(2).default('en'),
  status: z.enum(['draft','published','archived']).default('draft'),
  version: z.string().optional(),
  datePublished: z.string().optional(),
  dateModified: z.string().optional(),
  doi: z.string().optional(),
  series: z.object({ name: z.string(), number: z.string().optional() }).optional(),
  license: z.string().optional(),
  keywords: z.array(z.string().min(1)).default([]),
  contributors: z.array(Contributor).default([]),
  related: z.array(z.object({
    relation: z.enum(['isPartOf','isReferencedBy','references','isSupplementTo','isSupplementedBy']),
    uri: z.string().url(),
  })).default([]),
  dataLinks: z.array(z.object({ label: z.string().min(1), uri: z.string().url() })).default([]),

  // Publisher + imprint (new)
  publisher: z.literal('Houses of the Oireachtas').default('Houses of the Oireachtas'),
  imprint: z.object({
    unit: z.string().min(2),
    unitCode: ImprintCode,
    committeeCode: z.string().optional(),
    unitUri: z.string().url().optional(),
    committeeUri: z.string().url().optional(),
  }).optional(),
})