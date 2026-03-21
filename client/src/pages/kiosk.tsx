import { useState, useEffect } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { ShoppingCart, Plus, Minus, Trash2, CheckCircle, Coffee, ChevronRight, X, Loader2 } from "lucide-react";
import qiroxLogo from "@assets/qirox-logo-customer.png";

interface MenuItem {
  _id: string;
  id: string;
  nameAr: string;
  nameEn: string;
  price: number;
  imageUrl?: string;
  category?: string;
  isAvailable?: boolean;
}

interface CartItem {
  item: MenuItem;
  quantity: number;
}

function SarIcon() {
  return <span className="font-arabic text-sm font-bold">ر.س</span>;
}

export default function KioskPage() {
  const { toast } = useToast();
  const [cart, setCart] = useState<CartItem[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string>("الكل");
  const [showCart, setShowCart] = useState(false);
  const [showCheckout, setShowCheckout] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const [orderNumber, setOrderNumber] = useState("");
  const [customerName, setCustomerName] = useState("");
  const [selectedItem, setSelectedItem] = useState<MenuItem | null>(null);
  const [idleTimer, setIdleTimer] = useState<NodeJS.Timeout | null>(null);

  const { data: menuItems = [], isLoading: menuLoading } = useQuery<MenuItem[]>({
    queryKey: ["/api/coffee-items"],
  });

  const availableItems = (menuItems as MenuItem[]).filter(i =>
    i.isAvailable !== false && (i as any).availabilityStatus !== 'out_of_stock'
  );

  const categories = ["الكل", ...Array.from(new Set(availableItems.map(i => i.category).filter((c): c is string => !!c)))];

  const filteredItems = selectedCategory === "الكل"
    ? availableItems
    : availableItems.filter(i => i.category === selectedCategory);

  const cartCount = cart.reduce((sum, c) => sum + c.quantity, 0);
  const cartTotal = cart.reduce((sum, c) => sum + c.item.price * c.quantity, 0);

  const resetIdle = () => {
    if (idleTimer) clearTimeout(idleTimer);
    const t = setTimeout(() => {
      if (!showSuccess) {
        setCart([]);
        setShowCart(false);
        setShowCheckout(false);
        setCustomerName("");
        setSelectedCategory("الكل");
      }
    }, 120000);
    setIdleTimer(t);
  };

  useEffect(() => {
    resetIdle();
    return () => { if (idleTimer) clearTimeout(idleTimer); };
  }, []);

  const addToCart = (item: MenuItem) => {
    resetIdle();
    setCart(prev => {
      const existing = prev.find(c => c.item._id === item._id);
      if (existing) return prev.map(c => c.item._id === item._id ? { ...c, quantity: c.quantity + 1 } : c);
      return [...prev, { item, quantity: 1 }];
    });
    setSelectedItem(null);
    toast({ title: "✅ تمت الإضافة", description: item.nameAr });
  };

  const removeFromCart = (id: string) => {
    resetIdle();
    setCart(prev => {
      const existing = prev.find(c => c.item._id === id);
      if (!existing || existing.quantity <= 1) return prev.filter(c => c.item._id !== id);
      return prev.map(c => c.item._id === id ? { ...c, quantity: c.quantity - 1 } : c);
    });
  };

  const placeOrderMutation = useMutation({
    mutationFn: async () => {
      const res = await apiRequest("POST", "/api/orders", {
        customerName: customerName || "زبون الكشك",
        items: cart.map(c => ({
          coffeeItemId: c.item._id || c.item.id,
          quantity: c.quantity,
          price: c.item.price,
          nameAr: c.item.nameAr,
          nameEn: c.item.nameEn,
        })),
        totalAmount: cartTotal,
        paymentMethod: "cash",
        status: "pending",
        channel: "kiosk",
        orderType: "dine-in",
        branchId: "default",
      });
      if (!res.ok) throw new Error("فشل إرسال الطلب");
      return res.json();
    },
    onSuccess: (data) => {
      setOrderNumber(data.orderNumber || data._id?.slice(-4) || "0000");
      setShowCheckout(false);
      setShowCart(false);
      setCart([]);
      setCustomerName("");
      setShowSuccess(true);
      setTimeout(() => {
        setShowSuccess(false);
        setSelectedCategory("الكل");
      }, 8000);
    },
    onError: () => toast({ variant: "destructive", title: "خطأ", description: "تعذّر إرسال الطلب. حاول مجدداً." }),
  });

  if (showSuccess) {
    return (
      <div className="h-screen bg-primary flex flex-col items-center justify-center text-white text-center p-8" data-testid="kiosk-success">
        <CheckCircle className="w-32 h-32 mb-6 animate-bounce" />
        <h1 className="text-5xl font-black mb-4">شكراً لطلبك!</h1>
        <p className="text-3xl font-bold mb-2">رقم الطلب</p>
        <div className="text-8xl font-black bg-white text-primary rounded-3xl px-10 py-6 mb-6">#{orderNumber}</div>
        <p className="text-2xl text-white/80">سنُخبرك عند جاهزية طلبك</p>
        <div className="mt-8 text-lg text-white/60">سيعود الشاشة تلقائياً خلال ثوانٍ...</div>
      </div>
    );
  }

  return (
    <div className="h-screen bg-background flex flex-col overflow-hidden" onClick={resetIdle} data-testid="kiosk-page">
      {/* Header */}
      <div className="bg-primary text-white px-6 py-3 flex items-center justify-between shrink-0 shadow-lg">
        <img src={qiroxLogo} alt="QIROX" className="h-10 object-contain brightness-0 invert" />
        <div className="text-center">
          <p className="text-lg font-bold">نظام الطلب الذاتي</p>
          <p className="text-xs text-white/70">Self-Order Kiosk</p>
        </div>
        <button
          onClick={() => setShowCart(true)}
          className="relative bg-white text-primary rounded-2xl px-5 py-2 font-bold flex items-center gap-2 text-lg hover:bg-white/90 transition-colors"
          data-testid="button-kiosk-cart"
        >
          <ShoppingCart className="w-6 h-6" />
          <span>{cartTotal.toFixed(2)} <SarIcon /></span>
          {cartCount > 0 && (
            <span className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full w-6 h-6 text-xs flex items-center justify-center font-black">
              {cartCount}
            </span>
          )}
        </button>
      </div>

      {/* Category Bar */}
      <div className="bg-card border-b px-4 py-3 flex gap-3 overflow-x-auto scrollbar-none shrink-0">
        {categories.map(cat => (
          <button
            key={cat}
            onClick={() => setSelectedCategory(cat)}
            data-testid={`button-category-${cat}`}
            className={`shrink-0 px-6 py-2 rounded-full text-base font-bold transition-all ${
              selectedCategory === cat
                ? "bg-primary text-white shadow-md"
                : "bg-muted text-muted-foreground hover:bg-muted/80"
            }`}
          >
            {cat}
          </button>
        ))}
      </div>

      {/* Menu Grid */}
      <ScrollArea className="flex-1 p-4">
        {menuLoading && (
          <div className="flex flex-col items-center justify-center h-64 gap-4">
            <Loader2 className="w-10 h-10 text-primary animate-spin" />
            <p className="text-muted-foreground font-medium">جاري تحميل القائمة...</p>
          </div>
        )}
        {!menuLoading && filteredItems.length === 0 && (
          <div className="flex flex-col items-center justify-center h-64 gap-3">
            <Coffee className="w-16 h-16 text-primary/30" />
            <p className="text-muted-foreground font-medium text-lg">لا توجد منتجات متاحة</p>
            <p className="text-muted-foreground/60 text-sm">يرجى التواصل مع الموظف</p>
          </div>
        )}
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 pb-4">
          {filteredItems.map(item => {
            const cartItem = cart.find(c => c.item._id === item._id);
            return (
              <Card
                key={item._id}
                className="overflow-hidden cursor-pointer hover:shadow-xl transition-all active:scale-95 select-none"
                onClick={() => setSelectedItem(item)}
                data-testid={`card-kiosk-item-${item._id}`}
              >
                <div className="aspect-square bg-muted relative overflow-hidden">
                  {item.imageUrl ? (
                    <img src={item.imageUrl} alt={item.nameAr} className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center bg-primary/10">
                      <Coffee className="w-16 h-16 text-primary/40" />
                    </div>
                  )}
                  {cartItem && (
                    <div className="absolute top-2 right-2 bg-primary text-white rounded-full w-8 h-8 flex items-center justify-center font-black text-sm">
                      {cartItem.quantity}
                    </div>
                  )}
                </div>
                <div className="p-3 text-center">
                  <p className="font-bold text-base leading-tight mb-1">{item.nameAr}</p>
                  <p className="text-xs text-muted-foreground mb-2">{item.nameEn}</p>
                  <Badge className="bg-primary/10 text-primary border-0 font-black text-sm">
                    {item.price.toFixed(2)} <SarIcon />
                  </Badge>
                </div>
              </Card>
            );
          })}
        </div>
      </ScrollArea>

      {/* Item Detail Modal */}
      <Dialog open={!!selectedItem} onOpenChange={() => setSelectedItem(null)}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle className="text-center text-xl">{selectedItem?.nameAr}</DialogTitle>
          </DialogHeader>
          {selectedItem && (
            <div className="text-center space-y-4">
              <div className="aspect-video rounded-xl overflow-hidden bg-muted flex items-center justify-center">
                {selectedItem.imageUrl ? (
                  <img src={selectedItem.imageUrl} alt={selectedItem.nameAr} className="w-full h-full object-cover" />
                ) : (
                  <Coffee className="w-20 h-20 text-primary/30" />
                )}
              </div>
              <p className="text-muted-foreground">{selectedItem.nameEn}</p>
              <p className="text-3xl font-black text-primary">{selectedItem.price.toFixed(2)} <SarIcon /></p>
              <Button
                size="lg"
                className="w-full text-lg py-6"
                onClick={() => addToCart(selectedItem)}
                data-testid="button-kiosk-add-to-cart"
              >
                <Plus className="w-5 h-5 mr-2" /> إضافة للطلب
              </Button>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Cart Sidebar */}
      <Dialog open={showCart} onOpenChange={setShowCart}>
        <DialogContent className="max-w-md h-[80vh] flex flex-col">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-xl">
              <ShoppingCart className="w-6 h-6 text-primary" /> طلبك ({cartCount})
            </DialogTitle>
          </DialogHeader>
          <ScrollArea className="flex-1">
            {cart.length === 0 ? (
              <div className="text-center py-16 text-muted-foreground">
                <ShoppingCart className="w-16 h-16 mx-auto mb-4 opacity-30" />
                <p className="text-lg">طلبك فارغ</p>
              </div>
            ) : (
              <div className="space-y-3 p-1">
                {cart.map(c => (
                  <div key={c.item._id} className="flex items-center gap-3 bg-muted/40 rounded-xl p-3" data-testid={`kiosk-cart-item-${c.item._id}`}>
                    <div className="flex-1">
                      <p className="font-bold">{c.item.nameAr}</p>
                      <p className="text-sm text-muted-foreground">{(c.item.price * c.quantity).toFixed(2)} <SarIcon /></p>
                    </div>
                    <div className="flex items-center gap-2">
                      <button onClick={() => removeFromCart(c.item._id)} className="w-8 h-8 rounded-full bg-muted flex items-center justify-center hover:bg-red-100">
                        {c.quantity === 1 ? <Trash2 className="w-4 h-4 text-red-500" /> : <Minus className="w-4 h-4" />}
                      </button>
                      <span className="w-6 text-center font-bold">{c.quantity}</span>
                      <button onClick={() => addToCart(c.item)} className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center hover:bg-primary/20">
                        <Plus className="w-4 h-4 text-primary" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </ScrollArea>
          {cart.length > 0 && (
            <div className="space-y-3 pt-4 border-t">
              <div className="flex justify-between font-black text-xl">
                <span>الإجمالي:</span>
                <span className="text-primary">{cartTotal.toFixed(2)} <SarIcon /></span>
              </div>
              <Button size="lg" className="w-full text-lg py-6" onClick={() => { setShowCart(false); setShowCheckout(true); }} data-testid="button-kiosk-checkout">
                متابعة الطلب <ChevronRight className="w-5 h-5 ml-1" />
              </Button>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Checkout Modal */}
      <Dialog open={showCheckout} onOpenChange={setShowCheckout}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="text-xl">تأكيد الطلب</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <label className="text-sm font-semibold text-muted-foreground block mb-1">اسمك (اختياري)</label>
              <Input
                placeholder="اكتب اسمك لمناداتك عند الجاهزية"
                value={customerName}
                onChange={e => setCustomerName(e.target.value)}
                className="text-lg py-5"
                data-testid="input-kiosk-name"
              />
            </div>
            <div className="bg-muted/50 rounded-xl p-4 space-y-2">
              {cart.map(c => (
                <div key={c.item._id} className="flex justify-between text-sm">
                  <span>{c.item.nameAr} × {c.quantity}</span>
                  <span className="font-bold">{(c.item.price * c.quantity).toFixed(2)}</span>
                </div>
              ))}
              <div className="border-t pt-2 flex justify-between font-black text-lg">
                <span>الإجمالي</span>
                <span className="text-primary">{cartTotal.toFixed(2)} <SarIcon /></span>
              </div>
            </div>
            <p className="text-sm text-muted-foreground text-center">الدفع عند الاستلام نقداً أو بطاقة</p>
            <div className="grid grid-cols-2 gap-3">
              <Button variant="outline" size="lg" onClick={() => { setShowCheckout(false); setShowCart(true); }} data-testid="button-kiosk-back">
                <X className="w-4 h-4 mr-2" /> تعديل
              </Button>
              <Button size="lg" onClick={() => placeOrderMutation.mutate()} disabled={placeOrderMutation.isPending} data-testid="button-kiosk-confirm">
                {placeOrderMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle className="w-4 h-4 mr-2" />}
                تأكيد
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
