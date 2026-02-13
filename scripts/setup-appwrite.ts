/**
 * Appwrite Database Setup Script
 *
 * Creates the database, all 7 collections with their attributes,
 * and fulltext indexes for fields used with ilike searches.
 *
 * Usage:
 *   npx tsx scripts/setup-appwrite.ts
 *
 * Ensure these env vars are set (or in .env.local):
 *   NEXT_PUBLIC_APPWRITE_ENDPOINT
 *   NEXT_PUBLIC_APPWRITE_PROJECT_ID
 *   APPWRITE_API_KEY
 *   APPWRITE_DATABASE_ID
 */

import { Client, Databases, IndexType } from 'node-appwrite';
import * as dotenv from 'dotenv';
import * as path from 'path';

// Load .env.local
dotenv.config({ path: path.resolve(__dirname, '..', '.env.local') });

// ---------------------------------------------------------------------------
// Config
// ---------------------------------------------------------------------------

const ENDPOINT = process.env.NEXT_PUBLIC_APPWRITE_ENDPOINT!;
const PROJECT_ID = process.env.NEXT_PUBLIC_APPWRITE_PROJECT_ID!;
const API_KEY = process.env.APPWRITE_API_KEY!;
const DATABASE_ID = process.env.APPWRITE_DATABASE_ID || 'praktikfinder';

if (!ENDPOINT || !PROJECT_ID || !API_KEY) {
  console.error(
    '❌  Missing env vars. Set NEXT_PUBLIC_APPWRITE_ENDPOINT, NEXT_PUBLIC_APPWRITE_PROJECT_ID, and APPWRITE_API_KEY in .env.local'
  );
  process.exit(1);
}

const client = new Client()
  .setEndpoint(ENDPOINT)
  .setProject(PROJECT_ID)
  .setKey(API_KEY);
const databases = new Databases(client);

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/** Wait for Appwrite to finish processing the attribute (status → available). */
async function waitForAttribute(
  collId: string,
  key: string,
  maxWaitMs = 30_000
): Promise<void> {
  const start = Date.now();
  while (Date.now() - start < maxWaitMs) {
    try {
      const attr = await databases.getAttribute(DATABASE_ID, collId, key);
      if ((attr as any).status === 'available') return;
    } catch {
      // attribute may not exist yet
    }
    await sleep(800);
  }
  console.warn(`  ⚠ Timed out waiting for attribute "${key}" in "${collId}"`);
}

function sleep(ms: number) {
  return new Promise((r) => setTimeout(r, ms));
}

async function safeCall<T>(
  label: string,
  fn: () => Promise<T>
): Promise<T | null> {
  try {
    const result = await fn();
    console.log(`  ✅ ${label}`);
    return result;
  } catch (err: any) {
    if (err?.code === 409) {
      console.log(`  ⏭  ${label} (already exists)`);
      return null;
    }
    console.error(`  ❌ ${label}:`, err?.message || err);
    return null;
  }
}

// ---------------------------------------------------------------------------
// Collection definitions (mirrors supabase/schema.sql)
// ---------------------------------------------------------------------------

interface AttrDef {
  type:
    | 'string'
    | 'boolean'
    | 'integer'
    | 'float'
    | 'enum'
    | 'datetime'
    | 'string[]';
  key: string;
  required?: boolean;
  size?: number; // string max length (default 255)
  elements?: string[]; // for enum
  default?: any;
}

interface CollectionDef {
  id: string;
  name: string;
  attributes: AttrDef[];
  fulltextIndexes?: string[]; // fields that need fulltext (for ilike)
  indexes?: { key: string; type: IndexType; attributes: string[] }[];
}

