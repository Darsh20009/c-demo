import { useState, useRef, useEffect } from "react";
import { useLocation } from "wouter";
import { useMutation } from "@tanstack/react-query";
import { preCacheOnLogin } from "@/lib/offline-cashier";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { AtSign, Lock, Loader2, Eye, EyeOff, QrCode, Download, Phone, ArrowRight, CheckCircle2 } from "lucide-react";
import type { Employee } from "@shared/schema";
import { Html5QrcodeScanner } from "html5-qrcode";
import qiroxLogoStaff from "@assets/qirox-logo-staff.png";
import { useTranslate } from "@/lib/useTranslate";

function useAutoRedirectIfLoggedIn() {
  const [, setLocation] = useLocation();
  useState(() => {
    const stored = localStorage.getItem("currentEmployee");
    if (stored) {
      try {
        const emp = JSON.parse(stored);
        if (emp?.role) {
          if (emp.role === "admin") setLocation("/admin/dashboard");
          else if (emp.role === "owner") setLocation("/owner/dashboard");
          else if (emp.role === "manager" || emp.role === "branch_manager") setLocation("/manager/dashboard");
          else setLocation("/employee/dashboard");
        }
      } catch {}
    }
  });
}

type Step = "username" | "phone" | "password";

export default function EmployeeLogin() {
  useAutoRedirectIfLoggedIn();
  const [, setLocation] = useLocation();
  const [step, setStep] = useState<Step>("username");
  const [username, setUsername] = useState("");
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [showQRScanner, setShowQRScanner] = useState(false);
  const qrScannerRef = useRef<Html5QrcodeScanner | null>(null);
  const tc = useTranslate();
  const [rememberMe, setRememberMe] = useState(true);
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);

  useEffect(() => {
    document.title = tc("تسجيل دخول الموظفين - QIROX Systems", "Employee Login - QIROX Systems");
    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e);
    };
    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    const stored = localStorage.getItem("currentEmployee");
    if (stored) {
      try {
        const parsed = JSON.parse(stored);
        if (parsed?.id) { window.location.href = "/employee/dashboard"; return; }
      } catch {}
    }
    return () => window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
  }, []);

  const verifyPhoneMutation = useMutation({
    mutationFn: async ({ username, phone }: { username: string; phone: string }) => {
      const res = await fetch("/api/employees/verify-phone", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, phone }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.error || tc("رقم الجوال غير صحيح", "Incorrect phone number"));
      return data;
    },
    onSuccess: () => {
      setError("");
      setStep("password");
    },
    onError: (err: any) => {
      setError(err?.message || tc("اسم المستخدم أو رقم الجوال غير صحيح", "Incorrect username or phone"));
    },
  });

  const loginMutation = useMutation({
    mutationFn: async (credentials: { username?: string; employeeId?: string; password?: string }) => {
      const isQRLogin = !!credentials.employeeId && !credentials.password;
      const endpoint = isQRLogin ? "/api/employees/login-qr" : "/api/employees/login";
      const response = await fetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: 'include',
        body: JSON.stringify(credentials),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data?.error || tc("فشل تسجيل الدخول", "Login failed"));
      return data as Employee;
    },
    onSuccess: (employee: any) => {
      if (employee.restoreKey) {
        localStorage.setItem("qirox-restore-key", employee.restoreKey);
        delete employee.restoreKey;
      }
      localStorage.setItem("currentEmployee", JSON.stringify(employee));
      preCacheOnLogin().catch(() => {});
      const role = employee.role;
      if (role === "admin") window.location.href = "/admin/dashboard";
      else if (role === "owner") window.location.href = "/owner/dashboard";
      else if (role === "manager" || role === "branch_manager") window.location.href = "/manager/dashboard";
      else window.location.href = "/employee/dashboard";
    },
    onError: (err: any) => {
      setError(err?.message || tc("بيانات تسجيل الدخول غير صحيحة", "Invalid login credentials"));
      setPassword("");
    },
  });

  const handleUsernameNext = (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    if (!username.trim()) {
      setError(tc("الرجاء إدخال اسم المستخدم", "Please enter your username"));
      return;
    }
    setStep("phone");
  };

  const handlePhoneNext = (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    if (!phone.trim()) {
      setError(tc("الرجاء إدخال رقم الجوال", "Please enter your phone number"));
      return;
    }
    verifyPhoneMutation.mutate({ username: username.trim().toLowerCase(), phone: phone.trim() });
  };

  const handlePasswordSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    if (!password) {
      setError(tc("الرجاء إدخال كلمة المرور", "Please enter your password"));
      return;
    }
    loginMutation.mutate({ username: username.trim().toLowerCase(), password });
  };

  useEffect(() => {
    if (!showQRScanner) return;
    const scanner = new Html5QrcodeScanner("qr-reader", { fps: 10, qrbox: { width: 250, height: 250 } }, false);
    scanner.render(
      (decodedText) => {
        try {
          const scannedId = decodedText.trim();
          if (scannedId) {
            setError("");
            scanner.clear();
            setShowQRScanner(false);
            loginMutation.mutate({ employeeId: scannedId });
          } else {
            setError(tc("صيغة الباركود غير صحيحة", "Invalid QR code format"));
          }
        } catch {
          setError(tc("خطأ في قراءة الباركود", "Error reading QR code"));
        }
      },
      (err) => console.debug("QR scan error:", err)
    );
    qrScannerRef.current = scanner;
    return () => { qrScannerRef.current?.clear().catch(() => {}); };
  }, [showQRScanner]);

  const stepConfig = {
    username: { num: 1, label: tc("اسم المستخدم", "Username") },
    phone:    { num: 2, label: tc("رقم الجوال", "Phone") },
    password: { num: 3, label: tc("كلمة المرور", "Password") },
  };

  return (
    <div dir="rtl" className="min-h-screen bg-background flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-40 h-28 mb-4">
            <img src={qiroxLogoStaff} alt="QIROX Systems" className="w-full h-full object-contain" />
          </div>
          <h1 className="text-3xl font-bold text-foreground mb-2 font-playfair">QIROX Systems</h1>
          <p className="text-muted-foreground font-cairo">{tc("تسجيل دخول الموظف", "Employee Login")}</p>
        </div>

        {showQRScanner ? (
          <Card className="bg-card border-border/50 shadow-lg">
            <CardHeader>
              <CardTitle className="text-2xl text-center font-playfair text-accent">
                {tc("مسح بطاقة الموظف", "Scan Employee Card")}
              </CardTitle>
              <CardDescription className="text-center text-muted-foreground">
                {tc("وجه الكاميرا نحو QR الكود الموجود على بطاقتك", "Point the camera at the QR code on your card")}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div id="qr-reader" className="w-full overflow-hidden rounded-md border border-border" />
              {error && <p className="text-destructive text-sm text-center">{error}</p>}
              <Button type="button" variant="outline" onClick={() => { setError(""); setShowQRScanner(false); }} className="w-full border-primary/20 text-primary">
                {tc("إلغاء", "Cancel")}
              </Button>
            </CardContent>
          </Card>
        ) : (
          <Card className="bg-card border-border/50 shadow-lg">
            <CardHeader>
              <CardTitle className="text-2xl text-center font-playfair text-foreground">
                {tc("تسجيل الدخول", "Sign In")}
              </CardTitle>

              {/* Step indicator - rendered LTR so numbers go 1→2→3 visually */}
              <div className="flex items-center justify-center gap-2 pt-2" dir="ltr">
                {(["username", "phone", "password"] as Step[]).map((s, i) => {
                  const isDone = stepConfig[step].num > i + 1;
                  const isActive = step === s;
                  return (
                    <div key={s} className="flex items-center gap-2">
                      <div className={`flex items-center justify-center w-8 h-8 rounded-full text-xs font-bold transition-all
                        ${isDone ? "bg-primary text-primary-foreground" : isActive ? "bg-primary/20 text-primary border-2 border-primary" : "bg-muted text-muted-foreground"}`}>
                        {isDone ? <CheckCircle2 className="w-4 h-4" /> : i + 1}
                      </div>
                      {i < 2 && <div className={`w-8 h-0.5 ${isDone ? "bg-primary" : "bg-muted"}`} />}
                    </div>
                  );
                })}
              </div>
              <p className="text-center text-xs text-muted-foreground pt-1">
                {tc("الخطوة", "Step")} {stepConfig[step].num} {tc("من", "of")} 3 — {stepConfig[step].label}
              </p>
            </CardHeader>

            <CardContent>
              {/* Step 1: Username */}
              {step === "username" && (
                <form onSubmit={handleUsernameNext} className="space-y-4">
                  <div className="relative">
                    <AtSign className="absolute right-3 top-3 h-5 w-5 text-primary" />
                    <Input
                      type="text"
                      placeholder={tc("اسم المستخدم أو البريد الإلكتروني", "Username or Email")}
                      value={username}
                      onChange={(e) => setUsername(e.target.value)}
                      className="pr-10 bg-background border-border"
                      data-testid="input-username"
                      autoFocus
                      autoComplete="username email"
                    />
                  </div>
                  {error && <p className="text-destructive text-sm text-right" data-testid="text-error">{error}</p>}
                  <Button type="submit" className="w-full bg-primary hover:bg-primary/90 text-primary-foreground font-bold" data-testid="button-next-username">
                    <ArrowRight className="w-4 h-4 mr-2" />
                    {tc("التالي", "Next")}
                  </Button>

                  <div className="pt-4 border-t border-border space-y-2">
                    <Button type="button" variant="secondary" onClick={() => { setError(""); setShowQRScanner(true); }} className="w-full" data-testid="button-scan-qr">
                      <QrCode className="w-4 h-4 ml-2" />
                      {tc("مسح بطاقة الموظف", "Scan Employee Card")}
                    </Button>
                    <p className="text-sm text-muted-foreground text-center">{tc("موظف جديد؟", "New employee?")}</p>
                    <Button type="button" variant="outline" onClick={() => setLocation("/employee/activate")} className="w-full border-primary/20 text-primary" data-testid="button-activate">
                      {tc("تفعيل حساب جديد", "Activate New Account")}
                    </Button>
                    <Button type="button" variant="ghost" onClick={async () => {
                      if (deferredPrompt) {
                        deferredPrompt.prompt();
                        const { outcome } = await deferredPrompt.userChoice;
                        if (outcome === 'accepted') setDeferredPrompt(null);
                      } else {
                        const ua = navigator.userAgent.toLowerCase();
                        if (/iphone|ipad|ipod/.test(ua)) {
                          alert(tc("لتثبيت النظام على iPhone: اضغط على زر 'مشاركة' ثم 'إضافة إلى الشاشة الرئيسية'", "To install on iPhone: tap 'Share' then 'Add to Home Screen'"));
                        } else {
                          alert(tc("لتثبيت النظام: اضغط على القائمة (⋮) ثم 'تثبيت التطبيق'", "To install: tap the menu (⋮) then 'Install App'"));
                        }
                      }
                    }} className="w-full text-primary font-bold hover:bg-primary/5">
                      <Download className="ml-2 h-4 w-4" />
                      {tc("تحميل نظام الموظفين", "Download Staff App")}
                    </Button>
                  </div>
                </form>
              )}

              {/* Step 2: Phone */}
              {step === "phone" && (
                <form onSubmit={handlePhoneNext} className="space-y-4">
                  <div className="bg-muted/50 rounded-lg px-4 py-3 text-sm text-muted-foreground flex items-center gap-2 border border-border">
                    <AtSign className="w-4 h-4 text-primary shrink-0" />
                    <span className="font-medium text-foreground">{username}</span>
                  </div>
                  <div className="relative">
                    <Phone className="absolute right-3 top-3 h-5 w-5 text-primary" />
                    <Input
                      type="tel"
                      placeholder={tc("رقم الجوال (مثال: 0501234567)", "Phone number (e.g. 0501234567)")}
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      className="pr-10 bg-background border-border"
                      data-testid="input-phone"
                      autoFocus
                      autoComplete="tel"
                      disabled={verifyPhoneMutation.isPending}
                    />
                  </div>
                  {error && <p className="text-destructive text-sm text-right" data-testid="text-error">{error}</p>}
                  <Button type="submit" disabled={verifyPhoneMutation.isPending} className="w-full bg-primary hover:bg-primary/90 text-primary-foreground font-bold" data-testid="button-verify-phone">
                    {verifyPhoneMutation.isPending ? (
                      <><Loader2 className="ml-2 h-4 w-4 animate-spin" />{tc("جاري التحقق...", "Verifying...")}</>
                    ) : (
                      <><ArrowRight className="w-4 h-4 mr-2" />{tc("التالي", "Next")}</>
                    )}
                  </Button>
                  <Button type="button" variant="ghost" onClick={() => { setError(""); setStep("username"); }} className="w-full text-muted-foreground" data-testid="button-back-username">
                    {tc("رجوع", "Back")}
                  </Button>
                </form>
              )}

              {/* Step 3: Password */}
              {step === "password" && (
                <form onSubmit={handlePasswordSubmit} className="space-y-4">
                  <div className="bg-muted/50 rounded-lg px-4 py-3 text-sm flex items-center gap-2 border border-border">
                    <CheckCircle2 className="w-4 h-4 text-primary shrink-0" />
                    <span className="text-muted-foreground">{tc("تم التحقق من الهوية", "Identity verified")}</span>
                    <span className="font-medium text-foreground mr-auto">{username}</span>
                  </div>
                  <div className="relative">
                    <Lock className="absolute right-3 top-3 h-5 w-5 text-primary" />
                    <Input
                      type={showPassword ? "text" : "password"}
                      placeholder={tc("كلمة المرور", "Password")}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="pr-10 pl-10 bg-background border-border"
                      data-testid="input-password"
                      autoFocus
                      autoComplete="current-password"
                      disabled={loginMutation.isPending}
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute left-3 top-3 text-primary hover:text-primary/80"
                      data-testid="button-toggle-password"
                    >
                      {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                    </button>
                  </div>
                  <div className="flex justify-end">
                    <button type="button" onClick={() => setLocation("/employee/forgot-password")} className="text-xs text-accent hover:text-accent/80 underline" data-testid="link-forgot-password">
                      {tc("نسيت كلمة المرور؟", "Forgot password?")}
                    </button>
                  </div>
                  {error && <p className="text-destructive text-sm text-right" data-testid="text-error">{error}</p>}
                  <div className="flex items-center space-x-2 space-x-reverse">
                    <input type="checkbox" id="remember-me" checked={rememberMe} onChange={(e) => setRememberMe(e.target.checked)} className="w-4 h-4 rounded border-gray-300 text-primary focus:ring-primary" />
                    <label htmlFor="remember-me" className="text-sm text-muted-foreground mr-2">{tc("تذكرني", "Remember me")}</label>
                  </div>
                  <Button type="submit" disabled={loginMutation.isPending} className="w-full bg-gradient-to-r from-accent to-accent/90 hover:from-accent/95 hover:to-accent/85 text-accent-foreground font-bold" data-testid="button-login">
                    {loginMutation.isPending ? (
                      <><Loader2 className="ml-2 h-4 w-4 animate-spin" />{tc("جاري تسجيل الدخول...", "Signing in...")}</>
                    ) : tc("دخول", "Sign In")}
                  </Button>
                  <Button type="button" variant="ghost" onClick={() => { setError(""); setStep("phone"); }} className="w-full text-muted-foreground" data-testid="button-back-phone">
                    {tc("رجوع", "Back")}
                  </Button>
                </form>
              )}
            </CardContent>
          </Card>
        )}

        <div className="mt-6 text-center">
          <Button variant="ghost" onClick={() => setLocation("/employee/gateway")} className="text-primary hover:text-primary/80" data-testid="link-back">
            {tc("رجوع للبوابة", "Back to Gateway")}
          </Button>
        </div>
      </div>
    </div>
  );
}
