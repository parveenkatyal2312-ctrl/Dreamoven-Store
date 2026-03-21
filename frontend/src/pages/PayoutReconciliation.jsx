import React, { useState, useEffect } from "react";
import { api } from "@/lib/api";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Loader2, RefreshCw, AlertTriangle, CheckCircle, XCircle } from "lucide-react";

const formatCurrency = (amount) => {
  if (!amount && amount !== 0) return "-";
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
};

const formatPercent = (pct) => {
  if (!pct && pct !== 0) return "-";
  return `${pct.toFixed(2)}%`;
};

function DeviationBadge({ deviation, threshold = 5 }) {
  if (!deviation && deviation !== 0) return <Badge variant="outline">N/A</Badge>;
  
  const absDeviation = Math.abs(deviation);
  
  if (absDeviation <= threshold) {
    return (
      <Badge className="bg-green-100 text-green-800">
        <CheckCircle className="w-3 h-3 mr-1" />
        {deviation > 0 ? "+" : ""}{formatPercent(deviation)}
      </Badge>
    );
  } else if (absDeviation <= threshold * 2) {
    return (
      <Badge className="bg-yellow-100 text-yellow-800">
        <AlertTriangle className="w-3 h-3 mr-1" />
        {deviation > 0 ? "+" : ""}{formatPercent(deviation)}
      </Badge>
    );
  } else {
    return (
      <Badge className="bg-red-100 text-red-800">
        <XCircle className="w-3 h-3 mr-1" />
        {deviation > 0 ? "+" : ""}{formatPercent(deviation)}
      </Badge>
    );
  }
}