const collections: CollectionDef[] = [
  // ---- profiles ----
  {
    id: 'profiles',
    name: 'Profiles',
    attributes: [
      {
        type: 'enum',
        key: 'role',
        required: true,
        elements: ['admin', 'school', 'company', 'student']
      },
      { type: 'string', key: 'email', required: true },
      { type: 'string', key: 'full_name' },
      { type: 'string', key: 'phone' },
      { type: 'string', key: 'avatar_url', size: 2048 }
    ],
    indexes: [
      {
        key: 'idx_profiles_email',
        type: IndexType.Unique,
        attributes: ['email']
      }
    ]
  },

  // ---- schools ----
  {
    id: 'schools',
    name: 'Schools',
    attributes: [
      { type: 'string', key: 'user_id' },
      { type: 'string', key: 'name', required: true },
      { type: 'string', key: 'org_number' },
      { type: 'string', key: 'city', required: true },
      { type: 'string', key: 'address' },
      { type: 'string', key: 'contact_name' },
      { type: 'string', key: 'contact_email', required: true },
      { type: 'string', key: 'contact_phone' },
      {
        type: 'enum',
        key: 'plan_type',
        elements: ['free', 'pro', 'enterprise'],
        default: 'free'
      },
      { type: 'integer', key: 'student_count', default: 0 },
      { type: 'boolean', key: 'is_verified', default: false }
    ],
    fulltextIndexes: ['city'],
    indexes: [
      {
        key: 'idx_schools_user_id',
        type: IndexType.Key,
        attributes: ['user_id']
      },
      {
        key: 'idx_schools_org_number',
        type: IndexType.Unique,
        attributes: ['org_number']
      }
    ]
  },

  // ---- companies ----
  {
    id: 'companies',
    name: 'Companies',
    attributes: [
      { type: 'string', key: 'user_id' },
      { type: 'string', key: 'name', required: true },
      { type: 'string', key: 'org_number' },
      { type: 'string', key: 'city', required: true },
      { type: 'string', key: 'industry' },
      { type: 'string', key: 'website', size: 2048 },
      { type: 'string', key: 'description', size: 5000 },
      { type: 'string', key: 'contact_name' },
      { type: 'string', key: 'contact_email', required: true },
      { type: 'string', key: 'contact_phone' },
      { type: 'boolean', key: 'accepts_prao', default: false },
      { type: 'boolean', key: 'accepts_apl', default: false },
      { type: 'boolean', key: 'accepts_lia', default: false },
      { type: 'boolean', key: 'accepts_praktik', default: false },
      { type: 'integer', key: 'available_spots', default: 1 },
      {
        type: 'enum',
        key: 'plan_type',
        elements: ['free', 'pro', 'enterprise'],
        default: 'free'
      },
      { type: 'boolean', key: 'is_claimed', default: false },
      { type: 'boolean', key: 'is_verified', default: false }
    ],
    fulltextIndexes: ['city', 'industry'],
    indexes: [
      {
        key: 'idx_companies_user_id',
        type: IndexType.Key,
        attributes: ['user_id']
      },
      {
        key: 'idx_companies_org_number',
        type: IndexType.Unique,
        attributes: ['org_number']
      }
    ]
  },

  // ---- students ----
  {
    id: 'students',
    name: 'Students',
    attributes: [
      { type: 'string', key: 'user_id' },
      { type: 'string', key: 'school_id' },
      { type: 'string', key: 'email', required: true },
      { type: 'string', key: 'full_name', required: true },
      { type: 'string', key: 'phone' },
      { type: 'string', key: 'program', required: true },
      { type: 'string', key: 'education_level' },
      { type: 'string', key: 'city', required: true },
      {
        type: 'enum',
        key: 'practice_type',
        required: true,
        elements: ['prao', 'apl', 'lia', 'praktik']
      },
      { type: 'string[]', key: 'preferred_industries' },
      { type: 'string', key: 'start_date' },
      { type: 'string', key: 'end_date' },
      { type: 'integer', key: 'weeks_duration' },
      { type: 'string', key: 'status', default: 'seeking' },
      { type: 'boolean', key: 'imported_from_csv', default: false },
      { type: 'boolean', key: 'gdpr_consent', default: false },
      { type: 'datetime', key: 'gdpr_consent_date' }
    ],
    fulltextIndexes: ['city'],
    indexes: [
      {
        key: 'idx_students_school_id',
        type: IndexType.Key,
        attributes: ['school_id']
      },
      {
        key: 'idx_students_user_id',
        type: IndexType.Key,
        attributes: ['user_id']
      },
      {
        key: 'idx_students_status',
        type: IndexType.Key,
        attributes: ['status']
      },
      {
        key: 'idx_students_practice_type',
        type: IndexType.Key,
        attributes: ['practice_type']
      }
    ]
  },

  // ---- matches ----
  {
    id: 'matches',
    name: 'Matches',
    attributes: [
      { type: 'string', key: 'student_id' },
      { type: 'string', key: 'company_id' },
      {
        type: 'enum',
        key: 'status',
        elements: [
          'pending',
          'interested',
          'accepted',
          'rejected',
          'completed'
        ],
        default: 'pending'
      },
      { type: 'float', key: 'match_score' },
      { type: 'string', key: 'matched_by' },
      { type: 'string', key: 'student_message', size: 5000 },
      { type: 'string', key: 'company_response', size: 5000 },
      { type: 'datetime', key: 'student_interested_at' },
      { type: 'datetime', key: 'company_responded_at' },
      { type: 'datetime', key: 'completed_at' }
    ],
    indexes: [
      {
        key: 'idx_matches_student',
        type: IndexType.Key,
        attributes: ['student_id']
      },
      {
        key: 'idx_matches_company',
        type: IndexType.Key,
        attributes: ['company_id']
      },
      {
        key: 'idx_matches_status',
        type: IndexType.Key,
        attributes: ['status']
      },
      {
        key: 'idx_matches_unique',
        type: IndexType.Unique,
        attributes: ['student_id', 'company_id']
      }
    ]
  },

  // ---- email_logs ----
  {
    id: 'email_logs',
    name: 'Email Logs',
    attributes: [
      { type: 'string', key: 'recipient_email', required: true },
      { type: 'string', key: 'recipient_type', required: true },
      { type: 'string', key: 'template_id', required: true },
      { type: 'string', key: 'subject', required: true, size: 1000 },
      { type: 'string', key: 'status', default: 'sent' },
      { type: 'string', key: 'metadata', size: 16384 }, // JSON string
      { type: 'datetime', key: 'sent_at' },
      { type: 'datetime', key: 'opened_at' },
      { type: 'datetime', key: 'clicked_at' }
    ]
  },

  // ---- waitlist ----
  {
    id: 'waitlist',
    name: 'Waitlist',
    attributes: [
      { type: 'string', key: 'email', required: true },
      { type: 'string', key: 'role', required: true },
      { type: 'string', key: 'company_name' },
      { type: 'string', key: 'school_name' },
      { type: 'string', key: 'city' },
      { type: 'boolean', key: 'invited', default: false },
      { type: 'datetime', key: 'invited_at' },
      { type: 'boolean', key: 'converted', default: false },
      { type: 'datetime', key: 'converted_at' }
    ],
    indexes: [
      {
        key: 'idx_waitlist_email',
        type: IndexType.Unique,
        attributes: ['email']
      }
    ]
  }
];

