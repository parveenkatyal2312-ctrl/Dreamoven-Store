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
import { Loader2, RefreshCw, AlertTriangle, CheckCircle, ArrowRight, Calendar } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

const formatCurrency = (amount) => {
  if (!amount && amount !== 0) return "₹0";
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
};

const formatPct = (val) => {
  if (val === null || val === undefined || Number.isNaN(val)) return "-";
  return `${val.toFixed(2)}%`;
};

const COMPANIES = ["DO", "KINFOLK", "DOPL"];

// Generate financial years
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

const VarianceCell = ({ calculated, actual, type = "deduction" }) => {
  if (!actual || actual === 0) {
    return <span className="text-slate-400">-</span>;
  }
  
  const variance = actual - calculated;
  const variancePct = calculated > 0 ? (variance / calculated) * 100 : 0;
  
  // For deductions: actual > calculated is bad (they charged more)
  // For payouts: actual < calculated is bad (they paid less)
  const isOvercharged = type === "deduction" ? variance > 0 : variance < 0;
  const isOk = Math.abs(variancePct) < 2;
  
  const color = isOk ? "text-green-600" : isOvercharged ? "text-red-600" : "text-amber-600";
  const sign = variance > 0 ? "+" : "";
  
  return (
    <span className={`font-medium ${color}`}>
      {sign}{formatCurrency(variance)}
      <span className="text-xs ml-1">({sign}{variancePct.toFixed(1)}%)</span>
    </span>
  );
};

const DeductionRow = ({ label, calculated, actual, isHeader = false, platform = "swiggy" }) => {
  const bgColor = platform === "swiggy" ? "bg-orange-50" : "bg-red-50";
  const textColor = platform === "swiggy" ? "text-orange-700" : "text-red-700";
  
  if (isHeader) {
    return (
      <TableRow className={bgColor}>
        <TableCell className="font-bold">{label}</TableCell>
        <TableCell className="text-right font-bold">Calculated</TableCell>
        <TableCell className="text-right font-bold">Actual</TableCell>
        <TableCell className="text-right font-bold">Variance</TableCell>
      </TableRow>
    );
  }
  
  return (
    <TableRow>
      <TableCell className="font-medium">{label}</TableCell>
      <TableCell className="text-right">{formatCurrency(calculated)}</TableCell>
      <TableCell className={`text-right font-medium ${textColor}`}>{actual > 0 ? formatCurrency(actual) : "-"}</TableCell>
      <TableCell className="text-right">
        <VarianceCell calculated={calculated} actual={actual} type="deduction" />
      </TableCell>
    </TableRow>
  );
};

