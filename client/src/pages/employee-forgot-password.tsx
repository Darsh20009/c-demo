import { useState } from "react";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Lock, Eye, EyeOff, ArrowRight } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useTranslate } from "@/lib/useTranslate";
import qiroxLogoStaff from "@assets/qirox-logo-staff.png";

export default function EmployeeForgotPassword() {
  const [, navigate] = useLocation();
  const { toast } = useToast();
  const tc = useTranslate();
  const [username, setUsername] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [step, setStep] = useState<'username' | 'password'>('username');

  const handleUsernameSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!username || username.trim().length < 2) {
      toast({
        title: tc("خطأ", "Error"),
        description: tc("يرجى إدخال اسم المستخدم", "Please enter your username"),
        variant: "destructive"
      });
      return;
    }

    setStep('password');
  };

  const handlePasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!newPassword || newPassword.length < 4) {
      toast({
        title: tc("خطأ", "Error"),
        description: tc("كلمة المرور يجب أن تكون على الأقل 4 أحرف", "Password must be at least 4 characters"),
        variant: "destructive"
      });
      return;
    }

    if (newPassword !== confirmPassword) {
      toast({
        title: tc("خطأ", "Error"),
        description: tc("كلمة المرور غير متطابقة", "Passwords do not match"),
        variant: "destructive"
      });
      return;
    }

    setLoading(true);

    try {
      const response = await fetch("/api/employees/reset-password-by-username", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, newPassword })
      });

      if (!response.ok) {
        throw new Error(tc("فشل تغيير كلمة المرور", "Failed to change password"));
      }

      toast({
        title: tc("نجح!", "Success!"),
        description: tc("تم تغيير كلمة المرور بنجاح. يمكنك تسجيل الدخول الآن", "Password changed successfully. You can sign in now"),
      });

      setTimeout(() => navigate("/employee/login"), 2000);
    } catch (error: any) {
      console.error("Reset password error:", error);
      toast({
        title: tc("خطأ", "Error"),
        description: error.message || tc("حدث خطأ أثناء تغيير كلمة المرور", "An error occurred while changing the password"),
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      className="min-h-screen flex items-center justify-center p-4 bg-gray-50"
      dir="rtl"
    >
      <Card className="w-full max-w-md border border-border bg-card shadow-xl">
        <CardHeader className="space-y-3 text-center pb-6">
          <div className="flex justify-center mb-1">
            <img src={qiroxLogoStaff} alt="QIROX" className="h-12 object-contain" />
          </div>
          <CardTitle className="text-2xl font-bold text-foreground">
            {tc("نسيت كلمة المرور؟", "Forgot Password?")}
          </CardTitle>
          <CardDescription className="text-muted-foreground">
            {step === 'username' && tc('أدخل اسم المستخدم لتغيير كلمة المرور', 'Enter your username to change your password')}
            {step === 'password' && tc('أدخل كلمة المرور الجديدة', 'Enter your new password')}
          </CardDescription>
        </CardHeader>

        <CardContent className="space-y-6">
          {step === 'username' && (
            <form onSubmit={handleUsernameSubmit} className="space-y-5">
              <div className="space-y-2">
                <Label htmlFor="username" className="text-foreground">{tc("اسم المستخدم", "Username")}</Label>
                <Input
                  id="username"
                  type="text"
                  placeholder={tc("أدخل اسم المستخدم الخاص بك", "Enter your username")}
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  className="bg-secondary border-border focus:border-primary focus:ring-primary/30"
                  data-testid="input-username"
                  required
                />
              </div>

              <Button
                type="submit"
                className="w-full h-12 text-base font-bold"
                data-testid="button-submit"
              >
                <div className="flex items-center gap-2">
                  <span>{tc("التالي", "Next")}</span>
                  <ArrowRight className="w-5 h-5" />
                </div>
              </Button>
            </form>
          )}

          {step === 'password' && (
            <form onSubmit={handlePasswordSubmit} className="space-y-5">
              <div className="space-y-2">
                <Label htmlFor="newPassword" className="text-foreground">{tc("كلمة المرور الجديدة", "New Password")}</Label>
                <div className="relative">
                  <Input
                    id="newPassword"
                    type={showNewPassword ? "text" : "password"}
                    placeholder={tc("أدخل كلمة المرور الجديدة", "Enter new password")}
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    className="bg-secondary border-border focus:border-primary focus:ring-primary/30 pl-10"
                    data-testid="input-new-password"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowNewPassword(!showNewPassword)}
                    className="absolute left-3 top-2.5 text-muted-foreground hover:text-foreground"
                    data-testid="button-toggle-new-password"
                  >
                    {showNewPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="confirmPassword" className="text-foreground">{tc("تأكيد كلمة المرور", "Confirm Password")}</Label>
                <div className="relative">
                  <Input
                    id="confirmPassword"
                    type={showConfirmPassword ? "text" : "password"}
                    placeholder={tc("أعد إدخال كلمة المرور", "Re-enter password")}
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    className="bg-secondary border-border focus:border-primary focus:ring-primary/30 pl-10"
                    data-testid="input-confirm-password"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    className="absolute left-3 top-2.5 text-muted-foreground hover:text-foreground"
                    data-testid="button-toggle-confirm-password"
                  >
                    {showConfirmPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
                <p className="text-xs text-muted-foreground mt-1">
                  {tc("كلمة المرور يجب أن تكون على الأقل 4 أحرف", "Password must be at least 4 characters")}
                </p>
              </div>

              <Button
                type="submit"
                disabled={loading}
                className="w-full h-12 text-base font-bold"
                data-testid="button-reset-password"
              >
                {loading ? tc("جارٍ التغيير...", "Changing...") : tc("تغيير كلمة المرور", "Change Password")}
              </Button>
            </form>
          )}

          <div className="pt-4 text-center">
            <button
              type="button"
              onClick={() => {
                if (step === 'password') {
                  setStep('username');
                  setNewPassword("");
                  setConfirmPassword("");
                } else {
                  navigate("/employee/login");
                }
              }}
              className="text-accent hover:text-accent text-sm"
              data-testid="button-back"
            >
              {step === 'password' ? tc("رجوع", "Back") : tc("العودة لتسجيل الدخول", "Back to Login")}
            </button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