// ---------------------------------------------------------------------------
// Main
// ---------------------------------------------------------------------------

async function main() {
  console.log('🚀 Appwrite Setup — PraktikFinder');
  console.log(`   Endpoint:    ${ENDPOINT}`);
  console.log(`   Project:     ${PROJECT_ID}`);
  console.log(`   Database ID: ${DATABASE_ID}`);
  console.log('');

  // 1. Create database
  await safeCall('Create database', () =>
    databases.create(DATABASE_ID, 'PraktikFinder')
  );
  console.log('');

  // 2. Create collections + attributes + indexes
  for (const coll of collections) {
    console.log(`📦 Collection: ${coll.name} (${coll.id})`);

    await safeCall(`Create collection "${coll.id}"`, () =>
      databases.createCollection(DATABASE_ID, coll.id, coll.name)
    );

    // --- Attributes ---
    for (const attr of coll.attributes) {
      const required = attr.required ?? false;
      const size = attr.size ?? 255;

      switch (attr.type) {
        case 'string':
          await safeCall(`Attr: ${attr.key} (string)`, () =>
            databases.createStringAttribute(
              DATABASE_ID,
              coll.id,
              attr.key,
              size,
              required,
              attr.default ?? undefined
            )
          );
          break;

        case 'string[]':
          await safeCall(`Attr: ${attr.key} (string[])`, () =>
            databases.createStringAttribute(
              DATABASE_ID,
              coll.id,
              attr.key,
              255,
              required,
              undefined,
              true // array = true
            )
          );
          break;

        case 'boolean':
          await safeCall(`Attr: ${attr.key} (boolean)`, () =>
            databases.createBooleanAttribute(
              DATABASE_ID,
              coll.id,
              attr.key,
              required,
              attr.default ?? undefined
            )
          );
          break;

        case 'integer':
          await safeCall(`Attr: ${attr.key} (integer)`, () =>
            databases.createIntegerAttribute(
              DATABASE_ID,
              coll.id,
              attr.key,
              required,
              undefined,
              undefined,
              attr.default ?? undefined
            )
          );
          break;

        case 'float':
          await safeCall(`Attr: ${attr.key} (float)`, () =>
            databases.createFloatAttribute(
              DATABASE_ID,
              coll.id,
              attr.key,
              required,
              undefined,
              undefined,
              attr.default ?? undefined
            )
          );
          break;

        case 'enum':
          await safeCall(`Attr: ${attr.key} (enum)`, () =>
            databases.createEnumAttribute(
              DATABASE_ID,
              coll.id,
              attr.key,
              attr.elements!,
              required,
              attr.default ?? undefined
            )
          );
          break;

        case 'datetime':
          await safeCall(`Attr: ${attr.key} (datetime)`, () =>
            databases.createDatetimeAttribute(
              DATABASE_ID,
              coll.id,
              attr.key,
              required,
              attr.default ?? undefined
            )
          );
          break;
      }
    }

    // Wait for all attributes to be ready before creating indexes
    console.log('  ⏳ Waiting for attributes to become available...');
    for (const attr of coll.attributes) {
      await waitForAttribute(coll.id, attr.key);
    }

    // --- Fulltext indexes (for ilike / Query.search) ---
    if (coll.fulltextIndexes) {
      for (const field of coll.fulltextIndexes) {
        await safeCall(`Fulltext index: ${field}`, () =>
          databases.createIndex(
            DATABASE_ID,
            coll.id,
            `ft_${coll.id}_${field}`,
            IndexType.Fulltext,
            [field]
          )
        );
      }
    }

    // --- Regular indexes ---
    if (coll.indexes) {
      for (const idx of coll.indexes) {
        await safeCall(`Index: ${idx.key}`, () =>
          databases.createIndex(
            DATABASE_ID,
            coll.id,
            idx.key,
            idx.type,
            idx.attributes
          )
        );
      }
    }

    console.log('');
  }

  console.log('✅ Setup complete!');
  console.log('');
  console.log('Next steps:');
  console.log('  1. Verify collections in Appwrite Console');
  console.log(
    '  2. Ensure APPWRITE_DATABASE_ID in .env.local matches:',
    DATABASE_ID
  );
  console.log(
    '  3. Set collection-level permissions if needed (default: API-key access only)'
  );
}

main().catch((err) => {
  console.error('Fatal error:', err);
  process.exit(1);
});
