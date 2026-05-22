import React, { useState, useMemo } from "react";
import {
  TrendingUp,
  TrendingDown,
  DollarSign,
  ShoppingBag,
  Percent,
  Users,
  Clock,
  PieChart,
  Award,
  AlertTriangle,
  Calendar,
  Layers
} from "lucide-react";

interface Product {
  id: string;
  outlet_id: string;
  category_id: string | null;
  name: string;
  price: number;
  description: string;
  image_url: string;
  is_recommended: boolean;
  is_available: boolean;
}

interface Category {
  id: string;
  outlet_id: string;
  name: string;
}

interface OrderItem {
  id: string;
  order_id: string;
  product_id: string;
  quantity: number;
  unit_price: number;
  total_price: number;
  product?: Product;
  modifiers?: {
    modifier_name: string;
    option_name: string;
    price_adjustment: number;
  }[];
}

interface Order {
  id: string;
  outlet_id: string;
  order_code: string;
  order_type: string;
  table_number: string | null;
  customer_name: string;
  customer_phone: string;
  status: string;
  payment_method: string;
  payment_status: string;
  total_amount: number;
  created_at: string;
  items?: OrderItem[];
}

interface WorkspaceReportsTabProps {
  orders: Order[];
  products?: Product[];
  categories?: Category[];
}

const fmt = (n: number) => `Rp ${Number(n).toLocaleString("id-ID")}`;

const fmtShort = (n: number) => {
  if (n >= 1_000_000) {
    return `Rp ${(n / 1_000_000).toFixed(1).replace(/\.0$/, "")}jt`;
  }
  if (n >= 1_000) {
    return `Rp ${(n / 1_000).toFixed(0)}rb`;
  }
  return `Rp ${n}`;
};

const calcPctChange = (curr: number, prev: number) => {
  if (prev === 0) {
    return curr > 0 ? 100 : 0;
  }
  return ((curr - prev) / prev) * 100;
};

