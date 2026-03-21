import React, { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "../components/ui/card";
import { Button } from "../components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "../components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../components/ui/tabs";
import { Alert, AlertDescription, AlertTitle } from "../components/ui/alert";
import { Badge } from "../components/ui/badge";
import { api } from "@/lib/api";
import { RefreshCw, Building2, Layers, Store } from "lucide-react";

const inr = (n) => (n || 0).toLocaleString("en-IN", { maximumFractionDigits: 0 });

export default function BrandReconciliation() {
  const [company, setCompany] = useState("DO");
  const [startDate, setStartDate] = useState("2025-12-15");
  const [endDate, setEndDate] = useState("2025-12-21");
  const [loading, setLoading] = useState(false);
  const [report, setReport] = useState(null);
  const [error, setError] = useState(null);

  const generateReport = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await api.post("/reports/brand-reconciliation", {
        company,
        start_date: startDate,
        end_date: endDate,
      });
      setReport(res.data);
    } catch (e) {
      setError(e?.response?.data?.detail || "Failed to generate report");
    } finally {
      setLoading(false);
    }
  };

  // Group brand lines by terminal
  const terminalData = {};
  if (report?.brand_lines) {
    for (const l of report.brand_lines) {
      const posId = l.pos_terminal_id || 'unmapped';
      if (!terminalData[posId]) {
        terminalData[posId] = {
          name: l.pos_terminal_name || `POS ${posId}`,
          location: l.location,
          brands: [],
          zomato: { expected: 0, received: 0 },
          swiggy: { expected: 0, received: 0 },
        };
      }
      terminalData[posId].brands.push(l);
      const platform = l.platform;
      terminalData[posId][platform].expected += l.expected_from_pos || 0;
      terminalData[posId][platform].received += l.received_payout || 0;
    }
  }

  return (
    <div className="space-y-6 p-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Brand Reconciliation</h1>
          <p className="text-sm text-slate-500">Multi-level reconciliation: Brand → Terminal → Platform</p>
        </div>
      </div>

      {/* Filters */}
      <Card className="rounded-2xl">
        <CardContent className="pt-6">
          <div className="flex flex-wrap items-end gap-4">
            <div>
              <label className="text-sm font-medium mb-1 block">Company</label>
              <Select value={company} onValueChange={setCompany}>
                <SelectTrigger className="w-40 rounded-xl" data-testid="brand-reco-company">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="DO">DO</SelectItem>
                  <SelectItem value="DREAMOVEN">DREAMOVEN</SelectItem>
                  <SelectItem value="DOPL">DOPL</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <label className="text-sm font-medium mb-1 block">Start Date</label>
              <input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="rounded-xl border px-3 py-2 text-sm"
              />
            </div>
            <div>
              <label className="text-sm font-medium mb-1 block">End Date</label>
              <input
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className="rounded-xl border px-3 py-2 text-sm"
              />
            </div>
            <Button
              onClick={generateReport}
              disabled={loading}
              className="rounded-xl"
              data-testid="brand-reco-generate"
            >
              {loading ? <RefreshCw className="h-4 w-4 mr-2 animate-spin" /> : <RefreshCw className="h-4 w-4 mr-2" />}
              Generate Report
            </Button>
          </div>
        </CardContent>
      </Card>

      {error && (
        <Alert variant="destructive">
          <AlertTitle>Error</AlertTitle>
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {report && (
        <>
          {/* Platform Summary Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Card className="rounded-2xl">
              <CardHeader className="pb-2">
                <CardTitle className="text-lg flex items-center gap-2">
                  <span className="text-red-600">Zomato</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-1 text-sm">
                  <div className="flex justify-between">
                    <span className="text-slate-600">Expected (POS):</span>
                    <span className="font-medium">₹{inr(report.platform_summary?.zomato?.expected)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-600">Received (Payout):</span>
                    <span className="font-medium text-green-600">₹{inr(report.platform_summary?.zomato?.received)}</span>
                  </div>
                  <div className="flex justify-between border-t pt-1">
                    <span className="text-slate-600">Difference:</span>
                    <span className={`font-semibold ${report.platform_summary?.zomato?.difference >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                      ₹{inr(report.platform_summary?.zomato?.difference)}
                    </span>
                  </div>
                  <div className="text-xs text-slate-500 mt-2">
                    {report.platform_summary?.zomato?.brands_with_payout}/{report.platform_summary?.zomato?.brands_total} brands with payout
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="rounded-2xl">
              <CardHeader className="pb-2">
                <CardTitle className="text-lg flex items-center gap-2">
                  <span className="text-orange-600">Swiggy</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-1 text-sm">
                  <div className="flex justify-between">
                    <span className="text-slate-600">Expected (POS):</span>
                    <span className="font-medium">₹{inr(report.platform_summary?.swiggy?.expected)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-600">Received (Payout):</span>
                    <span className="font-medium text-green-600">₹{inr(report.platform_summary?.swiggy?.received)}</span>
                  </div>
                  <div className="flex justify-between border-t pt-1">
                    <span className="text-slate-600">Difference:</span>
                    <span className={`font-semibold ${report.platform_summary?.swiggy?.difference >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                      ₹{inr(report.platform_summary?.swiggy?.difference)}
                    </span>
                  </div>
                  <div className="text-xs text-slate-500 mt-2">
                    {report.platform_summary?.swiggy?.brands_with_payout}/{report.platform_summary?.swiggy?.brands_total} brands with payout
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="rounded-2xl bg-slate-50">
              <CardHeader className="pb-2">
                <CardTitle className="text-lg">Total</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-1 text-sm">
                  <div className="flex justify-between">
                    <span className="text-slate-600">Expected:</span>
                    <span className="font-medium">
                      ₹{inr((report.platform_summary?.zomato?.expected || 0) + (report.platform_summary?.swiggy?.expected || 0))}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-600">Received:</span>
                    <span className="font-medium text-green-600">
                      ₹{inr((report.platform_summary?.zomato?.received || 0) + (report.platform_summary?.swiggy?.received || 0))}
                    </span>
                  </div>
                  <div className="flex justify-between border-t pt-1">
                    <span className="text-slate-600">Net Difference:</span>
                    <span className={`font-semibold ${((report.platform_summary?.zomato?.difference || 0) + (report.platform_summary?.swiggy?.difference || 0)) >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                      ₹{inr((report.platform_summary?.zomato?.difference || 0) + (report.platform_summary?.swiggy?.difference || 0))}
                    </span>
                  </div>
                  <div className="text-xs text-slate-500 mt-2">
                    {report.total_brands} total brands mapped
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Tabs for Terminal vs Brand view */}
          <Tabs defaultValue="terminal" className="space-y-4">
            <TabsList className="rounded-xl">
              <TabsTrigger value="terminal" className="rounded-lg">
                <Building2 className="h-4 w-4 mr-2" />
                Terminal View
              </TabsTrigger>
              <TabsTrigger value="brand" className="rounded-lg">
                <Store className="h-4 w-4 mr-2" />
                Brand View
              </TabsTrigger>
            </TabsList>

            {/* Terminal View */}
            <TabsContent value="terminal">
              <Card className="rounded-2xl">
                <CardHeader>
                  <CardTitle className="text-lg flex items-center gap-2">
                    <Building2 className="h-5 w-5" />
                    Terminal-Level Reconciliation
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="rounded-xl border overflow-x-auto">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>POS Terminal</TableHead>
                          <TableHead>Location</TableHead>
                          <TableHead className="text-center">Brands</TableHead>
                          <TableHead className="text-right">Zomato Expected</TableHead>
                          <TableHead className="text-right">Zomato Received</TableHead>
                          <TableHead className="text-right">Swiggy Expected</TableHead>
                          <TableHead className="text-right">Swiggy Received</TableHead>
                          <TableHead className="text-right">Total Diff</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {Object.entries(terminalData).map(([posId, t]) => {
                          const totalExpected = t.zomato.expected + t.swiggy.expected;
                          const totalReceived = t.zomato.received + t.swiggy.received;
                          const diff = totalReceived - totalExpected;
                          const uniqueBrands = [...new Set(t.brands.map(b => b.brand_name))];
                          return (
                            <TableRow key={posId}>
                              <TableCell className="font-medium">{t.name}</TableCell>
                              <TableCell>{t.location}</TableCell>
                              <TableCell className="text-center">
                                <Badge variant="outline" className="text-xs">
                                  {uniqueBrands.length}
                                </Badge>
                              </TableCell>
                              <TableCell className="text-right">₹{inr(t.zomato.expected)}</TableCell>
                              <TableCell className="text-right text-red-600">₹{inr(t.zomato.received)}</TableCell>
                              <TableCell className="text-right">₹{inr(t.swiggy.expected)}</TableCell>
                              <TableCell className="text-right text-orange-600">₹{inr(t.swiggy.received)}</TableCell>
                              <TableCell className={`text-right font-semibold ${Math.abs(diff) < 1000 ? 'text-green-600' : diff > 0 ? 'text-blue-600' : 'text-red-600'}`}>
                                {diff >= 0 ? '+' : ''}₹{inr(diff)}
                              </TableCell>
                            </TableRow>
                          );
                        })}
                      </TableBody>
                    </Table>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Brand View */}
            <TabsContent value="brand">
              <Card className="rounded-2xl">
                <CardHeader>
                  <CardTitle className="text-lg flex items-center gap-2">
                    <Store className="h-5 w-5" />
                    Brand-Level Breakdown
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="rounded-xl border overflow-x-auto">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Brand</TableHead>
                          <TableHead>Location</TableHead>
                          <TableHead>Platform</TableHead>
                          <TableHead>Res ID</TableHead>
                          <TableHead className="text-right">POS Expected</TableHead>
                          <TableHead className="text-right">Payout Received</TableHead>
                          <TableHead className="text-right">Difference</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {report.brand_lines?.sort((a, b) => (a.location || '').localeCompare(b.location || '') || a.brand_name.localeCompare(b.brand_name))
                          .map((l, idx) => {
                            const diff = l.difference_vs_pos;
                            const resId = l[`${l.platform}_res_id`] || '-';
                            return (
                              <TableRow key={idx}>
                                <TableCell className="font-medium">{l.brand_name}</TableCell>
                                <TableCell>{l.location}</TableCell>
                                <TableCell>
                                  <Badge variant={l.platform === 'zomato' ? 'destructive' : 'default'} className="text-xs">
                                    {l.platform}
                                  </Badge>
                                </TableCell>
                                <TableCell className="font-mono text-xs">{resId}</TableCell>
                                <TableCell className="text-right">
                                  {l.expected_from_pos > 0 ? `₹${inr(l.expected_from_pos)}` : <span className="text-slate-400">-</span>}
                                </TableCell>
                                <TableCell className="text-right">
                                  {l.has_payout ? (
                                    <span className="text-green-600">₹{inr(l.received_payout)}</span>
                                  ) : (
                                    <span className="text-slate-400">No payout</span>
                                  )}
                                </TableCell>
                                <TableCell className={`text-right font-semibold ${diff === null ? 'text-slate-400' : Math.abs(diff) < 1000 ? 'text-green-600' : diff > 0 ? 'text-blue-600' : 'text-red-600'}`}>
                                  {diff !== null ? `${diff >= 0 ? '+' : ''}₹${inr(diff)}` : '-'}
                                </TableCell>
                              </TableRow>
                            );
                          })}
                      </TableBody>
                    </Table>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </>
      )}
    </div>
  );
}
