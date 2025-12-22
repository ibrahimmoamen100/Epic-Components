/**
 * Generate a URL-friendly slug from a string
 * @param text - The text to slugify
 * @returns A URL-safe slug
 */
export function slugify(text: string): string {
    if (!text) return '';

    return text
        .toString()
        .toLowerCase()
        .trim()
        // Replace spaces with hyphens
        .replace(/\s+/g, '-')
        // Remove all non-word chars (except hyphens and Arabic/Unicode characters)
        .replace(/[^\w\u0600-\u06FF-]+/g, '')
        // Replace multiple hyphens with single hyphen
        .replace(/-+/g, '-')
        // Remove leading and trailing hyphens
        .replace(/^-+/, '')
        .replace(/-+$/, '');
}

/**
 * Generate a vendor slug from vendor name
 * @param vendorName - The vendor name
 * @returns A URL-safe vendor slug
 */
export function generateVendorSlug(vendorName: string): string {
    return slugify(vendorName);
}
