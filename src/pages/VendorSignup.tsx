import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useVendorAuth } from "@/hooks/useVendorAuth";
import { Helmet } from "react-helmet-async";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card } from "@/components/ui/card";

const VendorSignup = () => {
  const { signup, loading } = useVendorAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({
    name: "",
    phoneNumber: "",
    storeLocation: "",
    productLimit: 5,
    logoUrl: "",
    username: "",
    gmailAccount: "",
    password: "",
  });

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement>
  ) => {
    const { name, value } = e.target;
    setForm((prev) => ({
      ...prev,
      [name]:
        name === "productLimit"
          ? Number(value) || 0
          : value,
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const result = await signup(form);
    if (result.success) {
      navigate("/vendor/dashboard");
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-900 via-slate-950 to-slate-900 px-4">
      <Helmet>
        <title>تسجيل بائع جديد</title>
        <meta
          name="description"
          content="إنشاء حساب بائع جديد في المتجر"
        />
      </Helmet>
      <Card className="w-full max-w-2xl border border-slate-800 bg-slate-900/80 backdrop-blur text-slate-50 shadow-2xl">
        <div className="p-6 border-b border-slate-800">
          <h1 className="text-2xl font-bold mb-1">
            تسجيل بائع جديد
          </h1>
          <p className="text-sm text-slate-300">
            أدخل بيانات متجرك لإنشاء حساب بائع مستقل
          </p>
        </div>
        <form
          onSubmit={handleSubmit}
          className="p-6 grid grid-cols-1 md:grid-cols-2 gap-4"
        >
          <div className="space-y-2">
            <Label htmlFor="name">اسم البائع / المتجر</Label>
            <Input
              id="name"
              name="name"
              value={form.name}
              onChange={handleChange}
              required
              className="bg-slate-900 border-slate-700"
              placeholder="مثال: متاجر سبارك"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="phoneNumber">رقم الهاتف (واتساب)</Label>
            <Input
              id="phoneNumber"
              name="phoneNumber"
              value={form.phoneNumber}
              onChange={handleChange}
              required
              className="bg-slate-900 border-slate-700"
              placeholder="01XXXXXXXXX"
            />
          </div>

          <div className="space-y-2 md:col-span-2">
            <Label htmlFor="storeLocation">عنوان المتجر</Label>
            <Input
              id="storeLocation"
              name="storeLocation"
              value={form.storeLocation}
              onChange={handleChange}
              required
              className="bg-slate-900 border-slate-700"
              placeholder="المدينة، المنطقة، الشارع..."
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="productLimit">
              الحد الأقصى للمنتجات
            </Label>
            <Input
              id="productLimit"
              name="productLimit"
              type="number"
              min={1}
              value={form.productLimit}
              onChange={handleChange}
              className="bg-slate-900 border-slate-700"
            />
            <p className="text-xs text-slate-400">
              القيمة الافتراضية: 5 (يمكن للمدير تعديلها لاحقاً)
            </p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="logoUrl">
              رابط شعار المتجر (اختياري)
            </Label>
            <Input
              id="logoUrl"
              name="logoUrl"
              value={form.logoUrl}
              onChange={handleChange}
              className="bg-slate-900 border-slate-700"
              placeholder="https://example.com/logo.png"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="username">اسم المستخدم</Label>
            <Input
              id="username"
              name="username"
              value={form.username}
              onChange={handleChange}
              required
              className="bg-slate-900 border-slate-700"
              placeholder="اسم يظهر في لوحة التحكم"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="gmailAccount">
              حساب Gmail (للدخول)
            </Label>
            <Input
              id="gmailAccount"
              name="gmailAccount"
              type="email"
              value={form.gmailAccount}
              onChange={handleChange}
              required
              className="bg-slate-900 border-slate-700"
              placeholder="example@gmail.com"
            />
          </div>

          <div className="space-y-2 md:col-span-2">
            <Label htmlFor="password">كلمة المرور</Label>
            <Input
              id="password"
              name="password"
              type="password"
              value={form.password}
              onChange={handleChange}
              required
              minLength={6}
              className="bg-slate-900 border-slate-700"
              placeholder="على الأقل 6 أحرف"
            />
          </div>

          <div className="md:col-span-2 flex items-center justify-between mt-2">
            <Button
              type="button"
              variant="outline"
              className="border-slate-700 text-slate-200"
              onClick={() => navigate("/vendor/login")}
            >
              لدي حساب بالفعل
            </Button>
            <Button
              type="submit"
              disabled={loading}
              className="bg-emerald-500 hover:bg-emerald-600 text-white px-6"
            >
              {loading ? "جاري إنشاء الحساب..." : "إنشاء حساب بائع"}
            </Button>
          </div>
        </form>
      </Card>
    </div>
  );
};

export default VendorSignup;