export default function PayoutReconciliation() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [companyFilter, setCompanyFilter] = useState("all");
  const [platformFilter, setPlatformFilter] = useState("all");
  const [recoData, setRecoData] = useState(null);

  const fetchReconciliation = async () => {
    setLoading(true);
    setError(null);
    try {
      // Fetch all required data
      const [outletCommissions, extensionPayouts, posData] = await Promise.all([
        api.get("/reports/outlet-wise-commissions"),
        api.get("/extension/payouts"),
        api.get("/reports/partner-charges-review")
      ]);

      // Process and match data
      const reconciled = processReconciliation(
        outletCommissions.data,
        extensionPayouts.data.payouts,
        posData.data
      );
      
      setRecoData(reconciled);
    } catch (e) {
      setError(e?.response?.data?.detail || "Failed to fetch reconciliation data");
    } finally {
      setLoading(false);
    }
  };

  const processReconciliation = (outletData, extensionPayouts, partnerCharges) => {
    const reconciled = [];
    
    // Group extension payouts by outlet (normalize names)
    const payoutsByOutlet = {};
    extensionPayouts.forEach(p => {
      const key = normalizeOutletName(p.outlet) + "_" + p.platform + "_" + p.company;
      if (!payoutsByOutlet[key]) {
        payoutsByOutlet[key] = [];
      }
      payoutsByOutlet[key].push(p);
    });
    
    // Group POS data by outlet
    const posByOutlet = {};
    if (outletData.outlets) {
      outletData.outlets.forEach(o => {
        const key = normalizeOutletName(o.outlet) + "_" + o.partner + "_" + o.company;
        posByOutlet[key] = o;
      });
    }
    
    // Create reconciliation entries
    // First, go through POS data
    Object.keys(posByOutlet).forEach(key => {
      const pos = posByOutlet[key];
      const payouts = payoutsByOutlet[key] || [];
      
      // Aggregate extension payouts for this outlet
      const totalActualPayout = payouts.reduce((sum, p) => sum + (p.net_payout || 0), 0);
      const totalActualOrders = payouts.reduce((sum, p) => sum + (p.orders || 0), 0);
      const totalActualCommission = payouts.reduce((sum, p) => sum + (p.commission || 0), 0);
      const totalActualTax = payouts.reduce((sum, p) => sum + (p.tax_deductions || 0), 0);
      const totalActualAds = payouts.reduce((sum, p) => sum + (p.ad_charges || 0), 0);
      const totalActualNetOrderValue = payouts.reduce((sum, p) => sum + (p.net_order_value || 0), 0);
      
      // Expected from POS
      const expectedSales = pos.sales || 0;
      const expectedCommission = pos.commission_amount || 0;
      const expectedGST = pos.gst_on_commission || 0;
      const expectedAds = pos.ad_charges || 0;
      const expectedDeductions = pos.total_deductions || 0;
      const expectedPayout = pos.net_payout || 0;
      
      // Calculate deviations
      const salesDeviation = expectedSales > 0 ? ((totalActualNetOrderValue - expectedSales) / expectedSales) * 100 : null;
      const commissionDeviation = expectedCommission > 0 ? ((totalActualCommission - expectedCommission) / expectedCommission) * 100 : null;
      const payoutDeviation = expectedPayout > 0 ? ((totalActualPayout - expectedPayout) / expectedPayout) * 100 : null;
      
      reconciled.push({
        company: pos.company,
        outlet: pos.outlet,
        platform: pos.partner,
        
        // POS/Expected
        posOrders: null, // We don't have order count in POS
        posSales: expectedSales,
        posCommission: expectedCommission,
        posGST: expectedGST,
        posAds: expectedAds,
        posTotalDeductions: expectedDeductions,
        posNetPayout: expectedPayout,
        posCommissionRate: pos.total_rate,
        
        // Actual from Extension
        actualOrders: totalActualOrders || null,
        actualSales: totalActualNetOrderValue || null,
        actualCommission: totalActualCommission || null,
        actualTax: totalActualTax || null,
        actualAds: totalActualAds || null,
        actualNetPayout: totalActualPayout || null,
        
        // Deviations
        salesDeviation,
        commissionDeviation,
        payoutDeviation,
        salesDiff: totalActualNetOrderValue - expectedSales,
        commissionDiff: totalActualCommission - expectedCommission,
        payoutDiff: totalActualPayout - expectedPayout,
        
        hasActualData: payouts.length > 0,
        payoutCount: payouts.length
      });
    });
    
    // Add extension payouts that don't have POS data
    Object.keys(payoutsByOutlet).forEach(key => {
      if (!posByOutlet[key]) {
        const payouts = payoutsByOutlet[key];
        const first = payouts[0];
        
        const totalActualPayout = payouts.reduce((sum, p) => sum + (p.net_payout || 0), 0);
        const totalActualOrders = payouts.reduce((sum, p) => sum + (p.orders || 0), 0);
        const totalActualCommission = payouts.reduce((sum, p) => sum + (p.commission || 0), 0);
        const totalActualTax = payouts.reduce((sum, p) => sum + (p.tax_deductions || 0), 0);
        const totalActualNetOrderValue = payouts.reduce((sum, p) => sum + (p.net_order_value || 0), 0);
        
        reconciled.push({
          company: first.company,
          outlet: first.outlet,
          platform: first.platform,
          
          posOrders: null,
          posSales: null,
          posCommission: null,
          posGST: null,
          posAds: null,
          posTotalDeductions: null,
          posNetPayout: null,
          posCommissionRate: null,
          
          actualOrders: totalActualOrders,
          actualSales: totalActualNetOrderValue,
          actualCommission: totalActualCommission,
          actualTax: totalActualTax,
          actualAds: null,
          actualNetPayout: totalActualPayout,
          
          salesDeviation: null,
          commissionDeviation: null,
          payoutDeviation: null,
          salesDiff: null,
          commissionDiff: null,
          payoutDiff: null,
          
          hasActualData: true,
          hasPOSData: false,
          payoutCount: payouts.length
        });
      }
    });
    
    return reconciled;
  };

  const normalizeOutletName = (name) => {
    if (!name) return "";
    return name.toLowerCase()
      .replace(/[^a-z0-9]/g, "")
      .replace(/stickyrice/g, "stickyrice")
      .replace(/punjabibagh/g, "pb")
      .replace(/gurgaon/g, "gcr");
  };

  useEffect(() => {
    fetchReconciliation();
  }, []);

  // Filter data
  const filteredData = (recoData || []).filter(row => {
    if (companyFilter !== "all" && row.company !== companyFilter) return false;
    if (platformFilter !== "all" && row.platform !== platformFilter) return false;
    return true;
  });

  // Calculate summary
  const summary = filteredData.reduce((acc, row) => {
    acc.totalPOSSales += row.posSales || 0;
    acc.totalActualSales += row.actualSales || 0;
    acc.totalPOSPayout += row.posNetPayout || 0;
    acc.totalActualPayout += row.actualNetPayout || 0;
    acc.totalPOSCommission += row.posCommission || 0;
    acc.totalActualCommission += row.actualCommission || 0;
    if (row.hasActualData) acc.matchedOutlets++;
    if (!row.hasActualData && row.posSales > 0) acc.unmatchedOutlets++;
    return acc;
  }, { 
    totalPOSSales: 0, totalActualSales: 0, 
    totalPOSPayout: 0, totalActualPayout: 0,
    totalPOSCommission: 0, totalActualCommission: 0,
    matchedOutlets: 0, unmatchedOutlets: 0 
  });

  return (
    <div data-testid="payout-reconciliation" className="space-y-6">
      <Card className="rounded-2xl">
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>🔍 Payout Reconciliation</CardTitle>
            <Button onClick={fetchReconciliation} disabled={loading} variant="outline" size="sm">
              {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <RefreshCw className="h-4 w-4" />}
            </Button>
          </div>
          <p className="text-sm text-slate-500">
            Compare expected payouts (from POS + commission rates) vs actual payouts (from Zomato/Swiggy)
          </p>
        </CardHeader>
        <CardContent>
          {/* Filters */}
          <div className="flex gap-4 mb-6">
            <div className="space-y-1">
              <label className="text-sm text-slate-500">Company</label>
              <Select value={companyFilter} onValueChange={setCompanyFilter}>
                <SelectTrigger className="w-32">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All</SelectItem>
                  <SelectItem value="DO">DO</SelectItem>
                  <SelectItem value="KINFOLK">KINFOLK</SelectItem>
                  <SelectItem value="DOPL">DOPL</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1">
              <label className="text-sm text-slate-500">Platform</label>
              <Select value={platformFilter} onValueChange={setPlatformFilter}>
                <SelectTrigger className="w-32">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All</SelectItem>
                  <SelectItem value="zomato">Zomato</SelectItem>
                  <SelectItem value="swiggy">Swiggy</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Summary Cards */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
            <div className="bg-blue-50 rounded-xl p-4">
              <div className="text-sm text-slate-500">Expected Sales (POS)</div>
              <div className="text-xl font-bold text-blue-600">{formatCurrency(summary.totalPOSSales)}</div>
              <div className="text-xs text-slate-400 mt-1">Actual: {formatCurrency(summary.totalActualSales)}</div>
            </div>
            <div className="bg-red-50 rounded-xl p-4">
              <div className="text-sm text-slate-500">Expected Commission</div>
              <div className="text-xl font-bold text-red-600">{formatCurrency(summary.totalPOSCommission)}</div>
              <div className="text-xs text-slate-400 mt-1">Actual: {formatCurrency(summary.totalActualCommission)}</div>
            </div>
            <div className="bg-green-50 rounded-xl p-4">
              <div className="text-sm text-slate-500">Expected Payout</div>
              <div className="text-xl font-bold text-green-600">{formatCurrency(summary.totalPOSPayout)}</div>
              <div className="text-xs text-slate-400 mt-1">Actual: {formatCurrency(summary.totalActualPayout)}</div>
            </div>
            <div className="bg-purple-50 rounded-xl p-4">
              <div className="text-sm text-slate-500">Outlets Matched</div>
              <div className="text-xl font-bold text-purple-600">{summary.matchedOutlets}</div>
              <div className="text-xs text-slate-400 mt-1">Unmatched: {summary.unmatchedOutlets}</div>
            </div>
          </div>

          {/* Deviation Summary */}
          {summary.totalPOSPayout > 0 && summary.totalActualPayout > 0 && (
            <div className="bg-slate-50 rounded-xl p-4 mb-6">
              <div className="text-sm font-medium mb-2">Overall Deviation</div>
              <div className="grid grid-cols-3 gap-4">
                <div>
                  <span className="text-xs text-slate-500">Sales Difference:</span>
                  <div className={`font-bold ${summary.totalActualSales - summary.totalPOSSales >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                    {formatCurrency(summary.totalActualSales - summary.totalPOSSales)}
                  </div>
                </div>
                <div>
                  <span className="text-xs text-slate-500">Commission Difference:</span>
                  <div className={`font-bold ${summary.totalActualCommission - summary.totalPOSCommission <= 0 ? 'text-green-600' : 'text-red-600'}`}>
                    {formatCurrency(summary.totalActualCommission - summary.totalPOSCommission)}
                  </div>
                </div>
                <div>
                  <span className="text-xs text-slate-500">Payout Difference:</span>
                  <div className={`font-bold ${summary.totalActualPayout - summary.totalPOSPayout >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                    {formatCurrency(summary.totalActualPayout - summary.totalPOSPayout)}
                  </div>
                </div>
              </div>
            </div>
          )}

          {error && (
            <Alert variant="destructive" className="mb-4">
              <AlertTitle>Error</AlertTitle>
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          {/* Reconciliation Table */}
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow className="bg-slate-100">
                  <TableHead rowSpan={2} className="border-r">Outlet</TableHead>
                  <TableHead colSpan={4} className="text-center border-r bg-blue-50">Expected (POS)</TableHead>
                  <TableHead colSpan={4} className="text-center border-r bg-green-50">Actual (Partner)</TableHead>
                  <TableHead colSpan={2} className="text-center bg-yellow-50">Deviation</TableHead>
                </TableRow>
                <TableRow>
                  <TableHead className="text-right text-xs">Sales</TableHead>
                  <TableHead className="text-right text-xs">Comm.</TableHead>
                  <TableHead className="text-right text-xs">GST</TableHead>
                  <TableHead className="text-right text-xs border-r">Payout</TableHead>
                  <TableHead className="text-right text-xs">Orders</TableHead>
                  <TableHead className="text-right text-xs">Sales</TableHead>
                  <TableHead className="text-right text-xs">Comm.</TableHead>
                  <TableHead className="text-right text-xs border-r">Payout</TableHead>
                  <TableHead className="text-center text-xs">Sales %</TableHead>
                  <TableHead className="text-center text-xs">Payout %</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading ? (
                  <TableRow>
                    <TableCell colSpan={12} className="text-center py-8">
                      <Loader2 className="h-6 w-6 animate-spin mx-auto" />
                    </TableCell>
                  </TableRow>
                ) : filteredData.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={12} className="text-center py-8 text-slate-500">
                      No data to reconcile. Upload POS data and import payouts via extension.
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredData.map((row, idx) => (
                    <TableRow key={idx} className={idx % 2 === 0 ? "bg-slate-50" : ""}>
                      <TableCell className="border-r">
                        <div className="font-medium">{row.outlet}</div>
                        <div className="text-xs text-slate-400">
                          {row.company} • 
                          <Badge variant={row.platform === "zomato" ? "destructive" : "default"} className="ml-1 text-xs">
                            {row.platform}
                          </Badge>
                        </div>
                      </TableCell>
                      
                      {/* Expected (POS) */}
                      <TableCell className="text-right text-sm">{formatCurrency(row.posSales)}</TableCell>
                      <TableCell className="text-right text-sm text-red-600">{formatCurrency(row.posCommission)}</TableCell>
                      <TableCell className="text-right text-sm text-red-600">{formatCurrency(row.posGST)}</TableCell>
                      <TableCell className="text-right text-sm font-medium text-green-600 border-r">{formatCurrency(row.posNetPayout)}</TableCell>
                      
                      {/* Actual */}
                      <TableCell className="text-right text-sm">{row.actualOrders || "-"}</TableCell>
                      <TableCell className="text-right text-sm">{formatCurrency(row.actualSales)}</TableCell>
                      <TableCell className="text-right text-sm text-red-600">{formatCurrency(row.actualCommission)}</TableCell>
                      <TableCell className="text-right text-sm font-medium text-green-600 border-r">{formatCurrency(row.actualNetPayout)}</TableCell>
                      
                      {/* Deviations */}
                      <TableCell className="text-center">
                        <DeviationBadge deviation={row.salesDeviation} />
                      </TableCell>
                      <TableCell className="text-center">
                        <DeviationBadge deviation={row.payoutDeviation} />
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>

          {/* Legend */}
          <div className="mt-4 flex gap-4 text-xs text-slate-500">
            <div className="flex items-center gap-1">
              <CheckCircle className="w-3 h-3 text-green-600" /> Within 5% - OK
            </div>
            <div className="flex items-center gap-1">
              <AlertTriangle className="w-3 h-3 text-yellow-600" /> 5-10% - Review
            </div>
            <div className="flex items-center gap-1">
              <XCircle className="w-3 h-3 text-red-600" /> &gt;10% - Investigate
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
