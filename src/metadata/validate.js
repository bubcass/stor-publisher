import { MetadataSchema } from './schema.js'

const BLOCKING_FIELDS = ['title', 'language', 'status']

export function validateMetadata(meta) {
  const errors = []
  // Blockers: required fields
  if (!meta?.title || meta.title.trim().length < 3) errors.push('title')
  if (!meta?.language) errors.push('language')
  if (!meta?.status || !['draft','published','archived'].includes(meta.status)) errors.push('status')

  const warnings = []
  if (!meta?.contributors?.length) warnings.push('contributors')
  if (!meta?.license) warnings.push('license')

  // Zod structural checks
  const z = MetadataSchema.safeParse(meta)
  const zodIssues = z.success ? [] : z.error.issues

  // Treat Zod issues as warnings unless they touch blocking fields
  const zodBlocking = []
  const zodWarn = []

  for (const issue of zodIssues) {
    const top = issue.path?.[0]
    if (BLOCKING_FIELDS.includes(top)) {
      zodBlocking.push(issue)
    } else {
      zodWarn.push(issue)
    }
  }

  // Merge any Zod blocking into our errors (rare, but explicit)
  if (zodBlocking.length) {
    for (const i of zodBlocking) {
      const top = i.path?.[0] || 'unknown'
      if (!errors.includes(top)) errors.push(top)
    }
  }

  // Convert Zod warnings to a readable hint
  if (zodWarn.length) {
    warnings.push('format checks') // e.g., bad ORCID/email/etc.
  }

  return {
    ok: errors.length === 0,  // <-- only true blockers affect this
    errors,
    warnings,
    zodIssues,                // keep available for debugging if needed
  }
}