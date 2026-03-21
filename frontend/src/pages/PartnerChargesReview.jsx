import React, { useState, useEffect } from "react";
import { api } from "@/lib/api";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Loader2, RefreshCw, ChevronDown, ChevronRight } from "lucide-react";

const formatCurrency = (amount) => {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
};

const formatPercent = (pct) => {
  return `${pct.toFixed(2)}%`;
};

function PartnerCard({ partner, data }) {
  const isProfit = data.net_payout.amount > 0;
  
  return (
    <Card className="rounded-2xl">
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg capitalize flex items-center gap-2">
            <span
              className={`inline-block h-3 w-3 rounded-full ${
                partner === "zomato" ? "bg-red-500" : "bg-orange-500"
              }`}
            />
            {partner}
          </CardTitle>
          <Badge variant={isProfit ? "default" : "destructive"}>
            {formatPercent(data.net_payout.percentage)} Net
          </Badge>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          <div className="flex justify-between items-center py-2 border-b">
            <span className="text-slate-600">Total Sales</span>
            <span className="font-semibold">{formatCurrency(data.total_sales)}</span>
          </div>
          <div className="flex justify-between items-center py-2 border-b">
            <span className="text-slate-600">Orders</span>
            <span className="font-semibold">{data.total_orders.toLocaleString()}</span>
          </div>
          
          <div className="space-y-2 pt-2">
            <div className="text-sm font-medium text-slate-700 mb-2">Deductions Breakdown:</div>
            
            <div className="flex justify-between items-center text-sm">
              <span className="text-slate-600">Commission</span>
              <div className="text-right">
                <span className="font-medium text-red-600">{formatCurrency(data.commission.amount)}</span>
                <span className="text-slate-400 ml-2">({formatPercent(data.commission.percentage)})</span>
              </div>
            </div>
            
            <div className="flex justify-between items-center text-sm">
              <span className="text-slate-600">GST on Commission</span>
              <div className="text-right">
                <span className="font-medium text-red-600">{formatCurrency(data.gst_on_commission.amount)}</span>
                <span className="text-slate-400 ml-2">({formatPercent(data.gst_on_commission.percentage)})</span>
              </div>
            </div>
            
            <div className="flex justify-between items-center text-sm">
              <span className="text-slate-600">Ad Charges</span>
              <div className="text-right">
                <span className="font-medium text-red-600">{formatCurrency(data.ad_charges.amount)}</span>
                <span className="text-slate-400 ml-2">({formatPercent(data.ad_charges.percentage)})</span>
              </div>
            </div>
            
            <div className="flex justify-between items-center text-sm">
              <span className="text-slate-600">GST on Ads</span>
              <div className="text-right">
                <span className="font-medium text-red-600">{formatCurrency(data.gst_on_ads.amount)}</span>
                <span className="text-slate-400 ml-2">({formatPercent(data.gst_on_ads.percentage)})</span>
              </div>
            </div>
            
            <div className="flex justify-between items-center text-sm">
              <span className="text-slate-600">Long Distance Charges</span>
              <div className="text-right">
                <span className="font-medium text-red-600">{formatCurrency(data.long_distance_charges.amount)}</span>
                <span className="text-slate-400 ml-2">({formatPercent(data.long_distance_charges.percentage)})</span>
              </div>
            </div>
          </div>
          
          <div className="border-t pt-3 mt-3 space-y-2">
            <div className="flex justify-between items-center">
              <span className="font-medium text-slate-700">Total Deductions</span>
              <div className="text-right">
                <span className="font-bold text-red-600">{formatCurrency(data.total_deductions.amount)}</span>
                <span className="text-slate-500 ml-2">({formatPercent(data.total_deductions.percentage)})</span>
              </div>
            </div>
            
            <div className="flex justify-between items-center bg-slate-50 p-2 rounded-lg">
              <span className="font-medium text-slate-700">Net Payout</span>
              <div className="text-right">
                <span className={`font-bold ${isProfit ? "text-green-600" : "text-red-600"}`}>
                  {formatCurrency(data.net_payout.amount)}
                </span>
                <span className="text-slate-500 ml-2">({formatPercent(data.net_payout.percentage)})</span>
              </div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

function OutletWiseTable({ outlets, partner }) {
  const [expanded, setExpanded] = useState(true);
  const partnerOutlets = outlets.filter(o => o.partner === partner);
  
  if (partnerOutlets.length === 0) return null;
  
  return (
    <Card className="rounded-2xl">
      <CardHeader className="pb-2">
        <button 
          onClick={() => setExpanded(!expanded)}
          className="flex items-center justify-between w-full text-left"
        >
          <CardTitle className="text-base capitalize flex items-center gap-2">
            <span className={`inline-block h-3 w-3 rounded-full ${partner === "zomato" ? "bg-red-500" : "bg-orange-500"}`} />
            {partner} - Outlet-wise Breakdown
          </CardTitle>
          {expanded ? <ChevronDown className="w-5 h-5" /> : <ChevronRight className="w-5 h-5" />}
        </button>
      </CardHeader>
      {expanded && (
        <CardContent className="pt-0">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="sticky left-0 bg-white">Outlet</TableHead>
                  <TableHead className="text-right">Sales</TableHead>
                  <TableHead className="text-right">Comm %</TableHead>
                  <TableHead className="text-right">Conv %</TableHead>
                  <TableHead className="text-right">Total %</TableHead>
                  <TableHead className="text-right">Commission</TableHead>
                  <TableHead className="text-right">GST</TableHead>
                  <TableHead className="text-right">Ads</TableHead>
                  <TableHead className="text-right">L.D.</TableHead>
                  <TableHead className="text-right">Total Ded.</TableHead>
                  <TableHead className="text-right">Net %</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {partnerOutlets.map((outlet, idx) => (
                  <TableRow key={idx} className={idx % 2 === 0 ? "bg-slate-50" : ""}>
                    <TableCell className="sticky left-0 bg-inherit font-medium text-sm">
                      {outlet.outlet}
                      {outlet.commission_key && (
                        <span className="text-xs text-slate-400 block">{outlet.commission_key}</span>
                      )}
                    </TableCell>
                    <TableCell className="text-right text-sm">{formatCurrency(outlet.sales)}</TableCell>
                    <TableCell className="text-right text-sm">{outlet.commission_rate}%</TableCell>
                    <TableCell className="text-right text-sm">{outlet.conv_rate}%</TableCell>
                    <TableCell className="text-right text-sm font-medium">{outlet.total_rate}%</TableCell>
                    <TableCell className="text-right text-sm text-red-600">{formatCurrency(outlet.commission_amount)}</TableCell>
                    <TableCell className="text-right text-sm text-red-600">{formatCurrency(outlet.gst_on_commission)}</TableCell>
                    <TableCell className="text-right text-sm text-red-600">{formatCurrency(outlet.ad_charges)}</TableCell>
                    <TableCell className="text-right text-sm text-red-600">{formatCurrency(outlet.long_distance)}</TableCell>
                    <TableCell className="text-right text-sm font-medium text-red-600">{formatCurrency(outlet.total_deductions)}</TableCell>
                    <TableCell className="text-right text-sm font-medium text-green-600">{outlet.net_payout_pct}%</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      )}
    </Card>
  );
}

function CompanySection({ companyData, outletData }) {
  const { company, partners, company_totals } = companyData;
  const companyOutlets = outletData?.by_company?.[company] || { swiggy: [], zomato: [] };
  const allOutlets = [...(companyOutlets.swiggy || []), ...(companyOutlets.zomato || [])];
  
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-slate-800">{company}</h2>
        <div className="flex items-center gap-4 text-sm">
          <div>
            <span className="text-slate-500">Total Sales:</span>
            <span className="ml-2 font-semibold">{formatCurrency(company_totals.total_sales)}</span>
          </div>
          <div>
            <span className="text-slate-500">Net:</span>
            <span className={`ml-2 font-semibold ${company_totals.net_payout >= 0 ? "text-green-600" : "text-red-600"}`}>
              {formatCurrency(company_totals.net_payout)} ({formatPercent(company_totals.net_payout_pct || 0)})
            </span>
          </div>
        </div>
      </div>
      
      {/* Partner Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {partners.map((p) => (
          <PartnerCard key={p.partner} partner={p.partner} data={p} />
        ))}
      </div>
      
      {/* Outlet-wise Breakdown */}
      {allOutlets.length > 0 && (
        <div className="space-y-4">
          <OutletWiseTable outlets={allOutlets} partner="swiggy" />
          <OutletWiseTable outlets={allOutlets} partner="zomato" />
        </div>
      )}
    </div>
  );
}

export default function PartnerChargesReview() {
  const [month, setMonth] = useState("");
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState(null);
  const [outletData, setOutletData] = useState(null);
  const [error, setError] = useState(null);
  const [activeTab, setActiveTab] = useState("summary");

  const fetchData = async (selectedMonth) => {
    setLoading(true);
    setError(null);
    try {
      const params = selectedMonth ? { month: selectedMonth } : {};
      const [summaryRes, outletRes] = await Promise.all([
        api.get("/reports/partner-charges-review", { params }),
        api.get("/reports/outlet-wise-commissions"),
      ]);
      setData(summaryRes.data);
      setOutletData(outletRes.data);
    } catch (e) {
      setError(e?.response?.data?.detail || "Failed to fetch data");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData(month);
  }, []);

  const handleRefresh = () => {
    fetchData(month);
  };

  const handleMonthChange = (e) => {
    const newMonth = e.target.value;
    setMonth(newMonth);
    fetchData(newMonth);
  };

  return (
    <div data-testid="partner-charges-review" className="space-y-6">
      {/* Filter Section */}
      <Card className="rounded-2xl">
        <CardContent className="pt-6">
          <div className="flex flex-wrap items-end gap-4">
            <div className="space-y-1">
              <Label>Month (YYYY-MM)</Label>
              <Input
                type="month"
                value={month}
                onChange={handleMonthChange}
                placeholder="YYYY-MM"
                className="w-48 rounded-xl"
              />
            </div>
            <Button onClick={handleRefresh} disabled={loading} className="rounded-xl">
              {loading ? (
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
              ) : (
                <RefreshCw className="h-4 w-4 mr-2" />
              )}
              Refresh
            </Button>
            <div className="text-sm text-slate-500">
              {data?.month && `Showing: ${data.month}`}
            </div>
          </div>
        </CardContent>
      </Card>

      {error && (
        <Alert variant="destructive">
          <AlertTitle>Error</AlertTitle>
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {loading && (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-slate-400" />
        </div>
      )}

      {data && !loading && (
        <>
          {/* Grand Totals Summary */}
          <Card className="rounded-2xl bg-gradient-to-br from-slate-900 to-slate-800 text-white">
            <CardHeader>
              <CardTitle className="text-xl">All Companies Summary</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
                <div>
                  <div className="text-slate-400 text-sm">Total Sales</div>
                  <div className="text-2xl font-bold">{formatCurrency(data.grand_totals.total_sales)}</div>
                </div>
                <div>
                  <div className="text-slate-400 text-sm">Total Deductions</div>
                  <div className="text-2xl font-bold text-red-400">
                    {formatCurrency(data.grand_totals.total_deductions)}
                    <span className="text-sm ml-2">({formatPercent(data.grand_totals.total_deduction_pct || 0)})</span>
                  </div>
                </div>
                <div>
                  <div className="text-slate-400 text-sm">Net Payout</div>
                  <div className="text-2xl font-bold text-green-400">
                    {formatCurrency(data.grand_totals.net_payout)}
                    <span className="text-sm ml-2">({formatPercent(data.grand_totals.net_payout_pct || 0)})</span>
                  </div>
                </div>
                <div>
                  <div className="text-slate-400 text-sm">Effective Commission</div>
                  <div className="text-2xl font-bold text-yellow-400">
                    {formatPercent((data.grand_totals.commission_pct || 0) + (data.grand_totals.gst_on_commission_pct || 0))}
                  </div>
                </div>
              </div>
              
              {/* Detailed Breakdown */}
              <div className="mt-6 pt-6 border-t border-slate-700">
                <div className="grid grid-cols-2 md:grid-cols-5 gap-4 text-sm">
                  <div>
                    <div className="text-slate-400">Commission</div>
                    <div className="font-medium">{formatPercent(data.grand_totals.commission_pct || 0)}</div>
                  </div>
                  <div>
                    <div className="text-slate-400">GST on Commission</div>
                    <div className="font-medium">{formatPercent(data.grand_totals.gst_on_commission_pct || 0)}</div>
                  </div>
                  <div>
                    <div className="text-slate-400">Ad Charges</div>
                    <div className="font-medium">{formatPercent(data.grand_totals.ad_charges_pct || 0)}</div>
                  </div>
                  <div>
                    <div className="text-slate-400">GST on Ads</div>
                    <div className="font-medium">{formatPercent(data.grand_totals.gst_on_ads_pct || 0)}</div>
                  </div>
                  <div>
                    <div className="text-slate-400">Long Distance</div>
                    <div className="font-medium">{formatPercent(data.grand_totals.long_distance_pct || 0)}</div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Company Sections */}
          {data.companies.map((company) => (
            <CompanySection key={company.company} companyData={company} outletData={outletData} />
          ))}

          {/* No Data Message */}
          {data.grand_totals.total_sales === 0 && (
            <Alert>
              <AlertTitle>No Data Available</AlertTitle>
              <AlertDescription>
                No sales data found for the selected period. Please upload POS sales data, 
                commission structure, ad charges, and long distance charges to see the review.
              </AlertDescription>
            </Alert>
          )}
        </>
      )}
    </div>
  );
}
