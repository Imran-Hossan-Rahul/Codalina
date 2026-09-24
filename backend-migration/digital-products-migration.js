/**
 * digital-products-migration.js
 *
 * MongoDB migration script — Codalina
 * Pivots the Product collection from physical electronics to digital products.
 *
 * RUN IN A DRY-RUN FIRST:
 *   DRY_RUN=true node digital-products-migration.js
 *
 * THEN EXECUTE:
 *   node digital-products-migration.js
 *
 * Requirements:
 *   npm install mongodb dotenv
 *   MONGO_URI env var must be set (or add a .env file)
 *
 * Safety guarantees:
 *   - NEVER modifies the orders collection.
 *   - Only ADDS new fields to product documents. Physical-era fields are
 *     preserved (not deleted) to keep legacy order references valid.
 *   - All changes are logged to migration-output.json.
 *
 * Author: Codalina Backend Migration
 * Created: September 2026
 */

require('dotenv').config();
const { MongoClient } = require('mongodb');
const fs = require('fs');
const path = require('path');

// ─── Config ──────────────────────────────────────────────────────────────────
const MONGO_URI = process.env.MONGO_URI;
if (!MONGO_URI) {
  console.error('❌ MONGO_URI environment variable is not set.');
  process.exit(1);
}

const DB_NAME = process.env.DB_NAME || 'test';
const PRODUCTS_COLLECTION = 'marketproducts';
const DRY_RUN = process.env.DRY_RUN === 'true';

// ─── Digital product field defaults ─────────────────────────────────────────
// These are the fields that will be ADDED to every existing product document.
// All fields default to null/empty so as not to imply incorrect data.
const DIGITAL_FIELDS_DEFAULT = {
  productType:      null,  // SaaS Tool | Web Template | Script/Automation | Source Code | UI Kit/Plugin
  licenseType:      null,  // Personal | Commercial | Extended
  demoUrl:          null,
  documentationUrl: null,
  techStack:        '[]',  // serialised JSON array
  fileFormat:       null,
  fileSize:         null,
  version:          null,
  changelog:        '[]',  // serialised JSON array of { version, date, notes }
  downloadUrl:      null,  // ADMIN-ONLY — never exposed to customer-facing API
  screenshotGallery: '[]', // serialised JSON array of image URLs
};

// ─── Physical fields that are now DEPRECATED ────────────────────────────────
// These fields are NOT deleted from existing documents (to preserve order data).
// They are only noted here for documentation purposes.
// Use the deprecation marker `_deprecated: true` on docs for future cleanup.
const DEPRECATED_PHYSICAL_FIELDS = [
  'weight',
  'dimensions',
  'procurement_threshold',
  'est_delivery_days',
  'reportedStockQuantity',
  'warranty_info',
  'return_policy',
  'wholesaler_id',
  'weightInGrams',
  'delivery_charge',
];

