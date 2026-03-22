import { useState, useRef, useCallback, useEffect } from "react";
import { PlanGate } from "@/components/plan-gate";
  import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
  import { Button } from "@/components/ui/button";
  import { Badge } from "@/components/ui/badge";
  import { Input } from "@/components/ui/input";
  import { Label } from "@/components/ui/label";
  import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
  import { Switch } from "@/components/ui/switch";
  import { useToast } from "@/hooks/use-toast";
  import { useTranslate } from "@/lib/useTranslate";
  import { useLocation } from "wouter";
  import { 
    Printer, Usb, Fingerprint, Wallet, Settings, CheckCircle, XCircle, 
    AlertTriangle, Zap, ArrowLeft, RefreshCw, TestTube, Wifi, WifiOff,
    Monitor, Receipt, Banknote, Smartphone
  } from "lucide-react";

  // ESC/POS commands
  const ESC = 0x1B;
  const GS = 0x1D;
  const INIT = new Uint8Array([ESC, 0x40]);
  const CUT = new Uint8Array([GS, 0x56, 0x42, 0x00]);
  const BOLD_ON = new Uint8Array([ESC, 0x45, 0x01]);
  const BOLD_OFF = new Uint8Array([ESC, 0x45, 0x00]);
  const ALIGN_CENTER = new Uint8Array([ESC, 0x61, 0x01]);
  const ALIGN_RIGHT = new Uint8Array([ESC, 0x61, 0x02]);
  const ALIGN_LEFT = new Uint8Array([ESC, 0x61, 0x00]);
  const FEED = new Uint8Array([ESC, 0x64, 0x03]);
  const CASH_DRAWER = new Uint8Array([ESC, 0x70, 0x00, 0x19, 0xFA]);

  function encodeArabic(text: string): Uint8Array {
    const encoder = new TextEncoder();
    return encoder.encode(text + '\n');
  }

  export default function HardwareManagementPage() {
    const [, setLocation] = useLocation();
    const { toast } = useToast();
    const tc = useTranslate();
    const [printerPort, setPrinterPort] = useState<any>(null);
    const [printerConnected, setPrinterConnected] = useState(false);
    const [printerName, setPrinterName] = useState('');
    const [printerLoading, setPrinterLoading] = useState(false);
    const [drawerConnected, setDrawerConnected] = useState(false);
    const [fingerprintSupported, setFingerprintSupported] = useState(false);
    const [fingerprintRegistered, setFingerprintRegistered] = useState(false);
    const [fingerprintLoading, setFingerprintLoading] = useState(false);
    const [autoCut, setAutoCut] = useState(true);
    const [openDrawerOnSale, setOpenDrawerOnSale] = useState(true);
    const [printerWidth, setPrinterWidth] = useState('80');

    useEffect(() => {
      setFingerprintSupported(!!window.PublicKeyCredential);
      const saved = localStorage.getItem('hw-printer-name');
      if (saved) { setPrinterName(saved); setPrinterConnected(false); }
      setAutoCut(localStorage.getItem('hw-auto-cut') !== 'false');
      setOpenDrawerOnSale(localStorage.getItem('hw-drawer-on-sale') !== 'false');
      setPrinterWidth(localStorage.getItem('hw-printer-width') || '80');
    }, []);

    const connectPrinter = useCallback(async () => {
      if (!('serial' in navigator)) {
        toast({ title: tc("غير مدعوم", "Not Supported"), description: tc("Web Serial API غير متاح في هذا المتصفح — استخدم Chrome أو Edge", "Web Serial API not available — use Chrome or Edge"), variant: "destructive" });
        return;
      }
      setPrinterLoading(true);
      try {
        const port = await (navigator as any).serial.requestPort();
        await port.open({ baudRate: 9600 });
        setPrinterPort(port);
        setPrinterConnected(true);
        setDrawerConnected(true);
        const portInfo = port.getInfo?.();
        const name = portInfo ? `USB \${portInfo.usbVendorId?.toString(16).toUpperCase()}` : tc("طابعة متصلة", "Connected Printer");
        setPrinterName(name);
        localStorage.setItem('hw-printer-name', name);
        toast({ title: tc("✅ تم الاتصال بالطابعة", "✅ Printer Connected"), description: name });
      } catch (err: any) {
        if (err.name !== 'NotFoundError') {
          toast({ title: tc("فشل الاتصال", "Connection Failed"), description: err.message, variant: "destructive" });
        }
      } finally {
        setPrinterLoading(false);
      }
    }, []);

    const disconnectPrinter = useCallback(async () => {
      if (printerPort) {
        try { await printerPort.close(); } catch {}
        setPrinterPort(null);
      }
      setPrinterConnected(false);
      setDrawerConnected(false);
      setPrinterName('');
      localStorage.removeItem('hw-printer-name');
      toast({ title: tc("تم قطع الاتصال", "Disconnected") });
    }, [printerPort]);

    const sendToPrinter = useCallback(async (data: Uint8Array[]) => {
      if (!printerPort) { toast({ title: tc("لا توجد طابعة متصلة", "No printer connected"), variant: "destructive" }); return false; }
      try {
        const writer = printerPort.writable.getWriter();
        for (const chunk of data) await writer.write(chunk);
        writer.releaseLock();
        return true;
      } catch (err: any) {
        toast({ title: tc("خطأ في الطباعة", "Print Error"), description: err.message, variant: "destructive" });
        return false;
      }
    }, [printerPort]);

    const testPrint = useCallback(async () => {
      const success = await sendToPrinter([
        INIT, ALIGN_CENTER, BOLD_ON,
        encodeArabic('QIROX Cafe'),
        BOLD_OFF,
        encodeArabic(tc('اختبار الطابعة', 'Printer Test')),
        encodeArabic(new Date().toLocaleString('ar-SA')),
        FEED,
        ...(autoCut ? [CUT] : []),
      ]);
      if (success) toast({ title: tc("✅ تمت الطباعة", "✅ Printed Successfully") });
    }, [sendToPrinter, autoCut]);

    const openCashDrawer = useCallback(async () => {
      const success = await sendToPrinter([CASH_DRAWER]);
      if (success) toast({ title: tc("✅ تم فتح الدرج", "✅ Cash Drawer Opened") });
    }, [sendToPrinter]);

    const registerFingerprint = useCallback(async () => {
      if (!fingerprintSupported) return;
      setFingerprintLoading(true);
      try {
        const challenge = new Uint8Array(32);
        crypto.getRandomValues(challenge);
        const credential = await navigator.credentials.create({
          publicKey: {
            challenge,
            rp: { name: "QIROX Cafe", id: window.location.hostname },
            user: { id: new Uint8Array(16), name: "employee", displayName: tc("موظف QIROX", "QIROX Employee") },
            pubKeyCredParams: [{ alg: -7, type: "public-key" }],
            authenticatorSelection: { authenticatorAttachment: "platform", userVerification: "required" },
            timeout: 60000,
          }
        });
        if (credential) {
          localStorage.setItem('hw-fingerprint-registered', 'true');
          setFingerprintRegistered(true);
          toast({ title: tc("✅ تم تسجيل البصمة بنجاح", "✅ Fingerprint Registered Successfully") });
        }
      } catch (err: any) {
        if (err.name !== 'NotAllowedError') {
          toast({ title: tc("فشل تسجيل البصمة", "Fingerprint Registration Failed"), description: err.message, variant: "destructive" });
        }
      } finally {
        setFingerprintLoading(false);
      }
    }, [fingerprintSupported]);

    const saveSettings = () => {
      localStorage.setItem('hw-auto-cut', String(autoCut));
      localStorage.setItem('hw-drawer-on-sale', String(openDrawerOnSale));
      localStorage.setItem('hw-printer-width', printerWidth);
      toast({ title: tc("✅ تم حفظ الإعدادات", "✅ Settings Saved") });
    };

    const StatusBadge = ({ ok, label }: { ok: boolean; label: string }) => (
      <Badge className={`${ok ? 'bg-green-500/20 text-green-400 border-green-500/30' : 'bg-red-500/20 text-red-400 border-red-500/30'} border`}>
        {ok ? <CheckCircle className="w-3 h-3 ml-1" /> : <XCircle className="w-3 h-3 ml-1" />}
        {label}
      </Badge>
    );

    return (
      <PlanGate feature="hardwareSupport">
      <div className="min-h-screen bg-background p-4 md:p-6" dir="rtl">
        <div className="max-w-4xl mx-auto space-y-6">
          <div className="flex items-center gap-3">
            <Button variant="ghost" size="icon" onClick={() => setLocation('/manager/dashboard')}>
              <ArrowLeft className="w-5 h-5" />
            </Button>
            <div>
              <h1 className="text-2xl font-bold flex items-center gap-2">
                <Settings className="w-7 h-7 text-primary" />
                {tc("إدارة الأجهزة والهاردوير", "Hardware Management")}
              </h1>
              <p className="text-sm text-muted-foreground">{tc("ربط الطابعات وأدراج النقد وبصمة الموظفين", "Connect printers, cash drawers and employee fingerprints")}</p>
            </div>
          </div>

          {/* Status Overview */}
          <div className="grid grid-cols-3 gap-3">
            <Card className="text-center p-4">
              <Printer className="w-8 h-8 mx-auto mb-2 text-blue-500" />
              <p className="text-xs text-muted-foreground mb-1">{tc("الطابعة", "Printer")}</p>
              <StatusBadge ok={printerConnected} label={printerConnected ? tc("متصلة", "Connected") : tc("غير متصلة", "Disconnected")} />
            </Card>
            <Card className="text-center p-4">
              <Wallet className="w-8 h-8 mx-auto mb-2 text-green-500" />
              <p className="text-xs text-muted-foreground mb-1">{tc("درج النقد", "Cash Drawer")}</p>
              <StatusBadge ok={drawerConnected} label={drawerConnected ? tc("متصل", "Connected") : tc("غير متصل", "Disconnected")} />
            </Card>
            <Card className="text-center p-4">
              <Fingerprint className="w-8 h-8 mx-auto mb-2 text-purple-500" />
              <p className="text-xs text-muted-foreground mb-1">{tc("البصمة", "Fingerprint")}</p>
              <StatusBadge ok={fingerprintRegistered} label={fingerprintRegistered ? tc("مسجلة", "Registered") : tc("غير مسجلة", "Not Registered")} />
            </Card>
          </div>

          <Tabs defaultValue="printer">
            <TabsList className="grid grid-cols-3 w-full">
              <TabsTrigger value="printer"><Printer className="w-4 h-4 ml-1" />{tc("الطابعة", "Printer")}</TabsTrigger>
              <TabsTrigger value="drawer"><Wallet className="w-4 h-4 ml-1" />{tc("درج النقد", "Cash Drawer")}</TabsTrigger>
              <TabsTrigger value="fingerprint"><Fingerprint className="w-4 h-4 ml-1" />{tc("البصمة", "Fingerprint")}</TabsTrigger>
            </TabsList>

            {/* Printer Tab */}
            <TabsContent value="printer" className="space-y-4">
              <Card>
                <CardHeader><CardTitle className="text-lg flex items-center gap-2"><Printer className="w-5 h-5 text-blue-500" />{tc("إعداد الطابعة الحرارية", "Thermal Printer Setup")}</CardTitle>
                  <CardDescription>{tc("يدعم جميع طابعات ESC/POS عبر USB أو Serial", "Supports all ESC/POS printers via USB or Serial")}</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex gap-3">
                    {!printerConnected ? (
                      <Button onClick={connectPrinter} disabled={printerLoading} className="flex-1">
                        <Usb className="w-4 h-4 ml-2" />
                        {printerLoading ? tc("جاري الاتصال...", "Connecting...") : tc("ربط الطابعة", "Connect Printer")}
                      </Button>
                    ) : (
                      <>
                        <Button variant="outline" onClick={testPrint} className="flex-1">
                          <TestTube className="w-4 h-4 ml-2" />{tc("طباعة تجريبية", "Test Print")}
                        </Button>
                        <Button variant="destructive" onClick={disconnectPrinter}>{tc("قطع الاتصال", "Disconnect")}</Button>
                      </>
                    )}
                  </div>
                  {printerConnected && (
                    <div className="p-3 rounded-lg bg-green-500/10 border border-green-500/20 flex items-center gap-2">
                      <CheckCircle className="w-4 h-4 text-green-500" />
                      <span className="text-sm text-green-600 dark:text-green-400">{printerName || tc("طابعة متصلة", "Connected Printer")}</span>
                    </div>
                  )}
                  <div className="space-y-3 pt-2 border-t">
                    <div className="flex items-center justify-between">
                      <Label>{tc("قص تلقائي بعد الطباعة", "Auto-cut after print")}</Label>
                      <Switch checked={autoCut} onCheckedChange={setAutoCut} />
                    </div>
                    <div className="flex items-center justify-between">
                      <Label>{tc("فتح الدرج عند البيع", "Open drawer on sale")}</Label>
                      <Switch checked={openDrawerOnSale} onCheckedChange={setOpenDrawerOnSale} />
                    </div>
                    <div className="space-y-1">
                      <Label>{tc("عرض الورقة", "Paper Width")}</Label>
                      <div className="flex gap-2">
                        {['58', '80'].map(w => (
                          <Button key={w} size="sm" variant={printerWidth === w ? 'default' : 'outline'} onClick={() => setPrinterWidth(w)}>{w}mm</Button>
                        ))}
                      </div>
                    </div>
                    <Button onClick={saveSettings} className="w-full">{tc("حفظ الإعدادات", "Save Settings")}</Button>
                  </div>
                </CardContent>
              </Card>
              <Card>
                <CardHeader><CardTitle className="text-sm">{tc("الطابعات المدعومة", "Supported Printers")}</CardTitle></CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 gap-2 text-xs text-muted-foreground">
                    {['Epson TM-T20', 'Epson TM-T82', 'Star TSP100', 'Star TSP650', 'Bixolon SRP-350', 'Xprinter XP-58', 'Sam4s ELLIX40', 'Citizen CT-S310'].map(p => (
                      <div key={p} className="flex items-center gap-1"><CheckCircle className="w-3 h-3 text-green-500" />{p}</div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Cash Drawer Tab */}
            <TabsContent value="drawer" className="space-y-4">
              <Card>
                <CardHeader><CardTitle className="text-lg flex items-center gap-2"><Wallet className="w-5 h-5 text-green-500" />{tc("درج النقد", "Cash Drawer")}</CardTitle>
                  <CardDescription>{tc("يعمل درج النقد عبر الطابعة الحرارية (RJ11)", "Cash drawer works through the thermal printer (RJ11)")}</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  {!printerConnected && (
                    <div className="flex items-center gap-2 p-3 rounded-lg bg-yellow-500/10 border border-yellow-500/20">
                      <AlertTriangle className="w-4 h-4 text-yellow-500" />
                      <span className="text-sm">{tc("يجب ربط الطابعة أولاً لتشغيل الدرج", "Connect the printer first to operate the drawer")}</span>
                    </div>
                  )}
                  <Button onClick={openCashDrawer} disabled={!printerConnected} className="w-full h-16 text-lg" size="lg">
                    <Banknote className="w-6 h-6 ml-2" />
                    {tc("فتح الدرج الآن", "Open Drawer Now")}
                  </Button>
                  <div className="p-4 rounded-xl bg-muted/50 space-y-2">
                    <p className="text-sm font-bold">{tc("طريقة التوصيل", "Connection Method")}</p>
                    <div className="flex items-start gap-2 text-sm text-muted-foreground">
                      <span className="text-green-500 font-bold">1.</span>{tc("وصّل الدرج بمنفذ RJ11 في الطابعة", "Connect drawer to printer's RJ11 port")}
                    </div>
                    <div className="flex items-start gap-2 text-sm text-muted-foreground">
                      <span className="text-green-500 font-bold">2.</span>{tc("اربط الطابعة بـ USB على الجهاز", "Connect printer via USB to the device")}
                    </div>
                    <div className="flex items-start gap-2 text-sm text-muted-foreground">
                      <span className="text-green-500 font-bold">3.</span>{tc("فعّل 'فتح الدرج عند البيع' في إعدادات الطابعة", "Enable 'Open drawer on sale' in printer settings")}
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Fingerprint Tab */}
            <TabsContent value="fingerprint" className="space-y-4">
              <Card>
                <CardHeader><CardTitle className="text-lg flex items-center gap-2"><Fingerprint className="w-5 h-5 text-purple-500" />{tc("بصمة الموظف", "Employee Fingerprint")}</CardTitle>
                  <CardDescription>{tc("تسجيل الحضور والدخول بالبصمة عبر بصمة الجهاز", "Attendance and login via device biometrics")}</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  {!fingerprintSupported ? (
                    <div className="flex items-center gap-2 p-3 rounded-lg bg-red-500/10 border border-red-500/20">
                      <XCircle className="w-4 h-4 text-red-500" />
                      <span className="text-sm">{tc("الجهاز الحالي لا يدعم البصمة البيومترية", "Current device doesn't support biometric fingerprint")}</span>
                    </div>
                  ) : (
                    <>
                      <div className="flex flex-col items-center gap-4 py-6">
                        <div className={`w-24 h-24 rounded-full flex items-center justify-center ${fingerprintRegistered ? 'bg-purple-500/20 border-2 border-purple-500' : 'bg-muted border-2 border-dashed border-muted-foreground/30'}`}>
                          <Fingerprint className={`w-12 h-12 ${fingerprintRegistered ? 'text-purple-500' : 'text-muted-foreground'}`} />
                        </div>
                        <div className="text-center">
                          <p className="font-bold">{fingerprintRegistered ? tc("البصمة مسجلة ✅", "Fingerprint Registered ✅") : tc("البصمة غير مسجلة", "Fingerprint Not Registered")}</p>
                          <p className="text-sm text-muted-foreground mt-1">{fingerprintRegistered ? tc("يمكن للموظف تسجيل الحضور بالبصمة", "Employee can clock in with fingerprint") : tc("سجل البصمة لتفعيل تسجيل الحضور", "Register fingerprint to enable attendance")}</p>
                        </div>
                      </div>
                      <Button onClick={registerFingerprint} disabled={fingerprintLoading || fingerprintRegistered} className="w-full" size="lg">
                        <Fingerprint className="w-5 h-5 ml-2" />
                        {fingerprintLoading ? tc("جاري التسجيل...", "Registering...") : fingerprintRegistered ? tc("تم التسجيل", "Already Registered") : tc("تسجيل البصمة", "Register Fingerprint")}
                      </Button>
                      {fingerprintRegistered && (
                        <Button variant="outline" className="w-full" onClick={() => { localStorage.removeItem('hw-fingerprint-registered'); setFingerprintRegistered(false); }}>
                          {tc("إعادة تسجيل البصمة", "Re-register Fingerprint")}
                        </Button>
                      )}
                    </>
                  )}
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </div>
      </PlanGate>
    );
  }
  