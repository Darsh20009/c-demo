import { useState } from "react";
import { PlanGate } from "@/components/plan-gate";
import { useTranslate, tc } from "@/lib/useTranslate";
import { Link, useLocation } from "wouter";
import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import SarIcon from "@/components/sar-icon";
import {
  Plus,
  Minus,
  Package,
  Search,
  Loader2,
  Coffee,
  Box,
  Wrench,
  Droplet,
  HelpCircle,
  AlertTriangle,
  TrendingDown,
  DollarSign,
  PackagePlus,
  Eye,
  Layers,
  BarChart3,
  Users,
  ShoppingCart,
  ArrowRightLeft,
  Bell,
  BookOpen,
  ChevronLeft,
  ArrowLeft,
  CheckCircle2,
  TrendingUp,
  RefreshCw,
  Boxes,
  ChevronDown,
} from "lucide-react";

const categoryConfig: Record<string, { label: string; icon: any; color: string; bg: string; border: string }> = {
  ingredient: {
    label: tc("مكون أساسي", "Ingredient"),
    icon: Coffee,
    color: "text-emerald-700",
    bg: "bg-emerald-50",
    border: "border-emerald-200",
  },
  packaging: {
    label: tc("تغليف", "Packaging"),
    icon: Box,
    color: "text-blue-700",
    bg: "bg-blue-50",
    border: "border-blue-200",
  },
  equipment: {
    label: tc("معدات", "Equipment"),
    icon: Wrench,
    color: "text-orange-700",
    bg: "bg-orange-50",
    border: "border-orange-200",
  },
  consumable: {
    label: tc("مستهلكات", "Consumables"),
    icon: Droplet,
    color: "text-purple-700",
    bg: "bg-purple-50",
    border: "border-purple-200",
  },
  other: {
    label: tc("أخرى", "Other"),
    icon: HelpCircle,
    color: "text-gray-600",
    bg: "bg-gray-50",
    border: "border-gray-200",
  },
};

const unitLabels: Record<string, string> = {
  kg: "كيلو",
  g: "جرام",
  liter: "لتر",
  ml: "مل",
  piece: "قطعة",
  box: "صندوق",
  bag: "كيس",
};

interface RawItem {
  id: string;
  code: string;
  nameAr: string;
  nameEn?: string;
  description?: string;
  category: string;
  unit: string;
  unitCost: number;
  minStockLevel: number;
  maxStockLevel?: number;
  isActive: number;
}

interface BranchStock {
  id: string;
  branchId: string;
  rawItemId: string;
  currentQuantity: number;
  reservedQuantity: number;
  lastUpdated: string;
  rawItem?: RawItem;
}

interface Branch {
  id?: string;
  nameAr: string;
}

const navLinks = [
  { href: "/manager/inventory/raw-items", icon: Coffee, label: "المواد الخام", desc: "إدارة مواد التصنيع" },
  { href: "/manager/inventory/stock", icon: Boxes, label: "المخزون", desc: "مستويات المخزون" },
  { href: "/manager/inventory/recipes", icon: BookOpen, label: "الوصفات", desc: "وصفات المنتجات" },
  { href: "/manager/inventory/suppliers", icon: Users, label: "الموردين", desc: "إدارة الموردين" },
  { href: "/manager/inventory/purchases", icon: ShoppingCart, label: "المشتريات", desc: "أوامر الشراء" },
  { href: "/manager/inventory/transfers", icon: ArrowRightLeft, label: "التحويلات", desc: "تحويل بين الفروع" },
  { href: "/manager/inventory/alerts", icon: Bell, label: "التنبيهات", desc: "تنبيهات المخزون", danger: true },
];