export default function CommissionReconciliation() {
  const [selectedFY, setSelectedFY] = useState(generateFYOptions()[0].value);
  const [selectedCompany, setSelectedCompany] = useState("DO");
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState(null);
  const [weeklyData, setWeeklyData] = useState(null);
  const [error, setError] = useState(null);
  const [selectedMonth, setSelectedMonth] = useState(null);
  const [viewMode, setViewMode] = useState("monthly"); // "monthly" or "weekly"

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
      
      // Auto-select month with payout data
      if (res.data?.delivery_monthly) {
        const monthWithData = res.data.delivery_monthly.find(m => 
          (m.swiggy_net_payout_actual > 0) || (m.zomato_net_payout_actual > 0)
        );
        if (monthWithData) {
          setSelectedMonth(monthWithData.month);
        }
      }
      
      // Fetch weekly payout data
      const weeklyRes = await api.get("/reports/weekly-payouts", { params: { company: selectedCompany, fy: selectedFY } });
      setWeeklyData(weeklyRes.data);
    } catch (e) {
      setError(e?.response?.data?.detail || "Failed to fetch data");
    } finally {
      setLoading(false);
    }
  }, [selectedFY, selectedCompany]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // Get selected month data
  const monthData = data?.delivery_monthly?.find(m => m.month === selectedMonth) || {};
  const hasSwiggyData = (monthData.swiggy_net_payout_actual || 0) > 0;
  const hasZomatoData = (monthData.zomato_net_payout_actual || 0) > 0;

  // Get months with payout data
  const monthsWithPayouts = data?.delivery_monthly?.filter(m => 
    (m.swiggy_net_payout_actual > 0) || (m.zomato_net_payout_actual > 0)
  ) || [];

  return (
    <div className="space-y-6" data-testid="commission-reconciliation-page">
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-2xl font-bold">Deduction Reconciliation</h1>
          <p className="text-slate-500">Compare calculated vs actual deductions from payout files</p>
        </div>
        <div className="flex gap-3 flex-wrap">
          <Select value={selectedFY} onValueChange={setSelectedFY}>
            <SelectTrigger className="w-36" data-testid="fy-selector">
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
            <SelectTrigger className="w-32" data-testid="company-selector">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {COMPANIES.map((c) => (
                <SelectItem key={c} value={c}>{c}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          
          {monthsWithPayouts.length > 0 && (
            <Select value={selectedMonth || ""} onValueChange={setSelectedMonth}>
              <SelectTrigger className="w-40" data-testid="month-selector">
                <SelectValue placeholder="Select Month" />
              </SelectTrigger>
              <SelectContent>
                {monthsWithPayouts.map((m) => (
                  <SelectItem key={m.month} value={m.month}>{m.month_name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}
          
          {/* Monthly/Weekly View Toggle */}
          <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-lg">
            <Button 
              size="sm" 
              variant={viewMode === "monthly" ? "default" : "ghost"}
              onClick={() => setViewMode("monthly")}
              className="px-3 py-1 h-8"
            >
              Monthly
            </Button>
            <Button 
              size="sm" 
              variant={viewMode === "weekly" ? "default" : "ghost"}
              onClick={() => setViewMode("weekly")}
              className="px-3 py-1 h-8"
            >
              Weekly
            </Button>
          </div>
          
          <Button onClick={fetchData} disabled={loading} variant="outline" data-testid="refresh-btn">
            {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <RefreshCw className="h-4 w-4" />}
          </Button>
        </div>
      </div>

      {error && (
        <div className="bg-red-50 text-red-700 p-4 rounded-xl">
          {error}
        </div>
      )}

      {loading ? (
        <div className="flex justify-center py-8">
          <Loader2 className="h-8 w-8 animate-spin text-slate-400" />
        </div>
      ) : monthsWithPayouts.length === 0 ? (
        <Card className="rounded-2xl">
          <CardContent className="py-8 text-center">
            <AlertTriangle className="h-12 w-12 mx-auto text-amber-500 mb-4" />
            <h3 className="text-lg font-medium mb-2">No Payout Files Found</h3>
            <p className="text-slate-500">Upload Swiggy/Zomato payout files to see deduction comparison</p>
          </CardContent>
        </Card>
      ) : (
        <>
          {/* Formula Reference */}
          <Card className="rounded-2xl bg-slate-50">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm">Payout Calculation Formula</CardTitle>
            </CardHeader>
            <CardContent className="text-xs space-y-2">
              <div className="flex items-center gap-2 flex-wrap">
                <Badge variant="outline" className="bg-red-50 text-red-700">Zomato</Badge>
                <span className="font-medium">Net Sales (A)</span>
                <span className="text-slate-400">−</span>
                <span>Commission</span>
                <span className="text-slate-400">−</span>
                <span>Payment Mech Fee (1.93%)</span>
                <span className="text-slate-400">−</span>
                <span>Long Distance</span>
                <span className="text-slate-400">−</span>
                <span>GST 18%</span>
                <span className="text-slate-400">−</span>
                <span>GST 5% (9(5))</span>
                <span className="text-slate-400">−</span>
                <span>TDS</span>
                <span className="text-slate-400">−</span>
                <span>Ads</span>
                <ArrowRight className="h-3 w-3" />
                <span className="font-bold">Net Payout</span>
              </div>
              <div className="flex items-center gap-2 flex-wrap">
                <Badge variant="outline" className="bg-orange-50 text-orange-700">Swiggy</Badge>
                <span className="font-medium">Sales + 5% GST</span>
                <span className="text-slate-400">−</span>
                <span>Commission</span>
                <span className="text-slate-400">−</span>
                <span>Convenience</span>
                <span className="text-slate-400">−</span>
                <span>Ad Charges</span>
                <span className="text-slate-400">−</span>
                <span>GST (18%)</span>
                <span className="text-slate-400">−</span>
                <span>TDS (0.1% of Sales/1.05)</span>
                <ArrowRight className="h-3 w-3" />
                <span className="font-bold">Net Payout</span>
              </div>
            </CardContent>
          </Card>

          {/* Month Detail */}
          {viewMode === "monthly" && selectedMonth && (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Swiggy Breakdown */}
              <Card className="rounded-2xl border-orange-200">
                <CardHeader className="bg-orange-50 rounded-t-2xl">
                  <CardTitle className="text-orange-700 flex items-center justify-between">
                    <span>Swiggy - {monthData.month_name}</span>
                    {hasSwiggyData ? (
                      <Badge className={
                        (monthData.swiggy_net_payout_actual - monthData.swiggy_net_payout) < 0 
                          ? "bg-red-100 text-red-700" 
                          : "bg-green-100 text-green-700"
                      }>
                        {(monthData.swiggy_net_payout_actual - monthData.swiggy_net_payout) < 0 
                          ? <AlertTriangle className="h-3 w-3 mr-1" />
                          : <CheckCircle className="h-3 w-3 mr-1" />
                        }
                        {formatCurrency(monthData.swiggy_net_payout_actual - monthData.swiggy_net_payout)}
                      </Badge>
                    ) : (
                      <Badge variant="outline" className="text-slate-400">No Payout Data</Badge>
                    )}
                  </CardTitle>
                </CardHeader>
                <CardContent className="pt-4">
                  <Table>
                    <TableHeader>
                      <TableRow className="bg-orange-50">
                        <TableHead>Item</TableHead>
                        <TableHead className="text-right">Calculated</TableHead>
                        <TableHead className="text-right">Actual</TableHead>
                        <TableHead className="text-right">Variance</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      <TableRow className="bg-orange-50/50">
                        <TableCell className="font-medium">
                          Sales + 5% GST
                          <div className="text-xs text-slate-400">Commission Base</div>
                        </TableCell>
                        <TableCell className="text-right font-bold">{formatCurrency(monthData.swiggy_sales_with_gst || monthData.swiggy_sales * 1.05)}</TableCell>
                        <TableCell className="text-right font-bold text-orange-700">{hasSwiggyData ? formatCurrency(monthData.swiggy_gross_from_payout) : "-"}</TableCell>
                        <TableCell className="text-right">
                          {hasSwiggyData && <VarianceCell calculated={monthData.swiggy_sales_with_gst || monthData.swiggy_sales * 1.05} actual={monthData.swiggy_gross_from_payout} type="payout" />}
                        </TableCell>
                      </TableRow>
                      <DeductionRow 
                        label="(−) Commission" 
                        calculated={monthData.swiggy_commission} 
                        actual={monthData.swiggy_commission_actual}
                        platform="swiggy"
                      />
                      <DeductionRow 
                        label="(−) Convenience Fee" 
                        calculated={monthData.swiggy_convenience} 
                        actual={0}  // Swiggy doesn't break this out separately
                        platform="swiggy"
                      />
                      <DeductionRow 
                        label="(−) Ad Charges" 
                        calculated={monthData.swiggy_ad_charges} 
                        actual={monthData.swiggy_ad_charges_actual}
                        platform="swiggy"
                      />
                      <DeductionRow 
                        label="(−) GST (18%)" 
                        calculated={monthData.swiggy_gst} 
                        actual={monthData.swiggy_gst_actual}
                        platform="swiggy"
                      />
                      <DeductionRow 
                        label="(−) TDS (0.1%)" 
                        calculated={monthData.swiggy_tds_calculated} 
                        actual={monthData.swiggy_tds_actual}
                        platform="swiggy"
                      />
                      {monthData.swiggy_hidden_deduction > 0 && (
                        <TableRow className="bg-amber-50">
                          <TableCell className="font-medium text-amber-700">
                            (−) Platform/Conv. Fee
                            <div className="text-xs text-amber-500">Hidden in payout</div>
                          </TableCell>
                          <TableCell className="text-right text-slate-400">Not in POS</TableCell>
                          <TableCell className="text-right font-medium text-amber-700">{formatCurrency(monthData.swiggy_hidden_deduction)}</TableCell>
                          <TableCell className="text-right text-amber-600">-</TableCell>
                        </TableRow>
                      )}
                      {monthData.swiggy_additions > 0 && (
                        <TableRow className="bg-green-50/50">
                          <TableCell className="font-medium text-green-700">
                            (+) Additions/Credits
                            <div className="text-xs text-green-500">Cancellation compensation etc.</div>
                          </TableCell>
                          <TableCell className="text-right text-slate-400">-</TableCell>
                          <TableCell className="text-right font-medium text-green-700">+{formatCurrency(monthData.swiggy_additions)}</TableCell>
                          <TableCell className="text-right text-green-600">-</TableCell>
                        </TableRow>
                      )}
                      <TableRow className="bg-green-50 font-bold border-t-2">
                        <TableCell>= Net Payout</TableCell>
                        <TableCell className="text-right">{formatCurrency(monthData.swiggy_net_payout)}</TableCell>
                        <TableCell className="text-right text-green-700">{hasSwiggyData ? formatCurrency(monthData.swiggy_net_payout_actual) : "-"}</TableCell>
                        <TableCell className="text-right">
                          {hasSwiggyData && <VarianceCell calculated={monthData.swiggy_net_payout} actual={monthData.swiggy_net_payout_actual} type="payout" />}
                        </TableCell>
                      </TableRow>
                    </TableBody>
                  </Table>
                </CardContent>
              </Card>

              {/* Zomato Breakdown */}
              <Card className="rounded-2xl border-red-200">
                <CardHeader className="bg-red-50 rounded-t-2xl">
                  <CardTitle className="text-red-700 flex items-center justify-between">
                    <span>Zomato - {monthData.month_name}</span>
                    {hasZomatoData ? (
                      <Badge className={
                        (monthData.zomato_net_payout_actual - monthData.zomato_net_payout) < 0 
                          ? "bg-red-100 text-red-700" 
                          : "bg-green-100 text-green-700"
                      }>
                        {(monthData.zomato_net_payout_actual - monthData.zomato_net_payout) < 0 
                          ? <AlertTriangle className="h-3 w-3 mr-1" />
                          : <CheckCircle className="h-3 w-3 mr-1" />
                        }
                        {formatCurrency(monthData.zomato_net_payout_actual - monthData.zomato_net_payout)}
                      </Badge>
                    ) : (
                      <Badge variant="outline" className="text-slate-400">No Payout Data</Badge>
                    )}
                  </CardTitle>
                </CardHeader>
                <CardContent className="pt-4">
                  <Table>
                    <TableHeader>
                      <TableRow className="bg-red-50">
                        <TableHead>Item</TableHead>
                        <TableHead className="text-right">Calculated</TableHead>
                        <TableHead className="text-right">Actual</TableHead>
                        <TableHead className="text-right">Variance</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {/* A. Net Order Value */}
                      <TableRow className="bg-red-50/50">
                        <TableCell className="font-medium">A. Gross Sales (POS)</TableCell>
                        <TableCell className="text-right font-bold">{formatCurrency(monthData.zomato_sales)}</TableCell>
                        <TableCell className="text-right font-bold text-red-700">{hasZomatoData ? formatCurrency(monthData.zomato_gross_from_payout) : "-"}</TableCell>
                        <TableCell className="text-right">
                          {hasZomatoData && <VarianceCell calculated={monthData.zomato_sales} actual={monthData.zomato_gross_from_payout} type="payout" />}
                        </TableCell>
                      </TableRow>
                      
                      {/* Section C: Service Fees */}
                      <TableRow className="bg-slate-100">
                        <TableCell colSpan={4} className="font-bold text-slate-600 text-xs py-1">
                          C. SERVICE FEES & PAYMENT MECHANISM FEES
                        </TableCell>
                      </TableRow>
                      <DeductionRow 
                        label="(−) Base Service Fee (Commission)" 
                        calculated={monthData.zomato_commission} 
                        actual={monthData.zomato_commission_actual}
                        platform="zomato"
                      />
                      <DeductionRow 
                        label="(−) Payment Mechanism Fee (1.93%)" 
                        calculated={monthData.zomato_payment_mechanism_fee || 0} 
                        actual={monthData.zomato_payment_mechanism_fee_actual || 0}
                        platform="zomato"
                      />
                      <DeductionRow 
                        label="(−) Long Distance Fee" 
                        calculated={monthData.zomato_long_distance} 
                        actual={monthData.zomato_long_distance_actual}
                        platform="zomato"
                      />
                      {(monthData.zomato_long_distance_discount_actual > 0 || monthData.zomato_service_fee_discount_actual > 0) && (
                        <TableRow>
                          <TableCell className="font-medium text-green-600">(+) Discounts on Fees</TableCell>
                          <TableCell className="text-right text-slate-400">-</TableCell>
                          <TableCell className="text-right text-green-600">
                            +{formatCurrency((monthData.zomato_long_distance_discount_actual || 0) + (monthData.zomato_service_fee_discount_actual || 0))}
                          </TableCell>
                          <TableCell className="text-right">-</TableCell>
                        </TableRow>
                      )}
                      
                      {/* Section D: Government Charges */}
                      <TableRow className="bg-slate-100">
                        <TableCell colSpan={4} className="font-bold text-slate-600 text-xs py-1">
                          D. GOVERNMENT CHARGES
                        </TableCell>
                      </TableRow>
                      <DeductionRow 
                        label="(−) GST on Service Fees (18%)" 
                        calculated={monthData.zomato_gst} 
                        actual={monthData.zomato_gst_actual}
                        platform="zomato"
                      />
                      <DeductionRow 
                        label="(−) GST Paid by Zomato (5% u/s 9(5))" 
                        calculated={monthData.zomato_gst_paid_by_zomato || 0} 
                        actual={monthData.zomato_gst_paid_by_zomato_actual || 0}
                        platform="zomato"
                      />
                      <DeductionRow 
                        label="(−) TDS 194O (0.1%)" 
                        calculated={monthData.zomato_tds_calculated} 
                        actual={monthData.zomato_tds_actual}
                        platform="zomato"
                      />
                      {(monthData.zomato_tcs_actual > 0) && (
                        <DeductionRow 
                          label="(−) TCS IGST" 
                          calculated={0} 
                          actual={monthData.zomato_tcs_actual}
                          platform="zomato"
                        />
                      )}
                      
                      {/* Section F: Ads */}
                      <TableRow className="bg-slate-100">
                        <TableCell colSpan={4} className="font-bold text-slate-600 text-xs py-1">
                          F. INVESTMENT IN GROWTH SERVICES
                        </TableCell>
                      </TableRow>
                      <DeductionRow 
                        label="(−) Ad Charges (inc. 18% GST)" 
                        calculated={monthData.zomato_ad_charges} 
                        actual={monthData.zomato_ad_charges_actual}
                        platform="zomato"
                      />
                      
                      {monthData.zomato_hidden_deduction > 0 && (
                        <TableRow className="bg-amber-50">
                          <TableCell className="font-medium text-amber-700">
                            (−) Other Deductions
                            <div className="text-xs text-amber-500">Hyperpure, Misc etc.</div>
                          </TableCell>
                          <TableCell className="text-right text-slate-400">Not in POS</TableCell>
                          <TableCell className="text-right font-medium text-amber-700">{formatCurrency(monthData.zomato_hidden_deduction)}</TableCell>
                          <TableCell className="text-right text-amber-600">-</TableCell>
                        </TableRow>
                      )}
                      {monthData.zomato_additions > 0 && (
                        <TableRow className="bg-green-50/50">
                          <TableCell className="font-medium text-green-700">
                            (+) Additions/Credits
                            <div className="text-xs text-green-500">Cancellation compensation etc.</div>
                          </TableCell>
                          <TableCell className="text-right text-slate-400">-</TableCell>
                          <TableCell className="text-right font-medium text-green-700">+{formatCurrency(monthData.zomato_additions)}</TableCell>
                          <TableCell className="text-right text-green-600">-</TableCell>
                        </TableRow>
                      )}
                      <TableRow className="bg-green-50 font-bold border-t-2">
                        <TableCell>= Net Payout</TableCell>
                        <TableCell className="text-right">{formatCurrency(monthData.zomato_net_payout)}</TableCell>
                        <TableCell className="text-right text-green-700">{hasZomatoData ? formatCurrency(monthData.zomato_net_payout_actual) : "-"}</TableCell>
                        <TableCell className="text-right">
                          {hasZomatoData && <VarianceCell calculated={monthData.zomato_net_payout} actual={monthData.zomato_net_payout_actual} type="payout" />}
                        </TableCell>
                      </TableRow>
                    </TableBody>
                  </Table>
                </CardContent>
              </Card>
            </div>
          )}

          {/* Summary Table - All Months */}
          <Card className="rounded-2xl">
            <CardHeader>
              <CardTitle>Monthly Payout Summary</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <Table className="text-sm">
                  <TableHeader>
                    <TableRow className="bg-slate-50">
                      <TableHead rowSpan={2} className="align-bottom">Month</TableHead>
                      <TableHead colSpan={4} className="text-center border-x bg-orange-50">Swiggy</TableHead>
                      <TableHead colSpan={4} className="text-center border-x bg-red-50">Zomato</TableHead>
                    </TableRow>
                    <TableRow className="bg-slate-50 text-xs">
                      <TableHead className="text-right bg-orange-50">Sales</TableHead>
                      <TableHead className="text-right bg-orange-50">Payout (Calc)</TableHead>
                      <TableHead className="text-right bg-orange-100">Payout (Actual)</TableHead>
                      <TableHead className="text-right bg-orange-50 border-r">Variance</TableHead>
                      <TableHead className="text-right bg-red-50">Sales</TableHead>
                      <TableHead className="text-right bg-red-50">Payout (Calc)</TableHead>
                      <TableHead className="text-right bg-red-100">Payout (Actual)</TableHead>
                      <TableHead className="text-right bg-red-50">Variance</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {data?.delivery_monthly?.map((row, idx) => {
                      const swVariance = (row.swiggy_net_payout_actual || 0) - (row.swiggy_net_payout || 0);
                      const zoVariance = (row.zomato_net_payout_actual || 0) - (row.zomato_net_payout || 0);
                      const hasSwData = (row.swiggy_net_payout_actual || 0) > 0;
                      const hasZoData = (row.zomato_net_payout_actual || 0) > 0;
                      const isSelected = row.month === selectedMonth;
                      
                      return (
                        <TableRow 
                          key={row.month} 
                          className={`${idx % 2 === 0 ? "bg-white" : "bg-slate-50"} ${isSelected ? "ring-2 ring-blue-500" : ""} cursor-pointer hover:bg-blue-50`}
                          onClick={() => setSelectedMonth(row.month)}
                        >
                          <TableCell className="font-medium">{row.month_name}</TableCell>
                          {/* Swiggy */}
                          <TableCell className="text-right">{formatCurrency(row.swiggy_sales)}</TableCell>
                          <TableCell className="text-right">{formatCurrency(row.swiggy_net_payout)}</TableCell>
                          <TableCell className="text-right font-medium text-green-600">
                            {hasSwData ? formatCurrency(row.swiggy_net_payout_actual) : "-"}
                          </TableCell>
                          <TableCell className={`text-right border-r ${swVariance < 0 ? "text-red-600" : swVariance > 0 ? "text-green-600" : ""}`}>
                            {hasSwData ? formatCurrency(swVariance) : "-"}
                          </TableCell>
                          {/* Zomato */}
                          <TableCell className="text-right">{formatCurrency(row.zomato_sales)}</TableCell>
                          <TableCell className="text-right">{formatCurrency(row.zomato_net_payout)}</TableCell>
                          <TableCell className="text-right font-medium text-green-600">
                            {hasZoData ? formatCurrency(row.zomato_net_payout_actual) : "-"}
                          </TableCell>
                          <TableCell className={`text-right ${zoVariance < 0 ? "text-red-600" : zoVariance > 0 ? "text-green-600" : ""}`}>
                            {hasZoData ? formatCurrency(zoVariance) : "-"}
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>

          {/* Legend */}
          <Card className="rounded-2xl bg-blue-50 border-blue-200">
            <CardContent className="pt-4">
              <div className="flex gap-3">
                <div className="text-blue-500 mt-0.5">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                  </svg>
                </div>
                <div className="text-sm text-blue-800">
                  <div className="font-medium mb-1">How to read this report:</div>
                  <ul className="list-disc list-inside space-y-1 text-blue-700">
                    <li><strong>Calculated:</strong> Based on your POS sales and agreed commission rates</li>
                    <li><strong>Actual:</strong> What platform actually deducted as per their payout files</li>
                    <li><span className="text-green-600 font-medium">Green variance</span> = You received more than expected</li>
                    <li><span className="text-red-600 font-medium">Red variance</span> = You received less than expected (potential discrepancy)</li>
                    <li>Click on any month row to see detailed breakdown</li>
                  </ul>
                </div>
              </div>
            </CardContent>
          </Card>
          
          {/* Weekly View */}
          {viewMode === "weekly" && weeklyData?.weekly_payouts && (
            <Card className="rounded-2xl">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Calendar className="h-5 w-5" />
                  Weekly Payout Breakdown
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-6">
                  {/* Zomato Weekly */}
                  <div>
                    <h3 className="text-lg font-semibold text-red-700 mb-3 flex items-center gap-2">
                      <Badge className="bg-red-100 text-red-700">Zomato</Badge>
                      Weekly Payouts (Mon-Sun)
                    </h3>
                    <div className="overflow-x-auto">
                      <Table>
                        <TableHeader>
                          <TableRow className="bg-red-50">
                            <TableHead>Week</TableHead>
                            <TableHead className="text-right">Gross Sales</TableHead>
                            <TableHead className="text-right">Commission</TableHead>
                            <TableHead className="text-right">PMF</TableHead>
                            <TableHead className="text-right">Long Dist.</TableHead>
                            <TableHead className="text-right">GST 18%</TableHead>
                            <TableHead className="text-right">GST 5%</TableHead>
                            <TableHead className="text-right">TDS</TableHead>
                            <TableHead className="text-right">Ads</TableHead>
                            <TableHead className="text-right">Net Payout</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {weeklyData.weekly_payouts
                            .filter(w => w.platform === "zomato" && !w.is_split)
                            .map((week, idx) => (
                              <TableRow key={idx} className={week.is_split ? "bg-red-50/30" : ""}>
                                <TableCell className="font-medium">
                                  {week.payout_cycle}
                                  {week.is_split && <Badge variant="outline" className="ml-2 text-xs">Split</Badge>}
                                </TableCell>
                                <TableCell className="text-right">{formatCurrency(week.gross_order_value)}</TableCell>
                                <TableCell className="text-right text-red-600">-{formatCurrency(week.commission)}</TableCell>
                                <TableCell className="text-right text-red-600">-{formatCurrency(week.payment_mechanism_fee)}</TableCell>
                                <TableCell className="text-right text-red-600">-{formatCurrency(week.long_distance_charges)}</TableCell>
                                <TableCell className="text-right text-red-600">-{formatCurrency(week.gst_on_commission)}</TableCell>
                                <TableCell className="text-right text-red-600">-{formatCurrency(week.gst_paid_by_zomato)}</TableCell>
                                <TableCell className="text-right text-red-600">-{formatCurrency(week.tds)}</TableCell>
                                <TableCell className="text-right text-red-600">-{formatCurrency(week.ad_charges)}</TableCell>
                                <TableCell className="text-right font-bold text-green-600">{formatCurrency(week.net_payout)}</TableCell>
                              </TableRow>
                            ))}
                          {/* Split records */}
                          {weeklyData.weekly_payouts
                            .filter(w => w.platform === "zomato" && w.is_split)
                            .map((week, idx) => (
                              <TableRow key={`split-${idx}`} className="bg-amber-50/50 border-l-4 border-amber-400">
                                <TableCell className="font-medium">
                                  <span className="text-amber-700">↳ {week.payout_cycle}</span>
                                  <Badge variant="outline" className="ml-2 text-xs bg-amber-100">
                                    Split from {week.original_payout_cycle}
                                  </Badge>
                                </TableCell>
                                <TableCell className="text-right">{formatCurrency(week.gross_order_value)}</TableCell>
                                <TableCell className="text-right text-red-600">-{formatCurrency(week.commission)}</TableCell>
                                <TableCell className="text-right text-red-600">-{formatCurrency(week.payment_mechanism_fee)}</TableCell>
                                <TableCell className="text-right text-red-600">-{formatCurrency(week.long_distance_charges)}</TableCell>
                                <TableCell className="text-right text-red-600">-{formatCurrency(week.gst_on_commission)}</TableCell>
                                <TableCell className="text-right text-red-600">-{formatCurrency(week.gst_paid_by_zomato)}</TableCell>
                                <TableCell className="text-right text-red-600">-{formatCurrency(week.tds)}</TableCell>
                                <TableCell className="text-right text-red-600">-{formatCurrency(week.ad_charges)}</TableCell>
                                <TableCell className="text-right font-bold text-green-600">{formatCurrency(week.net_payout)}</TableCell>
                              </TableRow>
                            ))}
                        </TableBody>
                      </Table>
                    </div>
                  </div>
                  
                  {/* Swiggy Weekly */}
                  <div>
                    <h3 className="text-lg font-semibold text-orange-700 mb-3 flex items-center gap-2">
                      <Badge className="bg-orange-100 text-orange-700">Swiggy</Badge>
                      Weekly Payouts (Sun-Sat)
                    </h3>
                    <div className="overflow-x-auto">
                      <Table>
                        <TableHeader>
                          <TableRow className="bg-orange-50">
                            <TableHead>Week</TableHead>
                            <TableHead className="text-right">Gross Sales</TableHead>
                            <TableHead className="text-right">Commission</TableHead>
                            <TableHead className="text-right">GST</TableHead>
                            <TableHead className="text-right">TDS</TableHead>
                            <TableHead className="text-right">Ads</TableHead>
                            <TableHead className="text-right">Net Payout</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {weeklyData.weekly_payouts
                            .filter(w => w.platform === "swiggy")
                            .map((week, idx) => (
                              <TableRow key={idx}>
                                <TableCell className="font-medium">{week.payout_cycle}</TableCell>
                                <TableCell className="text-right">{formatCurrency(week.gross_order_value)}</TableCell>
                                <TableCell className="text-right text-red-600">-{formatCurrency(week.commission)}</TableCell>
                                <TableCell className="text-right text-red-600">-{formatCurrency(week.gst_on_commission)}</TableCell>
                                <TableCell className="text-right text-red-600">-{formatCurrency(week.tds)}</TableCell>
                                <TableCell className="text-right text-red-600">-{formatCurrency(week.ad_charges)}</TableCell>
                                <TableCell className="text-right font-bold text-green-600">{formatCurrency(week.net_payout)}</TableCell>
                              </TableRow>
                            ))}
                          {weeklyData.weekly_payouts.filter(w => w.platform === "swiggy").length === 0 && (
                            <TableRow>
                              <TableCell colSpan={7} className="text-center text-slate-400 py-8">
                                No Swiggy weekly payouts uploaded
                              </TableCell>
                            </TableRow>
                          )}
                        </TableBody>
                      </Table>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}
        </>
      )}
    </div>
  );
}
