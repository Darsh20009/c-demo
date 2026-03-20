import { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { CheckCircle, CreditCard, Lock, Shield, Wifi, ArrowLeft } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

interface SimulatedCardPaymentProps {
  amount: number;
  onSuccess: () => void;
  onCancel: () => void;
}

type CardBrand = "visa" | "mastercard" | "mada" | "amex" | "unknown";
type PayStep = "form" | "processing" | "success";

function detectCardBrand(num: string): CardBrand {
  const n = num.replace(/\s/g, "");
  if (/^4/.test(n) && (n.length < 2 || /^4(0024|0148|0168|0502|0544|0547|0553|0579|0651|0660|0685|0686|0688|0700|0707|0709|0714|1563|1564|5564|5660|5688|9989)/.test(n) || parseInt(n.substring(0,6)) >= 446200 && parseInt(n.substring(0,6)) <= 446204)) {
    return "mada";
  }
  if (/^4/.test(n)) return "visa";
  if (/^5[1-5]/.test(n) || /^2[2-7]/.test(n)) return "mastercard";
  if (/^3[47]/.test(n)) return "amex";
  return "unknown";
}

function CardBrandLogo({ brand }: { brand: CardBrand }) {
  if (brand === "visa") return (
    <div className="bg-white rounded px-2 py-1">
      <span className="text-blue-800 font-black text-sm italic tracking-tighter">VISA</span>
    </div>
  );
  if (brand === "mastercard") return (
    <div className="flex">
      <div className="w-7 h-7 rounded-full bg-red-500 opacity-90" />
      <div className="w-7 h-7 rounded-full bg-yellow-400 opacity-90 -ml-3.5" />
    </div>
  );
  if (brand === "mada") return (
    <div className="bg-white rounded px-2 py-1">
      <span className="text-green-700 font-black text-sm tracking-tight">mada</span>
    </div>
  );
  if (brand === "amex") return (
    <div className="bg-white rounded px-2 py-1">
      <span className="text-blue-600 font-black text-xs tracking-tight">AMEX</span>
    </div>
  );
  return <CreditCard className="w-8 h-8 text-white/60" />;
}

function formatCardNumber(val: string) {
  return val.replace(/\D/g, "").slice(0, 16).replace(/(.{4})/g, "$1 ").trim();
}
function formatExpiry(val: string) {
  const digits = val.replace(/\D/g, "").slice(0, 4);
  if (digits.length >= 3) return digits.slice(0, 2) + "/" + digits.slice(2);
  return digits;
}

export default function SimulatedCardPayment({ amount, onSuccess, onCancel }: SimulatedCardPaymentProps) {
  const [cardNumber, setCardNumber] = useState("");
  const [cardName, setCardName] = useState("");
  const [expiry, setExpiry] = useState("");
  const [cvv, setCvv] = useState("");
  const [isFlipped, setIsFlipped] = useState(false);
  const [step, setStep] = useState<PayStep>("form");
  const [errors, setErrors] = useState<Record<string, string>>({});
  const cvvRef = useRef<HTMLInputElement>(null);

  const brand = detectCardBrand(cardNumber);

  const cardGradient =
    brand === "mastercard"
      ? "from-[#1a1a1a] via-[#2d2d2d] to-[#111]"
      : brand === "visa"
      ? "from-[#1A1F71] via-[#2d3799] to-[#0d1255]"
      : brand === "mada"
      ? "from-[#006c35] via-[#008a45] to-[#004d26]"
      : brand === "amex"
      ? "from-[#007B5E] via-[#00A878] to-[#005a45]"
      : "from-[#1c2340] via-[#2a3460] to-[#0f1429]";

  const validate = () => {
    const e: Record<string, string> = {};
    const num = cardNumber.replace(/\s/g, "");
    if (num.length < 16) e.cardNumber = "رقم البطاقة غير مكتمل";
    if (!cardName.trim() || cardName.trim().length < 3) e.cardName = "اكتب اسمك كما هو على البطاقة";
    const [m, y] = expiry.split("/");
    const now = new Date();
    if (!m || !y || parseInt(m) < 1 || parseInt(m) > 12) { e.expiry = "تاريخ الانتهاء غير صحيح"; }
    else {
      const expYear = 2000 + parseInt(y);
      const expMonth = parseInt(m);
      if (expYear < now.getFullYear() || (expYear === now.getFullYear() && expMonth < now.getMonth() + 1)) {
        e.expiry = "البطاقة منتهية الصلاحية";
      }
    }
    if (cvv.length < 3) e.cvv = "رمز CVV غير صحيح";
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handlePay = () => {
    if (!validate()) return;
    setStep("processing");
    setTimeout(() => {
      setStep("success");
      setTimeout(() => {
        onSuccess();
      }, 1800);
    }, 2800);
  };

  const displayNumber = cardNumber || "•••• •••• •••• ••••";

  if (step === "processing") {
    return (
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="flex flex-col items-center justify-center py-12 space-y-6"
        data-testid="card-processing-screen"
      >
        <div className="relative">
          <div className="w-20 h-20 rounded-full border-4 border-primary/20 border-t-primary animate-spin" />
          <div className="absolute inset-0 flex items-center justify-center">
            <Lock className="w-8 h-8 text-primary" />
          </div>
        </div>
        <div className="text-center space-y-2">
          <p className="text-lg font-bold text-foreground">جاري معالجة الدفع...</p>
          <p className="text-sm text-muted-foreground">الرجاء الانتظار، يتم التحقق من بطاقتك</p>
        </div>
        <div className="flex items-center gap-2 text-xs text-muted-foreground bg-muted/50 rounded-full px-4 py-2">
          <Shield className="w-3.5 h-3.5 text-green-600" />
          <span>دفع آمن ومشفّر 256-bit SSL</span>
        </div>
      </motion.div>
    );
  }

  if (step === "success") {
    return (
      <motion.div
        initial={{ opacity: 0, scale: 0.8 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ type: "spring", stiffness: 200, damping: 18 }}
        className="flex flex-col items-center justify-center py-10 space-y-5"
        data-testid="card-success-screen"
      >
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ type: "spring", stiffness: 300, damping: 20, delay: 0.1 }}
          className="w-20 h-20 rounded-full bg-green-100 flex items-center justify-center"
        >
          <CheckCircle className="w-12 h-12 text-green-600" />
        </motion.div>
        <div className="text-center space-y-1">
          <p className="text-xl font-black text-foreground">تمّ الدفع بنجاح!</p>
          <p className="text-sm text-muted-foreground">
            تم خصم <span className="font-bold text-primary">{amount.toFixed(2)} ر.س</span> من بطاقتك
          </p>
        </div>
      </motion.div>
    );
  }

  return (
    <div className="space-y-5" dir="rtl" data-testid="simulated-card-payment">
      <div className="flex items-center justify-between">
        <h3 className="text-base font-bold text-foreground">بيانات البطاقة البنكية</h3>
        <div className="flex items-center gap-1.5 text-xs text-green-700 bg-green-50 border border-green-200 rounded-full px-3 py-1">
          <Shield className="w-3 h-3" />
          دفع آمن
        </div>
      </div>

      <div className="flex items-center gap-3 text-xs text-muted-foreground bg-muted/40 rounded-xl px-4 py-2.5">
        <span>البطاقات المقبولة:</span>
        <div className="flex items-center gap-2">
          <div className="bg-white border rounded px-1.5 py-0.5">
            <span className="text-green-700 font-black text-[11px]">mada</span>
          </div>
          <div className="bg-white border rounded px-1.5 py-0.5">
            <span className="text-blue-800 font-black text-[11px] italic">VISA</span>
          </div>
          <div className="flex bg-white border rounded px-1 py-0.5 gap-0.5 items-center">
            <div className="w-3.5 h-3.5 rounded-full bg-red-500" />
            <div className="w-3.5 h-3.5 rounded-full bg-yellow-400 -ml-1.5" />
          </div>
        </div>
      </div>

      <div className="relative h-44 cursor-pointer" style={{ perspective: "1000px" }} onClick={() => {}}>
        <motion.div
          className="relative w-full h-full"
          animate={{ rotateY: isFlipped ? 180 : 0 }}
          transition={{ duration: 0.6, type: "spring", stiffness: 120, damping: 18 }}
          style={{ transformStyle: "preserve-3d" }}
        >
          <div
            className={`absolute inset-0 rounded-2xl bg-gradient-to-br ${cardGradient} p-6 shadow-2xl`}
            style={{ backfaceVisibility: "hidden" }}
          >
            <div className="flex justify-between items-start">
              <Wifi className="w-6 h-6 text-white/60 rotate-90" />
              <CardBrandLogo brand={brand} />
            </div>
            <div className="mt-4">
              <div className="w-10 h-7 rounded bg-gradient-to-br from-yellow-300 to-yellow-500 opacity-80 mb-4 shadow-inner" />
              <p className="text-white font-mono text-lg tracking-[0.2em] font-bold">
                {cardNumber || "•••• •••• •••• ••••"}
              </p>
            </div>
            <div className="flex justify-between items-end mt-4">
              <div>
                <p className="text-white/50 text-[10px] uppercase tracking-wider mb-0.5">حامل البطاقة</p>
                <p className="text-white font-bold text-sm truncate max-w-[150px]">
                  {cardName || "CARDHOLDER NAME"}
                </p>
              </div>
              <div className="text-right">
                <p className="text-white/50 text-[10px] uppercase tracking-wider mb-0.5">صالحة حتى</p>
                <p className="text-white font-bold text-sm">{expiry || "MM/YY"}</p>
              </div>
            </div>
          </div>

          <div
            className={`absolute inset-0 rounded-2xl bg-gradient-to-br ${cardGradient} shadow-2xl`}
            style={{ backfaceVisibility: "hidden", transform: "rotateY(180deg)" }}
          >
            <div className="w-full h-10 bg-black/60 mt-8" />
            <div className="px-6 mt-4">
              <div className="bg-white/90 rounded-md px-3 py-2 flex items-center justify-between">
                <span className="text-xs text-gray-500 tracking-widest">•••</span>
                <span className="font-mono font-bold text-gray-800 text-sm">{cvv || "CVV"}</span>
              </div>
              <p className="text-white/50 text-[10px] text-center mt-2">رمز الأمان (CVV)</p>
            </div>
            <div className="absolute bottom-4 left-6 right-6 flex justify-between items-center">
              <p className="text-white/40 text-[10px]">QIROX Cafe — Simulated</p>
              <CardBrandLogo brand={brand} />
            </div>
          </div>
        </motion.div>
      </div>

      <div className="space-y-4">
        <div className="space-y-1.5">
          <Label className="text-sm font-medium">رقم البطاقة</Label>
          <Input
            placeholder="•••• •••• •••• ••••"
            value={cardNumber}
            onChange={(e) => setCardNumber(formatCardNumber(e.target.value))}
            maxLength={19}
            inputMode="numeric"
            className={`font-mono tracking-widest text-base ${errors.cardNumber ? "border-destructive" : ""}`}
            data-testid="input-card-number"
            dir="ltr"
          />
          {errors.cardNumber && <p className="text-xs text-destructive">{errors.cardNumber}</p>}
        </div>

        <div className="space-y-1.5">
          <Label className="text-sm font-medium">اسم حامل البطاقة</Label>
          <Input
            placeholder="كما هو مكتوب على البطاقة"
            value={cardName}
            onChange={(e) => setCardName(e.target.value.toUpperCase())}
            className={`uppercase tracking-wide ${errors.cardName ? "border-destructive" : ""}`}
            data-testid="input-card-name"
            dir="ltr"
          />
          {errors.cardName && <p className="text-xs text-destructive">{errors.cardName}</p>}
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-1.5">
            <Label className="text-sm font-medium">تاريخ الانتهاء</Label>
            <Input
              placeholder="MM/YY"
              value={expiry}
              onChange={(e) => setExpiry(formatExpiry(e.target.value))}
              maxLength={5}
              inputMode="numeric"
              className={`font-mono ${errors.expiry ? "border-destructive" : ""}`}
              data-testid="input-card-expiry"
              dir="ltr"
            />
            {errors.expiry && <p className="text-xs text-destructive">{errors.expiry}</p>}
          </div>
          <div className="space-y-1.5">
            <Label className="text-sm font-medium">رمز CVV</Label>
            <Input
              ref={cvvRef}
              placeholder="•••"
              value={cvv}
              onChange={(e) => setCvv(e.target.value.replace(/\D/g, "").slice(0, 4))}
              maxLength={4}
              inputMode="numeric"
              type="password"
              className={`font-mono ${errors.cvv ? "border-destructive" : ""}`}
              data-testid="input-card-cvv"
              dir="ltr"
              onFocus={() => setIsFlipped(true)}
              onBlur={() => setIsFlipped(false)}
            />
            {errors.cvv && <p className="text-xs text-destructive">{errors.cvv}</p>}
          </div>
        </div>
      </div>

      <div className="bg-primary/5 border border-primary/20 rounded-xl p-3 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Lock className="w-4 h-4 text-primary" />
          <span className="text-sm text-foreground font-medium">إجمالي الدفع</span>
        </div>
        <span className="text-lg font-black text-primary">{amount.toFixed(2)} ر.س</span>
      </div>

      <div className="space-y-2">
        <Button
          onClick={handlePay}
          className="w-full h-12 text-base font-bold"
          data-testid="button-pay-card"
        >
          <Lock className="w-4 h-4 ml-2" />
          ادفع الآن — {amount.toFixed(2)} ر.س
        </Button>
        <Button
          variant="ghost"
          className="w-full text-muted-foreground text-sm"
          onClick={onCancel}
          data-testid="button-cancel-card-payment"
        >
          <ArrowLeft className="w-4 h-4 ml-1" />
          العودة
        </Button>
      </div>

      <p className="text-center text-[11px] text-muted-foreground flex items-center justify-center gap-1">
        <Shield className="w-3 h-3 text-green-600" />
        هذه بيئة محاكاة آمنة — لن يتم خصم أي مبلغ حقيقي
      </p>
    </div>
  );
}
