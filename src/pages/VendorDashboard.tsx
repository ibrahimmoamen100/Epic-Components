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

const VendorDashboard = () => {
  const { session, loading: authLoading, isAuthenticated, logout } = useVendorAuth();
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

  const handleEdit = useCallback((product: Product) => {
    // Prevent editing products that do not belong to this vendor
    if (product.vendorId !== vendorId) {
      toast.error("لا يمكنك تعديل منتجات بائعين آخرين");
      return;
    }
    setEditingProduct(product);
  }, [vendorId]);

  const handleSaveEdit = useCallback(
    async (updated: Product) => {
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
        setEditingProduct(null);
        toast.success("تم تحديث المنتج بنجاح");
      } catch (err) {
        console.error("Vendor update product error:", err);
        toast.error("فشل في تحديث المنتج");
      }
    },
    [updateProduct, vendorId, vendorName, vendorLogoUrl, vendorLocation]
  );

  if (authLoading || !session) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="flex items-center space-x-2">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          <span className="text-muted-foreground">
            جاري تحميل لوحة البائع...
          </span>
        </div>
      </div>
    );
  }

  const { vendor } = session;

  return (
    <div className="min-h-screen bg-slate-950 text-slate-50">
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
            <h1 className="text-3xl font-bold">
              لوحة تحكم البائع
            </h1>
            <p className="text-slate-300 mt-1">
              مرحباً، {vendor.name} – يمكنك هنا إضافة وتعديل منتجاتك
            </p>
          </div>
          <Button
            variant="outline"
            className="border-slate-700 text-slate-100"
            onClick={logout}
          >
            تسجيل الخروج
          </Button>
        </header>

        {/* Vendor stats */}
        <section className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card className="bg-slate-900 border-slate-800 p-4">
            <p className="text-sm text-slate-400 mb-1">
              اسم البائع
            </p>
            <p className="text-lg font-semibold">
              {vendor.name}
            </p>
          </Card>

          <Card className="bg-slate-900 border-slate-800 p-4">
            <p className="text-sm text-slate-400 mb-1">
              رقم الواتساب
            </p>
            <p className="text-lg font-semibold">
              {vendor.phoneNumber}
            </p>
          </Card>

          <Card className="bg-slate-900 border-slate-800 p-4">
            <p className="text-sm text-slate-400 mb-1">
              الحد الأقصى للمنتجات
            </p>
            <p className="text-lg font-semibold">
              {limit} منتج
            </p>
          </Card>

          <Card className="bg-slate-900 border-slate-800 p-4">
            <p className="text-sm text-slate-400 mb-1">
              عدد منتجاتك الحالية
            </p>
            <p className="text-lg font-semibold">
              {currentCount} منتج
            </p>
          </Card>
        </section>

        {/* Add product form (vendor-limited) */}
        <section className="space-y-4">
          <Card className="bg-slate-900 border-slate-800 p-4">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-semibold">
                إضافة منتج جديد
              </h2>
              {hasReachedLimit && (
                <span className="text-sm text-red-400">
                  وصلت إلى الحد الأقصى للمنتجات المسموح بها – تواصل مع
                  المسؤول لزيادة الحد
                </span>
              )}
            </div>
            <div className={hasReachedLimit ? "opacity-50 pointer-events-none" : ""}>
              <ProductForm onSubmit={handleVendorAddProduct as any} />
            </div>
          </Card>
        </section>

        {/* Vendor products table */}
        <section className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-semibold">
              منتجاتك
            </h2>
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="بحث باسم المنتج أو ID..."
              className="w-full max-w-xs bg-slate-900 border border-slate-700 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
            />
          </div>
          {productsLoading ? (
            <div className="flex items-center justify-center p-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
              <span className="ml-2 text-muted-foreground">
                جاري تحميل المنتجات...
              </span>
            </div>
          ) : vendorProducts.length === 0 ? (
            <Card className="bg-slate-900 border-slate-800 p-6 text-center text-slate-300">
              لا توجد منتجات بعد، ابدأ بإضافة أول منتج لك من النموذج أعلاه.
            </Card>
          ) : (
            <ProductTable
              products={vendorProducts}
              searchQuery={searchQuery}
              onEdit={handleEdit}
              onDelete={() => {
                toast.error("لا يمكن للبائع حذف المنتج في هذه المرحلة (سيتم تفعيلها لاحقاً)");
              }}
            />
          )}
        </section>

        {/* Edit product modal (vendor) */}
        <EditProductModal
          product={editingProduct}
          open={!!editingProduct}
          onOpenChange={(open) => !open && setEditingProduct(null)}
          onSave={handleSaveEdit}
        />
      </main>
    </div>
  );
};

export default VendorDashboard;


