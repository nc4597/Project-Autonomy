import { kycPrisma } from "./prisma";
import {
  DEFAULT_FORM_CONFIG,
  formConfigSchema,
  type VerificationFormConfig,
} from "./formConfigShared";

export {
  DEFAULT_FORM_CONFIG,
  formConfigSchema,
  validateDraftAgainstCore,
  type VerificationFormConfig,
  type FormField,
  type FormOption,
} from "./formConfigShared";

async function getOrCreateConfigRow() {
  const existing = await kycPrisma.verificationFormConfig.findFirst();
  if (existing) return existing;
  return kycPrisma.verificationFormConfig.create({
    data: {
      draft: DEFAULT_FORM_CONFIG,
      published: DEFAULT_FORM_CONFIG,
      publishedAt: new Date(),
    },
  });
}

/**
 * Reconciles a stored config against the code's current core field list,
 * so a config saved before a core field was renamed or added doesn't
 * permanently drift out of sync (which would otherwise fail
 * validateDraftAgainstCore on every future save/publish, since that
 * checks the stored draft against today's DEFAULT_FORM_CONFIG). Runs on
 * every read, not as a one-off migration, so it keeps healing itself
 * across future core-field changes too.
 */
function reconcileCoreFields(config: VerificationFormConfig): VerificationFormConfig {
  let fields = config.fields;

  // One-time key migration: the SSN-only field was generalized into a
  // SSN/TIN tax ID field. Carries the key AND label forward together,
  // since "SSN — Last 4 Digits" is no longer accurate for what the
  // field now collects — admins can still relabel it same as any other
  // core field afterward.
  fields = fields.map((f) =>
    f.key === "contact.ssnLast4"
      ? { ...f, key: "contact.taxIdLast4", label: "Tax ID — Last 4 Digits" }
      : f
  );

  // Any core field the code defines that isn't in the stored config yet
  // (new fields added after this config was first saved) is appended
  // with its default definition, rather than silently missing from the
  // editor and blocking saves.
  const existingKeys = new Set(fields.map((f) => f.key));
  for (const coreField of DEFAULT_FORM_CONFIG.fields) {
    if (!existingKeys.has(coreField.key)) fields = [...fields, coreField];
  }

  return fields === config.fields ? config : { ...config, fields };
}

function parseStored(value: unknown): VerificationFormConfig {
  const parsed = formConfigSchema.safeParse(value);
  // A malformed stored blob must never take the investor form down.
  const config = parsed.success ? parsed.data : DEFAULT_FORM_CONFIG;
  return reconcileCoreFields(config);
}

export async function getFormConfigState() {
  const row = await getOrCreateConfigRow();
  return {
    draft: parseStored(row.draft),
    published: parseStored(row.published),
    publishedAt: row.publishedAt?.toISOString() ?? null,
    hasUnpublishedChanges: JSON.stringify(row.draft) !== JSON.stringify(row.published),
  };
}

export async function getPublishedFormConfig(): Promise<VerificationFormConfig> {
  const row = await getOrCreateConfigRow();
  return parseStored(row.published);
}

export async function saveDraftFormConfig(draft: VerificationFormConfig) {
  const row = await getOrCreateConfigRow();
  await kycPrisma.verificationFormConfig.update({
    where: { id: row.id },
    data: { draft },
  });
}

export async function publishFormConfig() {
  const row = await getOrCreateConfigRow();
  await kycPrisma.verificationFormConfig.update({
    where: { id: row.id },
    data: { published: parseStored(row.draft), publishedAt: new Date() },
  });
}

/**
 * Store a step's custom-field answers. Only keys that exist as custom
 * fields in the published config are accepted; empty values delete the
 * answer (the investor cleared an optional field).
 */
export async function upsertCustomAnswers(
  submissionId: string,
  answers: Record<string, string> | undefined
) {
  if (!answers) return;
  const config = await getPublishedFormConfig();
  const customByKey = new Map(config.fields.filter((f) => !f.core).map((f) => [f.key, f]));

  for (const [key, raw] of Object.entries(answers)) {
    const field = customByKey.get(key);
    if (!field) continue;
    const value = raw.trim().slice(0, 500);
    if (!value) {
      await kycPrisma.customAnswer.deleteMany({ where: { submissionId, fieldKey: key } });
      continue;
    }
    await kycPrisma.customAnswer.upsert({
      where: { submissionId_fieldKey: { submissionId, fieldKey: key } },
      create: { submissionId, fieldKey: key, label: field.label, value },
      update: { value, label: field.label },
    });
  }
}
