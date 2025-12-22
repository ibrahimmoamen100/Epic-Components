/*
 * Admin Setup Utility Script
 * 
 * This script helps you set up admin access quickly.
 * 
 * HOW TO USE:
 * 1. Login to your app
 * 2. Open browser console (F12)
 * 3. Copy and paste this entire script
 * 4. Follow the instructions that appear in the console
 */

(async function adminSetupUtility() {
    console.log('🚀 Admin Setup Utility Started\n');
    console.log('═══════════════════════════════════════════════════════\n');

    // Check if Firebase is available
    if (typeof firebase === 'undefined') {
        console.error('❌ Firebase is not available. Make sure you are on a page with Firebase loaded.');
        return;
    }

    // Check if user is logged in
    const currentUser = firebase.auth().currentUser;
    if (!currentUser) {
        console.error('❌ No user is currently logged in. Please login first.');
        return;
    }

    // Display user info
    console.log('✅ User Information:');
    console.log('───────────────────────────────────────────────────────');
    console.log(`   Email: ${currentUser.email || 'N/A'}`);
    console.log(`   UID: ${currentUser.uid}`);
    console.log('───────────────────────────────────────────────────────\n');

    // Copy UID to clipboard
    try {
        await navigator.clipboard.writeText(currentUser.uid);
        console.log('✅ Your UID has been copied to clipboard!\n');
    } catch (err) {
        console.log('ℹ️ Copy your UID manually from above\n');
    }

    // Check current custom claims
    try {
        const tokenResult = await currentUser.getIdTokenResult();
        console.log('📋 Current Custom Claims:');
        console.log('───────────────────────────────────────────────────────');
        console.log(JSON.stringify(tokenResult.claims, null, 2));
        console.log('───────────────────────────────────────────────────────\n');

        if (tokenResult.claims.admin) {
            console.log('✅ You already have admin custom claims!\n');
        } else {
            console.log('⚠️ No admin custom claim found.\n');
        }
    } catch (err) {
        console.error('❌ Error checking custom claims:', err);
    }

    // Provide next steps
    console.log('📝 Next Steps:');
    console.log('═══════════════════════════════════════════════════════');
    console.log('1. Update functions/src/index.ts:');
    console.log(`   Replace "PUT_ADMIN_UID_HERE" with "${currentUser.uid}"`);
    console.log('');
    console.log('2. Deploy the function:');
    console.log('   cd functions && npm run deploy');
    console.log('');
    console.log('3. Call the makeAdmin function:');
    console.log('   https://us-central1-epic-electronics-274dd.cloudfunctions.net/makeAdmin');
    console.log('');
    console.log('4. Refresh your token by running:');
    console.log('   await firebase.auth().currentUser.getIdToken(true)');
    console.log('   Then refresh the page (F5)');
    console.log('');
    console.log('5. Update Firestore users collection:');
    console.log('   - Document ID: ' + currentUser.uid);
    console.log('   - Field: role = "admin"');
    console.log('');
    console.log('6. DELETE the makeAdmin function and redeploy');
    console.log('═══════════════════════════════════════════════════════\n');

    // Provide a helper function for step 4
    window.refreshAdminToken = async function () {
        console.log('🔄 Refreshing auth token...');
        try {
            await firebase.auth().currentUser.getIdToken(true);
            console.log('✅ Token refreshed successfully!');
            console.log('🔄 Reloading page in 2 seconds...');
            setTimeout(() => {
                window.location.reload();
            }, 2000);
        } catch (error) {
            console.error('❌ Error refreshing token:', error);
        }
    };

    console.log('💡 Tip: After step 3, run refreshAdminToken() in this console');
    console.log('    Or run: await firebase.auth().currentUser.getIdToken(true)\n');

})();
