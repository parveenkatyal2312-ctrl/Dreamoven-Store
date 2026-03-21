import React, { useCallback, useEffect, useState } from "react";
import { api } from "@/lib/api";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Loader2, RefreshCw } from "lucide-react";

const formatCurrency = (amount) => {
  if (!amount && amount !== 0) return "₹0";
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
};

const formatNumber = (num) => {
  if (!num && num !== 0) return "0";
  return new Intl.NumberFormat("en-IN").format(num);
};

const formatPct = (val) => {
  if (val === null || val === undefined || Number.isNaN(val)) return "";
  return `${val.toFixed(2)}%`;
};

const pct = (part, base) => {
  const b = Number(base || 0);
  if (!b) return null;
  return (Number(part || 0) / b) * 100;
};

const COMPANIES = ["DO", "KINFOLK", "DOPL"];

// Generate financial years (e.g., "2024-25", "2025-26")
const generateFYOptions = () => {
  const currentYear = new Date().getFullYear();
  const currentMonth = new Date().getMonth() + 1;
  const currentFY = currentMonth >= 4 ? currentYear : currentYear - 1;
  
  const options = [];
  for (let i = 0; i < 3; i++) {
    const startYear = currentFY - i;
    options.push({
      value: `${startYear}-${(startYear + 1).toString().slice(-2)}`,
      label: `FY ${startYear}-${(startYear + 1).toString().slice(-2)}`,
      startYear: startYear
    });
  }
  return options;
};

