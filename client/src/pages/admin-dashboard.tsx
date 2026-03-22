import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useQuery } from '@tanstack/react-query';
import { useLocation } from 'wouter';
import {
  Users, TrendingUp, DollarSign, Calendar, Activity, Settings, Clock,
  ShoppingBag, AlertCircle, CheckCircle2, Sparkles, ArrowUpRight,
  ArrowDownRight, BarChart3, Package, Zap, Target, Brain,
  ChefHat, Banknote, Star, ArrowRight, RefreshCw
} from 'lucide-react';
import {
  AreaChart, Area, BarChart, Bar, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend
} from "recharts";
import SarIcon from "@/components/sar-icon";
import { useTranslate } from "@/lib/useTranslate";
import { ManagerSidebar, MobileBottomNav } from "@/components/manager-sidebar";
import { apiRequest } from "@/lib/queryClient";

const COLORS = ["#2D9B6E", "#3b82f6", "#f59e0b", "#ec4899", "#8b5cf6", "#06b6d4"];

export default function AdminDashboard() {
  const [, navigate] = useLocation();
  const tc = useTranslate();
  const [manager, setManager] = useState<any>(null);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [aiInsights, setAiInsights] = useState<string[]>([]);
  const [loadingInsights, setLoadingInsights] = useState(false);

  useEffect(() => {
    document.title = "لوحة تحكم الإدارة - QIROX Cafe";
    const stored = localStorage.getItem("currentEmployee");
    if (stored) {
      try { setManager(JSON.parse(stored)); } catch {}
    }
  }, []);

  const { data: employees = [] } = useQuery<any[]>({ queryKey: ['/api/employees'] });
  const { data: orders = [] } = useQuery<any[]>({ queryKey: ['/api/orders'] });
  const { data: attendance = [], } = useQuery<any[]>({ queryKey: ['/api/attendance'], retry: false });
  const { data: leaveRequests = [] } = useQuery<any[]>({ queryKey: ['/api/leave-requests'], retry: false });
  const { data: businessConfig } = useQuery<any>({ queryKey: ['/api/business-config'] });

  const handleLogout = () => {
    localStorage.removeItem("currentEmployee");
    navigate("/manager/login");
  };

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const todayOrders = orders.filter((o: any) => {
    const d = o.createdAt ? new Date(o.createdAt) : null;
    return d && d >= today;
  });

  const yesterdayStart = new Date(today);
  yesterdayStart.setDate(yesterdayStart.getDate() - 1);
  const yesterdayOrders = orders.filter((o: any) => {
    const d = o.createdAt ? new Date(o.createdAt) : null;
    return d && d >= yesterdayStart && d < today;
  });

  const totalRevenue = orders.reduce((s: number, o: any) => s + Number(o.totalAmount || 0), 0);
  const todayRevenue = todayOrders.reduce((s: number, o: any) => s + Number(o.totalAmount || 0), 0);
  const yesterdayRevenue = yesterdayOrders.reduce((s: number, o: any) => s + Number(o.totalAmount || 0), 0);
  const avgOrderValue = orders.length > 0 ? totalRevenue / orders.length : 0;
  const activeEmployees = employees.filter((e: any) => e.isActivated === 1).length;

  const revenueGrowth = yesterdayRevenue > 0
    ? ((todayRevenue - yesterdayRevenue) / yesterdayRevenue * 100).toFixed(1)
    : "0";

  const presentToday = Array.isArray(attendance)
    ? attendance.filter((a: any) => {
        const d = a.checkIn ? new Date(a.checkIn) : null;
        return d && d >= today;
      }).length
    : 0;

  const onLeave = Array.isArray(leaveRequests)
    ? leaveRequests.filter((lr: any) => {
        if (lr.status !== 'approved') return false;
        const start = lr.startDate ? new Date(lr.startDate) : null;
        const end = lr.endDate ? new Date(lr.endDate) : null;
        const now = new Date();
        return start && end && start <= now && end >= now;
      }).length
    : 0;

  const last7DaysRevenue = Array.from({ length: 7 }, (_, i) => {
    const d = new Date(today);
    d.setDate(d.getDate() - (6 - i));
    const nextD = new Date(d);
    nextD.setDate(nextD.getDate() + 1);
    const dayOrders = orders.filter((o: any) => {
      const od = o.createdAt ? new Date(o.createdAt) : null;
      return od && od >= d && od < nextD;
    });
    return {
      day: d.toLocaleDateString('ar-SA', { weekday: 'short' }),
      revenue: dayOrders.reduce((s: number, o: any) => s + Number(o.totalAmount || 0), 0),
      orders: dayOrders.length,
    };
  });

  const ordersByStatus = [
    { name: tc("مكتمل", "Completed"), value: orders.filter((o: any) => o.status === 'completed').length },
    { name: tc("قيد التحضير", "Preparing"), value: orders.filter((o: any) => o.status === 'preparing').length },
    { name: tc("معلق", "Pending"), value: orders.filter((o: any) => o.status === 'pending').length },
    { name: tc("ملغى", "Cancelled"), value: orders.filter((o: any) => o.status === 'cancelled').length },
  ].filter(s => s.value > 0);

  const employeePerformance = employees
    .filter((e: any) => e.isActivated === 1)
    .slice(0, 5)
    .map((emp: any) => {
      const empOrders = orders.filter((o: any) => o.employeeId === emp.id);
      return {
        name: emp.fullName?.split(' ')[0] || '—',
        orders: empOrders.length,
        revenue: empOrders.reduce((s: number, o: any) => s + Number(o.totalAmount || 0), 0),
      };
    })
    .sort((a, b) => b.revenue - a.revenue);

  const fetchInsights = async () => {
    setLoadingInsights(true);
    try {
      const res = await apiRequest("GET", "/api/ai/insights");
      const data = await res.json();
      if (Array.isArray(data.insights)) {
        setAiInsights(data.insights.map((i: any) => i.text || i.content || String(i)));
      }
    } catch {
      setAiInsights([tc("لا تتوفر رؤى في الوقت الحالي. تأكد من إعداد مفتاح الذكاء الاصطناعي.", "No insights available. Please ensure AI key is configured.")]);
    } finally {
      setLoadingInsights(false);
    }
  };

  useEffect(() => { fetchInsights(); }, []);

  const KpiCard = ({ label, value, sub, icon: Icon, trend, color, onClick }: any) => (
    <Card
      className="border border-border/50 bg-card hover:shadow-lg transition-all cursor-pointer group"
      onClick={onClick}
      data-testid={`card-kpi-${label}`}
    >
      <CardContent className="p-5">
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <p className="text-xs text-muted-foreground font-medium uppercase tracking-wide">{label}</p>
            <p className="text-2xl font-bold text-foreground mt-1">{value}</p>
            {sub && <p className="text-xs text-muted-foreground mt-1">{sub}</p>}
          </div>
          <div className="p-2.5 rounded-xl flex-shrink-0" style={{ background: `${color}20` }}>
            <Icon className="w-5 h-5" style={{ color }} />
          </div>
        </div>
        {trend !== undefined && (
          <div className={`flex items-center gap-1 mt-3 text-xs font-medium ${Number(trend) >= 0 ? 'text-emerald-600' : 'text-red-500'}`}>
            {Number(trend) >= 0 ? <ArrowUpRight className="w-3 h-3" /> : <ArrowDownRight className="w-3 h-3" />}
            <span>{Math.abs(Number(trend))}% {tc("مقارنة بالأمس", "vs yesterday")}</span>
          </div>
        )}
      </CardContent>
    </Card>
  );

  return (
    <div className="flex h-screen overflow-hidden bg-[#070707]" dir="rtl" style={{ fontFamily: "'Cairo', sans-serif" }}>
      <ManagerSidebar
        manager={manager}
        onLogout={handleLogout}
        mobileOpen={mobileMenuOpen}
        onMobileClose={() => setMobileMenuOpen(false)}
        role={manager?.role}
      />

      <div className="flex-1 flex flex-col overflow-hidden min-w-0">
        <header className="flex-shrink-0 bg-[#0a0a0a] border-b border-[#1a1a1a] px-4 lg:px-6 py-3 flex items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <button
              className="lg:hidden w-9 h-9 flex items-center justify-center rounded-xl bg-[#1a1a1a] text-[#888] hover:text-white"
              onClick={() => setMobileMenuOpen(true)}
            >
              <BarChart3 className="w-4 h-4" />
            </button>
            <div>
              <h1 className="text-base font-bold text-white">{tc("لوحة التحكم", "Dashboard")}</h1>
              <p className="text-xs text-[#555]">{tc("نظرة شاملة على أداء الكافيه", "Complete cafe performance overview")}</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Badge className="bg-[#2D9B6E]/20 text-[#2D9B6E] border-[#2D9B6E]/30 text-xs font-medium">
              {businessConfig?.businessName || "QIROX Cafe"}
            </Badge>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => navigate('/admin/settings')}
              className="text-[#888] hover:text-white"
            >
              <Settings className="w-4 h-4" />
            </Button>
          </div>
        </header>

        <div className="flex-1 overflow-y-auto px-4 lg:px-6 py-5 space-y-5 pb-20 lg:pb-5">

          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
            <KpiCard
              label={tc("إيرادات اليوم", "Today's Revenue")}
              value={<span className="flex items-center gap-1">{todayRevenue.toFixed(0)} <SarIcon /></span>}
              sub={`${todayOrders.length} ${tc("طلب", "orders")}`}
              icon={DollarSign}
              trend={revenueGrowth}
              color="#2D9B6E"
              onClick={() => navigate('/admin/reports')}
            />
            <KpiCard
              label={tc("إجمالي الموظفين", "Total Employees")}
              value={employees.length}
              sub={`${activeEmployees} ${tc("نشط", "active")}`}
              icon={Users}
              color="#3b82f6"
              onClick={() => navigate('/admin/employees')}
            />
            <KpiCard
              label={tc("الحضور اليوم", "Present Today")}
              value={presentToday}
              sub={`${tc("من", "of")} ${activeEmployees}`}
              icon={CheckCircle2}
              color="#f59e0b"
              onClick={() => navigate('/manager/attendance')}
            />
            <KpiCard
              label={tc("متوسط الطلب", "Avg Order")}
              value={<span className="flex items-center gap-1">{avgOrderValue.toFixed(1)} <SarIcon /></span>}
              sub={`${orders.length} ${tc("طلب إجمالاً", "total orders")}`}
              icon={Target}
              color="#8b5cf6"
              onClick={() => navigate('/admin/reports')}
            />
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
            <Card className="lg:col-span-2 bg-[#0a0a0a] border-[#1a1a1a]">
              <CardHeader className="pb-2 px-4 pt-4">
                <CardTitle className="text-sm text-white flex items-center gap-2">
                  <TrendingUp className="w-4 h-4 text-[#2D9B6E]" />
                  {tc("الإيرادات - آخر 7 أيام", "Revenue - Last 7 Days")}
                </CardTitle>
              </CardHeader>
              <CardContent className="px-2 pb-4">
                <ResponsiveContainer width="100%" height={180}>
                  <AreaChart data={last7DaysRevenue}>
                    <defs>
                      <linearGradient id="revGrad" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#2D9B6E" stopOpacity={0.3} />
                        <stop offset="95%" stopColor="#2D9B6E" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="#1a1a1a" />
                    <XAxis dataKey="day" tick={{ fontSize: 10, fill: '#555' }} />
                    <YAxis tick={{ fontSize: 10, fill: '#555' }} />
                    <Tooltip
                      contentStyle={{ background: '#111', border: '1px solid #222', borderRadius: '8px', color: '#fff', fontSize: 12 }}
                      formatter={(v: any) => [`${v} ر.س`, tc("إيراد", "Revenue")]}
                    />
                    <Area type="monotone" dataKey="revenue" stroke="#2D9B6E" strokeWidth={2} fill="url(#revGrad)" />
                  </AreaChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            <Card className="bg-[#0a0a0a] border-[#1a1a1a]">
              <CardHeader className="pb-2 px-4 pt-4">
                <CardTitle className="text-sm text-white flex items-center gap-2">
                  <Activity className="w-4 h-4 text-[#3b82f6]" />
                  {tc("حالة الطلبات", "Order Status")}
                </CardTitle>
              </CardHeader>
              <CardContent className="flex flex-col items-center pb-4">
                {ordersByStatus.length > 0 ? (
                  <>
                    <ResponsiveContainer width="100%" height={130}>
                      <PieChart>
                        <Pie data={ordersByStatus} cx="50%" cy="50%" innerRadius={35} outerRadius={55} dataKey="value" paddingAngle={3}>
                          {ordersByStatus.map((_, i) => (
                            <Cell key={i} fill={COLORS[i % COLORS.length]} />
                          ))}
                        </Pie>
                        <Tooltip contentStyle={{ background: '#111', border: '1px solid #222', borderRadius: '8px', color: '#fff', fontSize: 11 }} />
                      </PieChart>
                    </ResponsiveContainer>
                    <div className="grid grid-cols-2 gap-1 w-full mt-1">
                      {ordersByStatus.map((s, i) => (
                        <div key={i} className="flex items-center gap-1.5 text-xs">
                          <div className="w-2 h-2 rounded-full flex-shrink-0" style={{ background: COLORS[i % COLORS.length] }} />
                          <span className="text-[#888] truncate">{s.name}</span>
                          <span className="text-white font-bold ml-auto">{s.value}</span>
                        </div>
                      ))}
                    </div>
                  </>
                ) : (
                  <div className="flex flex-col items-center justify-center h-32 text-[#444]">
                    <ShoppingBag className="w-8 h-8 mb-2" />
                    <p className="text-xs">{tc("لا توجد طلبات", "No orders yet")}</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
            <Card className="lg:col-span-2 bg-[#0a0a0a] border-[#1a1a1a]">
              <CardHeader className="pb-2 px-4 pt-4">
                <CardTitle className="text-sm text-white flex items-center gap-2">
                  <ChefHat className="w-4 h-4 text-[#ec4899]" />
                  {tc("أداء الموظفين", "Employee Performance")}
                </CardTitle>
              </CardHeader>
              <CardContent className="px-2 pb-4">
                {employeePerformance.length > 0 ? (
                  <ResponsiveContainer width="100%" height={160}>
                    <BarChart data={employeePerformance}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#1a1a1a" />
                      <XAxis dataKey="name" tick={{ fontSize: 10, fill: '#555' }} />
                      <YAxis tick={{ fontSize: 10, fill: '#555' }} />
                      <Tooltip
                        contentStyle={{ background: '#111', border: '1px solid #222', borderRadius: '8px', color: '#fff', fontSize: 11 }}
                        formatter={(v: any) => [`${v} ر.س`, tc("إيراد", "Revenue")]}
                      />
                      <Bar dataKey="revenue" fill="#ec4899" radius={[4, 4, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="flex flex-col items-center justify-center h-32 text-[#444]">
                    <Users className="w-8 h-8 mb-2" />
                    <p className="text-xs">{tc("لا يوجد بيانات موظفين", "No employee data")}</p>
                  </div>
                )}
              </CardContent>
            </Card>

            <Card className="bg-gradient-to-br from-[#0d0a1a] to-[#0a0a0a] border-[#2d1a4a]">
              <CardHeader className="pb-2 px-4 pt-4">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-sm text-white flex items-center gap-2">
                    <Sparkles className="w-4 h-4 text-[#a855f7]" />
                    {tc("رؤى الذكاء الاصطناعي", "AI Insights")}
                  </CardTitle>
                  <button
                    onClick={fetchInsights}
                    disabled={loadingInsights}
                    className="text-[#666] hover:text-[#a855f7] transition-colors"
                  >
                    <RefreshCw className={`w-3.5 h-3.5 ${loadingInsights ? 'animate-spin' : ''}`} />
                  </button>
                </div>
              </CardHeader>
              <CardContent className="px-4 pb-4 space-y-2.5">
                {loadingInsights ? (
                  <div className="flex items-center gap-2 text-[#666] text-xs">
                    <Brain className="w-4 h-4 animate-pulse text-[#a855f7]" />
                    <span>{tc("جارٍ تحليل البيانات...", "Analyzing data...")}</span>
                  </div>
                ) : aiInsights.length > 0 ? (
                  aiInsights.slice(0, 3).map((insight, i) => (
                    <div key={i} className="flex gap-2 p-2.5 rounded-lg bg-[#1a0a2a] border border-[#2d1a4a]">
                      <Zap className="w-3.5 h-3.5 text-[#a855f7] flex-shrink-0 mt-0.5" />
                      <p className="text-xs text-[#ccc] leading-relaxed">{insight}</p>
                    </div>
                  ))
                ) : (
                  <div className="text-center py-4 text-[#444]">
                    <Brain className="w-8 h-8 mx-auto mb-2 opacity-50" />
                    <p className="text-xs">{tc("لا توجد رؤى", "No insights available")}</p>
                  </div>
                )}
                <Button
                  size="sm"
                  className="w-full mt-1 bg-[#a855f7]/20 hover:bg-[#a855f7]/30 text-[#a855f7] border border-[#a855f7]/30 text-xs h-8"
                  onClick={() => navigate('/manager/ai')}
                >
                  <Brain className="w-3.5 h-3.5 ml-1" />
                  {tc("فتح مركز الذكاء الاصطناعي", "Open AI Center")}
                  <ArrowRight className="w-3.5 h-3.5 mr-1" />
                </Button>
              </CardContent>
            </Card>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <Card className="bg-[#0a0a0a] border-[#1a1a1a]">
              <CardHeader className="pb-2 px-4 pt-4">
                <CardTitle className="text-sm text-white">{tc("روابط سريعة", "Quick Links")}</CardTitle>
              </CardHeader>
              <CardContent className="px-4 pb-4">
                <div className="grid grid-cols-2 gap-2">
                  {[
                    { label: tc("الموظفون", "Employees"), icon: Users, path: "/admin/employees", color: "#3b82f6" },
                    { label: tc("التقارير", "Reports"), icon: BarChart3, path: "/admin/reports", color: "#2D9B6E" },
                    { label: tc("الحضور", "Attendance"), icon: Clock, path: "/manager/attendance", color: "#f59e0b" },
                    { label: tc("الإعدادات", "Settings"), icon: Settings, path: "/admin/settings", color: "#8b5cf6" },
                    { label: tc("المخزون", "Inventory"), icon: Package, path: "/manager/inventory", color: "#ec4899" },
                    { label: tc("الذكاء الاصطناعي", "AI Center"), icon: Sparkles, path: "/manager/ai", color: "#a855f7" },
                  ].map(item => (
                    <button
                      key={item.path}
                      onClick={() => navigate(item.path)}
                      className="flex items-center gap-2.5 p-3 rounded-xl bg-[#111] hover:bg-[#1a1a1a] border border-[#1a1a1a] hover:border-[#2a2a2a] transition-all text-right"
                    >
                      <div className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0" style={{ background: `${item.color}20` }}>
                        <item.icon className="w-4 h-4" style={{ color: item.color }} />
                      </div>
                      <span className="text-xs text-[#aaa] font-medium">{item.label}</span>
                    </button>
                  ))}
                </div>
              </CardContent>
            </Card>

            <Card className="bg-[#0a0a0a] border-[#1a1a1a]">
              <CardHeader className="pb-2 px-4 pt-4">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-sm text-white flex items-center gap-2">
                    <Users className="w-4 h-4 text-[#ec4899]" />
                    {tc("آخر الموظفين", "Recent Employees")}
                  </CardTitle>
                  <button onClick={() => navigate('/admin/employees')} className="text-xs text-[#2D9B6E] hover:underline">
                    {tc("عرض الكل", "View All")}
                  </button>
                </div>
              </CardHeader>
              <CardContent className="px-4 pb-4 space-y-2">
                {employees.slice(0, 4).map((emp: any) => (
                  <div key={emp.id} className="flex items-center gap-3 p-2.5 rounded-lg bg-[#111] border border-[#1a1a1a]">
                    <div className="w-8 h-8 rounded-full bg-[#2D9B6E]/20 flex items-center justify-center flex-shrink-0">
                      <span className="text-xs text-[#2D9B6E] font-bold">{(emp.fullName || '?')[0]}</span>
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs text-white font-medium truncate">{emp.fullName}</p>
                      <p className="text-[10px] text-[#555] truncate">{emp.jobTitle || emp.role}</p>
                    </div>
                    <span className={`text-[10px] px-1.5 py-0.5 rounded-full ${emp.isActivated === 1 ? 'bg-emerald-500/20 text-emerald-400' : 'bg-[#222] text-[#555]'}`}>
                      {emp.isActivated === 1 ? tc("نشط", "Active") : tc("معطل", "Inactive")}
                    </span>
                  </div>
                ))}
                {employees.length === 0 && (
                  <div className="text-center py-6 text-[#444]">
                    <Users className="w-8 h-8 mx-auto mb-2 opacity-50" />
                    <p className="text-xs">{tc("لا يوجد موظفون بعد", "No employees yet")}</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>

        <MobileBottomNav manager={manager} />
      </div>
    </div>
  );
}