export default function InventorySmartPage() {
  const tc = useTranslate();
  const { toast } = useToast();
  const [, setLocation] = useLocation();
  const [searchQuery, setSearchQuery] = useState("");
  const [categoryFilter, setCategoryFilter] = useState<string>("all");
  const [selectedBranch, setSelectedBranch] = useState<string>("all");
  const [isAddStockOpen, setIsAddStockOpen] = useState(false);
  const [isQuickAdjustOpen, setIsQuickAdjustOpen] = useState(false);
  const [selectedItem, setSelectedItem] = useState<RawItem | null>(null);
  const [adjustQuantity, setAdjustQuantity] = useState<number>(1);
  const [adjustType, setAdjustType] = useState<"add" | "subtract">("add");
  const [newStockData, setNewStockData] = useState({
    rawItemId: "",
    quantity: 0,
    unitCost: 0,
    notes: "",
  });

  const { data: rawItems = [], isLoading: loadingItems } = useQuery<RawItem[]>({
    queryKey: ["/api/inventory/raw-items"],
  });

  const { data: branchStocks = [], isLoading: loadingStocks, refetch: refetchStocks } = useQuery<BranchStock[]>({
    queryKey: ["/api/inventory/branch-stocks", selectedBranch],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (selectedBranch && selectedBranch !== "all") {
        params.append("branchId", selectedBranch);
      }
      const response = await fetch(`/api/inventory/branch-stocks?${params.toString()}`);
      if (!response.ok) throw new Error("Failed to fetch stocks");
      return response.json();
    },
  });

  const { data: branches = [] } = useQuery<Branch[]>({
    queryKey: ["/api/branches"],
  });

  const adjustStockMutation = useMutation({
    mutationFn: async (data: { rawItemId: string; branchId: string; quantity: number; type: "add" | "subtract"; notes?: string }) => {
      return apiRequest("POST", "/api/inventory/stock-adjustment", data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/inventory/branch-stocks"] });
      setIsQuickAdjustOpen(false);
      setAdjustQuantity(1);
      toast({ title: "✅ تم تعديل المخزون بنجاح", className: "bg-green-600 text-white" });
    },
    onError: (error: any) => {
      toast({ title: error.message || "فشل في تعديل المخزون", variant: "destructive" });
    },
  });

  const addStockBatchMutation = useMutation({
    mutationFn: async (data: typeof newStockData & { branchId: string }) => {
      return apiRequest("POST", "/api/inventory/stock-batch", data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/inventory/branch-stocks"] });
      queryClient.invalidateQueries({ queryKey: ["/api/inventory/raw-items"] });
      setIsAddStockOpen(false);
      setNewStockData({ rawItemId: "", quantity: 0, unitCost: 0, notes: "" });
      toast({ title: "✅ تمت إضافة الدفعة بنجاح", className: "bg-green-600 text-white" });
    },
    onError: (error: any) => {
      toast({ title: error.message || "فشل في إضافة الدفعة", variant: "destructive" });
    },
  });

  const getStockForItem = (itemId: string) => branchStocks.find(s => s.rawItemId === itemId);

  const getStockStatus = (item: RawItem, stock?: BranchStock) => {
    const qty = stock?.currentQuantity || 0;
    const min = item.minStockLevel || 0;
    const max = item.maxStockLevel || min * 3 || 100;
    if (qty <= 0) return { key: "out", label: "نفد المخزون", color: "bg-red-100 text-red-700 border border-red-200", barColor: "bg-red-400", alert: true };
    if (qty <= min) return { key: "low", label: "منخفض", color: "bg-amber-100 text-amber-700 border border-amber-200", barColor: "bg-amber-400", alert: true };
    if (qty >= max * 0.8) return { key: "high", label: "وفير", color: "bg-emerald-100 text-emerald-700 border border-emerald-200", barColor: "bg-emerald-500", alert: false };
    return { key: "normal", label: "طبيعي", color: "bg-blue-100 text-blue-700 border border-blue-200", barColor: "bg-blue-400", alert: false };
  };

  const getStockPercentage = (item: RawItem, stock?: BranchStock) => {
    const qty = stock?.currentQuantity || 0;
    const max = item.maxStockLevel || item.minStockLevel * 3 || 100;
    return Math.min(100, (qty / max) * 100);
  };

  const filteredItems = rawItems.filter(item => {
    const q = searchQuery.toLowerCase();
    const matchSearch = item.nameAr.toLowerCase().includes(q) || item.code.toLowerCase().includes(q) || (item.nameEn?.toLowerCase().includes(q) ?? false);
    const matchCat = categoryFilter === "all" || item.category === categoryFilter;
    return matchSearch && matchCat;
  });

  const totalItems = rawItems.length;
  const lowStockItems = rawItems.filter(item => {
    const s = getStockForItem(item.id);
    const qty = s?.currentQuantity || 0;
    return qty > 0 && qty <= item.minStockLevel;
  }).length;
  const outOfStockItems = rawItems.filter(item => (getStockForItem(item.id)?.currentQuantity || 0) <= 0).length;
  const totalCOGS = rawItems.reduce((sum, item) => sum + ((getStockForItem(item.id)?.currentQuantity || 0) * item.unitCost), 0);

  const handleQuickAdjust = (item: RawItem, type: "add" | "subtract") => {
    setSelectedItem(item);
    setAdjustType(type);
    setAdjustQuantity(1);
    setIsQuickAdjustOpen(true);
  };

  const handleAdjustSubmit = () => {
    if (!selectedItem || !selectedBranch || selectedBranch === "all") {
      toast({ title: "⚠️ يرجى اختيار فرع محدد أولاً", variant: "destructive" });
      return;
    }
    adjustStockMutation.mutate({ rawItemId: selectedItem.id, branchId: selectedBranch, quantity: adjustQuantity, type: adjustType });
  };

  if (loadingItems || loadingStocks) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center" dir="rtl">
        <div className="text-center space-y-4">
          <div className="w-16 h-16 border-4 border-green-500 border-t-transparent rounded-full animate-spin mx-auto" />
          <p className="text-gray-600 font-medium">جاري تحميل المخزون...</p>
        </div>
      </div>
    );
  }

  return (
    <PlanGate feature="inventoryManagement">
      <div className="min-h-screen bg-gray-50" dir="rtl">
        {/* Header */}
        <div className="bg-white border-b border-gray-200 sticky top-0 z-10 shadow-sm">
          <div className="max-w-7xl mx-auto px-4 py-4">
            <div className="flex items-center justify-between gap-4 flex-wrap">
              <div className="flex items-center gap-3">
                <Button variant="ghost" size="icon" onClick={() => setLocation("/manager/dashboard")} className="text-gray-600 hover:text-gray-900" data-testid="btn-back">
                  <ArrowLeft className="w-5 h-5" />
                </Button>
                <div className="p-2.5 rounded-xl bg-green-600 shadow-md shadow-green-200">
                  <Layers className="h-6 w-6 text-white" />
                </div>
                <div>
                  <h1 className="text-2xl font-bold text-gray-900">المخزون الذكي</h1>
                  <p className="text-sm text-gray-500">إدارة مبسطة وذكية للمخزون</p>
                </div>
              </div>
              <div className="flex gap-2 flex-wrap">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => refetchStocks()}
                  className="text-gray-600 border-gray-300"
                >
                  <RefreshCw className="h-4 w-4 ml-1" />
                  تحديث
                </Button>
                <Select value={selectedBranch} onValueChange={setSelectedBranch}>
                  <SelectTrigger className="w-[160px] border-gray-300 bg-white" data-testid="select-branch">
                    <SelectValue placeholder="اختر الفرع" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">🏪 جميع الفروع</SelectItem>
                    {branches.map(branch => (
                      <SelectItem key={branch.id} value={branch.id || ""}>{branch.nameAr}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Button onClick={() => setIsAddStockOpen(true)} className="bg-green-600 hover:bg-green-700 text-white shadow-sm" data-testid="button-add-stock-batch">
                  <PackagePlus className="h-4 w-4 ml-2" />
                  إضافة دفعة
                </Button>
              </div>
            </div>
          </div>
        </div>

        <div className="max-w-7xl mx-auto px-4 py-6 space-y-6">
          {/* Branch Warning */}
          {selectedBranch === "all" && (
            <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 flex items-center gap-3">
              <AlertTriangle className="h-5 w-5 text-amber-600 shrink-0" />
              <div>
                <p className="text-sm font-semibold text-amber-800">اختر فرعاً محدداً لتعديل المخزون</p>
                <p className="text-xs text-amber-600 mt-0.5">عرض "جميع الفروع" للمعاينة فقط — يجب اختيار فرع لإضافة أو خصم كميات</p>
              </div>
            </div>
          )}

          {/* Stats Cards */}
          <div className="grid gap-4 grid-cols-2 lg:grid-cols-4">
            <Card className="bg-white border-gray-200 shadow-sm hover:shadow-md transition-shadow">
              <CardContent className="p-5">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">إجمالي المواد</p>
                    <p className="text-3xl font-bold text-gray-900 mt-1" data-testid="text-total-items">{totalItems}</p>
                    <p className="text-xs text-gray-400 mt-1">صنف مخزني</p>
                  </div>
                  <div className="p-3 rounded-xl bg-blue-50">
                    <Package className="h-7 w-7 text-blue-600" />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="bg-white border-gray-200 shadow-sm hover:shadow-md transition-shadow">
              <CardContent className="p-5">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">منخفض المخزون</p>
                    <p className="text-3xl font-bold text-amber-600 mt-1" data-testid="text-low-stock">{lowStockItems}</p>
                    <p className="text-xs text-gray-400 mt-1">يحتاج إعادة طلب</p>
                  </div>
                  <div className="p-3 rounded-xl bg-amber-50">
                    <TrendingDown className="h-7 w-7 text-amber-600" />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="bg-white border-gray-200 shadow-sm hover:shadow-md transition-shadow">
              <CardContent className="p-5">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">نفد المخزون</p>
                    <p className="text-3xl font-bold text-red-600 mt-1" data-testid="text-out-stock">{outOfStockItems}</p>
                    <p className="text-xs text-gray-400 mt-1">يحتاج تعبئة فورية</p>
                  </div>
                  <div className="p-3 rounded-xl bg-red-50">
                    <AlertTriangle className="h-7 w-7 text-red-600" />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="bg-white border-gray-200 shadow-sm hover:shadow-md transition-shadow">
              <CardContent className="p-5">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">قيمة المخزون</p>
                    <p className="text-2xl font-bold text-green-700 mt-1" data-testid="text-cogs">
                      {totalCOGS.toFixed(0)} <span className="text-lg"><SarIcon /></span>
                    </p>
                    <p className="text-xs text-gray-400 mt-1">التكلفة الإجمالية</p>
                  </div>
                  <div className="p-3 rounded-xl bg-green-50">
                    <DollarSign className="h-7 w-7 text-green-600" />
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Quick Navigation */}
          <div>
            <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-3">الأقسام الفرعية</h2>
            <div className="grid gap-3 grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-7">
              {navLinks.map(({ href, icon: Icon, label, desc, danger }) => (
                <Link key={href} href={href}>
                  <Card className={`bg-white border shadow-sm hover:shadow-md transition-all duration-200 cursor-pointer group ${danger ? "border-red-100 hover:border-red-300" : "border-gray-200 hover:border-green-300"}`}>
                    <CardContent className="p-4 flex flex-col items-center gap-2 text-center">
                      <div className={`p-2.5 rounded-xl transition-transform group-hover:scale-110 ${danger ? "bg-red-50" : "bg-green-50"}`}>
                        <Icon className={`h-5 w-5 ${danger ? "text-red-600" : "text-green-600"}`} />
                      </div>
                      <p className={`font-semibold text-xs ${danger ? "text-red-700" : "text-gray-800"}`}>{label}</p>
                      <p className="text-xs text-gray-400 hidden sm:block">{desc}</p>
                    </CardContent>
                  </Card>
                </Link>
              ))}
            </div>
          </div>

          {/* Inventory Grid */}
          <Card className="bg-white border-gray-200 shadow-sm">
            <CardHeader className="border-b border-gray-100 bg-gray-50 rounded-t-xl">
              <div className="flex flex-wrap items-center gap-3">
                <div className="relative flex-1 min-w-[200px]">
                  <Search className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <Input
                    placeholder="بحث بالاسم أو الكود..."
                    value={searchQuery}
                    onChange={e => setSearchQuery(e.target.value)}
                    className="pr-10 bg-white border-gray-300 text-gray-900 placeholder:text-gray-400"
                    data-testid="input-search"
                  />
                </div>
                <div className="flex gap-2 flex-wrap">
                  {[{ key: "all", label: "الكل" }, ...Object.entries(categoryConfig).map(([k, v]) => ({ key: k, label: v.label }))].map(({ key, label }) => (
                    <button
                      key={key}
                      onClick={() => setCategoryFilter(key)}
                      className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                        categoryFilter === key
                          ? "bg-green-600 text-white shadow-sm shadow-green-200"
                          : "bg-white border border-gray-200 text-gray-600 hover:border-green-300 hover:text-green-700"
                      }`}
                    >
                      {label}
                    </button>
                  ))}
                </div>
                <span className="text-sm text-gray-500">{filteredItems.length} صنف</span>
              </div>
            </CardHeader>

            <CardContent className="p-5">
              {filteredItems.length === 0 ? (
                <div className="text-center py-16 space-y-4">
                  <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto">
                    <Package className="h-8 w-8 text-gray-400" />
                  </div>
                  <div>
                    <p className="font-semibold text-gray-700">لا توجد مواد</p>
                    <p className="text-sm text-gray-400 mt-1">أضف مواد خام جديدة للبدء أو غيّر فلتر البحث</p>
                  </div>
                  <Link href="/manager/inventory/raw-items">
                    <Button variant="outline" size="sm" className="border-green-300 text-green-700 hover:bg-green-50">
                      <Plus className="h-4 w-4 ml-1" />
                      إضافة مادة خام
                    </Button>
                  </Link>
                </div>
              ) : (
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                  {filteredItems.map(item => {
                    const catConfig = categoryConfig[item.category] || categoryConfig.other;
                    const CatIcon = catConfig.icon;
                    const stock = getStockForItem(item.id);
                    const status = getStockStatus(item, stock);
                    const pct = getStockPercentage(item, stock);
                    const qty = stock?.currentQuantity || 0;

                    return (
                      <div
                        key={item.id}
                        className="bg-white border border-gray-200 rounded-xl overflow-hidden hover:shadow-md transition-all duration-200 hover:border-green-200 group"
                        data-testid={`card-item-${item.id}`}
                      >
                        {/* Top colored strip */}
                        <div className={`h-1.5 ${status.barColor} transition-all duration-500`} />

                        <div className="p-4 space-y-3">
                          {/* Header */}
                          <div className="flex items-start justify-between">
                            <div className="flex items-center gap-2.5">
                              <div className={`p-2 rounded-lg ${catConfig.bg} ${catConfig.border} border`}>
                                <CatIcon className={`h-4 w-4 ${catConfig.color}`} />
                              </div>
                              <div>
                                <h3 className="font-bold text-gray-900 text-sm leading-tight">{item.nameAr}</h3>
                                <code className="text-xs text-gray-400 bg-gray-100 px-1.5 py-0.5 rounded mt-0.5 inline-block">
                                  {item.code}
                                </code>
                              </div>
                            </div>
                            <span className={`text-xs font-semibold px-2 py-1 rounded-lg ${status.color}`}>
                              {status.label}
                            </span>
                          </div>

                          {/* Quantity */}
                          <div className="bg-gray-50 rounded-lg p-3">
                            <div className="flex items-end justify-between mb-2">
                              <span className="text-3xl font-black text-gray-900" data-testid={`text-qty-${item.id}`}>
                                {qty < 1 && qty > 0 ? qty.toFixed(3) : qty.toFixed(1)}
                              </span>
                              <span className="text-sm text-gray-500 mb-1">{unitLabels[item.unit] || item.unit}</span>
                            </div>
                            <div className="space-y-1">
                              <div className="flex justify-between text-xs text-gray-400">
                                <span>حد أدنى: {item.minStockLevel}</span>
                                <span>{pct.toFixed(0)}%</span>
                              </div>
                              <div className="w-full bg-gray-200 rounded-full h-2 overflow-hidden">
                                <div
                                  className={`h-2 rounded-full transition-all duration-700 ${status.barColor}`}
                                  style={{ width: `${pct}%` }}
                                />
                              </div>
                            </div>
                          </div>

                          {/* Cost */}
                          <div className="flex items-center justify-between">
                            <div className="text-sm">
                              <span className="text-gray-400">التكلفة: </span>
                              <span className="font-semibold text-gray-700">{item.unitCost.toFixed(2)}</span>
                              <span className="text-gray-400 text-xs ml-1"><SarIcon /></span>
                            </div>
                            <div className="text-sm">
                              <span className="text-gray-400">الإجمالي: </span>
                              <span className="font-bold text-green-700">{(qty * item.unitCost).toFixed(0)}</span>
                              <span className="text-gray-400 text-xs ml-1"><SarIcon /></span>
                            </div>
                          </div>

                          {/* Action Buttons */}
                          <div className="flex gap-2 pt-1">
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handleQuickAdjust(item, "subtract")}
                              disabled={qty <= 0}
                              className="flex-1 border-red-200 text-red-600 hover:bg-red-50 hover:border-red-300 disabled:opacity-30"
                              data-testid={`button-minus-${item.id}`}
                            >
                              <Minus className="h-3.5 w-3.5 ml-1" />
                              خصم
                            </Button>
                            <Button
                              size="sm"
                              onClick={() => handleQuickAdjust(item, "add")}
                              className="flex-1 bg-green-600 hover:bg-green-700 text-white shadow-sm"
                              data-testid={`button-plus-${item.id}`}
                            >
                              <Plus className="h-3.5 w-3.5 ml-1" />
                              إضافة
                            </Button>
                          </div>
                        </div>

                        {/* Alert Banner */}
                        {status.alert && (
                          <div className={`px-4 py-2 flex items-center gap-2 text-xs font-medium border-t ${
                            status.key === "out" ? "bg-red-50 text-red-700 border-red-100" : "bg-amber-50 text-amber-700 border-amber-100"
                          }`}>
                            <AlertTriangle className="h-3.5 w-3.5 shrink-0" />
                            {status.key === "out" ? "نفد المخزون — يرجى إعادة التعبئة فوراً" : "المخزون منخفض — يُنصح بالطلب"}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Quick Adjust Dialog */}
        <Dialog open={isQuickAdjustOpen} onOpenChange={setIsQuickAdjustOpen}>
          <DialogContent className="max-w-md bg-white" dir="rtl">
            <DialogHeader>
              <DialogTitle className={`flex items-center gap-2 ${adjustType === "add" ? "text-green-700" : "text-red-700"}`}>
                {adjustType === "add" ? <Plus className="h-5 w-5" /> : <Minus className="h-5 w-5" />}
                {adjustType === "add" ? "إضافة كمية" : "خصم كمية"} — {selectedItem?.nameAr}
              </DialogTitle>
            </DialogHeader>
            <div className="space-y-5 py-4">
              {/* Branch requirement notice */}
              {selectedBranch === "all" ? (
                <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 text-center">
                  <AlertTriangle className="h-8 w-8 text-amber-500 mx-auto mb-2" />
                  <p className="font-semibold text-amber-800 text-sm">يرجى اختيار فرع محدد أولاً</p>
                  <p className="text-xs text-amber-600 mt-1">أغلق هذا النافذة واختر الفرع من القائمة أعلى الصفحة</p>
                </div>
              ) : (
                <>
                  <div className="bg-green-50 border border-green-200 rounded-xl px-4 py-3 flex items-center gap-2">
                    <CheckCircle2 className="h-4 w-4 text-green-600" />
                    <span className="text-sm text-green-700 font-medium">
                      الفرع المحدد: {branches.find(b => b.id === selectedBranch)?.nameAr || selectedBranch}
                    </span>
                  </div>

                  <div className="space-y-2">
                    <Label className="text-gray-700 font-semibold">الكمية ({unitLabels[selectedItem?.unit || ""] || selectedItem?.unit})</Label>
                    <div className="flex items-center gap-3">
                      <Button
                        size="icon"
                        variant="outline"
                        onClick={() => setAdjustQuantity(Math.max(0, adjustQuantity - 1))}
                        className="border-gray-300 hover:bg-gray-100"
                      >
                        <Minus className="h-4 w-4" />
                      </Button>
                      <Input
                        type="number"
                        value={adjustQuantity}
                        onChange={e => setAdjustQuantity(parseFloat(e.target.value) || 0)}
                        className="text-center text-2xl font-bold h-14 border-gray-300"
                        min={0}
                        step={0.1}
                        data-testid="input-adjust-qty"
                      />
                      <Button
                        size="icon"
                        variant="outline"
                        onClick={() => setAdjustQuantity(adjustQuantity + 1)}
                        className="border-gray-300 hover:bg-gray-100"
                      >
                        <Plus className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </>
              )}
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsQuickAdjustOpen(false)} className="border-gray-300">إلغاء</Button>
              <Button
                onClick={handleAdjustSubmit}
                disabled={adjustStockMutation.isPending || selectedBranch === "all" || adjustQuantity <= 0}
                className={adjustType === "add" ? "bg-green-600 hover:bg-green-700 text-white" : "bg-red-600 hover:bg-red-700 text-white"}
              >
                {adjustStockMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin ml-2" /> : null}
                {adjustType === "add" ? "✅ تأكيد الإضافة" : "🗑️ تأكيد الخصم"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Add Stock Batch Dialog */}
        <Dialog open={isAddStockOpen} onOpenChange={setIsAddStockOpen}>
          <DialogContent className="max-w-lg bg-white" dir="rtl">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2 text-green-700">
                <PackagePlus className="h-5 w-5" />
                إضافة دفعة مخزون جديدة
              </DialogTitle>
            </DialogHeader>
            <div className="space-y-4 py-4">
              {selectedBranch === "all" && (
                <div className="bg-amber-50 border border-amber-200 rounded-xl p-4">
                  <div className="flex items-center gap-2 mb-1">
                    <AlertTriangle className="h-4 w-4 text-amber-600" />
                    <p className="font-semibold text-amber-800 text-sm">يجب اختيار فرع محدد</p>
                  </div>
                  <p className="text-xs text-amber-600">أغلق هذا النافذة واختر الفرع من الزر أعلى الصفحة</p>
                </div>
              )}

              <div className="space-y-2">
                <Label className="text-gray-700 font-semibold">المادة الخام</Label>
                <Select
                  value={newStockData.rawItemId}
                  onValueChange={value => {
                    const item = rawItems.find(i => i.id === value);
                    setNewStockData({ ...newStockData, rawItemId: value, unitCost: item?.unitCost || 0 });
                  }}
                >
                  <SelectTrigger className="border-gray-300 bg-white" data-testid="select-raw-item">
                    <SelectValue placeholder="اختر المادة الخام..." />
                  </SelectTrigger>
                  <SelectContent>
                    {rawItems.map(item => (
                      <SelectItem key={item.id} value={item.id}>
                        <div className="flex items-center gap-2">
                          <span>{item.nameAr}</span>
                          <code className="text-xs text-gray-400">{item.code}</code>
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label className="text-gray-700 font-semibold">الكمية</Label>
                  <Input
                    type="number"
                    value={newStockData.quantity}
                    onChange={e => setNewStockData({ ...newStockData, quantity: parseFloat(e.target.value) || 0 })}
                    min={0}
                    step={0.1}
                    className="border-gray-300"
                    data-testid="input-batch-qty"
                  />
                </div>
                <div className="space-y-2">
                  <Label className="text-gray-700 font-semibold">تكلفة الوحدة</Label>
                  <Input
                    type="number"
                    value={newStockData.unitCost}
                    onChange={e => setNewStockData({ ...newStockData, unitCost: parseFloat(e.target.value) || 0 })}
                    min={0}
                    step={0.01}
                    className="border-gray-300"
                    data-testid="input-batch-cost"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label className="text-gray-700 font-semibold">ملاحظات (اختياري)</Label>
                <Input
                  value={newStockData.notes}
                  onChange={e => setNewStockData({ ...newStockData, notes: e.target.value })}
                  placeholder="سبب الإضافة أو تفاصيل أخرى..."
                  className="border-gray-300"
                  data-testid="input-batch-notes"
                />
              </div>

              {newStockData.rawItemId && newStockData.quantity > 0 && (
                <div className="bg-green-50 border border-green-200 rounded-xl p-4">
                  <div className="flex items-center justify-between">
                    <span className="text-green-700 font-medium text-sm">إجمالي التكلفة:</span>
                    <span className="text-2xl font-bold text-green-700">
                      {(newStockData.quantity * newStockData.unitCost).toFixed(2)} <SarIcon />
                    </span>
                  </div>
                  <p className="text-xs text-green-600 mt-1">
                    {newStockData.quantity} × {newStockData.unitCost.toFixed(2)} ر.س
                  </p>
                </div>
              )}
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsAddStockOpen(false)} className="border-gray-300">إلغاء</Button>
              <Button
                onClick={() => {
                  if (selectedBranch !== "all") {
                    addStockBatchMutation.mutate({ ...newStockData, branchId: selectedBranch });
                  }
                }}
                disabled={addStockBatchMutation.isPending || selectedBranch === "all" || !newStockData.rawItemId || newStockData.quantity <= 0}
                className="bg-green-600 hover:bg-green-700 text-white"
              >
                {addStockBatchMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin ml-2" /> : <PackagePlus className="h-4 w-4 ml-2" />}
                إضافة الدفعة
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </PlanGate>
  );
}
