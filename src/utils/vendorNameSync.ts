import { getFunctions, httpsCallable } from 'firebase/functions';

/**
 * Manual Vendor Name Sync Utility
 * 
 * Provides client-side functions to trigger manual vendor name synchronization.
 * Only accessible to admin users.
 */

// Initialize Firebase Functions
const functions = getFunctions();

interface ManualSyncResult {
    success: boolean;
    vendorsProcessed: number;
    results: Array<{
        vendorId: string;
        vendorName?: string;
        status: 'success' | 'skipped' | 'error';
        productsUpdated?: number;
        reason?: string;
    }>;
}

/**
 * Trigger manual sync for a specific vendor
 * @param vendorId - The ID of the vendor to sync
 * @returns Promise with sync results
 */
export async function syncVendorProducts(vendorId: string): Promise<ManualSyncResult> {
    console.log(`🔧 Triggering manual sync for vendor: ${vendorId}`);

    const manualSync = httpsCallable<
        { vendorId: string },
        ManualSyncResult
    >(functions, 'manualVendorNameSync');

    try {
        const result = await manualSync({ vendorId });
        console.log(`✅ Sync completed:`, result.data);
        return result.data;
    } catch (error) {
        console.error(`❌ Sync failed:`, error);
        throw error;
    }
}

/**
 * Trigger manual sync for all vendors
 * Use with caution - this will update all products for all vendors
 * @returns Promise with sync results
 */
export async function syncAllVendorProducts(): Promise<ManualSyncResult> {
    console.log(`🔧 Triggering manual sync for ALL vendors`);
    console.warn(`⚠️ This will update ALL products. Please confirm this is intentional.`);

    const manualSync = httpsCallable<
        { syncAll: boolean },
        ManualSyncResult
    >(functions, 'manualVendorNameSync');

    try {
        const result = await manualSync({ syncAll: true });
        console.log(`✅ Sync completed:`, result.data);
        return result.data;
    } catch (error) {
        console.error(`❌ Sync failed:`, error);
        throw error;
    }
}

/**
 * Get sync logs from Firestore
 * Useful for monitoring sync history and debugging
 * @param limitCount - Maximum number of logs to fetch (default: 50)
 */
export async function getSyncLogs(limitCount: number = 50) {
    const { getFirestore, collection, query, orderBy, limit, getDocs } = await import('firebase/firestore');
    const db = getFirestore();

    const logsQuery = query(
        collection(db, 'syncLogs'),
        orderBy('timestamp', 'desc'),
        limit(limitCount)
    );

    const snapshot = await getDocs(logsQuery);
    const logs = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
    }));

    console.log(`📋 Fetched ${logs.length} sync log(s)`);
    console.table(logs);

    return logs;
}

/**
 * Browser console utilities
 * Automatically loaded when this module is imported
 */
if (typeof window !== 'undefined') {
    (window as any).vendorSync = {
        syncOne: syncVendorProducts,
        syncAll: syncAllVendorProducts,
        getLogs: getSyncLogs,
    };

    console.log('💡 Vendor sync utilities loaded!');
    console.log('   Run: vendorSync.syncOne("vendorId") to sync one vendor');
    console.log('   Run: vendorSync.syncAll() to sync all vendors');
    console.log('   Run: vendorSync.getLogs() to view sync history');
}
