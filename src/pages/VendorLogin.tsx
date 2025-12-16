import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useVendorAuth } from "@/hooks/useVendorAuth";
import { Helmet } from "react-helmet-async";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card } from "@/components/ui/card";

const VendorLogin = () => {
  const { login, loading } = useVendorAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const result = await login(email, password);
    if (result.success) {
      navigate("/vendor/dashboard");
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-900 via-slate-950 to-slate-900 px-4">
      <Helmet>
        <title>تسجيل دخول البائع</title>
        <meta
          name="description"
          content="تسجيل دخول البائع لإدارة منتجاته في المتجر"
        />
      </Helmet>
      <Card className="w-full max-w-md border border-slate-800 bg-slate-900/80 backdrop-blur text-slate-50 shadow-2xl">
        <div className="p-6 border-b border-slate-800">
          <h1 className="text-2xl font-bold mb-1">
            تسجيل دخول البائع
          </h1>
          <p className="text-sm text-slate-300">
            أدخل بريد Gmail وكلمة المرور الخاصة بحساب البائع
          </p>
        </div>
        <form
          onSubmit={handleSubmit}
          className="p-6 space-y-4"
        >
          <div className="space-y-2">
            <Label htmlFor="email">البريد الإلكتروني (Gmail)</Label>
            <Input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="bg-slate-900 border-slate-700"
              placeholder="example@gmail.com"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="password">كلمة المرور</Label>
            <Input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              className="bg-slate-900 border-slate-700"
            />
          </div>

          <div className="flex items-center justify-between pt-2">
            <Button
              type="button"
              variant="outline"
              className="border-slate-700 text-slate-200"
              onClick={() => navigate("/vendor/signup")}
            >
              إنشاء حساب بائع جديد
            </Button>
            <Button
              type="submit"
              disabled={loading}
              className="bg-emerald-500 hover:bg-emerald-600 text-white px-6"
            >
              {loading ? "جاري تسجيل الدخول..." : "تسجيل الدخول"}
            </Button>
          </div>
        </form>
      </Card>
    </div>
  );
};

export default VendorLogin;


