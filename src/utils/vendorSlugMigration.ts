/**
 * Vendor Slug Migration Script
 * 
 * This script updates existing vendors in Firestore to add slug fields
 * based on their names. Run this once after deploying the vendor slug feature.
 * 
 * Usage:
 * 1. Ensure you're logged in as admin in the app
 * 2. Open browser console on any page
 * 3. Copy and paste this script
 * 4. Run: await migrateVendorSlugs()
 */

import { vendorsService } from '@/lib/firebase';
import { generateVendorSlug } from '@/utils/slugify';

export async function migrateVendorSlugs() {
    console.log('🚀 Starting vendor slug migration...');

    try {
        // Get all vendors
        const vendors = await vendorsService.getAllVendors();
        console.log(`📊 Found ${vendors.length} vendors to process`);

        let updated = 0;
        let skipped = 0;
        let errors = 0;

        // Process each vendor
        for (const vendor of vendors) {
            try {
                // Skip if vendor already has a slug
                if (vendor.slug) {
                    console.log(`⏭️  Skipping ${vendor.name} - already has slug: ${vendor.slug}`);
                    skipped++;
                    continue;
                }

                // Generate slug from vendor name
                const slug = generateVendorSlug(vendor.name);

                // Check if slug already exists (collision detection)
                const existingVendor = await vendorsService.getVendorBySlug(slug);
                if (existingVendor && existingVendor.id !== vendor.id) {
                    console.warn(`⚠️  Slug collision for ${vendor.name}: ${slug} already used by ${existingVendor.name}`);
                    // Append vendor ID to make it unique
                    const uniqueSlug = `${slug}-${vendor.id?.substring(0, 8)}`;
                    console.log(`   Using unique slug: ${uniqueSlug}`);

                    await vendorsService.updateVendor(vendor.id!, { slug: uniqueSlug });
                    console.log(`✅ Updated ${vendor.name} with slug: ${uniqueSlug}`);
                } else {
                    // Update vendor with new slug
                    await vendorsService.updateVendor(vendor.id!, { slug });
                    console.log(`✅ Updated ${vendor.name} with slug: ${slug}`);
                }

                updated++;

                // Add a small delay to avoid overwhelming Firestore
                await new Promise(resolve => setTimeout(resolve, 100));

            } catch (error) {
                console.error(`❌ Error updating ${vendor.name}:`, error);
                errors++;
            }
        }

        console.log('\n📈 Migration Summary:');
        console.log(`   ✅ Updated: ${updated}`);
        console.log(`   ⏭️  Skipped: ${skipped}`);
        console.log(`   ❌ Errors: ${errors}`);
        console.log(`   📊 Total: ${vendors.length}`);
        console.log('\n✨ Migration complete!');

        return { updated, skipped, errors, total: vendors.length };

    } catch (error) {
        console.error('❌ Migration failed:', error);
        throw error;
    }
}

// For debugging: Check vendor slugs
export async function listVendorSlugs() {
    const vendors = await vendorsService.getAllVendors();
    console.log('\n📋 Current Vendor Slugs:');
    console.table(
        vendors.map(v => ({
            Name: v.name,
            Slug: v.slug || '(not set)',
            ID: v.id,
        }))
    );
}

// For testing: Generate slug without saving
export function previewSlug(vendorName: string) {
    const slug = generateVendorSlug(vendorName);
    console.log(`\nVendor Name: ${vendorName}`);
    console.log(`Generated Slug: ${slug}`);
    console.log(`URL: /products/vendor/${slug}`);
    return slug;
}

// Export for use in admin panel or console
if (typeof window !== 'undefined') {
    (window as any).vendorSlugMigration = {
        migrate: migrateVendorSlugs,
        list: listVendorSlugs,
        preview: previewSlug,
    };

    console.log('💡 Vendor slug migration tools loaded!');
    console.log('   Run: vendorSlugMigration.migrate() to update all vendors');
    console.log('   Run: vendorSlugMigration.list() to view current slugs');
    console.log('   Run: vendorSlugMigration.preview("Vendor Name") to test slug generation');
}
