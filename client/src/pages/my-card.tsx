import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import {
  Coffee, Gift, QrCode, ChevronRight, TrendingUp,
  ArrowDownRight, ArrowUpRight, Clock, Star, Crown, Award, Medal,
  Wallet, Sparkles, CheckCircle2, ChevronDown, ChevronUp
} from "lucide-react";
import { useCustomer } from "@/contexts/CustomerContext";
import { useLocation } from "wouter";
import { CustomerLayout } from "@/components/layouts/CustomerLayout";
import SarIcon from "@/components/sar-icon";
import QRCodeLib from "qrcode";
import { useTranslate } from "@/lib/useTranslate";
import { useTranslation } from "react-i18next";

function getTierConfig(tier: string, tc: (ar: string, en: string) => string) {
  const configs = {
    bronze:   { label: tc("برونزي","Bronze"),   color: "from-amber-600 to-amber-800",  badge: "bg-amber-600",  icon: Medal,  min: 0,    max: 499  },
    silver:   { label: tc("فضي","Silver"),      color: "from-slate-400 to-slate-600",  badge: "bg-slate-500",  icon: Star,   min: 500,  max: 1999 },
    gold:     { label: tc("ذهبي","Gold"),       color: "from-yellow-400 to-amber-600", badge: "bg-yellow-500", icon: Crown,  min: 2000, max: 4999 },
    platinum: { label: tc("بلاتيني","Platinum"), color: "from-gray-300 to-gray-500",   badge: "bg-gray-400",   icon: Award,  min: 5000, max: Infinity },
  };
  return configs[tier as keyof typeof configs] || configs.bronze;
}

function getNextTier(tier: string): string | null {
  const order = ["bronze", "silver", "gold", "platinum"];
  const idx = order.indexOf(tier);
  return idx < order.length - 1 ? order[idx + 1] : null;
}