export default function WorkspaceReportsTab({
  orders,
  products = [],
  categories = [],
}: WorkspaceReportsTabProps) {
  const [dateRange, setDateRange] = useState<"today" | "7days" | "30days" | "all">("7days");
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);

  // ─── Filter & Period Calculations ───
  const { startOfToday, startOfYesterday, startOf7DaysAgo, startOf14DaysAgo, startOf30DaysAgo, startOf60DaysAgo } = useMemo(() => {
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
    return {
      startOfToday: today,
      startOfYesterday: today - 24 * 60 * 60 * 1000,
      startOf7DaysAgo: today - 6 * 24 * 60 * 60 * 1000,
      startOf14DaysAgo: today - 13 * 24 * 60 * 60 * 1000,
      startOf30DaysAgo: today - 29 * 24 * 60 * 60 * 1000,
      startOf60DaysAgo: today - 59 * 24 * 60 * 60 * 1000,
    };
  }, []);

  const currentOrders = useMemo(() => {
    return orders.filter((o) => {
      const t = new Date(o.created_at).getTime();
      if (dateRange === "today") return t >= startOfToday;
      if (dateRange === "7days") return t >= startOf7DaysAgo;
      if (dateRange === "30days") return t >= startOf30DaysAgo;
      return true; // all
    });
  }, [orders, dateRange, startOfToday, startOf7DaysAgo, startOf30DaysAgo]);

  const prevOrders = useMemo(() => {
    return orders.filter((o) => {
      const t = new Date(o.created_at).getTime();
      if (dateRange === "today") return t >= startOfYesterday && t < startOfToday;
      if (dateRange === "7days") return t >= startOf14DaysAgo && t < startOf7DaysAgo;
      if (dateRange === "30days") return t >= startOf60DaysAgo && t < startOf30DaysAgo;
      return false; // No comparison for "all"
    });
  }, [orders, dateRange, startOfYesterday, startOfToday, startOf14DaysAgo, startOf7DaysAgo, startOf60DaysAgo, startOf30DaysAgo]);

  // ─── KPI Calculations ───
  const kpis = useMemo(() => {
    const completedCurrent = currentOrders.filter((o) => o.status === "completed");
    const completedPrev = prevOrders.filter((o) => o.status === "completed");

    // Revenue
    const currRev = completedCurrent.reduce((sum, o) => sum + o.total_amount, 0);
    const prevRev = completedPrev.reduce((sum, o) => sum + o.total_amount, 0);

    // Orders count
    const currCount = completedCurrent.length;
    const prevCount = completedPrev.length;

    // AOV
    const currAOV = currCount > 0 ? currRev / currCount : 0;
    const prevAOV = prevCount > 0 ? prevRev / prevCount : 0;

    // Unique customers
    const getCustKey = (o: Order) => (o.customer_phone || o.customer_name || o.id).trim().toLowerCase();
    const currCust = new Set(completedCurrent.map(getCustKey)).size;
    const prevCust = new Set(completedPrev.map(getCustKey)).size;

    return {
      revenue: { curr: currRev, prev: prevRev, pct: calcPctChange(currRev, prevRev) },
      orders: { curr: currCount, prev: prevCount, pct: calcPctChange(currCount, prevCount) },
      aov: { curr: currAOV, prev: prevAOV, pct: calcPctChange(currAOV, prevAOV) },
      customers: { curr: currCust, prev: prevCust, pct: calcPctChange(currCust, prevCust) },
    };
  }, [currentOrders, prevOrders]);

  // ─── Range Text Helper ───
  const rangeText = useMemo(() => {
    const options: Intl.DateTimeFormatOptions = { day: "numeric", month: "short", year: "numeric" };
    if (dateRange === "today") {
      return new Date().toLocaleDateString("id-ID", options);
    }
    if (dateRange === "7days") {
      const start = new Date(startOf7DaysAgo).toLocaleDateString("id-ID", { day: "numeric", month: "short" });
      const end = new Date().toLocaleDateString("id-ID", options);
      return `${start} - ${end}`;
    }
    if (dateRange === "30days") {
      const start = new Date(startOf30DaysAgo).toLocaleDateString("id-ID", { day: "numeric", month: "short" });
      const end = new Date().toLocaleDateString("id-ID", options);
      return `${start} - ${end}`;
    }
    if (orders.length === 0) return "Tidak ada data";
    const earliest = new Date(orders[orders.length - 1].created_at).toLocaleDateString("id-ID", { day: "numeric", month: "short" });
    const latest = new Date(orders[0].created_at).toLocaleDateString("id-ID", options);
    return `${earliest} - ${latest}`;
  }, [dateRange, orders, startOf7DaysAgo, startOf30DaysAgo]);

  // ─── Sales Trend Chart Data ───
  const chartData = useMemo(() => {
    const completed = currentOrders.filter((o) => o.status === "completed");

    if (dateRange === "today") {
      // Group by Hour (dynamic range based on orders, or default 08-22)
      const hourlyMap: Record<number, number> = {};
      completed.forEach((o) => {
        const hour = new Date(o.created_at).getHours();
        hourlyMap[hour] = (hourlyMap[hour] || 0) + o.total_amount;
      });

      const hours = Object.keys(hourlyMap).map(Number);
      const minHour = hours.length > 0 ? Math.min(...hours) : 8;
      const maxHour = hours.length > 0 ? Math.max(...hours) : 21;

      const data = [];
      for (let h = Math.max(0, minHour - 1); h <= Math.min(23, maxHour + 1); h++) {
        data.push({
          label: `${h.toString().padStart(2, "0")}:00`,
          value: hourlyMap[h] || 0,
        });
      }
      return data;
    } else {
      // Group by Date
      const dateMap: Record<string, number> = {};
      const days = dateRange === "7days" ? 7 : dateRange === "30days" ? 30 : 0;

      if (days > 0) {
        // Initialize days with 0
        for (let i = days - 1; i >= 0; i--) {
          const d = new Date(startOfToday - i * 24 * 60 * 60 * 1000);
          const key = d.toLocaleDateString("en-CA");
          dateMap[key] = 0;
        }
      }

      completed.forEach((o) => {
        const key = new Date(o.created_at).toLocaleDateString("en-CA");
        if (days > 0) {
          if (dateMap[key] !== undefined) {
            dateMap[key] += o.total_amount;
          }
        } else {
          dateMap[key] = (dateMap[key] || 0) + o.total_amount;
        }
      });

      const data = [];
      if (days > 0) {
        for (let i = days - 1; i >= 0; i--) {
          const d = new Date(startOfToday - i * 24 * 60 * 60 * 1000);
          const dateStr = d.toLocaleDateString("id-ID", { day: "2-digit", month: "short" });
          const key = d.toLocaleDateString("en-CA");
          data.push({ label: dateStr, value: dateMap[key] || 0 });
        }
      } else {
        const sortedKeys = Object.keys(dateMap).sort();
        sortedKeys.forEach((key) => {
          const d = new Date(key);
          const label = d.toLocaleDateString("id-ID", { day: "2-digit", month: "short" });
          data.push({ label, value: dateMap[key] });
        });
      }
      return data;
    }
  }, [currentOrders, dateRange, startOfToday]);

  // ─── SVG Chart Math ───
  const chartWidth = 600;
  const chartHeight = 220;
  const paddingLeft = 55;
  const paddingRight = 20;
  const paddingTop = 25;
  const paddingBottom = 35;

  const graphWidth = chartWidth - paddingLeft - paddingRight;
  const graphHeight = chartHeight - paddingTop - paddingBottom;

  const maxVal = useMemo(() => {
    const values = chartData.map((d) => d.value);
    const max = Math.max(...values, 0);
    return max > 0 ? max * 1.15 : 10000; // 15% buffer
  }, [chartData]);

  const points = useMemo(() => {
    return chartData.map((d, index) => {
      const x = paddingLeft + (index / Math.max(1, chartData.length - 1)) * graphWidth;
      const y = paddingTop + graphHeight - (d.value / maxVal) * graphHeight;
      return { x, y, label: d.label, value: d.value };
    });
  }, [chartData, maxVal, graphWidth, graphHeight]);

  // ─── Order Types (Donut segments) ───
  const orderTypesData = useMemo(() => {
    const completed = currentOrders.filter((o) => o.status === "completed");
    const count = completed.length;
    if (count === 0) return [];

    const dinein = completed.filter((o) => o.order_type === "dinein").length;
    const takeaway = completed.filter((o) => o.order_type === "takeaway").length;
    const delivery = completed.filter((o) => o.order_type === "delivery").length;

    const raw = [
      { label: "Dine-in", count: dinein, pct: (dinein / count) * 100, color: "var(--color-brand)" },
      { label: "Takeaway", count: takeaway, pct: (takeaway / count) * 100, color: "#06b6d4" },
      { label: "Delivery", count: delivery, pct: (delivery / count) * 100, color: "#10b981" },
    ];

    let accumulatedPercent = 0;
    return raw
      .filter((t) => t.count > 0)
      .map((t) => {
        const strokeOffset = 251.2 - (accumulatedPercent / 100) * 251.2;
        accumulatedPercent += t.pct;
        return { ...t, strokeOffset };
      });
  }, [currentOrders]);

  // ─── Payment Methods Breakdown ───
  const paymentMethods = useMemo(() => {
    const completed = currentOrders.filter((o) => o.status === "completed");
    const count = completed.length;
    if (count === 0) return { cash: 0, cashPct: 0, qris: 0, qrisPct: 0 };

    const cash = completed.filter((o) => o.payment_method === "cash").length;
    const qris = count - cash;

    return {
      cash,
      cashPct: (cash / count) * 100,
      qris,
      qrisPct: (qris / count) * 100,
    };
  }, [currentOrders]);

  // ─── Peak Hours Distribution ───
  const peakHoursData = useMemo(() => {
    const completed = currentOrders.filter((o) => o.status === "completed");
    const slots = [
      { label: "Pagi (06-12)", count: 0, color: "var(--color-brand)" },
      { label: "Siang (12-18)", count: 0, color: "#3b82f6" },
      { label: "Sore (18-24)", count: 0, color: "#6366f1" },
      { label: "Malam (00-06)", count: 0, color: "#64748b" },
    ];

    completed.forEach((o) => {
      const hr = new Date(o.created_at).getHours();
      if (hr >= 6 && hr < 12) slots[0].count++;
      else if (hr >= 12 && hr < 18) slots[1].count++;
      else if (hr >= 18 && hr <= 23) slots[2].count++;
      else slots[3].count++;
    });

    return slots;
  }, [currentOrders]);

  const peakMax = Math.max(...peakHoursData.map((d) => d.count), 1);

  // ─── Product Performance (Best Sellers & Slow Movers) ───
  const productPerformance = useMemo(() => {
    const completed = currentOrders.filter((o) => o.status === "completed");
    const salesMap: Record<string, { id: string; name: string; imageUrl: string; price: number; qty: number; rev: number }> = {};

    // Seed map with all active products to correctly trace 0 sales items (Slow Movers)
    if (products.length > 0) {
      products.forEach((p) => {
        salesMap[p.id] = {
          id: p.id,
          name: p.name,
          imageUrl: p.image_url,
          price: p.price,
          qty: 0,
          rev: 0,
        };
      });
    }

    completed.forEach((o) => {
      o.items?.forEach((item) => {
        const pId = item.product_id;
        if (!salesMap[pId]) {
          const pName = item.product?.name || "Produk Terhapus";
          const pImg = item.product?.image_url || "";
          const pPrice = item.unit_price;
          salesMap[pId] = {
            id: pId,
            name: pName,
            imageUrl: pImg,
            price: pPrice,
            qty: 0,
            rev: 0,
          };
        }
        salesMap[pId].qty += item.quantity;
        salesMap[pId].rev += item.total_price;
      });
    });

    const list = Object.values(salesMap);

    const bestSellers = [...list]
      .filter((item) => item.qty > 0)
      .sort((a, b) => b.qty - a.qty)
      .slice(0, 5);

    const slowMovers = [...list]
      .sort((a, b) => a.qty - b.qty)
      .slice(0, 5);

    return { bestSellers, slowMovers };
  }, [currentOrders, products]);

  // ─── Category Performance ───
  const categoryPerformance = useMemo(() => {
    const completed = currentOrders.filter((o) => o.status === "completed");
    const catSalesMap: Record<string, number> = {};

    completed.forEach((o) => {
      o.items?.forEach((item) => {
        const prod = products.find((p) => p.id === item.product_id);
        const catId = prod?.category_id || "uncategorized";
        catSalesMap[catId] = (catSalesMap[catId] || 0) + item.total_price;
      });
    });

    const totalRev = Object.values(catSalesMap).reduce((a, b) => a + b, 0);

    const list = Object.entries(catSalesMap).map(([catId, rev]) => {
      const catName = categories.find((c) => c.id === catId)?.name || "Tanpa Kategori";
      return {
        name: catName,
        revenue: rev,
        pct: totalRev > 0 ? (rev / totalRev) * 100 : 0,
      };
    });

    return list.sort((a, b) => b.revenue - a.revenue);
  }, [currentOrders, products, categories]);

  return (
    <div className="space-y-6">
      {/* ─── Control Header ─── */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-4 rounded-2xl border border-neutral-200/80 shadow-sm">
        <div>
          <h2 className="font-extrabold text-base text-neutral-900 tracking-tight">
            Dashboard Analisis & Laporan
          </h2>
          <div className="flex items-center gap-1.5 text-xs text-neutral-400 font-semibold mt-0.5">
            <Calendar className="w-3.5 h-3.5" />
            <span>Periode: {rangeText}</span>
          </div>
        </div>

        {/* Range Pill Selector */}
        <div className="flex bg-neutral-100 p-1 rounded-xl gap-0.5 self-start md:self-auto border border-neutral-200/30">
          {(
            [
              { key: "today", label: "Hari Ini" },
              { key: "7days", label: "7 Hari" },
              { key: "30days", label: "30 Hari" },
              { key: "all", label: "Semua" },
            ] as const
          ).map((item) => (
            <button
              key={item.key}
              onClick={() => setDateRange(item.key)}
              className={`px-3 py-1.5 text-xs font-bold rounded-lg cursor-pointer transition-all ${
                dateRange === item.key
                  ? "bg-white text-brand shadow-sm"
                  : "text-neutral-500 hover:text-neutral-800"
              }`}
            >
              {item.label}
            </button>
          ))}
        </div>
      </div>

      {/* ─── KPI Metrik Grid ─── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {(
          [
            {
              label: "Pendapatan Kotor",
              val: fmt(kpis.revenue.curr),
              pct: kpis.revenue.pct,
              icon: DollarSign,
              color: "text-emerald-500 bg-emerald-50 border-emerald-100/50",
            },
            {
              label: "Total Transaksi",
              val: `${kpis.orders.curr} Pesanan`,
              pct: kpis.orders.pct,
              icon: ShoppingBag,
              color: "text-blue-500 bg-blue-50 border-blue-100/50",
            },
            {
              label: "Rata-rata Keranjang",
              val: fmt(kpis.aov.curr),
              pct: kpis.aov.pct,
              icon: Percent,
              color: "text-purple-500 bg-purple-50 border-purple-100/50",
            },
            {
              label: "Pelanggan Unik",
              val: `${kpis.customers.curr} Orang`,
              pct: kpis.customers.pct,
              icon: Users,
              color: "text-amber-500 bg-amber-50 border-amber-100/50",
            },
          ] as const
        ).map((card, idx) => (
          <div
            key={idx}
            className="bg-white p-5 rounded-2xl border border-neutral-200/80 shadow-sm relative overflow-hidden flex flex-col justify-between"
          >
            <div className="flex items-start justify-between">
              <div>
                <p className="text-[10px] font-bold text-neutral-400 uppercase tracking-wider">
                  {card.label}
                </p>
                <p className="font-extrabold text-lg text-neutral-800 mt-1 tracking-tight">
                  {card.val}
                </p>
              </div>
              <div className={`p-2 rounded-xl border ${card.color} flex-shrink-0`}>
                <card.icon className="w-4 h-4" />
              </div>
            </div>

            {/* Growth indicator */}
            {dateRange !== "all" && (
              <div className="flex items-center gap-1.5 mt-3 pt-3 border-t border-neutral-100">
                {card.pct > 0 ? (
                  <div className="flex items-center gap-0.5 bg-emerald-50 text-emerald-600 font-bold text-[10px] px-1.5 py-0.5 rounded">
                    <TrendingUp className="w-3 h-3" />
                    <span>+{card.pct.toFixed(1)}%</span>
                  </div>
                ) : card.pct < 0 ? (
                  <div className="flex items-center gap-0.5 bg-red-50 text-red-600 font-bold text-[10px] px-1.5 py-0.5 rounded">
                    <TrendingDown className="w-3 h-3" />
                    <span>{card.pct.toFixed(1)}%</span>
                  </div>
                ) : (
                  <div className="flex items-center gap-0.5 bg-neutral-100 text-neutral-500 font-bold text-[10px] px-1.5 py-0.5 rounded">
                    <span>0.0%</span>
                  </div>
                )}
                <span className="text-[10px] text-neutral-400 font-bold">vs periode lalu</span>
              </div>
            )}
          </div>
        ))}
      </div>

      {/* ─── Sales Trend & Breakdown Grid ─── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Trend Chart (Line/Area) */}
        <div className="lg:col-span-2 bg-white p-5 rounded-2xl border border-neutral-200/80 shadow-sm relative flex flex-col">
          <div className="flex items-center justify-between mb-4 border-b border-neutral-100 pb-3">
            <div className="flex items-center gap-1.5">
              <TrendingUp className="w-4 h-4 text-brand" />
              <h3 className="font-extrabold text-xs text-neutral-800 uppercase tracking-wider">
                Tren Omzet Penjualan
              </h3>
            </div>
            <span className="text-[10px] bg-brand/5 border border-brand/10 text-brand px-2.5 py-0.5 rounded-full font-bold">
              Sukses
            </span>
          </div>

          <div className="relative flex-1 min-h-[220px]">
            {chartData.length === 0 ? (
              <div className="absolute inset-0 flex items-center justify-center text-xs text-neutral-400">
                Belum ada transaksi di rentang waktu ini
              </div>
            ) : (
              <svg viewBox={`0 0 ${chartWidth} ${chartHeight}`} className="w-full h-auto overflow-visible">
                <defs>
                  <linearGradient id="chartGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="var(--color-brand)" stopOpacity="0.22" />
                    <stop offset="100%" stopColor="var(--color-brand)" stopOpacity="0.0" />
                  </linearGradient>
                </defs>

                {/* Grid Lines */}
                {[0, 0.25, 0.5, 0.75, 1].map((r, idx) => {
                  const y = paddingTop + r * graphHeight;
                  const val = maxVal - r * maxVal;
                  return (
                    <g key={idx}>
                      <line
                        x1={paddingLeft}
                        y1={y}
                        x2={chartWidth - paddingRight}
                        y2={y}
                        stroke="#f1f5f9"
                        strokeWidth="1"
                        strokeDasharray="4 4"
                      />
                      <text
                        x={paddingLeft - 8}
                        y={y + 4}
                        textAnchor="end"
                        className="text-[9px] fill-neutral-400 font-bold"
                      >
                        {fmtShort(val)}
                      </text>
                    </g>
                  );
                })}

                {/* Area under curve */}
                {points.length > 0 && (
                  <path
                    d={`M ${points[0].x} ${paddingTop + graphHeight} ${points.map((p) => `L ${p.x} ${p.y}`).join(" ")} L ${points[points.length - 1].x} ${paddingTop + graphHeight} Z`}
                    fill="url(#chartGradient)"
                  />
                )}

                {/* Line path */}
                {points.length > 0 && (
                  <path
                    d={points.map((p, i) => `${i === 0 ? "M" : "L"} ${p.x} ${p.y}`).join(" ")}
                    fill="none"
                    stroke="var(--color-brand)"
                    strokeWidth="2.5"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                )}

                {/* Data point dots */}
                {points.map((p, idx) => (
                  <circle
                    key={idx}
                    cx={p.x}
                    cy={p.y}
                    r={hoveredIndex === idx ? "5" : "3"}
                    fill={hoveredIndex === idx ? "var(--color-brand)" : "white"}
                    stroke="var(--color-brand)"
                    strokeWidth={hoveredIndex === idx ? "3" : "1.5"}
                    className="transition-all duration-150"
                  />
                ))}

                {/* X-Axis labels */}
                {points.map((p, idx) => {
                  const skipCount = Math.max(1, Math.ceil(points.length / 8));
                  if (idx % skipCount !== 0 && idx !== points.length - 1) return null;
                  return (
                    <text
                      key={idx}
                      x={p.x}
                      y={chartHeight - 12}
                      textAnchor="middle"
                      className="text-[9px] fill-neutral-400 font-bold"
                    >
                      {p.label}
                    </text>
                  );
                })}

                {/* Vertical slider tracker */}
                {hoveredIndex !== null && points[hoveredIndex] && (
                  <line
                    x1={points[hoveredIndex].x}
                    y1={paddingTop}
                    x2={points[hoveredIndex].x}
                    y2={paddingTop + graphHeight}
                    stroke="var(--color-brand)"
                    strokeWidth="1.5"
                    strokeDasharray="2 2"
                    pointerEvents="none"
                  />
                )}

                {/* Interactive col overlays */}
                {points.map((p, idx) => {
                  const colWidth = graphWidth / Math.max(1, points.length - 1);
                  const startX = p.x - colWidth / 2;
                  return (
                    <rect
                      key={idx}
                      x={startX}
                      y={paddingTop}
                      width={colWidth}
                      height={graphHeight}
                      fill="transparent"
                      className="cursor-pointer pointer-events-auto"
                      onMouseEnter={() => setHoveredIndex(idx)}
                      onMouseLeave={() => setHoveredIndex(null)}
                    />
                  );
                })}
              </svg>
            )}

            {/* Hover Tooltip Overlay */}
            {hoveredIndex !== null && points[hoveredIndex] && (
              <div
                className="absolute bg-neutral-900/95 text-white text-[10px] font-bold py-1.5 px-2.5 rounded-lg shadow-xl pointer-events-none flex flex-col gap-0.5 z-10 border border-neutral-800 backdrop-blur"
                style={{
                  left: `${((points[hoveredIndex].x - paddingLeft) / graphWidth) * 100}%`,
                  top: `${points[hoveredIndex].y - 12}px`,
                  transform: "translate(-50%, -100%)",
                }}
              >
                <span className="text-[8px] text-neutral-400 font-bold tracking-wider">{points[hoveredIndex].label}</span>
                <span className="text-white font-black">{fmt(points[hoveredIndex].value)}</span>
              </div>
            )}
          </div>
        </div>

        {/* Order Types & Payments Breakdown */}
        <div className="flex flex-col gap-4">
          {/* Order Types Donut */}
          <div className="bg-white p-5 rounded-2xl border border-neutral-200/80 shadow-sm flex flex-col justify-between flex-1">
            <div className="flex items-center gap-1.5 border-b border-neutral-100 pb-2 mb-3">
              <PieChart className="w-4 h-4 text-neutral-400" />
              <h3 className="font-extrabold text-xs text-neutral-800 uppercase tracking-wider">
                Distribusi Tipe Pesanan
              </h3>
            </div>

            {orderTypesData.length === 0 ? (
              <div className="text-center py-6 text-xs text-neutral-400">
                Belum ada transaksi
              </div>
            ) : (
              <div className="flex items-center gap-6">
                <div className="relative flex-shrink-0">
                  <svg width="100" height="100" viewBox="0 0 100 100">
                    <circle cx="50" cy="50" r="40" fill="transparent" stroke="#f8fafc" strokeWidth="12" />
                    {orderTypesData.map((seg, idx) => (
                      <circle
                        key={idx}
                        cx="50"
                        cy="50"
                        r="40"
                        fill="transparent"
                        stroke={seg.color}
                        strokeWidth="12"
                        strokeDasharray="251.2"
                        strokeDashoffset={seg.strokeOffset}
                        transform="rotate(-90 50 50)"
                        className="transition-all duration-500 ease-out"
                      />
                    ))}
                  </svg>
                </div>

                <div className="flex-1 space-y-2">
                  {orderTypesData.map((t, idx) => (
                    <div key={idx} className="flex items-center justify-between text-xs">
                      <div className="flex items-center gap-1.5">
                        <span className="w-2.5 h-2.5 rounded-full" style={{ background: t.color }} />
                        <span className="font-semibold text-neutral-600">{t.label}</span>
                      </div>
                      <span className="font-bold text-neutral-800">{t.pct.toFixed(0)}% ({t.count})</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Payment Method Progres */}
          <div className="bg-white p-5 rounded-2xl border border-neutral-200/80 shadow-sm flex flex-col justify-between flex-1">
            <div className="flex items-center gap-1.5 border-b border-neutral-100 pb-2 mb-3">
              <PieChart className="w-4 h-4 text-neutral-400" />
              <h3 className="font-extrabold text-xs text-neutral-800 uppercase tracking-wider">
                Metode Pembayaran
              </h3>
            </div>

            <div className="space-y-4 py-2">
              {/* QRIS Progress */}
              <div className="space-y-1">
                <div className="flex justify-between text-xs font-bold text-neutral-700">
                  <span>QRIS / Online</span>
                  <span>{paymentMethods.qrisPct.toFixed(0)}% ({paymentMethods.qris})</span>
                </div>
                <div className="w-full bg-neutral-100 h-2.5 rounded-full overflow-hidden">
                  <div
                    className="bg-brand h-full rounded-full transition-all duration-500"
                    style={{ width: `${paymentMethods.qrisPct}%` }}
                  />
                </div>
              </div>

              {/* Cash Progress */}
              <div className="space-y-1">
                <div className="flex justify-between text-xs font-bold text-neutral-700">
                  <span>Tunai (Cash)</span>
                  <span>{paymentMethods.cashPct.toFixed(0)}% ({paymentMethods.cash})</span>
                </div>
                <div className="w-full bg-neutral-100 h-2.5 rounded-full overflow-hidden">
                  <div
                    className="bg-blue-500 h-full rounded-full transition-all duration-500"
                    style={{ width: `${paymentMethods.cashPct}%` }}
                  />
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ─── Peak Hours & Category Sales ─── */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Peak Hours SVG Bar Chart */}
        <div className="bg-white p-5 rounded-2xl border border-neutral-200/80 shadow-sm flex flex-col">
          <div className="flex items-center gap-1.5 border-b border-neutral-100 pb-3 mb-4">
            <Clock className="w-4 h-4 text-neutral-400" />
            <h3 className="font-extrabold text-xs text-neutral-800 uppercase tracking-wider">
              Analisis Jam Sibuk
            </h3>
          </div>

          <div className="flex-1 flex items-center justify-center min-h-[140px]">
            <svg viewBox="0 0 300 120" className="w-full h-auto overflow-visible">
              {peakHoursData.map((d, idx) => {
                const barWidth = 40;
                const barSpacing = 28;
                const x = 30 + idx * (barWidth + barSpacing);
                const graphHeight = 70;
                const barHeight = (d.count / peakMax) * graphHeight;
                const y = 85 - barHeight;

                return (
                  <g key={idx} className="group">
                    {/* Floating counts */}
                    <text
                      x={x + barWidth / 2}
                      y={y - 6}
                      textAnchor="middle"
                      className="text-[9px] font-black fill-neutral-700 opacity-0 group-hover:opacity-100 transition-opacity duration-150"
                    >
                      {d.count} ord
                    </text>

                    {/* Bar */}
                    <rect
                      x={x}
                      y={y}
                      width={barWidth}
                      height={Math.max(barHeight, 2)}
                      rx="4"
                      fill={d.color}
                      className="transition-all duration-300 hover:opacity-90 cursor-pointer"
                    />

                    {/* Label */}
                    <text
                      x={x + barWidth / 2}
                      y={102}
                      textAnchor="middle"
                      className="text-[9px] font-bold fill-neutral-400"
                    >
                      {d.label.split(" ")[0]}
                    </text>
                    <text
                      x={x + barWidth / 2}
                      y={112}
                      textAnchor="middle"
                      className="text-[8px] font-semibold fill-neutral-400"
                    >
                      {d.label.split(" ")[1] || ""}
                    </text>
                  </g>
                );
              })}
            </svg>
          </div>
        </div>

        {/* Category Contribution */}
        <div className="bg-white p-5 rounded-2xl border border-neutral-200/80 shadow-sm flex flex-col">
          <div className="flex items-center gap-1.5 border-b border-neutral-100 pb-3 mb-4">
            <Layers className="w-4 h-4 text-neutral-400" />
            <h3 className="font-extrabold text-xs text-neutral-800 uppercase tracking-wider">
              Penjualan Per Kategori
            </h3>
          </div>

          <div className="flex-1 space-y-3.5">
            {categoryPerformance.length === 0 ? (
              <div className="text-center py-6 text-xs text-neutral-400">
                Belum ada data penjualan kategori
              </div>
            ) : (
              categoryPerformance.map((cat, idx) => (
                <div key={idx} className="space-y-1.5">
                  <div className="flex justify-between text-xs font-bold text-neutral-700">
                    <span className="truncate max-w-[150px]">{cat.name}</span>
                    <span className="text-neutral-500 font-semibold">
                      {fmt(cat.revenue)} ({cat.pct.toFixed(0)}%)
                    </span>
                  </div>
                  <div className="w-full bg-neutral-100 h-2 rounded-full overflow-hidden">
                    <div
                      className="bg-brand h-full rounded-full transition-all duration-500"
                      style={{
                        width: `${cat.pct}%`,
                        backgroundColor:
                          idx === 0
                            ? "var(--color-brand)"
                            : idx === 1
                              ? "#3b82f6"
                              : idx === 2
                                ? "#10b981"
                                : "#8b5cf6",
                      }}
                    />
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      {/* ─── Product Performance (Best Sellers vs Slow Movers) ─── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Best Sellers */}
        <div className="bg-white p-5 rounded-2xl border border-neutral-200/80 shadow-sm">
          <div className="flex items-center gap-1.5 border-b border-neutral-100 pb-3 mb-4">
            <Award className="w-4 h-4 text-emerald-500" />
            <h3 className="font-extrabold text-xs text-neutral-800 uppercase tracking-wider">
              Menu Terlaris (Best Sellers)
            </h3>
          </div>

          <div className="space-y-3.5">
            {productPerformance.bestSellers.length === 0 ? (
              <p className="text-xs text-neutral-400 text-center py-4">
                Belum ada transaksi penjualan produk
              </p>
            ) : (
              productPerformance.bestSellers.map((item, idx) => (
                <div key={item.id} className="flex items-center gap-3">
                  {/* Thumbnail / Badge */}
                  <div className="relative">
                    {item.imageUrl ? (
                      <img
                        src={item.imageUrl}
                        alt={item.name}
                        className="w-10 h-10 object-cover rounded-lg border border-neutral-200"
                      />
                    ) : (
                      <div className="w-10 h-10 bg-neutral-100 rounded-lg flex items-center justify-center text-xs font-bold text-neutral-400 border border-neutral-200">
                        POS
                      </div>
                    )}
                    <span className="absolute -top-1.5 -left-1.5 w-5 h-5 bg-emerald-500 text-white rounded-full flex items-center justify-center text-[9px] font-black border border-white">
                      {idx + 1}
                    </span>
                  </div>

                  {/* Details */}
                  <div className="flex-1 min-w-0">
                    <span className="font-bold text-xs text-neutral-800 block truncate">
                      {item.name}
                    </span>
                    <span className="text-[10px] text-neutral-400 font-bold block mt-0.5">
                      {fmt(item.price)}
                    </span>
                  </div>

                  {/* Quantity & Revenue */}
                  <div className="text-right flex-shrink-0">
                    <span className="font-black text-xs text-neutral-800 block">
                      {item.qty}x Terjual
                    </span>
                    <span className="text-[10px] text-neutral-400 font-bold block mt-0.5">
                      {fmt(item.rev)}
                    </span>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Slow Movers */}
        <div className="bg-white p-5 rounded-2xl border border-neutral-200/80 shadow-sm">
          <div className="flex items-center gap-1.5 border-b border-neutral-100 pb-3 mb-4">
            <AlertTriangle className="w-4 h-4 text-amber-500" />
            <h3 className="font-extrabold text-xs text-neutral-800 uppercase tracking-wider">
              Menu Kurang Laku (Slow Movers)
            </h3>
          </div>

          <div className="space-y-3.5">
            {productPerformance.slowMovers.length === 0 ? (
              <p className="text-xs text-neutral-400 text-center py-4">
                Belum ada produk terdaftar di outlet
              </p>
            ) : (
              productPerformance.slowMovers.map((item, idx) => (
                <div key={item.id} className="flex items-center gap-3">
                  {/* Thumbnail / Badge */}
                  <div className="relative">
                    {item.imageUrl ? (
                      <img
                        src={item.imageUrl}
                        alt={item.name}
                        className="w-10 h-10 object-cover rounded-lg border border-neutral-200"
                      />
                    ) : (
                      <div className="w-10 h-10 bg-neutral-100 rounded-lg flex items-center justify-center text-xs font-bold text-neutral-400 border border-neutral-200">
                        POS
                      </div>
                    )}
                    <span className="absolute -top-1.5 -left-1.5 w-5 h-5 bg-neutral-400 text-white rounded-full flex items-center justify-center text-[9px] font-black border border-white">
                      {idx + 1}
                    </span>
                  </div>

                  {/* Details */}
                  <div className="flex-1 min-w-0">
                    <span className="font-bold text-xs text-neutral-800 block truncate">
                      {item.name}
                    </span>
                    <span className="text-[10px] text-neutral-400 font-bold block mt-0.5">
                      {fmt(item.price)}
                    </span>
                  </div>

                  {/* Quantity & Revenue */}
                  <div className="text-right flex-shrink-0">
                    <span className="font-black text-xs text-neutral-800 block">
                      {item.qty}x Terjual
                    </span>
                    <span className="text-[10px] text-neutral-400 font-bold block mt-0.5">
                      {fmt(item.rev)}
                    </span>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
