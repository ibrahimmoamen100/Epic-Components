import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { RefreshCw, Copy, Check } from 'lucide-react';
import { toast } from 'sonner';
import { auth } from '@/lib/firebase';

/**
 * AdminTokenRefresh Component
 * 
 * This component helps admin users:
 * 1. View their Firebase UID (needed for makeAdmin function)
 * 2. Refresh their auth token after being granted admin privileges
 * 
 * Usage: Add this component to your admin page or login page
 */
const AdminTokenRefresh = () => {
    const [loading, setLoading] = useState(false);
    const [copied, setCopied] = useState(false);
    const currentUser = auth.currentUser;

    const handleRefreshToken = async () => {
        if (!currentUser) {
            toast.error('No user is currently logged in');
            return;
        }

        setLoading(true);
        try {
            // Force token refresh to get updated custom claims
            await currentUser.getIdToken(true);

            toast.success('Token refreshed successfully! Please refresh the page to see changes.', {
                duration: 5000,
            });

            // Optionally reload the page after a delay
            setTimeout(() => {
                window.location.reload();
            }, 2000);
        } catch (error) {
            console.error('Error refreshing token:', error);
            toast.error('Failed to refresh token. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    const handleCopyUID = () => {
        if (!currentUser?.uid) {
            toast.error('No user UID available');
            return;
        }

        navigator.clipboard.writeText(currentUser.uid);
        setCopied(true);
        toast.success('UID copied to clipboard!');

        setTimeout(() => setCopied(false), 2000);
    };

    if (!currentUser) {
        return (
            <Card className="max-w-md">
                <CardHeader>
                    <CardTitle>Admin Token Utilities</CardTitle>
                    <CardDescription>Please login to use admin utilities</CardDescription>
                </CardHeader>
            </Card>
        );
    }

    return (
        <Card className="max-w-md">
            <CardHeader>
                <CardTitle>Admin Token Utilities</CardTitle>
                <CardDescription>
                    Use these tools to manage your admin privileges
                </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
                {/* User UID Display */}
                <div className="space-y-2">
                    <label className="text-sm font-medium">Your User UID:</label>
                    <div className="flex items-center gap-2">
                        <code className="flex-1 p-2 bg-muted rounded text-xs font-mono break-all">
                            {currentUser.uid}
                        </code>
                        <Button
                            variant="outline"
                            size="icon"
                            onClick={handleCopyUID}
                            title="Copy UID"
                        >
                            {copied ? (
                                <Check className="h-4 w-4 text-green-500" />
                            ) : (
                                <Copy className="h-4 w-4" />
                            )}
                        </Button>
                    </div>
                    <p className="text-xs text-muted-foreground">
                        Use this UID in the makeAdmin function
                    </p>
                </div>

                {/* Email Display */}
                <div className="space-y-2">
                    <label className="text-sm font-medium">Email:</label>
                    <code className="block p-2 bg-muted rounded text-xs font-mono">
                        {currentUser.email || 'No email'}
                    </code>
                </div>

                {/* Refresh Token Button */}
                <div className="pt-4 border-t">
                    <Button
                        onClick={handleRefreshToken}
                        disabled={loading}
                        className="w-full"
                    >
                        <RefreshCw className={`mr-2 h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
                        {loading ? 'Refreshing Token...' : 'Refresh Admin Token'}
                    </Button>
                    <p className="text-xs text-muted-foreground mt-2">
                        Click this after being granted admin privileges
                    </p>
                </div>

                {/* Instructions */}
                <div className="pt-4 border-t space-y-2">
                    <h4 className="text-sm font-semibold">Quick Setup:</h4>
                    <ol className="text-xs text-muted-foreground space-y-1 list-decimal list-inside">
                        <li>Copy your UID above</li>
                        <li>Update the makeAdmin function with your UID</li>
                        <li>Deploy the function: <code className="bg-muted px-1">firebase deploy --only functions:makeAdmin</code></li>
                        <li>Visit the function URL to grant admin privileges</li>
                        <li>Click "Refresh Admin Token" button above</li>
                        <li>Update your user document in Firestore with role: "admin"</li>
                        <li>Refresh the page</li>
                    </ol>
                </div>
            </CardContent>
        </Card>
    );
};

export default AdminTokenRefresh;
