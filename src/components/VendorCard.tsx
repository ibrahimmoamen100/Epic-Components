import { Vendor } from "@/types/vendor";
import { MapPin, Phone, Store } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";

interface VendorCardProps {
    vendor: Vendor;
}

export function VendorCard({ vendor }: VendorCardProps) {
    return (
        <Card className="w-full mb-6 overflow-hidden border-2 border-primary/20 bg-gradient-to-r from-primary/5 to-background">
            <CardContent className="p-6">
                <div className="flex flex-col md:flex-row items-start md:items-center gap-6">
                    {/* Vendor Logo */}
                    {vendor.logoUrl ? (
                        <div className="flex-shrink-0">
                            <img
                                src={vendor.logoUrl}
                                alt={vendor.name}
                                className="w-24 h-24 md:w-32 md:h-32 rounded-lg object-cover border-2 border-primary/20 shadow-lg"
                            />
                        </div>
                    ) : (
                        <div className="flex-shrink-0 w-24 h-24 md:w-32 md:h-32 rounded-lg bg-primary/10 flex items-center justify-center border-2 border-primary/20">
                            <Store className="w-12 h-12 md:w-16 md:h-16 text-primary" />
                        </div>
                    )}

                    {/* Vendor Information */}
                    <div className="flex-1 space-y-3">
                        <div>
                            <h1 className="text-2xl md:text-3xl font-bold text-foreground mb-1">
                                {vendor.name}
                            </h1>
                            <p className="text-sm text-muted-foreground">
                                متجر معتمد
                            </p>
                        </div>

                        <div className="flex flex-col sm:flex-row gap-4 text-sm">
                            {/* Store Location */}
                            <div className="flex items-center gap-2 text-muted-foreground">
                                <MapPin className="w-4 h-4 text-primary flex-shrink-0" />
                                <span>{vendor.storeLocation}</span>
                            </div>

                            {/* Phone Number */}
                            {vendor.phoneNumber && (
                                <div className="flex items-center gap-2 text-muted-foreground">
                                    <Phone className="w-4 h-4 text-primary flex-shrink-0" />
                                    <a
                                        href={`tel:${vendor.phoneNumber}`}
                                        className="hover:text-primary transition-colors"
                                    >
                                        {vendor.phoneNumber}
                                    </a>
                                </div>
                            )}
                        </div>

                        {/* Products Count */}
                        {vendor.productsCount !== undefined && vendor.productsCount > 0 && (
                            <div className="text-sm text-muted-foreground">
                                <span className="font-semibold text-primary">
                                    {vendor.productsCount}
                                </span>{" "}
                                منتج متاح
                            </div>
                        )}
                    </div>
                </div>
            </CardContent>
        </Card>
    );
}
