import { z } from "zod";

// Core vendor schema stored in Firestore under `vendors` collection
export const VendorSchema = z.object({
  id: z.string().optional(), // Firestore doc id

  // Basic info
  name: z.string(), // Vendor Name
  slug: z.string().optional(), // URL-friendly slug for SEO
  phoneNumber: z.string(), // Used later for WhatsApp
  storeLocation: z.string(), // Store address / location

  // Limits & settings
  productLimit: z.number().int().nonnegative().default(5), // Default 5 products per PRD
  editProductLimit: z.number().int().nonnegative().default(5), // Maximum edits allowed
  deleteProductLimit: z.number().int().nonnegative().default(5), // Maximum deletes allowed

  // Usage counters
  editProductUsed: z.number().int().nonnegative().default(0), // Edits used
  deleteProductUsed: z.number().int().nonnegative().default(0), // Deletes used

  // Branding
  logoUrl: z.string().url().optional().nullable(),

  // Auth/account linkage
  username: z.string(), // For display / admin reference
  gmailAccount: z.string().email(), // Login email used in Firebase Auth
  authUid: z.string().optional(), // Firebase Auth UID (set after signup)

  // Optional stats (can be maintained from admin/analytics later)
  productsCount: z.number().int().nonnegative().optional().default(0),

  createdAt: z
    .string()
    .optional()
    .default(() => new Date().toISOString()),
  updatedAt: z
    .string()
    .optional()
    .default(() => new Date().toISOString()),
});

export type Vendor = z.infer<typeof VendorSchema>;


