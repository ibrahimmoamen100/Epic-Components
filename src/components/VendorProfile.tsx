import { useState, useEffect } from "react";
import { Vendor } from "@/types/vendor";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { toast } from "sonner";
import { auth, vendorsService } from "@/lib/firebase";
import { EmailAuthProvider, reauthenticateWithCredential, updatePassword } from "firebase/auth";
import { Loader2, Upload } from "lucide-react";

interface VendorProfileProps {
    vendor: Vendor;
    onUpdate: () => void;
}

export function VendorProfile({ vendor, onUpdate }: VendorProfileProps) {
    const [loading, setLoading] = useState(false);
    const [formData, setFormData] = useState({
        name: vendor.name,
        storeLocation: vendor.storeLocation,
        phoneNumber: vendor.phoneNumber,
        gmailAccount: vendor.gmailAccount,
        logoUrl: vendor.logoUrl || "",
    });
    const [showLogoInput, setShowLogoInput] = useState(false);

    // Password Change State
    const [passwordData, setPasswordData] = useState({
        currentPassword: "",
        newPassword: "",
        confirmPassword: ""
    });
    const [passwordLoading, setPasswordLoading] = useState(false);

    useEffect(() => {
        setFormData({
            name: vendor.name,
            storeLocation: vendor.storeLocation,
            phoneNumber: vendor.phoneNumber,
            gmailAccount: vendor.gmailAccount,
            logoUrl: vendor.logoUrl || "",
        });
    }, [vendor]);

    const isValidUrl = (url: string) => {
        if (!url) return true; // Empty is valid (resetting logo)
        try {
            new URL(url);
            return true;
        } catch {
            return false;
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);

        try {
            // Basic validation
            if (!formData.phoneNumber.match(/^\+?[\d\s-]{10,}$/)) {
                toast.error("رقم الهاتف غير صحيح، يرجى إدخال رقم صحيح");
                setLoading(false);
                return;
            }

            if (!isValidUrl(formData.logoUrl)) {
                toast.error("رابط الشعار غير صحيح");
                setLoading(false);
                return;
            }

            if (!vendor.id) throw new Error("Vendor ID missing");

            await vendorsService.updateVendor(vendor.id, {
                name: formData.name,
                storeLocation: formData.storeLocation,
                phoneNumber: formData.phoneNumber,
                gmailAccount: formData.gmailAccount,
                logoUrl: formData.logoUrl,
            });

            toast.success("تم تحديث الملف الشخصي بنجاح");
            onUpdate();
        } catch (error: any) {
            console.error(error);
            const msg = error?.message || "حدث خطأ أثناء تحديث الملف الشخصي";
            toast.error(msg);
        } finally {
            setLoading(false);
        }
    };

    const handlePasswordChange = async (e: React.FormEvent) => {
        e.preventDefault();
        setPasswordLoading(true);

        try {
            if (passwordData.newPassword !== passwordData.confirmPassword) {
                toast.error("كلمة المرور الجديدة غير متطابقة");
                setPasswordLoading(false);
                return;
            }

            if (passwordData.newPassword.length < 6) {
                toast.error("كلمة المرور يجب أن تكون 6 أحرف على الأقل");
                setPasswordLoading(false);
                return;
            }

            const user = auth.currentUser;
            if (!user || !user.email) {
                toast.error("يجب تسجيل الدخول أولاً");
                setPasswordLoading(false);
                return;
            }

            // Re-authenticate
            const credential = EmailAuthProvider.credential(user.email, passwordData.currentPassword);
            await reauthenticateWithCredential(user, credential);

            // Update password
            await updatePassword(user, passwordData.newPassword);

            toast.success("تم تغيير كلمة المرور بنجاح");
            setPasswordData({
                currentPassword: "",
                newPassword: "",
                confirmPassword: ""
            });
        } catch (error: any) {
            console.error(error);
            if (error.code === 'auth/wrong-password' || error.code === 'auth/invalid-credential') {
                toast.error("كلمة المرور الحالية غير صحيحة");
            } else {
                toast.error("حدث خطأ أثناء تغيير كلمة المرور: " + (error.message || "خطأ غير معروف"));
            }
        } finally {
            setPasswordLoading(false);
        }
    };

    return (
        <div className="space-y-8 max-w-4xl mx-auto">
            <Card className="bg-white border-gray-200 shadow-sm">
                <CardHeader>
                    <CardTitle className="text-2xl text-gray-900">الملف الشخصي</CardTitle>
                    <CardDescription className="text-gray-600">
                        قم بتحديث معلومات متجرك وشعارك وبيانات التواصل الأساسية
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <form onSubmit={handleSubmit} className="space-y-8">
                        {/* Note: I'm preserving the existing content structure here */}
                        <div className="flex flex-col md:flex-row gap-8">
                            {/* Logo Section */}
                            <div className="flex flex-col items-center gap-4">
                                <div className="relative w-40 h-40 rounded-full overflow-hidden border-4 border-gray-200 bg-gray-50 flex items-center justify-center shadow-lg">
                                    {formData.logoUrl ? (
                                        <img
                                            src={formData.logoUrl}
                                            alt="Logo"
                                            className="w-full h-full object-cover"
                                            onError={(e) => {
                                                (e.target as HTMLImageElement).src = "https://via.placeholder.com/150?text=Error";
                                            }}
                                        />
                                    ) : (
                                        <span className="text-gray-400 text-sm font-medium">لا يوجد شعار</span>
                                    )}
                                </div>
                                <div className="flex flex-col items-center w-full gap-2">
                                    {!showLogoInput ? (
                                        <Button
                                            type="button"
                                            variant="outline"
                                            size="sm"
                                            onClick={() => setShowLogoInput(true)}
                                            className="bg-white border-gray-300 text-gray-700 hover:bg-gray-50 hover:text-gray-900"
                                        >
                                            <Upload className="w-4 h-4 mr-2" />
                                            تغيير الشعار
                                        </Button>
                                    ) : (
                                        <div className="w-full space-y-2 animate-in fade-in slide-in-from-top-1">
                                            <Label htmlFor="logo-url" className="text-xs text-gray-600">رابط الشعار URL</Label>
                                            <div className="flex gap-2">
                                                <Input
                                                    id="logo-url"
                                                    type="url"
                                                    value={formData.logoUrl}
                                                    onChange={(e) => setFormData({ ...formData, logoUrl: e.target.value })}
                                                    className="bg-white border-gray-300 text-gray-900 text-xs h-8"
                                                    placeholder="https://example.com/logo.png"
                                                />
                                                <Button
                                                    type="button"
                                                    variant="ghost"
                                                    size="icon"
                                                    className="h-8 w-8 text-slate-400 hover:text-slate-200"
                                                    onClick={() => setShowLogoInput(false)}
                                                >
                                                    <span className="sr-only">إخفاء</span>
                                                    &times;
                                                </Button>
                                            </div>
                                            <p className="text-[10px] text-slate-500">أدخل رابط صورة مباشر (JPG, PNG)</p>
                                        </div>
                                    )}
                                </div>
                            </div>

                            {/* Editable Fields Section */}
                            <div className="flex-1 space-y-6">
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    <div className="space-y-2">
                                        <Label className="text-gray-700">اسم المتجر / البائع <span className="text-red-600">*</span></Label>
                                        <Input
                                            required
                                            value={formData.name}
                                            onChange={e => setFormData({ ...formData, name: e.target.value })}
                                            className="bg-white border-gray-300 text-gray-900 focus:ring-primary"
                                            placeholder="اسم المتجر"
                                        />
                                    </div>

                                    <div className="space-y-2">
                                        <Label className="text-gray-700">رقم الهاتف / الواتساب <span className="text-red-600">*</span></Label>
                                        <Input
                                            required
                                            dir="ltr"
                                            className="text-right bg-white border-gray-300 text-gray-900 focus:ring-primary"
                                            value={formData.phoneNumber}
                                            onChange={e => setFormData({ ...formData, phoneNumber: e.target.value })}
                                            placeholder="+20 1xxxxxxxxx"
                                        />
                                    </div>

                                    <div className="space-y-2 border-gray-300">
                                        <Label className="text-gray-700">الموقع / العنوان <span className="text-red-600">*</span></Label>
                                        <Input
                                            required
                                            value={formData.storeLocation}
                                            onChange={e => setFormData({ ...formData, storeLocation: e.target.value })}
                                            className="bg-white border-gray-300 text-gray-900 focus:ring-primary"
                                            placeholder="العنوان التفصيلي"
                                        />
                                    </div>

                                    <div className="space-y-2">
                                        <Label className="text-gray-700">البريد الإلكتروني (Gmail) <span className="text-red-600">*</span></Label>
                                        <Input
                                            required
                                            type="email"
                                            dir="ltr"
                                            value={formData.gmailAccount}
                                            onChange={e => setFormData({ ...formData, gmailAccount: e.target.value })}
                                            className="text-right bg-white border-gray-300 text-gray-900 focus:ring-primary"
                                            placeholder="example@gmail.com"
                                        />
                                    </div>
                                </div>

                                <div className="h-px bg-gray-200 my-2" />

                                {/* Read Only Fields */}
                                <div>
                                    <h3 className="text-base font-semibold mb-4 text-gray-800 flex items-center gap-2">
                                        معلومات الحساب
                                        <span className="text-xs font-normal text-gray-600 bg-gray-100 px-2 py-0.5 rounded border border-gray-300">للقراءة فقط</span>
                                    </h3>
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                        <div className="space-y-2 opacity-70">
                                            <Label className="text-gray-600">اسم المستخدم</Label>
                                            <Input value={vendor.username} readOnly disabled className="bg-gray-100 border-gray-200 cursor-not-allowed text-gray-500" />
                                        </div>
                                        <div className="space-y-2 opacity-70">
                                            <Label className="text-gray-600">الحد الأقصى للمنتجات</Label>
                                            <Input value={`${vendor.productLimit} منتج`} readOnly disabled className="bg-gray-100 border-gray-200 cursor-not-allowed text-gray-500" />
                                        </div>
                                        <div className="space-y-2 opacity-70">
                                            <Label className="text-gray-600">حالة الحساب</Label>
                                            <Input value="نشط (Active)" readOnly disabled className="bg-gray-100 border-gray-200 cursor-not-allowed text-green-600 font-medium" />
                                        </div>
                                        <div className="space-y-2 opacity-70">
                                            <Label className="text-gray-600">الدور (Role)</Label>
                                            <Input value="بائع (Vendor)" readOnly disabled className="bg-gray-100 border-gray-200 cursor-not-allowed text-gray-500" />
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div className="flex justify-end pt-6 border-t border-gray-200">
                            <Button type="submit" disabled={loading} size="lg" className="w-full md:w-auto min-w-[150px]">
                                {loading ? (
                                    <>
                                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                        جاري الحفظ...
                                    </>
                                ) : (
                                    "حفظ التغييرات"
                                )}
                            </Button>
                        </div>
                    </form>
                </CardContent>
            </Card>

            {/* Password Change Card */}
            <Card className="bg-white border-gray-200 shadow-sm">
                <CardHeader>
                    <CardTitle className="text-xl text-gray-900">تغيير كلمة المرور</CardTitle>
                    <CardDescription className="text-gray-600">
                        قم بتحديث كلمة المرور الخاصة بحسابك
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <form onSubmit={handlePasswordChange} className="space-y-4 max-w-2xl">
                        <div className="space-y-2">
                            <Label className="text-gray-700">كلمة المرور الحالية</Label>
                            <Input
                                type="password"
                                required
                                value={passwordData.currentPassword}
                                onChange={e => setPasswordData({ ...passwordData, currentPassword: e.target.value })}
                                className="bg-white border-gray-300 text-gray-900"
                            />
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label className="text-gray-700">كلمة المرور الجديدة</Label>
                                <Input
                                    type="password"
                                    required
                                    value={passwordData.newPassword}
                                    onChange={e => setPasswordData({ ...passwordData, newPassword: e.target.value })}
                                    className="bg-white border-gray-300 text-gray-900"
                                />
                            </div>
                            <div className="space-y-2">
                                <Label className="text-gray-700">تأكيد كلمة المرور الجديدة</Label>
                                <Input
                                    type="password"
                                    required
                                    value={passwordData.confirmPassword}
                                    onChange={e => setPasswordData({ ...passwordData, confirmPassword: e.target.value })}
                                    className="bg-white border-gray-300 text-gray-900"
                                />
                            </div>
                        </div>
                        <div className="flex justify-end pt-4">
                            <Button type="submit" disabled={passwordLoading} className="w-full md:w-auto">
                                {passwordLoading ? (
                                    <>
                                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                        جاري التحديث...
                                    </>
                                ) : (
                                    "تحديث كلمة المرور"
                                )}
                            </Button>
                        </div>
                    </form>
                </CardContent>
            </Card>
        </div>
    );
}
