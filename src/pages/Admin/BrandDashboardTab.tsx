import React, { useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import {
  Store,
  Users,
  TrendingUp,
  TrendingDown,
  DollarSign,
  ShoppingBag,
  Percent,
  Award,
  Calendar,
  ArrowRight,
  Clock,
  PieChart,
  ChevronRight
} from "lucide-react";

interface Outlet {
  id: string;
  name: string;
  slug: string;
  brand_code: string;
  logo_url: string | null;
  brand_color: string;
  table_count: number;
  is_dine_in_enabled: boolean;
  is_takeaway_enabled: boolean;
  is_delivery_enabled: boolean;
}

interface Order {
  id: string;
  outlet_id: string;
  order_code: string;
  order_type: string;
  status: string;
  payment_method: string;
  payment_status: string;
  total_amount: number;
  created_at: string;
}

interface OutletAdmin {
  id: string;
  outlet_id: string;
  email: string;
}

interface BrandDashboardTabProps {
  brandName: string;
  outlets: Outlet[];
  orders: Order[];
  outletAdmins: OutletAdmin[];
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

export default function BrandDashboardTab({
  brandName,
  outlets,
  orders,
  outletAdmins,
}: BrandDashboardTabProps) {
  const navigate = useNavigate();
  const [dateRange, setDateRange] = useState<"today" | "7days" | "30days" | "all">("7days");
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);

  // ─── Filter & Period Calculations ───
  const {
    startOfToday,
    startOfYesterday,
    startOf7DaysAgo,
    startOf14DaysAgo,
    startOf30DaysAgo,
    startOf60DaysAgo,
  } = useMemo(() => {
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
    const currRev = completedCurrent.reduce((sum, o) => sum + Number(o.total_amount), 0);
    const prevRev = completedPrev.reduce((sum, o) => sum + Number(o.total_amount), 0);

    // Orders Count
    const currCount = completedCurrent.length;
    const prevCount = completedPrev.length;

    // AOV
    const currAOV = currCount > 0 ? currRev / currCount : 0;
    const prevAOV = prevCount > 0 ? prevRev / prevCount : 0;

    // Find best outlet in current period
    const outletRevMap: Record<string, number> = {};
    completedCurrent.forEach((o) => {
      outletRevMap[o.outlet_id] = (outletRevMap[o.outlet_id] || 0) + Number(o.total_amount);
    });

    let topOutletId = "";
    let maxOutletRev = 0;
    Object.entries(outletRevMap).forEach(([id, r]) => {
      if (r > maxOutletRev) {
        maxOutletRev = r;
        topOutletId = id;
      }
    });

    const topOutletName = outlets.find((o) => o.id === topOutletId)?.name ?? "—";

    return {
      revenue: { curr: currRev, prev: prevRev, pct: calcPctChange(currRev, prevRev) },
      orders: { curr: currCount, prev: prevCount, pct: calcPctChange(currCount, prevCount) },
      aov: { curr: currAOV, prev: prevAOV, pct: calcPctChange(currAOV, prevAOV) },
      topOutlet: { name: topOutletName, revenue: maxOutletRev },
    };
  }, [currentOrders, prevOrders, outlets]);

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

  // ─── Outlet Performance Leaderboard ───
  const leaderboard = useMemo(() => {
    const completed = currentOrders.filter((o) => o.status === "completed");

    return outlets
      .map((outlet) => {
        const outletOrders = completed.filter((o) => o.outlet_id === outlet.id);
        const revenue = outletOrders.reduce((sum, o) => sum + Number(o.total_amount), 0);
        const totalCount = currentOrders.filter((o) => o.outlet_id === outlet.id).length;
        const completedCount = outletOrders.length;
        const staffCount = outletAdmins.filter((a) => a.outlet_id === outlet.id).length;

        return {
          outlet,
          revenue,
          completedCount,
          totalCount,
          staffCount,
        };
      })
      .sort((a, b) => b.revenue - a.revenue);
  }, [currentOrders, outlets, outletAdmins]);

  // ─── Sales Trend Chart Data ───
  const chartData = useMemo(() => {
    const completed = currentOrders.filter((o) => o.status === "completed");

    if (dateRange === "today") {
      const hourlyMap: Record<number, number> = {};
      completed.forEach((o) => {
        const hour = new Date(o.created_at).getHours();
        hourlyMap[hour] = (hourlyMap[hour] || 0) + Number(o.total_amount);
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
      const dateMap: Record<string, number> = {};
      const days = dateRange === "7days" ? 7 : dateRange === "30days" ? 30 : 0;

      if (days > 0) {
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
            dateMap[key] += Number(o.total_amount);
          }
        } else {
          dateMap[key] = (dateMap[key] || 0) + Number(o.total_amount);
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
  const chartHeight = 200;
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

  // ─── Order Types Distribution ───
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

  const brandColor = outlets[0]?.brand_color ?? "#f97316";

  return (
    <div className="space-y-6">
      {/* ─── Control Header ─── */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-4 rounded-2xl border border-neutral-200/80 shadow-sm">
        <div>
          <h2 className="font-extrabold text-base text-neutral-900 tracking-tight">
            Dashboard Brand {brandName}
          </h2>
          <div className="flex items-center gap-1.5 text-xs text-neutral-400 font-semibold mt-0.5">
            <Calendar className="w-3.5 h-3.5" />
            <span>Periode Data: {rangeText}</span>
          </div>
        </div>

        {/* Date Selector */}
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

      {/* ─── KPIs Grid ─── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {(
          [
            {
              label: "Omzet Gabungan",
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
              label: "Cabang Terlaris",
              val: kpis.topOutlet.name,
              sub: kpis.topOutlet.revenue > 0 ? fmt(kpis.topOutlet.revenue) : "Belum ada penjualan",
              icon: Award,
              color: "text-amber-500 bg-amber-50 border-amber-100/50",
            },
          ] as const
        ).map((card, idx) => (
          <div
            key={idx}
            className="bg-white p-5 rounded-2xl border border-neutral-200/80 shadow-sm relative overflow-hidden flex flex-col justify-between"
          >
            <div className="flex items-start justify-between">
              <div className="min-w-0 flex-1">
                <p className="text-[10px] font-bold text-neutral-400 uppercase tracking-wider truncate">
                  {card.label}
                </p>
                <p className="font-extrabold text-base text-neutral-800 mt-1 tracking-tight truncate">
                  {card.val}
                </p>
                {"sub" in card && (
                  <p className="text-[10px] text-neutral-400 font-semibold truncate mt-0.5">
                    {card.sub}
                  </p>
                )}
              </div>
              <div className={`p-2 rounded-xl border ${card.color} flex-shrink-0 ml-2`}>
                <card.icon className="w-4 h-4" />
              </div>
            </div>

            {/* Growth indicator if applicable */}
            {"pct" in card && dateRange !== "all" && (
              <div className="flex items-center gap-1.5 mt-3 pt-3 border-t border-neutral-100">
                {card.pct > 0 ? (
                  <div className="flex items-center gap-0.5 bg-emerald-50 text-emerald-600 font-bold text-[10px] px-1.5 py-0.5 rounded">
                    <TrendingUp className="w-3.5 h-3.5" />
                    <span>+{card.pct.toFixed(1)}%</span>
                  </div>
                ) : card.pct < 0 ? (
                  <div className="flex items-center gap-0.5 bg-red-50 text-red-600 font-bold text-[10px] px-1.5 py-0.5 rounded">
                    <TrendingDown className="w-3.5 h-3.5" />
                    <span>{card.pct.toFixed(1)}%</span>
                  </div>
                ) : (
                  <div className="flex items-center gap-0.5 bg-neutral-100 text-neutral-500 font-bold text-[10px] px-1.5 py-0.5 rounded">
                    <span>0.0%</span>
                  </div>
                )}
                <span className="text-[10px] text-neutral-400 font-semibold">vs periode lalu</span>
              </div>
            )}
          </div>
        ))}
      </div>

      {/* ─── Sales Trend & Distribution ─── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Trend Line Chart */}
        <div className="lg:col-span-2 bg-white p-5 rounded-2xl border border-neutral-200/80 shadow-sm relative flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-4 border-b border-neutral-100 pb-3">
              <div className="flex items-center gap-1.5">
                <TrendingUp className="w-4 h-4 text-brand" />
                <h3 className="font-extrabold text-xs text-neutral-800 uppercase tracking-wider">
                  Tren Omzet Gabungan
                </h3>
              </div>
              <span className="text-[10px] bg-brand/5 border border-brand/10 text-brand px-2.5 py-0.5 rounded-full font-bold">
                Gabungan
              </span>
            </div>

            <div className="relative min-h-[180px] w-full">
              {chartData.length === 0 ? (
                <div className="absolute inset-0 flex items-center justify-center text-xs text-neutral-400">
                  Belum ada penjualan di periode ini
                </div>
              ) : (
                <svg viewBox={`0 0 ${chartWidth} ${chartHeight}`} className="w-full h-auto overflow-visible">
                  <defs>
                    <linearGradient id="brandChartGradient" x1="0" y1="0" x2="0" y2="1">
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
                      fill="url(#brandChartGradient)"
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

                  {/* Dot points */}
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
                        y={chartHeight - 10}
                        textAnchor="middle"
                        className="text-[9px] fill-neutral-400 font-bold"
                      >
                        {p.label}
                      </text>
                    );
                  })}

                  {/* Hover tracker */}
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

                  {/* Column overlays for interactions */}
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

              {/* Hover Tooltip */}
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
        </div>

        {/* Brand-wide Distributions */}
        <div className="flex flex-col gap-4">
          {/* Order Types */}
          <div className="bg-white p-5 rounded-2xl border border-neutral-200/80 shadow-sm flex flex-col justify-between flex-1">
            <div className="flex items-center gap-1.5 border-b border-neutral-100 pb-2 mb-3">
              <PieChart className="w-4 h-4 text-neutral-400" />
              <h3 className="font-extrabold text-xs text-neutral-800 uppercase tracking-wider">
                Tipe Pemesanan Brand
              </h3>
            </div>

            {orderTypesData.length === 0 ? (
              <div className="text-center py-6 text-xs text-neutral-400">
                Belum ada transaksi
              </div>
            ) : (
              <div className="flex items-center gap-6">
                <div className="relative flex-shrink-0">
                  <svg width="90" height="90" viewBox="0 0 100 100">
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
                    <div key={idx} className="flex items-center justify-between text-[11px]">
                      <div className="flex items-center gap-1">
                        <span className="w-2 h-2 rounded-full" style={{ background: t.color }} />
                        <span className="font-semibold text-neutral-600 truncate max-w-[70px]">{t.label}</span>
                      </div>
                      <span className="font-bold text-neutral-800">{t.pct.toFixed(0)}%</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Payment Methods */}
          <div className="bg-white p-5 rounded-2xl border border-neutral-200/80 shadow-sm flex flex-col justify-between flex-1">
            <div className="flex items-center gap-1.5 border-b border-neutral-100 pb-2 mb-3">
              <PieChart className="w-4 h-4 text-neutral-400" />
              <h3 className="font-extrabold text-xs text-neutral-800 uppercase tracking-wider">
                Metode Pembayaran Brand
              </h3>
            </div>

            <div className="space-y-3 py-1">
              <div className="space-y-1">
                <div className="flex justify-between text-xs font-bold text-neutral-700">
                  <span>QRIS / Online</span>
                  <span>{paymentMethods.qrisPct.toFixed(0)}% ({paymentMethods.qris})</span>
                </div>
                <div className="w-full bg-neutral-100 h-2 rounded-full overflow-hidden">
                  <div
                    className="bg-brand h-full rounded-full transition-all duration-500"
                    style={{ width: `${paymentMethods.qrisPct}%`, backgroundColor: brandColor }}
                  />
                </div>
              </div>

              <div className="space-y-1">
                <div className="flex justify-between text-xs font-bold text-neutral-700">
                  <span>Tunai (Cash)</span>
                  <span>{paymentMethods.cashPct.toFixed(0)}% ({paymentMethods.cash})</span>
                </div>
                <div className="w-full bg-neutral-100 h-2 rounded-full overflow-hidden">
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

      {/* ─── Outlet Performance Leaderboard ─── */}
      <div className="bg-white p-5 rounded-2xl border border-neutral-200/80 shadow-sm">
        <div className="flex items-center gap-1.5 border-b border-neutral-100 pb-3 mb-4">
          <Store className="w-4 h-4 text-brand" style={{ color: brandColor }} />
          <h3 className="font-extrabold text-xs text-neutral-800 uppercase tracking-wider">
            Leaderboard Performa Outlet
          </h3>
        </div>

        <div className="space-y-4">
          {leaderboard.length === 0 ? (
            <p className="text-xs text-neutral-400 text-center py-4">
              Tidak ada data outlet untuk ditampilkan
            </p>
          ) : (
            leaderboard.map((item, idx) => {
              const totalBrandRevenue = leaderboard.reduce((acc, curr) => acc + curr.revenue, 0);
              const contributionPct = totalBrandRevenue > 0 ? (item.revenue / totalBrandRevenue) * 100 : 0;

              return (
                <div
                  key={item.outlet.id}
                  className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 bg-neutral-50 rounded-xl border border-neutral-200/50 hover:bg-neutral-100/50 transition-all"
                >
                  {/* Outlet Basic Details */}
                  <div className="flex items-center gap-3 min-w-0 sm:flex-1">
                    <span className="w-6 h-6 bg-brand/10 text-brand rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0" style={{ color: brandColor, backgroundColor: `${brandColor}1A` }}>
                      #{idx + 1}
                    </span>
                    <div className="w-10 h-8 rounded border border-neutral-200 overflow-hidden bg-white flex-shrink-0 flex items-center justify-center">
                      {item.outlet.logo_url ? (
                        <img src={item.outlet.logo_url} alt={item.outlet.name} className="w-full h-full object-cover" />
                      ) : (
                        <Store className="w-4 h-4 text-neutral-400" />
                      )}
                    </div>
                    <div className="min-w-0">
                      <span className="font-bold text-xs text-neutral-800 block truncate">
                        {item.outlet.name}
                      </span>
                      <span className="text-[10px] text-neutral-400 font-bold block mt-0.5">
                        {item.staffCount} Staf Aktif
                      </span>
                    </div>
                  </div>

                  {/* Performance Indicators & Progress bar */}
                  <div className="flex-1 flex flex-col gap-1 sm:max-w-xs md:max-w-sm">
                    <div className="flex justify-between text-[10px] font-bold text-neutral-600">
                      <span>Kontribusi Omzet</span>
                      <span>{contributionPct.toFixed(1)}%</span>
                    </div>
                    <div className="w-full bg-neutral-200 h-1.5 rounded-full overflow-hidden">
                      <div
                        className="bg-brand h-full rounded-full transition-all duration-500"
                        style={{ width: `${contributionPct}%`, backgroundColor: brandColor }}
                      />
                    </div>
                  </div>

                  {/* Metrics and Action */}
                  <div className="flex items-center justify-between sm:justify-end gap-5 flex-shrink-0">
                    <div className="text-left sm:text-right">
                      <span className="font-extrabold text-xs text-neutral-800 block">
                        {fmt(item.revenue)}
                      </span>
                      <span className="text-[10px] text-neutral-400 font-bold block mt-0.5">
                        {item.completedCount} / {item.totalCount} Selesai
                      </span>
                    </div>

                    <button
                      onClick={() => navigate(`/admin/outlets/${item.outlet.id}`)}
                      className="flex items-center gap-1 px-3 py-1.5 bg-white border border-neutral-200 hover:border-neutral-300 text-[10px] font-bold text-neutral-700 rounded-lg hover:bg-neutral-50 transition-all cursor-pointer"
                    >
                      Buka Workspace <ChevronRight className="w-3 h-3 text-neutral-400" />
                    </button>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
}
