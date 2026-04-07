import { db, sql, siteSettingsTable, type SiteSettings } from "../../../db/src/index.js";

const SITE_SETTINGS_ID = "global";
const BOOTSTRAP_ADMIN_PASSWORDS = new Set(["admin123", "sns123"]);
const DEFAULT_ADMIN_PASSWORD = process.env.ADMIN_PASSWORD?.trim() || "admin123";

let ensureSiteSettingsPromise: Promise<void> | null = null;

async function ensureSiteSettingsTable() {
  await db.execute(sql`
    CREATE TABLE IF NOT EXISTS site_settings (
      id text PRIMARY KEY,
      accepting_responses boolean NOT NULL DEFAULT false,
      admin_password text NOT NULL DEFAULT 'admin123',
      password_initialized boolean NOT NULL DEFAULT false,
      updated_at timestamptz NOT NULL DEFAULT now()
    )
  `);

  await db.execute(sql`
    INSERT INTO site_settings (id, accepting_responses, admin_password, password_initialized)
    VALUES (${SITE_SETTINGS_ID}, false, ${DEFAULT_ADMIN_PASSWORD}, false)
    ON CONFLICT (id) DO NOTHING
  `);
}

async function ensureSiteSettingsReady() {
  if (!ensureSiteSettingsPromise) {
    ensureSiteSettingsPromise = ensureSiteSettingsTable().catch((error) => {
      ensureSiteSettingsPromise = null;
      throw error;
    });
  }

  return ensureSiteSettingsPromise;
}

export type SiteConfigRecord = {
  acceptingResponses: boolean;
  adminPassword: string;
  passwordInitialized: boolean;
  updatedAt: Date;
};

function toSiteConfigRecord(row: SiteSettings | undefined): SiteConfigRecord | null {
  if (!row) {
    return null;
  }

  return {
    acceptingResponses: row.acceptingResponses,
    adminPassword: row.adminPassword,
    passwordInitialized: row.passwordInitialized,
    updatedAt: row.updatedAt,
  };
}

export async function getSiteConfig(): Promise<SiteConfigRecord> {
  await ensureSiteSettingsReady();

  const [row] = await db
    .select({
      acceptingResponses: siteSettingsTable.acceptingResponses,
      adminPassword: siteSettingsTable.adminPassword,
      passwordInitialized: siteSettingsTable.passwordInitialized,
      updatedAt: siteSettingsTable.updatedAt,
    })
    .from(siteSettingsTable)
    .where(sql`${siteSettingsTable.id} = ${SITE_SETTINGS_ID}`)
    .limit(1);

  const config = toSiteConfigRecord(row as SiteSettings | undefined);
  if (!config) {
    return {
      acceptingResponses: false,
      adminPassword: DEFAULT_ADMIN_PASSWORD,
      passwordInitialized: false,
      updatedAt: new Date(),
    };
  }

  return config;
}

function isBootstrapPassword(token: string) {
  return BOOTSTRAP_ADMIN_PASSWORDS.has(token) || token === DEFAULT_ADMIN_PASSWORD;
}

export async function isAdminTokenAuthorized(token: string | undefined | null): Promise<boolean> {
  if (!token) {
    return false;
  }

  const config = await getSiteConfig();
  if (config.passwordInitialized) {
    return token === config.adminPassword;
  }

  return token === config.adminPassword || isBootstrapPassword(token);
}

export async function getAcceptingResponses(): Promise<boolean> {
  const config = await getSiteConfig();
  return config.acceptingResponses;
}

export async function updateSiteConfig(updates: {
  acceptingResponses?: boolean;
  adminPassword?: string;
  passwordInitialized?: boolean;
}): Promise<SiteConfigRecord> {
  await ensureSiteSettingsReady();

  const current = await getSiteConfig();
  const nextValues = {
    acceptingResponses: updates.acceptingResponses ?? current.acceptingResponses,
    adminPassword: updates.adminPassword ?? current.adminPassword,
    passwordInitialized: updates.passwordInitialized ?? current.passwordInitialized,
  };

  const [row] = await db
    .update(siteSettingsTable)
    .set({
      acceptingResponses: nextValues.acceptingResponses,
      adminPassword: nextValues.adminPassword,
      passwordInitialized: nextValues.passwordInitialized,
      updatedAt: new Date(),
    })
    .where(sql`${siteSettingsTable.id} = ${SITE_SETTINGS_ID}`)
    .returning({
      acceptingResponses: siteSettingsTable.acceptingResponses,
      adminPassword: siteSettingsTable.adminPassword,
      passwordInitialized: siteSettingsTable.passwordInitialized,
      updatedAt: siteSettingsTable.updatedAt,
    });

  const config = toSiteConfigRecord(row as SiteSettings | undefined);
  if (!config) {
    return getSiteConfig();
  }

  return config;
}