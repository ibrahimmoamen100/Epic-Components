import { useState, useEffect } from "react";
import { Vendor } from "@/types/vendor";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Separator } from "@/components/ui/separator";
import { toast } from "sonner";
import { Loader2, Eye, EyeOff, AlertTriangle, Building2, Phone, Mail, MapPin, Hash, Key } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";

interface VendorEditDialogProps {
    vendor: Vendor | null;
    open: boolean;
    onOpenChange: (open: boolean) => void;
    onSave: (vendor: Vendor, newPassword?: string) => Promise<void>;
}

export function VendorEditDialog({ vendor, open, onOpenChange, onSave }: VendorEditDialogProps) {
    const [formData, setFormData] = useState<Vendor | null>(null);
    const [newPassword, setNewPassword] = useState("");
    const [confirmPassword, setConfirmPassword] = useState("");
    const [showPassword, setShowPassword] = useState(false);
    const [isChangingPassword, setIsChangingPassword] = useState(false);
    const [isSaving, setIsSaving] = useState(false);

    // Sync form data when vendor changes
    useEffect(() => {
        if (vendor) {
            setFormData({ ...vendor });
        } else {
            setFormData(null);
        }
        // Reset password fields when dialog opens/closes or vendor changes
        setNewPassword("");
        setConfirmPassword("");
        setIsChangingPassword(false);
        setShowPassword(false);
    }, [vendor, open]);

    const handleSave = async () => {
        if (!formData) return;

        // Validate required fields
        if (!formData.name?.trim()) {
            toast.error("اسم البائع مطلوب");
            return;
        }
        if (!formData.phoneNumber?.trim()) {
            toast.error("رقم الهاتف مطلوب");
            return;
        }
        if (!formData.storeLocation?.trim()) {
            toast.error("موقع المتجر مطلوب");
            return;
        }
        if (!formData.username?.trim()) {
            toast.error("اسم المستخدم مطلوب");
            return;
        }
        if (!formData.gmailAccount?.trim()) {
            toast.error("حساب Gmail مطلوب");
            return;
        }

        // Validate product limit
        if (typeof formData.productLimit !== 'number' || formData.productLimit < 1) {
            toast.error("الحد الأقصى للمنتجات يجب أن يكون رقم موجب");
            return;
        }

        // Validate password if changing
        if (isChangingPassword) {
            if (!newPassword || newPassword.length < 6) {
                toast.error("كلمة المرور يجب أن تكون 6 أحرف على الأقل");
                return;
            }
            if (newPassword !== confirmPassword) {
                toast.error("كلمة المرور غير متطابقة");
                return;
            }
        }

        try {
            setIsSaving(true);
            await onSave(formData, isChangingPassword ? newPassword : undefined);
            toast.success("تم حفظ بيانات البائع بنجاح");
            onOpenChange(false);
        } catch (error: any) {
            console.error("Error saving vendor:", error);
            toast.error(error.message || "فشل في حفظ بيانات البائع");
        } finally {
            setIsSaving(false);
        }
    };

    const handleCancel = () => {
        onOpenChange(false);
    };

    if (!formData) return null;

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                    <DialogTitle className="text-2xl flex items-center gap-2">
                        <Building2 className="h-6 w-6 text-primary" />
                        تعديل بيانات البائع
                    </DialogTitle>
                    <DialogDescription>
                        قم بتحديث معلومات البائع الأساسية والإعدادات
                    </DialogDescription>
                </DialogHeader>

                <div className="space-y-6 py-4">
                    {/* Basic Info */}
                    <Card>
                        <CardHeader>
                            <CardTitle className="text-lg">المعلومات الأساسية</CardTitle>
                            <CardDescription>اسم البائع والشعار</CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <Label htmlFor="name" className="flex items-center gap-2">
                                        <Building2 className="h-4 w-4" />
                                        اسم البائع / المتجر <span className="text-red-500">*</span>
                                    </Label>
                                    <Input
                                        id="name"
                                        value={formData.name}
                                        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                        placeholder="أدخل اسم البائع أو المتجر"
                                        required
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="logoUrl" className="flex items-center gap-2">
                                        🖼️ رابط الشعار
                                    </Label>
                                    <Input
                                        id="logoUrl"
                                        type="url"
                                        value={formData.logoUrl || ""}
                                        onChange={(e) => setFormData({ ...formData, logoUrl: e.target.value })}
                                        placeholder="https://example.com/logo.png"
                                    />
                                    <p className="text-xs text-muted-foreground">رابط مباشر لصورة الشعار (اختياري)</p>
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    {/* Contact Info */}
                    <Card>
                        <CardHeader>
                            <CardTitle className="text-lg">معلومات الاتصال</CardTitle>
                            <CardDescription>الهاتف والبريد الإلكتروني والموقع</CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <Label htmlFor="phoneNumber" className="flex items-center gap-2">
                                        <Phone className="h-4 w-4" />
                                        رقم الهاتف / الواتساب <span className="text-red-500">*</span>
                                    </Label>
                                    <Input
                                        id="phoneNumber"
                                        dir="ltr"
                                        className="text-right"
                                        value={formData.phoneNumber}
                                        onChange={(e) => setFormData({ ...formData, phoneNumber: e.target.value })}
                                        placeholder="+20 1xxxxxxxxx"
                                        required
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="gmailAccount" className="flex items-center gap-2">
                                        <Mail className="h-4 w-4" />
                                        حساب Gmail <span className="text-red-500">*</span>
                                    </Label>
                                    <Input
                                        id="gmailAccount"
                                        type="email"
                                        dir="ltr"
                                        className="text-right"
                                        value={formData.gmailAccount}
                                        onChange={(e) => setFormData({ ...formData, gmailAccount: e.target.value })}
                                        placeholder="example@gmail.com"
                                        required
                                    />
                                </div>
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="storeLocation" className="flex items-center gap-2">
                                    <MapPin className="h-4 w-4" />
                                    موقع المتجر / العنوان <span className="text-red-500">*</span>
                                </Label>
                                <Input
                                    id="storeLocation"
                                    value={formData.storeLocation}
                                    onChange={(e) => setFormData({ ...formData, storeLocation: e.target.value })}
                                    placeholder="العنوان الكامل للمتجر"
                                    required
                                />
                            </div>
                        </CardContent>
                    </Card>

                    {/* Business Info */}
                    <Card>
                        <CardHeader>
                            <CardTitle className="text-lg">إعدادات العمل</CardTitle>
                            <CardDescription>اسم المستخدم والحد الأقصى للمنتجات</CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <Label htmlFor="username" className="flex items-center gap-2">
                                        👤 اسم المستخدم <span className="text-red-500">*</span>
                                    </Label>
                                    <Input
                                        id="username"
                                        value={formData.username}
                                        onChange={(e) => setFormData({ ...formData, username: e.target.value })}
                                        placeholder="اسم المستخدم للدخول"
                                        required
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="productLimit" className="flex items-center gap-2">
                                        <Hash className="h-4 w-4" />
                                        الحد الأقصى للمنتجات <span className="text-red-500">*</span>
                                    </Label>
                                    <Input
                                        id="productLimit"
                                        type="number"
                                        min={1}
                                        value={formData.productLimit ?? 5}
                                        onChange={(e) =>
                                            setFormData({
                                                ...formData,
                                                productLimit: Number(e.target.value) || 0,
                                            })
                                        }
                                        placeholder="5"
                                        required
                                    />
                                    <p className="text-xs text-muted-foreground">
                                        عدد المنتجات التي يمكن للبائع إضافتها
                                    </p>
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    <Separator />

                    {/* Password Reset Section */}
                    <Card className="border-amber-200 bg-amber-50">
                        <CardHeader>
                            <CardTitle className="text-lg flex items-center gap-2">
                                <Key className="h-5 w-5 text-amber-600" />
                                إعادة تعيين كلمة المرور
                            </CardTitle>
                            <CardDescription>تغيير كلمة مرور البائع (اختياري)</CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            {!isChangingPassword ? (
                                <div>
                                    <Alert className="bg-amber-100 border-amber-300">
                                        <AlertTriangle className="h-4 w-4 text-amber-600" />
                                        <AlertDescription className="text-amber-800">
                                            كمسؤول، يمكنك إعادة تعيين كلمة مرور البائع دون الحاجة إلى كلمة المرور القديمة.
                                        </AlertDescription>
                                    </Alert>
                                    <Button
                                        type="button"
                                        variant="outline"
                                        onClick={() => setIsChangingPassword(true)}
                                        className="mt-4 border-amber-600 text-amber-700 hover:bg-amber-100"
                                    >
                                        <Key className="h-4 w-4 mr-2" />
                                        إعادة تعيين كلمة المرور
                                    </Button>
                                </div>
                            ) : (
                                <div className="space-y-4">
                                    <Alert className="bg-red-50 border-red-300">
                                        <AlertTriangle className="h-4 w-4 text-red-600" />
                                        <AlertDescription className="text-red-800">
                                            <strong>تحذير:</strong> سيتم تغيير كلمة مرور البائع فوراً. سيحتاج البائع لاستخدام كلمة المرور الجديدة عند تسجيل الدخول.
                                        </AlertDescription>
                                    </Alert>

                                    <div className="space-y-2">
                                        <Label htmlFor="newPassword">كلمة المرور الجديدة</Label>
                                        <div className="relative">
                                            <Input
                                                id="newPassword"
                                                type={showPassword ? "text" : "password"}
                                                value={newPassword}
                                                onChange={(e) => setNewPassword(e.target.value)}
                                                placeholder="أدخل كلمة المرور الجديدة (6 أحرف على الأقل)"
                                                className="pr-10"
                                            />
                                            <Button
                                                type="button"
                                                variant="ghost"
                                                size="icon"
                                                className="absolute left-0 top-0 h-full"
                                                onClick={() => setShowPassword(!showPassword)}
                                            >
                                                {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                                            </Button>
                                        </div>
                                    </div>

                                    <div className="space-y-2">
                                        <Label htmlFor="confirmPassword">تأكيد كلمة المرور</Label>
                                        <Input
                                            id="confirmPassword"
                                            type={showPassword ? "text" : "password"}
                                            value={confirmPassword}
                                            onChange={(e) => setConfirmPassword(e.target.value)}
                                            placeholder="أعد إدخال كلمة المرور"
                                        />
                                    </div>

                                    {newPassword && confirmPassword && newPassword !== confirmPassword && (
                                        <p className="text-sm text-red-600">كلمات المرور غير متطابقة</p>
                                    )}

                                    <Button
                                        type="button"
                                        variant="ghost"
                                        onClick={() => {
                                            setIsChangingPassword(false);
                                            setNewPassword("");
                                            setConfirmPassword("");
                                        }}
                                        size="sm"
                                    >
                                        إلغاء تغيير كلمة المرور
                                    </Button>
                                </div>
                            )}
                        </CardContent>
                    </Card>
                </div>

                {/* Action Buttons */}
                <div className="flex justify-end gap-3 pt-4 border-t">
                    <Button variant="outline" onClick={handleCancel} disabled={isSaving}>
                        إلغاء
                    </Button>
                    <Button onClick={handleSave} disabled={isSaving}>
                        {isSaving ? (
                            <>
                                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                جاري الحفظ...
                            </>
                        ) : (
                            "حفظ التغييرات"
                        )}
                    </Button>
                </div>
            </DialogContent>
        </Dialog>
    );
}