export default function MyCardPage() {
  const { customer } = useCustomer();
  const [, setLocation] = useLocation();
  const [qrCodeUrl, setQrCodeUrl] = useState<string>("");
  const [showQr, setShowQr] = useState(false);
  const [showHistory, setShowHistory] = useState(false);
  const tc = useTranslate();
  const { i18n } = useTranslation();
  const dir = i18n.language === 'en' ? 'ltr' : 'rtl';

  const { data: loyaltyCards = [], isLoading: loadingCards } = useQuery<any[]>({
    queryKey: ["/api/customer/loyalty-cards"],
    enabled: !!customer,
  });

  const { data: transactions = [], isLoading: loadingTx } = useQuery<any[]>({
    queryKey: ["/api/customer/loyalty-transactions"],
    enabled: !!customer,
  });

  const { data: settings } = useQuery<any>({
    queryKey: ["/api/public/loyalty-settings"],
  });

  const card = loyaltyCards[0];
  const points = card?.points ?? 0;
  const stamps = card?.stamps ?? 0;
  const freeCupsEarned = card?.freeCupsEarned ?? 0;
  const freeCupsRedeemed = card?.freeCupsRedeemed ?? 0;
  const availableCups = Math.max(0, freeCupsEarned - freeCupsRedeemed);
  const tier = card?.tier ?? "bronze";
  const tierCfg = getTierConfig(tier, tc);
  const TierIcon = tierCfg.icon;
  const nextTier = getNextTier(tier);
  const nextTierCfg = nextTier ? getTierConfig(nextTier, tc) : null;

  const pointsValueInSar = settings?.pointsValueInSar ?? 0.05;
  const pointsForFreeDrink = settings?.pointsForFreeDrink ?? 500;
  const sarValue = (points * pointsValueInSar).toFixed(2);
  const sarValueNum = parseFloat(sarValue);
  const progressToNext = nextTierCfg
    ? Math.min(100, Math.round(((points - tierCfg.min) / (nextTierCfg.min - tierCfg.min)) * 100))
    : 100;

  // Stamps progress: 0-6 cycle
  const stampsInCycle = stamps % 6;
  const STAMPS_PER_CUP = 6;

  // Points progress toward free drink
  const pointsProgress = Math.min(100, Math.round((points / pointsForFreeDrink) * 100));
  const pointsReady = points >= pointsForFreeDrink;

  useEffect(() => {
    const qrData = card?.qrToken || card?.cardNumber;
    if (!qrData) return;
    QRCodeLib.toDataURL(qrData, {
      width: 240, margin: 2,
      color: { dark: "#1a1a1a", light: "#ffffff" }
    }).then(setQrCodeUrl).catch(console.error);
  }, [card?.qrToken, card?.cardNumber]);

  if (!customer) {
    return (
      <CustomerLayout>
        <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4 p-8" dir={dir}>
          <Coffee className="w-16 h-16 text-primary opacity-40" />
          <p className="text-lg font-bold text-center">{tc("يجب تسجيل الدخول لعرض بطاقة الولاء","Please log in to view your loyalty card")}</p>
          <Button onClick={() => setLocation("/auth")} data-testid="button-login">{tc("تسجيل الدخول","Log In")}</Button>
        </div>
      </CustomerLayout>
    );
  }

  if (loadingCards) {
    return (
      <CustomerLayout>
        <div className="flex items-center justify-center min-h-[60vh]" dir={dir}>
          <div className="flex flex-col items-center gap-3">
            <div className="w-10 h-10 border-4 border-primary border-t-transparent rounded-full animate-spin" />
            <p className="text-sm text-muted-foreground">{tc("جاري تحميل بطاقتك...","Loading your card...")}</p>
          </div>
        </div>
      </CustomerLayout>
    );
  }

  return (
    <CustomerLayout>
      <div className="container max-w-lg mx-auto px-4 py-5 pb-28 space-y-4" dir={dir}>

        {/* Header */}
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="icon" onClick={() => setLocation("/")} data-testid="button-back">
            <ChevronRight className="w-5 h-5" />
          </Button>
          <h1 className="text-xl font-black text-primary">{tc("بطاقة مكافآتي","My Rewards Card")}</h1>
        </div>

        {/* ── Main Loyalty Card ─────────────────────────────────── */}
        <div
          className={`relative rounded-3xl bg-gradient-to-br ${tierCfg.color} text-white shadow-2xl overflow-hidden`}
          data-testid="loyalty-card"
        >
          <div className="absolute -top-12 -left-12 w-40 h-40 bg-white/10 rounded-full" />
          <div className="absolute -bottom-8 -right-8 w-32 h-32 bg-white/10 rounded-full" />

          <div className="relative z-10 p-5 space-y-4">
            {/* Name + tier */}
            <div className="flex items-start justify-between">
              <div>
                <p className="text-xs opacity-70">{tc("أهلاً","Welcome")}</p>
                <p className="font-black text-xl">{customer?.name || tc("عميل","Customer")}</p>
              </div>
              <div className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full ${tierCfg.badge} bg-opacity-80`}>
                <TierIcon className="w-3.5 h-3.5" />
                <span className="text-xs font-bold">{tierCfg.label}</span>
              </div>
            </div>

            {/* Points balance */}
            <div className="text-center py-1">
              <p className="text-xs opacity-70 mb-0.5">{tc("نقاطي","My Points")}</p>
              <p className="text-5xl font-black" data-testid="text-points">{points.toLocaleString()}</p>
              <p className="text-sm opacity-80 mt-1 font-medium">
                {tc(`تساوي ${sarValue} ريال`,`= ${sarValue} SAR`)}
              </p>
            </div>

            {/* Card number + QR button */}
            <div className="flex items-center justify-between">
              <p className="font-mono text-xs opacity-70 tracking-widest" data-testid="text-card-number">
                {card?.cardNumber?.replace(/(.{4})/g,"$1 ")?.trim() || "**** **** ****"}
              </p>
              {qrCodeUrl && (
                <Button
                  size="sm"
                  variant="secondary"
                  className="bg-white/20 hover:bg-white/30 border-none text-white gap-1.5 text-xs"
                  onClick={() => setShowQr(true)}
                  data-testid="button-show-qr"
                >
                  <QrCode className="w-4 h-4" />
                  {tc("رمز QR","QR Code")}
                </Button>
              )}
            </div>
          </div>
        </div>

        {/* ── FREE CUP ALERT ─────────────────────────────────────── */}
        {availableCups > 0 && (
          <div
            className="bg-green-500/10 border-2 border-green-500 rounded-2xl p-4 flex items-center gap-4"
            data-testid="free-cup-alert"
          >
            <div className="w-14 h-14 bg-green-500 rounded-full flex items-center justify-center flex-shrink-0 text-white text-2xl">
              ☕
            </div>
            <div className="flex-1">
              <p className="font-black text-green-600 dark:text-green-400 text-lg">
                {availableCups === 1
                  ? tc("🎉 لديك مشروب مجاني!","🎉 You have a free drink!")
                  : tc(`🎉 لديك ${availableCups} مشروبات مجانية!`,`🎉 You have ${availableCups} free drinks!`)}
              </p>
              <p className="text-sm text-muted-foreground">{tc("أعرض رمز QR للكاشير لاستخدامه","Show your QR code to the cashier to redeem")}</p>
            </div>
            <Button size="sm" className="bg-green-500 hover:bg-green-600 text-white flex-shrink-0 gap-1" onClick={() => setShowQr(true)} data-testid="button-redeem-free-cup">
              <QrCode className="w-4 h-4" />
              {tc("استخدام","Redeem")}
            </Button>
          </div>
        )}

        {/* ── TWO REWARD PATHS ─────────────────────────────────────── */}
        <p className="text-sm font-bold text-muted-foreground text-center tracking-wide uppercase">
          {tc("طريقتا الاسترداد","Two Ways to Redeem")}
        </p>

        <div className="grid grid-cols-1 gap-4">

          {/* PATH 1 — Stamps */}
          <div
            className="bg-card border rounded-2xl p-5 space-y-4 relative overflow-hidden"
            data-testid="stamps-path-card"
          >
            {/* header */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-9 h-9 bg-amber-100 dark:bg-amber-900/40 rounded-xl flex items-center justify-center">
                  <Coffee className="w-5 h-5 text-amber-600" />
                </div>
                <div>
                  <p className="font-black text-base">{tc("مسار الطوابع","Stamp Path")}</p>
                  <p className="text-xs text-muted-foreground">{tc("كل 6 طوابع = مشروب مجاني","Every 6 stamps = free drink")}</p>
                </div>
              </div>
              {availableCups > 0 && (
                <Badge className="bg-green-500 text-white" data-testid="badge-free-cups">
                  {availableCups} {tc("مجاني","free")}
                </Badge>
              )}
            </div>

            {/* Stamps grid */}
            <div className="flex gap-2 justify-center">
              {Array.from({ length: STAMPS_PER_CUP }).map((_, i) => {
                const filled = i < stampsInCycle;
                return (
                  <div
                    key={i}
                    className={`w-11 h-11 rounded-full border-2 flex items-center justify-center transition-all duration-300 ${
                      filled
                        ? "bg-amber-500 border-amber-500 text-white scale-110 shadow-md shadow-amber-200 dark:shadow-amber-900"
                        : "border-dashed border-muted-foreground/30 text-muted-foreground/20"
                    }`}
                    data-testid={`stamp-${i}`}
                  >
                    <Coffee className="w-5 h-5" />
                  </div>
                );
              })}
            </div>

            {/* Status text */}
            <div className="text-center">
              {stampsInCycle === 0 && availableCups === 0 && (
                <p className="text-sm text-muted-foreground">{tc("ابدأ الجمع — طابع مع كل طلب","Start collecting — 1 stamp per order")}</p>
              )}
              {stampsInCycle > 0 && stampsInCycle < 6 && (
                <p className="text-sm font-semibold text-amber-600">
                  {tc(`${stampsInCycle} / 6 — تبقّى ${6 - stampsInCycle} للمشروب المجاني`,`${stampsInCycle} / 6 — ${6 - stampsInCycle} more until free drink`)}
                </p>
              )}
              {availableCups > 0 && (
                <p className="text-sm font-black text-green-600 dark:text-green-400">
                  {tc("✅ مشروبك المجاني جاهز! اعرض QR للكاشير","✅ Your free drink is ready! Show QR to cashier")}
                </p>
              )}
            </div>

            {/* Visual progress bar */}
            <div className="w-full bg-muted rounded-full h-2 overflow-hidden">
              <div
                className="h-full rounded-full bg-gradient-to-r from-amber-400 to-amber-600 transition-all duration-500"
                style={{ width: `${(stampsInCycle / STAMPS_PER_CUP) * 100}%` }}
              />
            </div>
          </div>

          {/* PATH 2 — Points as Cash */}
          <div
            className="bg-card border rounded-2xl p-5 space-y-4"
            data-testid="points-path-card"
          >
            {/* header */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-9 h-9 bg-violet-100 dark:bg-violet-900/40 rounded-xl flex items-center justify-center">
                  <Wallet className="w-5 h-5 text-violet-600" />
                </div>
                <div>
                  <p className="font-black text-base">{tc("مسار النقاط","Points Path")}</p>
                  <p className="text-xs text-muted-foreground">{tc("نقاطك = رصيد ريال قابل للخصم","Points = SAR discount balance")}</p>
                </div>
              </div>
              {pointsReady && (
                <Badge className="bg-violet-500 text-white gap-1" data-testid="badge-points-ready">
                  <Sparkles className="w-3 h-3" />{tc("جاهز","Ready")}
                </Badge>
              )}
            </div>

            {/* Big SAR value */}
            <div className="bg-violet-50 dark:bg-violet-950/30 rounded-xl p-4 text-center">
              <p className="text-xs text-muted-foreground mb-1">{tc("رصيد نقاطك يساوي","Your points are worth")}</p>
              <p className="text-4xl font-black text-violet-600 dark:text-violet-400" data-testid="text-sar-value">
                {sarValue} <span className="text-2xl">{tc("ريال","SAR")}</span>
              </p>
              <p className="text-xs text-muted-foreground mt-1">
                {points.toLocaleString()} {tc("نقطة","points")}
                {" × "}{pointsValueInSar} = <strong>{sarValue} {tc("ريال","SAR")}</strong>
              </p>
            </div>

            {/* Points toward free drink */}
            <div className="space-y-2">
              <div className="flex justify-between text-xs text-muted-foreground">
                <span>{tc("نحو مشروب مجاني بالنقاط","Toward free drink by points")}</span>
                <span>{points.toLocaleString()} / {pointsForFreeDrink.toLocaleString()}</span>
              </div>
              <div className="w-full bg-muted rounded-full h-2.5 overflow-hidden">
                <div
                  className={`h-full rounded-full transition-all duration-500 ${pointsReady ? "bg-green-500" : "bg-gradient-to-r from-violet-400 to-violet-600"}`}
                  style={{ width: `${pointsProgress}%` }}
                />
              </div>
              {pointsReady ? (
                <p className="text-sm font-black text-green-600 dark:text-green-400 text-center">
                  {tc("✅ يمكنك استبدال نقاطك بمشروب مجاني! أبلغ الكاشير","✅ Redeem your points for a free drink! Tell the cashier")}
                </p>
              ) : (
                <p className="text-sm text-muted-foreground text-center">
                  {tc(`تبقّى ${(pointsForFreeDrink - points).toLocaleString()} نقطة للمشروب المجاني`,`${(pointsForFreeDrink - points).toLocaleString()} more points for a free drink`)}
                </p>
              )}
            </div>

            {/* How to use */}
            <div className="bg-muted/50 rounded-xl p-3 text-xs text-muted-foreground space-y-1">
              <p className="font-semibold text-foreground text-sm">{tc("كيف أستخدم نقاطي كفلوس؟","How to use points as cash?")}</p>
              <p>• {tc("أخبر الكاشير أنك تريد خصم النقاط عند الدفع","Tell the cashier you want a points discount at checkout")}</p>
              <p>• {tc("أعرض رمز QR ليسحب النقاط تلقائياً","Show your QR code to auto-deduct points")}</p>
              <p>• {Math.round(1 / pointsValueInSar).toLocaleString()} {tc("نقطة = ريال واحد خصم","points = 1 SAR discount")}</p>
            </div>
          </div>
        </div>

        {/* ── HOW TO EARN ─────────────────────────────────────────── */}
        <div className="bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-800 rounded-2xl p-4">
          <div className="flex items-center gap-2 mb-2">
            <Gift className="w-5 h-5 text-amber-600" />
            <span className="font-bold text-amber-900 dark:text-amber-200">{tc("كيف أكسب أكثر؟","How to earn more?")}</span>
          </div>
          <div className="grid grid-cols-2 gap-2 text-xs text-amber-800 dark:text-amber-300">
            <div className="flex items-start gap-1.5">
              <CheckCircle2 className="w-3.5 h-3.5 mt-0.5 flex-shrink-0 text-amber-600" />
              <span>{settings?.pointsEarnedPerSar ?? 1} {tc("نقطة لكل ريال","pt per SAR")}</span>
            </div>
            <div className="flex items-start gap-1.5">
              <CheckCircle2 className="w-3.5 h-3.5 mt-0.5 flex-shrink-0 text-amber-600" />
              <span>{tc("طابع مع كل طلب","1 stamp per order")}</span>
            </div>
            <div className="flex items-start gap-1.5">
              <CheckCircle2 className="w-3.5 h-3.5 mt-0.5 flex-shrink-0 text-amber-600" />
              <span>{tc("6 طوابع = مشروب مجاني","6 stamps = free drink")}</span>
            </div>
            <div className="flex items-start gap-1.5">
              <CheckCircle2 className="w-3.5 h-3.5 mt-0.5 flex-shrink-0 text-amber-600" />
              <span>{Math.round(1 / pointsValueInSar).toLocaleString()} {tc("نقطة = ريال","pt = 1 SAR")}</span>
            </div>
          </div>
        </div>

        {/* ── TIER PROGRESS ───────────────────────────────────────── */}
        {nextTierCfg && (
          <div className="bg-card rounded-2xl border p-4 space-y-3" data-testid="tier-progress">
            <div className="flex items-center gap-2">
              <TrendingUp className="w-5 h-5 text-primary" />
              <span className="font-bold">{tc(`التقدم نحو ${nextTierCfg.label}`,`Progress to ${nextTierCfg.label}`)}</span>
            </div>
            <div className="w-full bg-muted rounded-full h-2.5 overflow-hidden">
              <div
                className={`h-full rounded-full bg-gradient-to-r ${tierCfg.color} transition-all`}
                style={{ width: `${progressToNext}%` }}
                data-testid="tier-progress-bar"
              />
            </div>
            <div className="flex justify-between text-xs text-muted-foreground">
              <span>{tierCfg.label}</span>
              <span>{progressToNext}%</span>
              <span>{nextTierCfg.label}</span>
            </div>
            <p className="text-xs text-muted-foreground text-center">
              {tc(
                `تحتاج ${Math.max(0, nextTierCfg.min - points).toLocaleString()} نقطة للوصول إلى ${nextTierCfg.label}`,
                `You need ${Math.max(0, nextTierCfg.min - points).toLocaleString()} more points to reach ${nextTierCfg.label}`
              )}
            </p>
          </div>
        )}

        {/* ── TRANSACTION HISTORY (collapsible) ──────────────────── */}
        <div className="bg-card rounded-2xl border" data-testid="transactions-section">
          <button
            className="w-full flex items-center justify-between p-4"
            onClick={() => setShowHistory(v => !v)}
            data-testid="button-toggle-history"
          >
            <div className="flex items-center gap-2">
              <Clock className="w-4 h-4 text-muted-foreground" />
              <span className="font-bold">{tc("آخر العمليات","Recent Transactions")}</span>
            </div>
            {showHistory ? <ChevronUp className="w-4 h-4 text-muted-foreground" /> : <ChevronDown className="w-4 h-4 text-muted-foreground" />}
          </button>

          {showHistory && (
            <div className="px-4 pb-4 space-y-2">
              {loadingTx ? (
                <p className="text-center py-6 text-muted-foreground text-sm">{tc("جاري التحميل...","Loading...")}</p>
              ) : transactions.length === 0 ? (
                <div className="text-center py-6 space-y-2">
                  <Clock className="w-10 h-10 mx-auto text-muted-foreground opacity-30" />
                  <p className="text-sm text-muted-foreground">{tc("لا توجد عمليات سابقة","No transactions yet")}</p>
                </div>
              ) : (
                transactions.slice(0, 10).map((tx: any, i: number) => {
                  const isEarn = tx.type === 'earn' || tx.type === 'transfer_in';
                  return (
                    <div
                      key={tx.id || i}
                      className="flex items-center justify-between bg-muted/50 rounded-xl px-3 py-2.5"
                      data-testid={`transaction-${i}`}
                    >
                      <div className="flex items-center gap-2.5">
                        <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                          isEarn ? "bg-green-100 text-green-600 dark:bg-green-900/30" : "bg-red-100 text-red-600 dark:bg-red-900/30"
                        }`}>
                          {isEarn ? <ArrowDownRight className="w-4 h-4" /> : <ArrowUpRight className="w-4 h-4" />}
                        </div>
                        <div>
                          <p className="text-sm font-medium">
                            {tx.descriptionAr || (isEarn ? tc("كسب نقاط","Points Earned") : tc("استرداد","Redeemed"))}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            {tx.createdAt ? new Date(tx.createdAt).toLocaleDateString(i18n.language === 'en' ? 'en-US' : "ar-SA") : ""}
                          </p>
                        </div>
                      </div>
                      {(tx.points !== undefined && tx.points !== 0) && (
                        <span className={`font-bold text-sm ${isEarn ? "text-green-600" : "text-red-600"}`}>
                          {isEarn ? "+" : "-"}{Math.abs(tx.points)}
                        </span>
                      )}
                    </div>
                  );
                })
              )}
            </div>
          )}
        </div>
      </div>

      {/* ── QR Code Dialog ──────────────────────────────────────── */}
      <Dialog open={showQr} onOpenChange={setShowQr}>
        <DialogContent className="max-w-xs text-center" dir={dir} data-testid="dialog-qr">
          <DialogHeader>
            <DialogTitle className="flex items-center justify-center gap-2">
              <QrCode className="w-5 h-5" />
              {tc("رمز بطاقتي","My Card QR")}
            </DialogTitle>
          </DialogHeader>
          <div className="flex flex-col items-center py-4 gap-4">
            <p className="text-sm text-muted-foreground">
              {tc("اعرض هذا الرمز للكاشير لكسب النقاط أو استرداد مكافأتك","Show to cashier to earn points or redeem your reward")}
            </p>
            {qrCodeUrl && (
              <div className="bg-white p-3 rounded-2xl shadow-lg">
                <img src={qrCodeUrl} alt="QR Code" className="w-52 h-52" data-testid="img-qr" />
              </div>
            )}
            {availableCups > 0 && (
              <div className="bg-green-50 dark:bg-green-950/30 border border-green-200 dark:border-green-800 rounded-xl p-3 w-full">
                <p className="font-bold text-green-700 dark:text-green-400 text-sm text-center">
                  {tc(`🎁 لديك ${availableCups} مشروب مجاني للاسترداد`,`🎁 You have ${availableCups} free drink(s) to redeem`)}
                </p>
              </div>
            )}
            {pointsReady && (
              <div className="bg-violet-50 dark:bg-violet-950/30 border border-violet-200 dark:border-violet-800 rounded-xl p-3 w-full">
                <p className="font-bold text-violet-700 dark:text-violet-400 text-sm text-center">
                  {tc(`🪙 لديك ${points.toLocaleString()} نقطة = ${sarValue} ريال`,`🪙 ${points.toLocaleString()} pts = ${sarValue} SAR`)}
                </p>
              </div>
            )}
            <p className="font-mono text-xs text-muted-foreground" data-testid="text-card-num-qr">
              {card?.cardNumber || ""}
            </p>
          </div>
          <Button variant="outline" onClick={() => setShowQr(false)} className="w-full" data-testid="button-close-qr">
            {tc("إغلاق","Close")}
          </Button>
        </DialogContent>
      </Dialog>
    </CustomerLayout>
  );
}
