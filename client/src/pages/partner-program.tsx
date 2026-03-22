import { useState } from "react";
import { PlanGate } from "@/components/plan-gate";
  import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
  import { Button } from "@/components/ui/button";
  import { Badge } from "@/components/ui/badge";
  import { Input } from "@/components/ui/input";
  import { Label } from "@/components/ui/label";
  import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
  import { Progress } from "@/components/ui/progress";
  import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
  import { Textarea } from "@/components/ui/textarea";
  import { useToast } from "@/hooks/use-toast";
  import { useTranslate } from "@/lib/useTranslate";
  import { useLocation } from "wouter";
  import { 
    Users, Award, TrendingUp, DollarSign, Star, ArrowLeft, Copy, 
    CheckCircle, Phone, Mail, Globe, Shield, Zap, BarChart3,
    Building2, Handshake, GraduationCap, HeartHandshake, Gift
  } from "lucide-react";

  const TIERS = [
    { id: 'silver', nameAr: 'فضي', nameEn: 'Silver', minClients: 1, commission: 15, color: 'from-slate-400 to-slate-500', benefits: ['15% عمولة شهرية', 'دعم فني مخصص', 'لوحة تحكم شريك'] },
    { id: 'gold', nameAr: 'ذهبي', nameEn: 'Gold', minClients: 5, commission: 20, color: 'from-yellow-400 to-amber-500', benefits: ['20% عمولة شهرية', 'مدير حساب مخصص', 'تدريب مجاني', 'مواد تسويقية'] },
    { id: 'platinum', nameAr: 'بلاتيني', nameEn: 'Platinum', minClients: 15, commission: 25, color: 'from-cyan-400 to-blue-500', benefits: ['25% عمولة شهرية', 'أولوية في الدعم', 'شعار في موقعنا', 'أسعار خاصة للعملاء'] },
    { id: 'diamond', nameAr: 'ماسي', nameEn: 'Diamond', minClients: 30, commission: 30, color: 'from-purple-400 to-pink-500', benefits: ['30% عمولة شهرية', 'حصرية منطقة جغرافية', 'مشاركة في الإيرادات', 'وصول beta للميزات'] },
  ];

  const MOCK_PARTNERS = [
    { nameAr: 'تك سولوشنز للحلول', nameEn: 'Tech Solutions LLC', clients: 12, revenue: 8400, tier: 'gold', city: 'الرياض' },
    { nameAr: 'سمارت ريتيل', nameEn: 'Smart Retail Co.', clients: 28, revenue: 19600, tier: 'platinum', city: 'جدة' },
    { nameAr: 'كافيه برو للاستشارات', nameEn: 'Cafe Pro Consulting', clients: 6, revenue: 4200, tier: 'gold', city: 'الدمام' },
  ];

  const REFERRAL_CODE = 'QIROX-' + Math.random().toString(36).toUpperCase().slice(2, 8);

  export default function PartnerProgramPage() {
    const [, setLocation] = useLocation();
    const { toast } = useToast();
    const tc = useTranslate();
    const [applyOpen, setApplyOpen] = useState(false);
    const [form, setForm] = useState({ companyAr: '', companyEn: '', phone: '', email: '', city: '', experience: '', website: '' });
    const [copied, setCopied] = useState(false);

    const myTier = TIERS[1]; // Gold for demo
    const myClients = 7;
    const myRevenue = 4900;
    const nextTier = TIERS[2];
    const progressToNext = Math.min((myClients / nextTier.minClients) * 100, 100);

    const copyCode = () => {
      navigator.clipboard.writeText(REFERRAL_CODE);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
      toast({ title: tc("تم نسخ الكود", "Code Copied!") });
    };

    const submitApplication = () => {
      toast({ title: tc("✅ تم استلام طلبك", "✅ Application Received"), description: tc("سنتواصل معك خلال 24 ساعة", "We'll contact you within 24 hours") });
      setApplyOpen(false);
    };

    const tierColors: Record<string, string> = { silver: 'text-slate-400', gold: 'text-yellow-500', platinum: 'text-cyan-500', diamond: 'text-purple-500' };
    const tierBadgeColors: Record<string, string> = { silver: 'bg-slate-500/20 text-slate-400 border-slate-500/30', gold: 'bg-yellow-500/20 text-yellow-500 border-yellow-500/30', platinum: 'bg-cyan-500/20 text-cyan-500 border-cyan-500/30', diamond: 'bg-purple-500/20 text-purple-500 border-purple-500/30' };

    return (
      <PlanGate feature="partnerProgram">
      <div className="min-h-screen bg-background p-4 md:p-6" dir="rtl">
        <div className="max-w-5xl mx-auto space-y-6">
          <div className="flex items-center gap-3">
            <Button variant="ghost" size="icon" onClick={() => setLocation('/manager/dashboard')}>
              <ArrowLeft className="w-5 h-5" />
            </Button>
            <div>
              <h1 className="text-2xl font-bold flex items-center gap-2">
                <Handshake className="w-7 h-7 text-primary" />
                {tc("برنامج الشركاء والموزعين", "Partner & Reseller Program")}
              </h1>
              <p className="text-sm text-muted-foreground">{tc("انضم إلى شبكة موزعي QIROX واكسب عمولات ثابتة", "Join QIROX reseller network and earn recurring commissions")}</p>
            </div>
          </div>

          <Tabs defaultValue="dashboard">
            <TabsList className="grid grid-cols-3 w-full">
              <TabsTrigger value="dashboard"><BarChart3 className="w-4 h-4 ml-1" />{tc("لوحتي", "My Dashboard")}</TabsTrigger>
              <TabsTrigger value="tiers"><Award className="w-4 h-4 ml-1" />{tc("مستويات الشراكة", "Partner Tiers")}</TabsTrigger>
              <TabsTrigger value="leaderboard"><TrendingUp className="w-4 h-4 ml-1" />{tc("المتصدرون", "Leaderboard")}</TabsTrigger>
            </TabsList>

            {/* My Dashboard */}
            <TabsContent value="dashboard" className="space-y-4">
              {/* Current Tier Card */}
              <Card className={`bg-gradient-to-r ${myTier.color} text-white`}>
                <CardContent className="p-5">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm opacity-80">{tc("مستواك الحالي", "Your Current Tier")}</p>
                      <h2 className="text-3xl font-black mt-1">{tc(myTier.nameAr, myTier.nameEn)}</h2>
                      <p className="text-sm opacity-80 mt-1">{myTier.commission}% {tc("عمولة شهرية", "monthly commission")}</p>
                    </div>
                    <Award className="w-16 h-16 opacity-30" />
                  </div>
                </CardContent>
              </Card>

              {/* Stats */}
              <div className="grid grid-cols-3 gap-3">
                <Card className="p-4 text-center">
                  <Users className="w-6 h-6 mx-auto mb-1 text-primary" />
                  <p className="text-2xl font-black">{myClients}</p>
                  <p className="text-[11px] text-muted-foreground">{tc("عميل نشط", "Active Clients")}</p>
                </Card>
                <Card className="p-4 text-center">
                  <DollarSign className="w-6 h-6 mx-auto mb-1 text-green-500" />
                  <p className="text-2xl font-black">{myRevenue.toLocaleString()}</p>
                  <p className="text-[11px] text-muted-foreground">{tc("ريال عمولة", "SAR Commission")}</p>
                </Card>
                <Card className="p-4 text-center">
                  <TrendingUp className="w-6 h-6 mx-auto mb-1 text-blue-500" />
                  <p className="text-2xl font-black">+23%</p>
                  <p className="text-[11px] text-muted-foreground">{tc("نمو شهري", "Monthly Growth")}</p>
                </Card>
              </div>

              {/* Progress to next tier */}
              <Card>
                <CardContent className="p-4 space-y-3">
                  <div className="flex items-center justify-between">
                    <p className="font-bold text-sm">{tc("التقدم نحو مستوى", "Progress to")} {tc(nextTier.nameAr, nextTier.nameEn)}</p>
                    <Badge className={`${tierBadgeColors[nextTier.id]} border text-xs`}>{tc(nextTier.nameAr, nextTier.nameEn)}</Badge>
                  </div>
                  <Progress value={progressToNext} className="h-3" />
                  <p className="text-xs text-muted-foreground">{myClients}/{nextTier.minClients} {tc("عميل — تحتاج", "clients — need")} {nextTier.minClients - myClients} {tc("عملاء أكثر", "more clients")}</p>
                </CardContent>
              </Card>

              {/* Referral Code */}
              <Card>
                <CardHeader><CardTitle className="text-sm">{tc("كود الإحالة الخاص بك", "Your Referral Code")}</CardTitle></CardHeader>
                <CardContent>
                  <div className="flex items-center gap-2 p-3 rounded-lg bg-primary/10 border border-primary/20">
                    <code className="flex-1 font-mono text-lg font-black text-primary">{REFERRAL_CODE}</code>
                    <Button size="sm" variant="outline" onClick={copyCode}>
                      {copied ? <CheckCircle className="w-4 h-4 text-green-500" /> : <Copy className="w-4 h-4" />}
                    </Button>
                  </div>
                  <p className="text-xs text-muted-foreground mt-2">{tc("شارك الكود مع عملائك ليحصلوا على خصم 10% واكسب عمولتك", "Share this code with clients for 10% discount and earn your commission")}</p>
                </CardContent>
              </Card>

              <Button size="lg" className="w-full" onClick={() => setApplyOpen(true)}>
                <HeartHandshake className="w-5 h-5 ml-2" />{tc("التقديم كشريك جديد", "Apply as New Partner")}
              </Button>
            </TabsContent>

            {/* Tiers */}
            <TabsContent value="tiers" className="space-y-3">
              {TIERS.map((tier, i) => (
                <Card key={tier.id} className={`border-2 ${myTier.id === tier.id ? 'border-primary' : 'border-transparent'}`}>
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex items-center gap-2">
                        <Award className={`w-6 h-6 ${tierColors[tier.id]}`} />
                        <div>
                          <p className="font-bold">{tc(tier.nameAr, tier.nameEn)}</p>
                          <p className="text-xs text-muted-foreground">{tier.minClients}+ {tc("عملاء", "clients")}</p>
                        </div>
                      </div>
                      <div className="text-left">
                        <p className="text-2xl font-black text-primary">{tier.commission}%</p>
                        <p className="text-xs text-muted-foreground">{tc("عمولة", "commission")}</p>
                      </div>
                    </div>
                    <div className="space-y-1">
                      {tier.benefits.map(b => (
                        <div key={b} className="flex items-center gap-2 text-sm"><CheckCircle className="w-3.5 h-3.5 text-green-500" />{b}</div>
                      ))}
                    </div>
                    {myTier.id === tier.id && <Badge className="mt-3 bg-primary/20 text-primary border-primary/30 border">{tc("مستواك الحالي", "Your Current Tier")}</Badge>}
                  </CardContent>
                </Card>
              ))}
            </TabsContent>

            {/* Leaderboard */}
            <TabsContent value="leaderboard" className="space-y-3">
              <Card>
                <CardHeader><CardTitle className="text-sm">{tc("أفضل الشركاء هذا الشهر", "Top Partners This Month")}</CardTitle></CardHeader>
                <CardContent className="space-y-3">
                  {MOCK_PARTNERS.sort((a,b) => b.clients - a.clients).map((p, i) => (
                    <div key={p.nameEn} className="flex items-center gap-3 p-3 rounded-xl bg-muted/50">
                      <span className={`text-2xl font-black ${i===0?'text-yellow-400':i===1?'text-slate-400':'text-amber-600'}`}>#{i+1}</span>
                      <div className="flex-1">
                        <p className="font-bold text-sm">{tc(p.nameAr, p.nameEn)}</p>
                        <p className="text-xs text-muted-foreground">{p.city} · {p.clients} {tc("عملاء", "clients")}</p>
                      </div>
                      <div className="text-left">
                        <p className="font-bold text-green-500">{p.revenue.toLocaleString()} {tc("ريال", "SAR")}</p>
                        <Badge className={`${tierBadgeColors[p.tier]} border text-[10px]`}>{tc(TIERS.find(t=>t.id===p.tier)?.nameAr||'', TIERS.find(t=>t.id===p.tier)?.nameEn||'')}</Badge>
                      </div>
                    </div>
                  ))}
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>

          {/* Apply Dialog */}
          <Dialog open={applyOpen} onOpenChange={setApplyOpen}>
            <DialogContent dir="rtl" className="max-h-[85vh] overflow-y-auto">
              <DialogHeader><DialogTitle>{tc("طلب الانضمام لبرنامج الشركاء", "Partner Program Application")}</DialogTitle></DialogHeader>
              <div className="space-y-3">
                {[
                  { key: 'companyAr', labelAr: 'اسم الشركة (عربي)', labelEn: 'Company Name (Arabic)' },
                  { key: 'companyEn', labelAr: 'اسم الشركة (إنجليزي)', labelEn: 'Company Name (English)' },
                  { key: 'phone', labelAr: 'رقم الجوال', labelEn: 'Phone Number' },
                  { key: 'email', labelAr: 'البريد الإلكتروني', labelEn: 'Email Address' },
                  { key: 'city', labelAr: 'المدينة', labelEn: 'City' },
                  { key: 'website', labelAr: 'الموقع الإلكتروني (اختياري)', labelEn: 'Website (Optional)' },
                ].map(f => (
                  <div key={f.key} className="space-y-1">
                    <Label>{tc(f.labelAr, f.labelEn)}</Label>
                    <Input value={(form as any)[f.key]} onChange={e => setForm({...form, [f.key]: e.target.value})} />
                  </div>
                ))}
                <div className="space-y-1">
                  <Label>{tc("خبرتك في قطاع المطاعم والكافيهات", "Experience in F&B sector")}</Label>
                  <Textarea placeholder={tc("اذكر خبرتك وعدد العملاء المتوقعين...", "Describe your experience and expected client count...")} value={form.experience} onChange={e => setForm({...form, experience: e.target.value})} rows={3} />
                </div>
                <Button onClick={submitApplication} className="w-full" disabled={!form.companyAr || !form.phone || !form.email}>
                  {tc("إرسال الطلب", "Submit Application")}
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </div>
      </PlanGate>
    );
  }
  