export default function FinancialYear() {
  const [selectedFY, setSelectedFY] = useState(generateFYOptions()[0].value);
  const [selectedCompany, setSelectedCompany] = useState("all");
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState(null);
  const [error, setError] = useState(null);

  const fyOptions = generateFYOptions();

  const fetchData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const params = { fy: selectedFY };
      if (selectedCompany !== "all") {
        params.company = selectedCompany;
      }
      const res = await api.get("/reports/financial-year", { params });
      setData(res.data);
    } catch (e) {
      setError(e?.response?.data?.detail || "Failed to fetch data");
    } finally {
      setLoading(false);
    }
  }, [selectedFY, selectedCompany]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // Calculate totals for dine-in table
  const dineinTotals = data?.dinein_monthly?.reduce((acc, row) => {
    acc.dinein += row.dinein || 0;
    acc.takeaway += row.takeaway || 0;
    acc.self_delivery += row.self_delivery || 0;
    acc.zomato_pay += row.zomato_pay || 0;
    acc.dineout += row.dineout || 0;
    acc.cash += row.cash || 0;
    acc.card += row.card || 0;
    acc.total += row.total || 0;
    acc.orders += row.orders || 0;
    return acc;
  }, { dinein: 0, takeaway: 0, self_delivery: 0, zomato_pay: 0, dineout: 0, cash: 0, card: 0, total: 0, orders: 0 }) || {};

  // Calculate totals for delivery table
  const deliveryTotals = data?.delivery_monthly?.reduce((acc, row) => {
    // Swiggy totals
    acc.swiggy_sales += row.swiggy_sales || 0;
    acc.swiggy_orders += row.swiggy_orders || 0;
    acc.swiggy_commission += row.swiggy_commission || 0;
    acc.swiggy_convenience += row.swiggy_convenience || 0;
    acc.swiggy_ad_charges += row.swiggy_ad_charges || 0;
    acc.swiggy_gst += row.swiggy_gst || 0;
    acc.swiggy_tds_calculated += row.swiggy_tds_calculated || 0;
    acc.swiggy_tds_actual += row.swiggy_tds_actual || 0;
    acc.swiggy_total_deductions += row.swiggy_total_deductions || 0;
    acc.swiggy_net_payout += row.swiggy_net_payout || 0;
    // Zomato totals
    acc.zomato_sales += row.zomato_sales || 0;
    acc.zomato_orders += row.zomato_orders || 0;
    acc.zomato_commission += row.zomato_commission || 0;
    acc.zomato_convenience += row.zomato_convenience || 0;
    acc.zomato_ad_charges += row.zomato_ad_charges || 0;
    acc.zomato_long_distance += row.zomato_long_distance || 0;
    acc.zomato_gst += row.zomato_gst || 0;
    acc.zomato_tds_calculated += row.zomato_tds_calculated || 0;
    acc.zomato_tds_actual += row.zomato_tds_actual || 0;
    acc.zomato_total_deductions += row.zomato_total_deductions || 0;
    acc.zomato_net_payout += row.zomato_net_payout || 0;
    // Combined totals
    acc.total_ad_charges += row.total_ad_charges || 0;
    acc.total_long_distance += row.total_long_distance || 0;
    acc.total_gst += row.total_gst || 0;
    acc.total_tds_calculated += row.total_tds_calculated || 0;
    acc.total_tds_actual += row.total_tds_actual || 0;
    acc.total_net_payout += row.total_net_payout || 0;
    return acc;
  }, {
    swiggy_sales: 0,
    swiggy_orders: 0,
    swiggy_commission: 0,
    swiggy_convenience: 0,
    swiggy_ad_charges: 0,
    swiggy_gst: 0,
    swiggy_tds_calculated: 0,
    swiggy_tds_actual: 0,
    swiggy_total_deductions: 0,
    swiggy_net_payout: 0,
    zomato_sales: 0,
    zomato_orders: 0,
    zomato_commission: 0,
    zomato_convenience: 0,
    zomato_ad_charges: 0,
    zomato_long_distance: 0,
    zomato_gst: 0,
    zomato_tds_calculated: 0,
    zomato_tds_actual: 0,
    zomato_total_deductions: 0,
    zomato_net_payout: 0,
    total_ad_charges: 0,
    total_long_distance: 0,
    total_gst: 0,
    total_tds_calculated: 0,
    total_tds_actual: 0,
    total_net_payout: 0,
  }) || {};

  const deliverySalesTotal = (deliveryTotals.swiggy_sales || 0) + (deliveryTotals.zomato_sales || 0);
  const deliveryOrdersTotal = (deliveryTotals.swiggy_orders || 0) + (deliveryTotals.zomato_orders || 0);
  const totalDeductions = (deliveryTotals.swiggy_total_deductions || 0) + (deliveryTotals.zomato_total_deductions || 0);

  const totalSales = (dineinTotals.total || 0) + deliverySalesTotal;

  const companyTotals = data?.company_summary?.reduce(
    (acc, row) => {
      acc.dinein_total += row.dinein_total || 0;
      acc.swiggy_sales += row.swiggy_sales || 0;
      acc.swiggy_orders += row.swiggy_orders || 0;
      acc.zomato_sales += row.zomato_sales || 0;
      acc.zomato_orders += row.zomato_orders || 0;
      acc.delivery_total += row.delivery_total || 0;
      acc.total_orders += row.total_orders || 0;
      acc.total_commission += row.total_commission || 0;
      acc.total_convenience += row.total_convenience || 0;
      acc.total_ad_charges += row.total_ad_charges || 0;
      acc.total_long_distance += row.total_long_distance || 0;
      acc.gst_on_commission += row.gst_on_commission || 0;
      acc.gst_on_ads += row.gst_on_ads || 0;
      acc.gst_on_long_distance += row.gst_on_long_distance || 0;
      acc.gst_dinein_takeaway += row.gst_dinein_takeaway || 0;
      acc.net_payout += row.net_payout || 0;
      acc.total_sales += (row.dinein_total || 0) + (row.delivery_total || 0);
      return acc;
    },
    {
      dinein_total: 0,
      swiggy_sales: 0,
      swiggy_orders: 0,
      zomato_sales: 0,
      zomato_orders: 0,
      delivery_total: 0,
      total_orders: 0,
      total_commission: 0,
      total_convenience: 0,
      total_ad_charges: 0,
      total_long_distance: 0,
      gst_on_commission: 0,
      gst_on_ads: 0,
      gst_on_long_distance: 0,
      gst_dinein_takeaway: 0,
      net_payout: 0,
      total_sales: 0,
    },
  ) || null;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Financial Year Report</h1>
          <p className="text-slate-500">Month-wise breakdown for dine-in and delivery sales</p>
        </div>
        <div className="flex gap-3">
          <Select value={selectedFY} onValueChange={setSelectedFY}>
            <SelectTrigger className="w-36">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {fyOptions.map((fy) => (
                <SelectItem key={fy.value} value={fy.value}>
                  {fy.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          
          <Select value={selectedCompany} onValueChange={setSelectedCompany}>
            <SelectTrigger className="w-32">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Companies</SelectItem>
              {COMPANIES.map((c) => (
                <SelectItem key={c} value={c}>{c}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          
          <Button onClick={fetchData} disabled={loading} variant="outline">
            {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <RefreshCw className="h-4 w-4" />}
          </Button>
        </div>
      </div>

      {error && (
        <div className="bg-red-50 text-red-700 p-4 rounded-xl">
          {error}
        </div>
      )}

      {/* Summary Cards */}
      {data && (
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-8 gap-4">
          <Card className="rounded-xl">
            <CardContent className="pt-4">
              <div className="text-sm text-slate-500">Total Dine-in/Takeaway</div>
              <div className="text-2xl font-bold text-blue-600">{formatCurrency(dineinTotals.total)}</div>
              <div className="text-xs text-slate-400">{formatNumber(dineinTotals.orders)} orders</div>
            </CardContent>
          </Card>
          <Card className="rounded-xl bg-purple-50">
            <CardContent className="pt-4">
              <div className="text-sm text-purple-600">Online Partners (Dine-in)</div>
              <div className="text-2xl font-bold text-purple-700">{formatCurrency((dineinTotals.zomato_pay || 0) + (dineinTotals.dineout || 0))}</div>
              <div className="text-xs text-purple-500">Zomato Pay + Dineout</div>
            </CardContent>
          </Card>
          <Card className="rounded-xl">
            <CardContent className="pt-4">
              <div className="text-sm text-slate-500">Swiggy Sales</div>
              <div className="text-2xl font-bold text-orange-700">{formatCurrency(deliveryTotals.swiggy_sales)}</div>
              <div className="text-xs text-slate-400">{formatNumber(deliveryTotals.swiggy_orders)} orders</div>
            </CardContent>
          </Card>
          <Card className="rounded-xl">
            <CardContent className="pt-4">
              <div className="text-sm text-slate-500">Zomato Sales</div>
              <div className="text-2xl font-bold text-red-700">{formatCurrency(deliveryTotals.zomato_sales)}</div>
              <div className="text-xs text-slate-400">{formatNumber(deliveryTotals.zomato_orders)} orders</div>
            </CardContent>
          </Card>
          <Card className="rounded-xl">
            <CardContent className="pt-4">
              <div className="text-sm text-slate-500">Total Delivery Sales</div>
              <div className="text-2xl font-bold text-green-600">{formatCurrency(deliverySalesTotal)}</div>
              <div className="text-xs text-slate-400">{formatNumber(deliveryOrdersTotal)} orders</div>
            </CardContent>
          </Card>
          <Card className="rounded-xl">
            <CardContent className="pt-4">
              <div className="text-sm text-slate-500">Total Deductions</div>
              <div className="text-2xl font-bold text-red-600">{formatCurrency(totalDeductions)}</div>
              <div className="text-xs text-slate-400">
                of delivery sales {formatPct(pct(totalDeductions, deliverySalesTotal))}
              </div>
            </CardContent>
          </Card>
          <Card className="rounded-xl">
            <CardContent className="pt-4">
              <div className="text-sm text-slate-500">Net Payout</div>
              <div className="text-2xl font-bold text-green-600">{formatCurrency(deliveryTotals.total_net_payout)}</div>
              <div className="text-xs text-slate-400">
                of delivery sales {formatPct(pct(deliveryTotals.total_net_payout, deliverySalesTotal))}
              </div>
            </CardContent>
          </Card>
          <Card className="rounded-xl">
            <CardContent className="pt-4">
              <div className="text-sm text-slate-500">Total Sales</div>
              <div className="text-2xl font-bold text-emerald-700">{formatCurrency(totalSales)}</div>
              <div className="text-xs text-slate-400">Dine-in + Delivery</div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Table 1: Dine-in / Takeaway / Self Delivery / Online Partners (Zomato Pay, Dineout) */}
      <Card className="rounded-2xl">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            Dine-in / Takeaway / Self Delivery - Month Wise
            <span className="text-sm font-normal text-slate-500">
              ({selectedCompany === "all" ? "All Companies" : selectedCompany})
            </span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex justify-center py-8">
              <Loader2 className="h-8 w-8 animate-spin text-slate-400" />
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow className="bg-slate-100 border-b-2">
                    <TableHead rowSpan={2} className="align-bottom">Month</TableHead>
                    <TableHead colSpan={3} className="text-center border-x bg-blue-50">Direct Channels</TableHead>
                    <TableHead colSpan={2} className="text-center border-x bg-purple-50">Online Partners (Dine-in)</TableHead>
                    <TableHead colSpan={2} className="text-center border-x bg-green-50">Payment Type</TableHead>
                    <TableHead rowSpan={2} className="text-right align-bottom font-bold">Total</TableHead>
                    <TableHead rowSpan={2} className="text-right align-bottom">Orders</TableHead>
                  </TableRow>
                  <TableRow className="bg-slate-50">
                    <TableHead className="text-right text-xs">Dine-in</TableHead>
                    <TableHead className="text-right text-xs">Takeaway</TableHead>
                    <TableHead className="text-right text-xs border-r">Self Delivery</TableHead>
                    <TableHead className="text-right text-xs text-purple-700">Zomato Pay</TableHead>
                    <TableHead className="text-right text-xs text-purple-700 border-r">Dineout</TableHead>
                    <TableHead className="text-right text-xs text-green-700">Cash</TableHead>
                    <TableHead className="text-right text-xs text-blue-700 border-r">Card/UPI</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {data?.dinein_monthly?.map((row, idx) => (
                    <TableRow key={row.month} className={idx % 2 === 0 ? "bg-white" : "bg-slate-50"}>
                      <TableCell className="font-medium">{row.month_name}</TableCell>
                      <TableCell className="text-right">{formatCurrency(row.dinein)}</TableCell>
                      <TableCell className="text-right">{formatCurrency(row.takeaway)}</TableCell>
                      <TableCell className="text-right border-r">{formatCurrency(row.self_delivery)}</TableCell>
                      <TableCell className="text-right text-purple-600">{formatCurrency(row.zomato_pay)}</TableCell>
                      <TableCell className="text-right text-purple-600 border-r">{formatCurrency(row.dineout)}</TableCell>
                      <TableCell className="text-right text-green-600">{formatCurrency(row.cash)}</TableCell>
                      <TableCell className="text-right text-blue-600 border-r">{formatCurrency(row.card)}</TableCell>
                      <TableCell className="text-right font-bold">{formatCurrency(row.total)}</TableCell>
                      <TableCell className="text-right text-slate-500">{formatNumber(row.orders)}</TableCell>
                    </TableRow>
                  ))}
                  {data?.dinein_monthly?.length > 0 && (
                    <TableRow className="bg-slate-100 font-bold border-t-2">
                      <TableCell>TOTAL</TableCell>
                      <TableCell className="text-right">{formatCurrency(dineinTotals.dinein)}</TableCell>
                      <TableCell className="text-right">{formatCurrency(dineinTotals.takeaway)}</TableCell>
                      <TableCell className="text-right border-r">{formatCurrency(dineinTotals.self_delivery)}</TableCell>
                      <TableCell className="text-right text-purple-700">{formatCurrency(dineinTotals.zomato_pay)}</TableCell>
                      <TableCell className="text-right text-purple-700 border-r">{formatCurrency(dineinTotals.dineout)}</TableCell>
                      <TableCell className="text-right text-green-700">{formatCurrency(dineinTotals.cash)}</TableCell>
                      <TableCell className="text-right text-blue-700 border-r">{formatCurrency(dineinTotals.card)}</TableCell>
                      <TableCell className="text-right text-lg">{formatCurrency(dineinTotals.total)}</TableCell>
                      <TableCell className="text-right">{formatNumber(dineinTotals.orders)}</TableCell>
                    </TableRow>
                  )}
                  {(!data?.dinein_monthly || data.dinein_monthly.length === 0) && (
                    <TableRow>
                      <TableCell colSpan={10} className="text-center py-8 text-slate-500">
                        No dine-in data available for this period
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Table 2: Delivery Portals */}
      <Card className="rounded-2xl">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            Delivery Portals (Swiggy / Zomato) - Month Wise
            <span className="text-sm font-normal text-slate-500">
              ({selectedCompany === "all" ? "All Companies" : selectedCompany})
            </span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex justify-center py-8">
              <Loader2 className="h-8 w-8 animate-spin text-slate-400" />
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table className="text-sm">
                <TableHeader>
                  <TableRow className="bg-slate-50">
                    <TableHead rowSpan={2} className="sticky left-0 bg-slate-50 z-10">Month</TableHead>
                    <TableHead colSpan={9} className="text-center border-l bg-orange-50">Swiggy</TableHead>
                    <TableHead colSpan={10} className="text-center border-l bg-red-50">Zomato</TableHead>
                  </TableRow>
                  <TableRow className="bg-slate-50 text-xs">
                    {/* Swiggy columns */}
                    <TableHead className="text-right border-l bg-orange-50">Sales</TableHead>
                    <TableHead className="text-right bg-orange-50">Orders</TableHead>
                    <TableHead className="text-right bg-orange-100">Commission</TableHead>
                    <TableHead className="text-right bg-orange-100">Conv.</TableHead>
                    <TableHead className="text-right bg-orange-100">Ad Charges</TableHead>
                    <TableHead className="text-right bg-orange-100">GST</TableHead>
                    <TableHead className="text-right bg-orange-100" title="TDS Calculated from POS (1% of Amount + Packaging)">TDS (Calc)</TableHead>
                    <TableHead className="text-right bg-orange-100" title="TDS Actual from Payout Reports">TDS (Act)</TableHead>
                    <TableHead className="text-right bg-orange-200 font-semibold">Net %</TableHead>
                    {/* Zomato columns */}
                    <TableHead className="text-right border-l bg-red-50">Sales</TableHead>
                    <TableHead className="text-right bg-red-50">Orders</TableHead>
                    <TableHead className="text-right bg-red-100">Commission</TableHead>
                    <TableHead className="text-right bg-red-100">Conv.</TableHead>
                    <TableHead className="text-right bg-red-100">Ad Charges</TableHead>
                    <TableHead className="text-right bg-red-100">Long Dist.</TableHead>
                    <TableHead className="text-right bg-red-100">GST</TableHead>
                    <TableHead className="text-right bg-red-100" title="TDS Calculated from POS (1% of Amount + Packaging)">TDS (Calc)</TableHead>
                    <TableHead className="text-right bg-red-100" title="TDS Actual from Payout Reports">TDS (Act)</TableHead>
                    <TableHead className="text-right bg-red-200 font-semibold">Net %</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {data?.delivery_monthly?.map((row, idx) => {
                    const swNetPayoutPct = row.swiggy_sales ? ((row.swiggy_net_payout || 0) / row.swiggy_sales) * 100 : 0;
                    const zoNetPayoutPct = row.zomato_sales ? ((row.zomato_net_payout || 0) / row.zomato_sales) * 100 : 0;
                    // TDS variance check - highlight if actual differs from calculated by more than 5%
                    const swTdsVariance = row.swiggy_tds_calculated > 0 ? Math.abs((row.swiggy_tds_actual || 0) - row.swiggy_tds_calculated) / row.swiggy_tds_calculated : 0;
                    const zoTdsVariance = row.zomato_tds_calculated > 0 ? Math.abs((row.zomato_tds_actual || 0) - row.zomato_tds_calculated) / row.zomato_tds_calculated : 0;
                    return (
                    <TableRow key={row.month} className={idx % 2 === 0 ? "bg-white" : "bg-slate-50"}>
                      <TableCell className="font-medium sticky left-0 bg-inherit z-10">{row.month_name}</TableCell>
                      {/* Swiggy */}
                      <TableCell className="text-right border-l text-orange-700 font-medium">{formatCurrency(row.swiggy_sales)}</TableCell>
                      <TableCell className="text-right text-orange-600">{formatNumber(row.swiggy_orders)}</TableCell>
                      <TableCell className="text-right text-orange-600">{formatCurrency(row.swiggy_commission)}</TableCell>
                      <TableCell className="text-right text-orange-600">{formatCurrency(row.swiggy_convenience)}</TableCell>
                      <TableCell className="text-right text-orange-600">{formatCurrency(row.swiggy_ad_charges)}</TableCell>
                      <TableCell className="text-right text-orange-600">{formatCurrency(row.swiggy_gst)}</TableCell>
                      <TableCell className="text-right text-purple-600">{formatCurrency(row.swiggy_tds_calculated)}</TableCell>
                      <TableCell className={`text-right ${swTdsVariance > 0.05 ? 'text-red-600 font-bold' : 'text-purple-600'}`} title={swTdsVariance > 0.05 ? 'TDS variance detected!' : ''}>{formatCurrency(row.swiggy_tds_actual)}</TableCell>
                      <TableCell className="text-right text-green-600 font-semibold">{formatPct(swNetPayoutPct)}</TableCell>
                      {/* Zomato */}
                      <TableCell className="text-right border-l text-red-700 font-medium">{formatCurrency(row.zomato_sales)}</TableCell>
                      <TableCell className="text-right text-red-600">{formatNumber(row.zomato_orders)}</TableCell>
                      <TableCell className="text-right text-red-600">{formatCurrency(row.zomato_commission)}</TableCell>
                      <TableCell className="text-right text-red-600">{formatCurrency(row.zomato_convenience)}</TableCell>
                      <TableCell className="text-right text-red-600">{formatCurrency(row.zomato_ad_charges)}</TableCell>
                      <TableCell className="text-right text-red-600">{formatCurrency(row.zomato_long_distance)}</TableCell>
                      <TableCell className="text-right text-red-600">{formatCurrency(row.zomato_gst)}</TableCell>
                      <TableCell className="text-right text-purple-600">{formatCurrency(row.zomato_tds_calculated)}</TableCell>
                      <TableCell className={`text-right ${zoTdsVariance > 0.05 ? 'text-red-600 font-bold' : 'text-purple-600'}`} title={zoTdsVariance > 0.05 ? 'TDS variance detected!' : ''}>{formatCurrency(row.zomato_tds_actual)}</TableCell>
                      <TableCell className="text-right text-green-600 font-semibold">{formatPct(zoNetPayoutPct)}</TableCell>
                    </TableRow>
                  )})}
                  {data?.delivery_monthly?.length > 0 && (
                    <TableRow className="bg-slate-100 font-bold border-t-2">
                      <TableCell className="sticky left-0 bg-slate-100 z-10">TOTAL</TableCell>
                      {/* Swiggy Totals */}
                      <TableCell className="text-right border-l text-orange-800">{formatCurrency(deliveryTotals.swiggy_sales)}</TableCell>
                      <TableCell className="text-right text-orange-700">{formatNumber(deliveryTotals.swiggy_orders)}</TableCell>
                      <TableCell className="text-right text-orange-700">{formatCurrency(deliveryTotals.swiggy_commission)}</TableCell>
                      <TableCell className="text-right text-orange-700">{formatCurrency(deliveryTotals.swiggy_convenience)}</TableCell>
                      <TableCell className="text-right text-orange-700">{formatCurrency(deliveryTotals.swiggy_ad_charges)}</TableCell>
                      <TableCell className="text-right text-orange-700">{formatCurrency(deliveryTotals.swiggy_gst)}</TableCell>
                      <TableCell className="text-right text-purple-700">{formatCurrency(deliveryTotals.swiggy_tds_calculated)}</TableCell>
                      <TableCell className="text-right text-purple-700">{formatCurrency(deliveryTotals.swiggy_tds_actual)}</TableCell>
                      <TableCell className="text-right text-green-700 font-bold">{formatPct(pct(deliveryTotals.swiggy_net_payout, deliveryTotals.swiggy_sales))}</TableCell>
                      {/* Zomato Totals */}
                      <TableCell className="text-right border-l text-red-800">{formatCurrency(deliveryTotals.zomato_sales)}</TableCell>
                      <TableCell className="text-right text-red-700">{formatNumber(deliveryTotals.zomato_orders)}</TableCell>
                      <TableCell className="text-right text-red-700">{formatCurrency(deliveryTotals.zomato_commission)}</TableCell>
                      <TableCell className="text-right text-red-700">{formatCurrency(deliveryTotals.zomato_convenience)}</TableCell>
                      <TableCell className="text-right text-red-700">{formatCurrency(deliveryTotals.zomato_ad_charges)}</TableCell>
                      <TableCell className="text-right text-red-700">{formatCurrency(deliveryTotals.zomato_long_distance)}</TableCell>
                      <TableCell className="text-right text-red-700">{formatCurrency(deliveryTotals.zomato_gst)}</TableCell>
                      <TableCell className="text-right text-purple-700">{formatCurrency(deliveryTotals.zomato_tds_calculated)}</TableCell>
                      <TableCell className="text-right text-purple-700">{formatCurrency(deliveryTotals.zomato_tds_actual)}</TableCell>
                      <TableCell className="text-right text-green-700 font-bold">{formatPct(pct(deliveryTotals.zomato_net_payout, deliveryTotals.zomato_sales))}</TableCell>
                    </TableRow>
                  )}
                  {(!data?.delivery_monthly || data.delivery_monthly.length === 0) && (
                    <TableRow>
                      <TableCell colSpan={20} className="text-center py-8 text-slate-500">
                        No delivery data available for this period
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Company-wise Summary */}
      {selectedCompany === "all" && data?.company_summary && (
        <Card className="rounded-2xl">
          <CardHeader>
            <CardTitle>Company-wise Summary</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <Table className="text-sm">
                <TableHeader>
                  <TableRow className="bg-slate-50">
                    <TableHead rowSpan={2} className="align-bottom">Company</TableHead>
                    <TableHead colSpan={2} className="text-center border-x">Sales</TableHead>
                    <TableHead colSpan={4} className="text-center border-x bg-red-50">Deductions</TableHead>
                    <TableHead colSpan={3} className="text-center border-x bg-amber-50">GST (Inline Portals)</TableHead>
                    <TableHead rowSpan={2} className="text-right align-bottom bg-green-50 font-bold">Net Payout</TableHead>
                  </TableRow>
                  <TableRow className="bg-slate-50 text-xs">
                    <TableHead className="text-right">Delivery</TableHead>
                    <TableHead className="text-right border-r">Dine-in</TableHead>
                    <TableHead className="text-right bg-red-50">Commission</TableHead>
                    <TableHead className="text-right bg-red-50">Convenience</TableHead>
                    <TableHead className="text-right bg-red-50">Ad Charges</TableHead>
                    <TableHead className="text-right bg-red-50 border-r">Long Distance</TableHead>
                    <TableHead className="text-right bg-amber-50">On Comm+Conv</TableHead>
                    <TableHead className="text-right bg-amber-50">On Ads</TableHead>
                    <TableHead className="text-right bg-amber-50 border-r">On LD</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {data.company_summary.map((row, idx) => (
                    <TableRow key={row.company} className={idx % 2 === 0 ? "bg-white" : "bg-slate-50"}>
                      <TableCell className="font-bold">{row.company}</TableCell>
                      <TableCell className="text-right">{formatCurrency(row.delivery_total)}</TableCell>
                      <TableCell className="text-right border-r">{formatCurrency(row.dinein_total)}</TableCell>
                      <TableCell className="text-right text-red-600">{formatCurrency(row.total_commission)}</TableCell>
                      <TableCell className="text-right text-red-600">{formatCurrency(row.total_convenience)}</TableCell>
                      <TableCell className="text-right text-red-600">{formatCurrency(row.total_ad_charges)}</TableCell>
                      <TableCell className="text-right text-red-600 border-r">{formatCurrency(row.total_long_distance)}</TableCell>
                      <TableCell className="text-right text-amber-600">{formatCurrency(row.gst_on_commission)}</TableCell>
                      <TableCell className="text-right text-amber-600">{formatCurrency(row.gst_on_ads)}</TableCell>
                      <TableCell className="text-right text-amber-600 border-r">{formatCurrency(row.gst_on_long_distance)}</TableCell>
                      <TableCell className="text-right font-bold text-green-700">{formatCurrency(row.net_payout)}</TableCell>
                    </TableRow>
                  ))}

                  {companyTotals && (
                    <TableRow className="bg-slate-100 font-bold border-t-2">
                      <TableCell>TOTAL</TableCell>
                      <TableCell className="text-right">{formatCurrency(companyTotals.delivery_total)}</TableCell>
                      <TableCell className="text-right border-r">{formatCurrency(companyTotals.dinein_total)}</TableCell>
                      <TableCell className="text-right text-red-700">{formatCurrency(companyTotals.total_commission)}</TableCell>
                      <TableCell className="text-right text-red-700">{formatCurrency(companyTotals.total_convenience)}</TableCell>
                      <TableCell className="text-right text-red-700">{formatCurrency(companyTotals.total_ad_charges)}</TableCell>
                      <TableCell className="text-right text-red-700 border-r">{formatCurrency(companyTotals.total_long_distance)}</TableCell>
                      <TableCell className="text-right text-amber-700">{formatCurrency(companyTotals.gst_on_commission)}</TableCell>
                      <TableCell className="text-right text-amber-700">{formatCurrency(companyTotals.gst_on_ads)}</TableCell>
                      <TableCell className="text-right text-amber-700 border-r">{formatCurrency(companyTotals.gst_on_long_distance)}</TableCell>
                      <TableCell className="text-right font-bold text-lg text-green-700">{formatCurrency(companyTotals.net_payout)}</TableCell>
                    </TableRow>
                  )}

                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