async function runMigration() {
  console.log('');
  console.log('╔═══════════════════════════════════════════════════╗');
  console.log('║   Codalina — Digital Products Migration Script    ║');
  console.log('╚═══════════════════════════════════════════════════╝');
  console.log('');
  console.log(`Mode:     ${DRY_RUN ? '🧪 DRY RUN (no writes)' : '🚀 LIVE EXECUTION'}`);
  console.log(`Database: ${DB_NAME}`);
  console.log(`URI:      ${MONGO_URI.replace(/:([^@]+)@/, ':***@')}`);
  console.log('');

  const client = new MongoClient(MONGO_URI);
  await client.connect();
  console.log('✅ Connected to MongoDB');

  const db = client.db(DB_NAME);
  const productsCol = db.collection(PRODUCTS_COLLECTION);

  // ─── Step 1: Count documents that DON'T have digital fields yet ────────────
  const totalProducts = await productsCol.countDocuments();
  const alreadyMigrated = await productsCol.countDocuments({ productType: { $exists: true } });
  const toMigrate = totalProducts - alreadyMigrated;

  console.log(`📊 Total products:         ${totalProducts}`);
  console.log(`📊 Already migrated:       ${alreadyMigrated}`);
  console.log(`📊 Needs migration:        ${toMigrate}`);
  console.log('');

  if (toMigrate === 0) {
    console.log('✅ All products already have digital fields. Nothing to do.');
    await client.close();
    return;
  }

  // ─── Step 2: Build the update operations ──────────────────────────────────
  // $setOnInsert cannot be used here; we use $set with a check that the field doesn't exist.
  // We build a conditional $set that only sets fields if they don't already exist.
  
  const setFields = {};
  for (const [key, value] of Object.entries(DIGITAL_FIELDS_DEFAULT)) {
    setFields[key] = value;
  }

  // ─── Step 3: Execute (or preview) ────────────────────────────────────────
  const filter = { productType: { $exists: false } }; // only products without digital fields

  if (DRY_RUN) {
    console.log('🔍 DRY RUN — Preview of changes:');
    console.log('   Filter:', JSON.stringify(filter, null, 2));
    console.log('   Fields to add:', Object.keys(setFields).join(', '));
    console.log('');
    
    const sample = await productsCol.find(filter).limit(3).toArray();
    console.log(`📝 Sample products that WOULD be updated (showing up to 3):`);
    sample.forEach(doc => {
      console.log(`   - [${doc._id}] "${doc.title}" | status: ${doc.status}`);
    });
    
    console.log('');
    console.log(`⚠️  DRY RUN complete. ${toMigrate} products would be updated.`);
    console.log('   Run without DRY_RUN=true to execute the migration.');
  } else {
    console.log('🚀 Executing migration...');

    const startTime = Date.now();
    const result = await productsCol.updateMany(
      filter,
      { $set: setFields }
    );

    const elapsed = ((Date.now() - startTime) / 1000).toFixed(2);
    console.log('');
    console.log(`✅ Migration complete!`);
    console.log(`   Matched:  ${result.matchedCount} products`);
    console.log(`   Modified: ${result.modifiedCount} products`);
    console.log(`   Elapsed:  ${elapsed}s`);

    // ─── Step 4: Verify ───────────────────────────────────────────────────
    console.log('');
    console.log('🔍 Post-migration verification:');
    const remaining = await productsCol.countDocuments({ productType: { $exists: false } });
    if (remaining === 0) {
      console.log('   ✅ All products now have digital fields.');
    } else {
      console.log(`   ⚠️  ${remaining} products still missing digital fields.`);
    }

    // ─── Step 5: Write migration log ─────────────────────────────────────
    const logPath = path.join(__dirname, 'migration-output.json');
    const logData = {
      runAt: new Date().toISOString(),
      dryRun: false,
      database: DB_NAME,
      collection: PRODUCTS_COLLECTION,
      matched: result.matchedCount,
      modified: result.modifiedCount,
      fieldsAdded: Object.keys(setFields),
      deprecatedFields: DEPRECATED_PHYSICAL_FIELDS,
      note: 'Physical-era fields (weight, dimensions, etc.) preserved on existing documents for order history compatibility.',
    };
    fs.writeFileSync(logPath, JSON.stringify(logData, null, 2));
    console.log(`   📝 Log written to ${logPath}`);
  }

  console.log('');
  console.log('─── Deprecated Physical Fields (still present on existing docs) ───');
  DEPRECATED_PHYSICAL_FIELDS.forEach(f => console.log(`   ⚠️  ${f}`));
  console.log('');
  console.log('   These fields are safe to remove in a future cleanup migration');
  console.log('   ONLY after confirming all order detail views no longer reference them.');
  console.log('');

  await client.close();
  console.log('🔒 Connection closed.');
}

runMigration().catch(err => {
  console.error('❌ Migration failed:', err);
  process.exit(1);
});
