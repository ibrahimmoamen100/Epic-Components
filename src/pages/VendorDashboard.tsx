import { useEffect, useMemo, useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { Helmet } from "react-helmet-async";
import { useVendorAuth } from "@/hooks/useVendorAuth";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { useStore } from "@/store/useStore";
import { Product } from "@/types/product";
import { ProductForm } from "@/components/ProductForm";
import { ProductTable } from "@/components/ProductTable";
import { EditProductModal } from "@/components/EditProductModal";
import { vendorsService } from "@/lib/firebase";
import { toast } from "sonner";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { VendorProfile } from "@/components/VendorProfile";

const VendorDashboard = () => {
  const { session, loading: authLoading, isAuthenticated, logout, refreshSession } = useVendorAuth();
  const navigate = useNavigate();
  const { products, addProduct, updateProduct, loadProducts, loading: productsLoading } =
    useStore();
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [searchQuery, setSearchQuery] = useState("");

  // Redirect unauthenticated vendors
  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      navigate("/vendor/login");
    }
  }, [authLoading, isAuthenticated, navigate]);

  // Load all products once (we'll filter by vendorId in memory)
  useEffect(() => {
    loadProducts();
  }, [loadProducts]);

  // Even قبل توفر session ننفّذ كل الـ hooks بنفس الترتيب
  const vendorId = session?.vendor.id || null;
  const vendorName = session?.vendor.name || "";
  const vendorLogoUrl = session?.vendor.logoUrl || undefined;
  const vendorLocation = session?.vendor.storeLocation || undefined;
  const vendorProductLimit =
    typeof session?.vendor.productLimit === "number"
      ? session.vendor.productLimit
      : 5;

  // Filter products to only show this vendor's products
  const vendorProducts = useMemo(
    () => products.filter((p) => vendorId && p.vendorId === vendorId),
    [products, vendorId]
  );

  const currentCount = vendorProducts.length;
  const limit = vendorProductLimit;
  const hasReachedLimit = currentCount >= limit;

  // Wrap store.addProduct with vendor linkage and limit check
  const handleVendorAddProduct = useCallback(
    async (payload: Omit<Product, "id">) => {
      if (!vendorId) {
        toast.error("لا يمكن إضافة منتج: معرف البائع غير متوفر");
        return;
      }

      try {
        // تأكيد الحد من Firestore (أقوى من العد المحلي)
        const canAdd = await vendorsService.canVendorAddProduct(vendorId);
        if (!canAdd) {
          toast.error("لقد وصلت إلى الحد الأقصى لعدد المنتجات المسموح بها");
          return;
        }

        const enriched: Omit<Product, "id"> = {
          ...payload,
          vendorId,
          vendorName,
          vendorLogoUrl,
          vendorLocation,
        };

        await addProduct(enriched as any);
      } catch (err) {
        console.error("Vendor add product error:", err);
        toast.error("فشل في إضافة المنتج، حاول مرة أخرى");
      }
    },
    [addProduct, vendorId, vendorName, vendorLogoUrl, vendorLocation]
  );

  const handleEdit = useCallback(async (product: Product) => {
    // Prevent editing products that do not belong to this vendor
    if (product.vendorId !== vendorId) {
      toast.error("لا يمكنك تعديل منتجات بائعين آخرين");
      return;
    }

    // Check if vendor has reached edit limit
    if (!vendorId) return;

    try {
      const { canEdit, used, limit } = await vendorsService.canVendorEditProduct(vendorId);

      if (!canEdit) {
        toast.error(`لقد وصلت إلى الحد الأقصى لعدد التعديلات المسموح بها (${used}/${limit})`, {
          description: "يرجى التواصل مع المسؤول لزيادة الحد",
          duration: 5000,
        });
        return;
      }

      setEditingProduct(product);
    } catch (error) {
      console.error("Error checking edit limit:", error);
      toast.error("فشل في التحقق من صلاحيات التعديل");
    }
  }, [vendorId]);

  const handleSaveEdit = useCallback(
    async (updated: Product) => {
      if (!vendorId) return;

      try {
        // Ensure vendor linkage stays intact
        const safeUpdated: Product = {
          ...updated,
          vendorId,
          vendorName,
          vendorLogoUrl: vendorLogoUrl || updated.vendorLogoUrl,
          vendorLocation: vendorLocation || updated.vendorLocation,
        };

        await updateProduct(safeUpdated);

        // Increment edit counter
        try {
          await vendorsService.incrementEditCounter(vendorId);
          await refreshSession(); // Refresh to get updated counters
        } catch (counterError) {
          console.warn("Edit successful but counter increment failed:", counterError);
        }

        setEditingProduct(null);
        toast.success("تم تحديث المنتج بنجاح", {
          description: "تم احتساب عملية تعديل واحدة",
        });
      } catch (err) {
        console.error("Vendor update product error:", err);
        toast.error("فشل في تحديث المنتج");
      }
    },
    [updateProduct, vendorId, vendorName, vendorLogoUrl, vendorLocation, refreshSession]
  );

  const handleDelete = useCallback(
    async (productId: string) => {
      if (!vendorId) return;

      // Find the product to verify ownership
      const productToDelete = vendorProducts.find(p => p.id === productId);
      if (!productToDelete) {
        toast.error("المنتج غير موجود");
        return;
      }

      // Verify ownership
      if (productToDelete.vendorId !== vendorId) {
        toast.error("لا يمكنك حذف منتجات بائعين آخرين");
        return;
      }

      // Check delete limit BEFORE attempting deletion
      try {
        const { canDelete, used, limit } = await vendorsService.canVendorDeleteProduct(vendorId);

        if (!canDelete) {
          toast.error(`لقد وصلت إلى الحد الأقصى لعدد عمليات الحذف المسموح بها (${used}/${limit})`, {
            description: "يرجى التواصل مع المسؤول لزيادة الحد",
            duration: 5000,
          });
          return;
        }

        // Show confirmation dialog
        const confirmed = window.confirm(
          `هل أنت متأكد من حذف المنتج "${productToDelete.name}"?\n\n` +
          `⚠️ هذا الإجراء لا يمكن التراجع عنه.\n` +
          `سيتم احتساب عملية حذف واحدة (${used + 1}/${limit}).`
        );

        if (!confirmed) {
          return;
        }

        // Attempt Firebase deletion
        const { deleteProduct } = useStore.getState();
        await deleteProduct(productId);

        // Only increment counter AFTER successful deletion
        try {
          await vendorsService.incrementDeleteCounter(vendorId);
          await refreshSession(); // Refresh to update counters in UI
        } catch (counterError) {
          console.warn("Product deleted but counter increment failed:", counterError);
          // Product is still deleted, just log the counter error
        }

        toast.success(`تم حذف المنتج "${productToDelete.name}" بنجاح`, {
          description: `تم احتساب عملية حذف واحدة (${used + 1}/${limit})`,
          duration: 4000,
        });

      } catch (error: any) {
        console.error("Error deleting product:", error);

        // Provide specific error messages
        if (error.message?.includes('permission')) {
          toast.error("خطأ في الصلاحيات", {
            description: "ليس لديك صلاحية حذف هذا المنتج",
          });
        } else if (error.message?.includes('not found')) {
          toast.error("المنتج غير موجود في قاعدة البيانات");
        } else {
          toast.error("فشل في حذف المنتج", {
            description: error.message || "حدث خطأ غير متوقع، يرجى المحاولة مرة أخرى",
          });
        }
      }
    },
    [vendorId, vendorProducts, refreshSession]
  );

  if (authLoading || !session) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-blue-50 flex items-center justify-center">
        <div className="flex items-center space-x-2">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          <span className="text-gray-700 font-medium">
            جاري تحميل لوحة البائع...
          </span>
        </div>
      </div>
    );
  }

  const { vendor } = session;

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-blue-50">
      <Helmet>
        <title>لوحة تحكم البائع</title>
        <meta
          name="description"
          content="لوحة تحكم البائع لإدارة منتجاته في المتجر"
        />
        <meta name="robots" content="noindex, nofollow" />
      </Helmet>

      <main className="max-w-6xl mx-auto py-10 px-4 space-y-8">
        <header className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">
              لوحة تحكم البائع
            </h1>
            <p className="text-gray-600 mt-1">
              مرحباً، {vendor.name} – يمكنك هنا إضافة وتعديل منتجاتك
            </p>
          </div>
          <Button
            variant="outline"
            className="border-gray-300 text-gray-700 hover:bg-gray-100"
            onClick={logout}
          >
            تسجيل الخروج
          </Button>
        </header>

        <Tabs defaultValue="dashboard" dir="rtl" className="w-full space-y-6">
          <TabsList className="bg-white border border-gray-200 p-1 shadow-sm">
            <TabsTrigger value="dashboard" className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
              لوحة التحكم
            </TabsTrigger>
            <TabsTrigger value="profile" className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
              الملف الشخصي
            </TabsTrigger>
          </TabsList>

          <TabsContent value="dashboard" className="space-y-8">
            {/* Vendor stats */}
            <section className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <Card className="bg-white border-gray-200 p-4 shadow-sm hover:shadow-md transition-shadow">
                <p className="text-sm text-gray-500 mb-1">
                  اسم البائع
                </p>
                <p className="text-lg font-semibold text-gray-900">
                  {vendor.name}
                </p>
              </Card>

              <Card className="bg-white border-gray-200 p-4 shadow-sm hover:shadow-md transition-shadow">
                <p className="text-sm text-gray-500 mb-1">
                  رقم الواتساب
                </p>
                <p className="text-lg font-semibold text-gray-900">
                  {vendor.phoneNumber}
                </p>
              </Card>

              <Card className="bg-white border-gray-200 p-4 shadow-sm hover:shadow-md transition-shadow">
                <p className="text-sm text-gray-500 mb-1">
                  الحد الأقصى للمنتجات
                </p>
                <p className="text-lg font-semibold text-gray-900">
                  {limit} منتج
                </p>
              </Card>

              <Card className="bg-white border-gray-200 p-4 shadow-sm hover:shadow-md transition-shadow">
                <p className="text-sm text-gray-500 mb-1">
                  عدد منتجاتك الحالية
                </p>
                <p className="text-lg font-semibold text-gray-900">
                  {currentCount} منتج
                </p>
              </Card>
            </section>

            {/* Edit/Delete Limits Display */}
            <section className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Edit Limit Card */}
              <Card className="bg-gradient-to-br from-blue-50 to-white border-blue-200 p-4 shadow-sm">
                <div className="flex items-center justify-between mb-2">
                  <p className="text-sm font-medium text-blue-700">
                    ✏️ التعديلات المتبقية
                  </p>
                  <span className="text-xs font-semibold text-blue-600 bg-blue-100 px-2 py-1 rounded">
                    {(vendor.editProductLimit ?? 5) - (vendor.editProductUsed ?? 0)} من {vendor.editProductLimit ?? 5}
                  </span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-3 mb-2">
                  <div
                    className="bg-blue-500 h-3 rounded-full transition-all"
                    style={{
                      width: `${Math.min(
                        ((vendor.editProductUsed ?? 0) / (vendor.editProductLimit ?? 5)) * 100,
                        100
                      )}%`,
                    }}
                  />
                </div>
                <p className="text-xs text-gray-600">
                  استخدمت {vendor.editProductUsed ?? 0} عملية تعديل
                </p>
              </Card>

              {/* Delete Limit Card */}
              <Card className="bg-gradient-to-br from-red-50 to-white border-red-200 p-4 shadow-sm">
                <div className="flex items-center justify-between mb-2">
                  <p className="text-sm font-medium text-red-700">
                    🗑️ عمليات الحذف المتبقية
                  </p>
                  <span className="text-xs font-semibold text-red-600 bg-red-100 px-2 py-1 rounded">
                    {(vendor.deleteProductLimit ?? 5) - (vendor.deleteProductUsed ?? 0)} من {vendor.deleteProductLimit ?? 5}
                  </span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-3 mb-2">
                  <div
                    className="bg-red-500 h-3 rounded-full transition-all"
                    style={{
                      width: `${Math.min(
                        ((vendor.deleteProductUsed ?? 0) / (vendor.deleteProductLimit ?? 5)) * 100,
                        100
                      )}%`,
                    }}
                  />
                </div>
                <p className="text-xs text-slate-300">
                  استخدمت {vendor.deleteProductUsed ?? 0} عملية حذف
                </p>
              </Card>
            </section>

            {/* Add product form (vendor-limited) */}
            <section className="space-y-4">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-semibold text-gray-900">
                  إضافة منتج جديد
                </h2>
                {hasReachedLimit && (
                  <span className="text-sm text-red-600 font-medium">
                    وصلت إلى الحد الأقصى للمنتجات المسموح بها – تواصل مع
                    المسؤول لزيادة الحد
                  </span>
                )}
              </div>
              <div className={hasReachedLimit ? "opacity-50 pointer-events-none" : ""}>
                <ProductForm
                  onSubmit={handleVendorAddProduct as any}
                  mode="vendor"
                  lockVendor
                  defaultVendorId={vendorId || undefined}
                  defaultVendorName={vendorName}
                  defaultVendorLogoUrl={vendorLogoUrl}
                  defaultVendorLocation={vendorLocation}
                  defaultVendorPhone={session.vendor.phoneNumber}
                />
              </div>
            </section>

            {/* Vendor products table */}
            <section className="space-y-4">
              <div className="flex items-center justify-between">
                <h2 className="text-xl font-semibold text-gray-900">
                  منتجاتك
                </h2>
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="بحث باسم المنتج أو ID..."
                  className="w-full max-w-xs bg-white border border-gray-300 rounded-md px-3 py-2 text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                />
              </div>
              {productsLoading ? (
                <div className="flex items-center justify-center p-8">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                  <span className="ml-2 text-gray-600">
                    جاري تحميل المنتجات...
                  </span>
                </div>
              ) : vendorProducts.length === 0 ? (
                <Card className="bg-white border-gray-200 p-6 text-center shadow-sm">
                  <p className="text-gray-600">
                    لا توجد منتجات بعد، ابدأ بإضافة أول منتج لك من النموذج أعلاه.
                  </p>
                </Card>
              ) : (
                <ProductTable
                  products={vendorProducts}
                  searchQuery={searchQuery}
                  onEdit={handleEdit}
                  onDelete={handleDelete}
                />
              )}

            </section>
          </TabsContent>

          <TabsContent value="profile">
            {session?.vendor && (
              <VendorProfile
                vendor={session.vendor}
                onUpdate={refreshSession}
              />
            )}
          </TabsContent>
        </Tabs>

        {/* Edit product modal (vendor) */}
        <EditProductModal
          product={editingProduct}
          open={!!editingProduct}
          onOpenChange={(open) => !open && setEditingProduct(null)}
          onSave={handleSaveEdit}
          mode="vendor"
          lockVendor
        />
      </main>
    </div>
  );
};

export default VendorDashboard;


