import React, { useMemo, useState } from "react";
import { inToIso } from "@/lib/date";
import { api, downloadUrl } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { CalendarDays, CreditCard } from "lucide-react";

const companies = ["DO", "KINFOLK", "DOPL"];

function inr(n) {
  const x = Number(n || 0);
  return x.toLocaleString("en-IN", { maximumFractionDigits: 2 });
}

// Helper to calculate week dates based on platform
function getWeekDates(platform, referenceDate) {
  const d = referenceDate ? new Date(referenceDate) : new Date();
  const day = d.getDay(); // 0=Sun, 1=Mon, ...
  
  if (platform === "zomato") {
    // Zomato: Mon-Sun
    const monday = new Date(d);
    monday.setDate(d.getDate() - ((day + 6) % 7)); // Go back to Monday
    const sunday = new Date(monday);
    sunday.setDate(monday.getDate() + 6);
    return { start: monday, end: sunday };
  } else {
    // Swiggy: Sun-Sat
    const sunday = new Date(d);
    sunday.setDate(d.getDate() - day); // Go back to Sunday
    const saturday = new Date(sunday);
    saturday.setDate(sunday.getDate() + 6);
    return { start: sunday, end: saturday };
  }
}

function formatDateDDMMYYYY(d) {
  const dd = String(d.getDate()).padStart(2, '0');
  const mm = String(d.getMonth() + 1).padStart(2, '0');
  const yyyy = d.getFullYear();
  return `${dd}/${mm}/${yyyy}`;
}

export default function Weekly() {
  const [company, setCompany] = useState("DO");
  const [platform, setPlatform] = useState("zomato");
  const [startDate, setStartDate] = useState("01/12/2025");
  const [endDate, setEndDate] = useState("07/12/2025");
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState(null);
  const [report, setReport] = useState(null);

  // Auto-set dates when platform changes
  const setWeekForPlatform = (plat) => {
    const week = getWeekDates(plat, new Date());
    setStartDate(formatDateDDMMYYYY(week.start));
    setEndDate(formatDateDDMMYYYY(week.end));
  };

  const summaryByPartner = useMemo(() => {
    const map = { swiggy: null, zomato: null };
    (report?.partner_summaries || []).forEach((s) => {
      map[s.partner] = s;
    });
    return map;
  }, [report]);

  // Filter UTR data by selected platform
  const filteredUtrMatches = useMemo(() => {
    if (!report?.utr_matches) return [];
    return report.utr_matches.filter(m => m.partner === platform);
  }, [report, platform]);

  const filteredUnmatchedSettlements = useMemo(() => {
    if (!report?.utr_unmatched_settlements) return [];
    return report.utr_unmatched_settlements.filter(s => s.partner === platform);
  }, [report, platform]);

  const generate = async () => {
    setErr(null);
    setReport(null);
    
    // Validate date range
    if (new Date(endDate) < new Date(startDate)) {
      setErr("End date must be after start date");
      return;
    }
    
    setBusy(true);
    try {
      const res = await api.post("/reports/weekly", {
        company,
        start_date: inToIso(startDate),
        end_date: inToIso(endDate),
      });
      setReport(res.data);
    } catch (e) {
      setErr(e?.response?.data?.detail || "Failed to generate report");
    } finally {
      setBusy(false);
    }
  };

  // Calculate expected settlement date (Wed/Thu after week ends)
  const getExpectedSettlementDate = () => {
    try {
      const [dd, mm, yyyy] = endDate.split('/');
      const endD = new Date(yyyy, mm - 1, dd);
      // Add 3-4 days (Wed/Thu)
      const settlementDate = new Date(endD);
      settlementDate.setDate(endD.getDate() + 4);
      return formatDateDDMMYYYY(settlementDate);
    } catch {
      return "N/A";
    }
  };

  return (
    <div data-testid="weekly" className="space-y-6">
      {/* Platform Tabs */}
      <Tabs value={platform} onValueChange={(v) => { setPlatform(v); setWeekForPlatform(v); }} className="w-full">
        <TabsList className="grid w-full grid-cols-2 max-w-md">
          <TabsTrigger value="zomato" className="data-[state=active]:bg-red-600 data-[state=active]:text-white">
            <span className="font-semibold">Zomato</span>
            <Badge variant="outline" className="ml-2 text-xs">Mon - Sun</Badge>
          </TabsTrigger>
          <TabsTrigger value="swiggy" className="data-[state=active]:bg-orange-500 data-[state=active]:text-white">
            <span className="font-semibold">Swiggy</span>
            <Badge variant="outline" className="ml-2 text-xs">Sun - Sat</Badge>
          </TabsTrigger>
        </TabsList>
      </Tabs>

      {/* Week Structure Info */}
      <div className={`p-4 rounded-xl ${platform === 'zomato' ? 'bg-red-50 border-red-200' : 'bg-orange-50 border-orange-200'} border`}>
        <div className="flex items-center gap-2 mb-2">
          <CalendarDays className={`h-5 w-5 ${platform === 'zomato' ? 'text-red-600' : 'text-orange-600'}`} />
          <span className="font-semibold">{platform === 'zomato' ? 'Zomato' : 'Swiggy'} Week Structure</span>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
          <div>
            <span className="text-slate-600">Sales Week:</span>
            <span className="ml-2 font-medium">{platform === 'zomato' ? 'Monday to Sunday' : 'Sunday to Saturday'}</span>
          </div>
          <div className="flex items-center">
            <CreditCard className="h-4 w-4 mr-2 text-green-600" />
            <span className="text-slate-600">Bank Credit Expected:</span>
            <span className="ml-2 font-medium text-green-700">Wed/Thu (~{getExpectedSettlementDate()})</span>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-4">
        <Card data-testid="weekly-filters-card" className="rounded-2xl lg:col-span-2">
          <CardHeader>
            <CardTitle className="text-lg">Filters</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-4">
              <div className="space-y-1">
                <Label data-testid="weekly-company-label">Company</Label>
                <Select value={company} onValueChange={setCompany}>
                  <SelectTrigger data-testid="weekly-company-select" className="rounded-xl">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {companies.map((c) => (
                      <SelectItem key={c} value={c} data-testid={`weekly-company-${c}`}>
                        {c}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1">
                <Label data-testid="weekly-start-date-label">Start date</Label>
                <Input
                  data-testid="weekly-start-date-input"
                  placeholder="DD/MM/YYYY"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                />
              </div>
              <div className="space-y-1">
                <Label data-testid="weekly-end-date-label">End date</Label>
                <Input
                  data-testid="weekly-end-date-input"
                  placeholder="DD/MM/YYYY"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                />
              </div>
              <div className="flex items-end">
                <Button
                  data-testid="weekly-generate-button"
                  className="rounded-xl w-full"
                  onClick={generate}
                  disabled={busy}
                >
                  {busy ? "Generating…" : "Generate Report"}
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card data-testid="weekly-summary-swiggy" className="rounded-2xl">
          <CardHeader>
            <CardTitle className="text-lg text-orange-600">Swiggy</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 text-sm">
            <div className="grid grid-cols-2 gap-2">
              <div className="text-slate-600">Expected (POS):</div>
              <div data-testid="weekly-swiggy-expected-pos" className="text-right font-medium">₹{inr(summaryByPartner.swiggy?.expected_from_pos)}</div>
              
              <div className="text-slate-600">Expected (Payout File):</div>
              <div data-testid="weekly-swiggy-expected-file" className="text-right font-medium text-orange-600">
                {summaryByPartner.swiggy?.expected_from_payout_file ? (
                  <>₹{inr(summaryByPartner.swiggy?.expected_from_payout_file)}</>
                ) : (
                  <span className="text-slate-400 text-xs">No weekly file uploaded</span>
                )}
              </div>
              
              <div className="text-slate-600">Received (Settlement Window):</div>
              <div data-testid="weekly-swiggy-received-settlement" className="text-right font-medium text-green-600">
                ₹{inr(summaryByPartner.swiggy?.received_in_settlement_window)}
              </div>
              
              <div className="text-slate-600 text-xs">All Bank Credits:</div>
              <div data-testid="weekly-swiggy-received-all" className="text-right text-xs text-slate-500">₹{inr(summaryByPartner.swiggy?.received_all_bank)}</div>
            </div>
            <div className="border-t pt-2">
              <div className="flex justify-between">
                <span className="text-slate-600">
                  {summaryByPartner.swiggy?.has_payout_file ? "Diff (Received vs File):" : "Diff (Received vs POS):"}
                </span>
                <span data-testid="weekly-swiggy-diff" className={`font-semibold ${Math.abs(summaryByPartner.swiggy?.difference_vs_payout_file || 0) < 1000 ? 'text-green-600' : 'text-amber-600'}`}>
                  ₹{inr(summaryByPartner.swiggy?.difference_vs_payout_file)}
                </span>
              </div>
              {summaryByPartner.swiggy?.settlement_window && (
                <div className="text-xs text-slate-500 mt-1">
                  Settlement window: {summaryByPartner.swiggy.settlement_window}
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        <Card data-testid="weekly-summary-zomato" className="rounded-2xl">
          <CardHeader>
            <CardTitle className="text-lg text-red-600">Zomato</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 text-sm">
            <div className="grid grid-cols-2 gap-2">
              <div className="text-slate-600">Expected (POS):</div>
              <div data-testid="weekly-zomato-expected-pos" className="text-right font-medium">₹{inr(summaryByPartner.zomato?.expected_from_pos)}</div>
              
              <div className="text-slate-600">Expected (Payout File):</div>
              <div data-testid="weekly-zomato-expected-file" className="text-right font-medium text-red-600">
                {summaryByPartner.zomato?.expected_from_payout_file ? (
                  <>₹{inr(summaryByPartner.zomato?.expected_from_payout_file)}</>
                ) : (
                  <span className="text-slate-400 text-xs">No weekly file uploaded</span>
                )}
              </div>
              
              <div className="text-slate-600">Received (Settlement Window):</div>
              <div data-testid="weekly-zomato-received-settlement" className="text-right font-medium text-green-600">
                ₹{inr(summaryByPartner.zomato?.received_in_settlement_window)}
              </div>
              
              <div className="text-slate-600 text-xs">All Bank Credits:</div>
              <div data-testid="weekly-zomato-received-all" className="text-right text-xs text-slate-500">₹{inr(summaryByPartner.zomato?.received_all_bank)}</div>
            </div>
            <div className="border-t pt-2">
              <div className="flex justify-between">
                <span className="text-slate-600">
                  {summaryByPartner.zomato?.has_payout_file ? "Diff (Received vs File):" : "Diff (Received vs POS):"}
                </span>
                <span data-testid="weekly-zomato-diff" className={`font-semibold ${Math.abs(summaryByPartner.zomato?.difference_vs_payout_file || 0) < 1000 ? 'text-green-600' : 'text-amber-600'}`}>
                  ₹{inr(summaryByPartner.zomato?.difference_vs_payout_file)}
                </span>
              </div>
              {summaryByPartner.zomato?.settlement_window && (
                <div className="text-xs text-slate-500 mt-1">
                  Settlement window: {summaryByPartner.zomato.settlement_window}
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {err ? (
        <Alert data-testid="weekly-error-alert" variant="destructive">
          <AlertTitle>Error</AlertTitle>
          <AlertDescription data-testid="weekly-error-text">{err}</AlertDescription>
        </Alert>
      ) : null}

      {report ? (
        <div data-testid="weekly-report" className="space-y-6">
          <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
            <div
              data-testid="weekly-report-meta"
              className="text-sm text-slate-700"
            >
              Report ID: <span className="font-mono">{report.id}</span>
            </div>
            <Button
              data-testid="weekly-export-button"
              className="rounded-xl"
              onClick={() => window.open(downloadUrl(report.export_url), "_blank")}
            >
              Export Excel
            </Button>
          </div>

          <Card data-testid="weekly-outlet-table-card" className="rounded-2xl">
            <CardHeader>
              <CardTitle className="text-lg">Outlet-wise Reconciliation</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="rounded-xl border overflow-x-auto">
                <Table data-testid="weekly-outlet-table">
                  <TableHeader>
                    <TableRow>
                      <TableHead>Outlet</TableHead>
                      <TableHead>Partner</TableHead>
                      <TableHead className="text-right">Orders</TableHead>
                      <TableHead className="text-right">Gross</TableHead>
                      <TableHead className="text-right">Deduction</TableHead>
                      <TableHead className="text-right">Expected</TableHead>
                      <TableHead className="text-right">Received</TableHead>
                      <TableHead className="text-right">Difference</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {report.partner_outlet_lines.map((l, idx) => {
                      const diff = l.payout_difference;
                      const diffClass = diff === null ? 'text-slate-400' : 
                                        Math.abs(diff) < 100 ? 'text-green-600' : 
                                        diff > 0 ? 'text-blue-600' : 'text-red-600';
                      return (
                        <TableRow key={`${l.outlet}-${l.partner}-${idx}`} data-testid={`weekly-line-${idx}`}>
                          <TableCell data-testid={`weekly-line-outlet-${idx}`} className="font-medium">{l.outlet}</TableCell>
                          <TableCell data-testid={`weekly-line-partner-${idx}`}>
                            <span className={`text-xs font-medium ${l.partner === 'zomato' ? 'text-red-600' : 'text-orange-600'}`}>
                              {l.partner}
                            </span>
                          </TableCell>
                          <TableCell data-testid={`weekly-line-orders-${idx}`} className="text-right">{l.orders}</TableCell>
                          <TableCell data-testid={`weekly-line-gross-${idx}`} className="text-right">₹{inr(l.gross_total)}</TableCell>
                          <TableCell data-testid={`weekly-line-deduction-${idx}`} className="text-right text-slate-600">₹{inr(l.total_deduction)}</TableCell>
                          <TableCell data-testid={`weekly-line-payout-${idx}`} className="text-right font-medium">₹{inr(l.expected_payout)}</TableCell>
                          <TableCell data-testid={`weekly-line-received-${idx}`} className="text-right">
                            {l.has_payout_match ? (
                              <span className="font-medium text-green-600">₹{inr(l.received_payout)}</span>
                            ) : (
                              <span className="text-slate-400 text-xs">No file</span>
                            )}
                          </TableCell>
                          <TableCell data-testid={`weekly-line-diff-${idx}`} className={`text-right font-semibold ${diffClass}`}>
                            {diff !== null ? (
                              <>
                                {diff >= 0 ? '+' : ''}₹{inr(diff)}
                              </>
                            ) : (
                              <span className="text-xs">-</span>
                            )}
                          </TableCell>
                        </TableRow>
                      );
                    })}
                    {!report.partner_outlet_lines.length ? (
                      <TableRow>
                        <TableCell colSpan={8} data-testid="weekly-no-lines" className="text-sm text-slate-600">
                          No online partner sales found for this date range.
                        </TableCell>
                      </TableRow>
                    ) : null}
                  </TableBody>
                </Table>
              </div>
              <div className="mt-2 text-xs text-slate-500">
                <span className="text-green-600">Green</span> = difference &lt; ₹100 | 
                <span className="text-blue-600 ml-2">Blue</span> = received more than expected | 
                <span className="text-red-600 ml-2">Red</span> = received less than expected
              </div>
            </CardContent>
          </Card>

          <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
            <Card data-testid="weekly-bank-card" className="rounded-2xl">
              <CardHeader>
                <CardTitle className="text-lg">Bank credits (auto-matched)</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div data-testid="weekly-bank-note" className="text-sm text-slate-700">
                  Because narration doesn’t include outlet name, this MVP reconciles partner deposits at company level.
                </div>
                <div className="rounded-xl border">
                  <Table data-testid="weekly-bank-table">
                    <TableHeader>
                      <TableRow>
                        <TableHead>Category</TableHead>
                        <TableHead>Date</TableHead>
                        <TableHead>Bank</TableHead>
                        <TableHead>Amount</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {Object.entries(report.bank_matches || {}).flatMap(([cat, arr]) =>
                        (arr || []).map((t, idx) => (
                          <TableRow key={`${cat}-${idx}`} data-testid={`weekly-bank-row-${cat}-${idx}`}>
                            <TableCell data-testid={`weekly-bank-cat-${cat}-${idx}`}>{cat}</TableCell>
                            <TableCell data-testid={`weekly-bank-date-${cat}-${idx}`}>{t.txn_date}</TableCell>
                            <TableCell data-testid={`weekly-bank-bank-${cat}-${idx}`}>{t.bank}</TableCell>
                            <TableCell data-testid={`weekly-bank-amt-${cat}-${idx}`}>₹{inr(t.amount)}</TableCell>
                          </TableRow>
                        )),
                      )}
                    </TableBody>
                  </Table>
                </div>
              </CardContent>
            </Card>

            <Card data-testid="weekly-dinein-card" className="rounded-2xl">
              <CardHeader>
                <CardTitle className="text-lg">Dine-in / Self delivery</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="grid grid-cols-1 gap-3 sm:grid-cols-4">
                  <div className="rounded-xl bg-slate-50 p-3">
                    <div data-testid="weekly-gst-title" className="text-xs text-slate-600">GST payable</div>
                    <div data-testid="weekly-gst-value" className="text-xl font-semibold text-slate-900">₹{inr(report.gst_summary?.gst_payable)}</div>
                  </div>
                  <div className="rounded-xl bg-slate-50 p-3">
                    <div data-testid="weekly-dinein-orders-title" className="text-xs text-slate-600">Orders</div>
                    <div data-testid="weekly-dinein-orders-value" className="text-xl font-semibold text-slate-900">{report.gst_summary?.orders || 0}</div>
                  </div>
                  <div className="rounded-xl bg-slate-50 p-3">
                    <div className="text-xs text-slate-600">Dine-in Total</div>
                    <div className="text-xl font-semibold text-slate-900">₹{inr(report.gst_summary?.dinein_total)}</div>
                  </div>
                  <div className="rounded-xl bg-green-50 p-3">
                    <div className="text-xs text-green-700">Cash Sales</div>
                    <div className="text-xl font-semibold text-green-800">
                      ₹{inr((report.dinein_payment_summary || []).filter(r => r.payment_type?.toLowerCase() === "cash").reduce((sum, r) => sum + (r.total || 0), 0))}
                    </div>
                  </div>
                </div>

                <div className="rounded-xl border">
                  <Table data-testid="weekly-dinein-table">
                    <TableHeader>
                      <TableRow>
                        <TableHead>Payment type</TableHead>
                        <TableHead>Orders</TableHead>
                        <TableHead>Total (POS)</TableHead>
                        <TableHead>Bank Match (T+1)</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {(report.dinein_payment_summary || []).map((r, idx) => {
                        // Determine which bank category this payment type maps to
                        const payType = (r.payment_type || "").toLowerCase();
                        let bankCat = null;
                        let bankTotal = 0;
                        let settlementNote = "";
                        
                        if (payType === "cash") {
                          // Cash - no bank settlement
                          bankCat = null;
                          settlementNote = "Stays in store";
                        } else if (payType.includes("card") || payType.includes("paytm") || payType.includes("upi") || payType === "other [upi]") {
                          bankCat = "paytm";
                          settlementNote = "ONE 97 (T+1)";
                        } else if (payType.includes("zomato pay")) {
                          bankCat = "zomato_pay";
                          settlementNote = "Eternal (T+3)";
                        } else if (payType.includes("dineout")) {
                          bankCat = "dineout";
                          settlementNote = "Swiggy Dineout (T+2)";
                        } else if (payType.includes("part payment") || payType.includes("due payment")) {
                          // Part/Due payments are typically mix of cash + card
                          bankCat = "paytm";
                          settlementNote = "Partial via ONE 97";
                        }
                        
                        // Get bank total for this category
                        if (bankCat && report.bank_matches?.[bankCat]) {
                          bankTotal = report.bank_matches[bankCat].reduce((sum, t) => sum + (t.amount || 0), 0);
                        }
                        
                        return (
                          <TableRow key={`${r.payment_type}-${idx}`} data-testid={`weekly-dinein-row-${idx}`} className={payType === "cash" ? "bg-green-50" : ""}>
                            <TableCell data-testid={`weekly-dinein-pay-${idx}`}>
                              <div className="flex flex-col">
                                <span className={payType === "cash" ? "font-medium text-green-700" : ""}>{r.payment_type}</span>
                                {bankCat && <span className="text-xs text-blue-600">→ {settlementNote}</span>}
                                {payType === "cash" && <span className="text-xs text-green-600">→ {settlementNote}</span>}
                              </div>
                            </TableCell>
                            <TableCell data-testid={`weekly-dinein-orders-${idx}`}>{r.orders}</TableCell>
                            <TableCell data-testid={`weekly-dinein-total-${idx}`} className={payType === "cash" ? "font-medium text-green-700" : ""}>₹{inr(r.total)}</TableCell>
                            <TableCell>
                              {payType === "cash" ? (
                                <span className="text-green-600 font-medium">
                                  💵 ₹{inr(report.dinein_recon_summary?.cash?.bank_received || 0)} deposited
                                </span>
                              ) : bankCat === "zomato_pay" ? (
                                <span className="text-blue-600">
                                  ₹{inr(report.dinein_recon_summary?.zomato_pay?.bank_received || 0)}
                                  <span className="text-xs ml-1">(balance after online)</span>
                                </span>
                              ) : bankCat ? (
                                <span className={bankTotal > 0 ? "text-green-600" : "text-orange-500"}>
                                  {bankTotal > 0 ? `₹${inr(bankTotal)}` : `Check bank (${settlementNote})`}
                                </span>
                              ) : (
                                <span className="text-slate-400">-</span>
                              )}
                            </TableCell>
                          </TableRow>
                        );
                      })}
                      {!report.dinein_payment_summary?.length ? (
                        <TableRow>
                          <TableCell colSpan={4} data-testid="weekly-dinein-none" className="text-sm text-slate-600">
                            No dine-in/self-delivery sales in this range.
                          </TableCell>
                        </TableRow>
                      ) : null}
                    </TableBody>
                  </Table>
                </div>
                
                {/* Cash Deposit Reconciliation */}
                {report.dinein_recon_summary?.cash && (
                  <div className="rounded-xl bg-green-50 p-3 space-y-2">
                    <div className="font-medium text-green-800">💵 Cash Reconciliation</div>
                    <div className="text-xs text-green-700 space-y-1">
                      <div className="flex justify-between">
                        <span>Cash Sales (POS):</span>
                        <span className="font-medium">₹{inr(report.dinein_recon_summary.cash.pos_total)}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Cash Deposited (Bank):</span>
                        <span className="font-medium">₹{inr(report.dinein_recon_summary.cash.bank_received)}</span>
                      </div>
                      <div className="flex justify-between border-t border-green-200 pt-1 mt-1">
                        <span className="font-medium">Difference:</span>
                        <span className={`font-bold ${(report.dinein_recon_summary.cash.difference || 0) >= 0 ? 'text-green-900' : 'text-red-600'}`}>
                          ₹{inr(report.dinein_recon_summary.cash.difference || 0)}
                        </span>
                      </div>
                    </div>
                    {report.dinein_recon_summary.cash_deposit_details?.length > 0 && (
                      <div className="mt-2 text-xs">
                        <div className="font-medium text-green-700 mb-1">Recent Deposits:</div>
                        <div className="max-h-24 overflow-y-auto space-y-1">
                          {report.dinein_recon_summary.cash_deposit_details.slice(0, 5).map((dep, idx) => (
                            <div key={idx} className="flex justify-between text-green-600 bg-green-100 px-2 py-1 rounded">
                              <span className="truncate mr-2">{dep.description?.substring(0, 40)}...</span>
                              <span className="font-medium whitespace-nowrap">₹{inr(dep.amount)}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                )}
                
                {/* Card Settlements Summary (Paytm + Amex + POS Terminal) */}
                {report.dinein_recon_summary?.total_card_settlements && (
                  <div className="rounded-xl bg-blue-50 p-3 space-y-2">
                    <div className="font-medium text-blue-800">💳 Card Settlements Summary</div>
                    <div className="text-xs text-blue-700 space-y-1">
                      <div className="flex justify-between">
                        <span>Paytm/ONE 97 (T+1):</span>
                        <span className="font-medium">₹{inr(report.dinein_recon_summary.total_card_settlements.paytm)}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>American Express:</span>
                        <span className="font-medium">₹{inr(report.dinein_recon_summary.total_card_settlements.amex)}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>POS Terminal:</span>
                        <span className="font-medium">₹{inr(report.dinein_recon_summary.total_card_settlements.pos_terminal)}</span>
                      </div>
                      <div className="flex justify-between border-t border-blue-200 pt-1 mt-1">
                        <span className="font-medium">Total Card Received:</span>
                        <span className="font-bold text-blue-900">₹{inr(report.dinein_recon_summary.total_card_settlements.total)}</span>
                      </div>
                      <div className="flex justify-between text-blue-600">
                        <span>Card/Paytm/UPI POS Total:</span>
                        <span>₹{inr(report.dinein_recon_summary.paytm?.pos_total || 0)}</span>
                      </div>
                    </div>
                  </div>
                )}
                
                {/* Zomato Pay Reconciliation Breakdown */}
                {report.dinein_recon_summary?.zomato_pay && (
                  <div className="rounded-xl bg-purple-50 p-3 space-y-2">
                    <div className="font-medium text-purple-800">🍽️ Zomato Pay Reconciliation</div>
                    <div className="text-xs text-purple-700 space-y-1">
                      <div className="flex justify-between">
                        <span>Total Zomato Bank Credits (Eternal):</span>
                        <span className="font-medium">₹{inr(report.dinein_recon_summary.zomato_pay.zomato_total_received)}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Less: Zomato Online Expected Payout:</span>
                        <span className="font-medium">- ₹{inr(report.dinein_recon_summary.zomato_pay.zomato_online_expected)}</span>
                      </div>
                      <div className="flex justify-between border-t border-purple-200 pt-1 mt-1">
                        <span className="font-medium">= Zomato Pay Balance:</span>
                        <span className="font-bold text-purple-900">₹{inr(report.dinein_recon_summary.zomato_pay.bank_received)}</span>
                      </div>
                      <div className="flex justify-between text-purple-600">
                        <span>Zomato Pay POS Total:</span>
                        <span>₹{inr(report.dinein_recon_summary.zomato_pay.pos_total)}</span>
                      </div>
                    </div>
                  </div>
                )}


              {/* UTR Settlement Matching */}
              {(report.utr_matches?.length > 0 || report.utr_unmatched_settlements?.length > 0 || report.utr_unmatched_bank_credits?.length > 0) && (
                <div className="rounded-xl bg-slate-50 p-3 space-y-3">
                  <div className="font-medium text-slate-800">
                    🏦 UTR Settlement Matching - {platform === 'zomato' ? 'Zomato' : 'Swiggy'}
                  </div>
                  <div className="text-xs text-slate-600">
                    Matches UTR from payout files with bank credits. Expected settlement: Wed/Thu after sales week ends.
                  </div>

                  {/* Matched */}
                  <div className="space-y-2">
                    <div className="font-medium text-slate-700 flex items-center gap-2">
                      Matched 
                      <span className="text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded-full">
                        {filteredUtrMatches.length} found
                      </span>
                    </div>
                    <div className="overflow-x-auto">
                      <Table>
                        <TableHeader>
                          <TableRow className="bg-white">
                            <TableHead>Outlet</TableHead>
                            <TableHead>UTR</TableHead>
                            <TableHead>Payout Period</TableHead>
                            <TableHead className="text-right">Settlement</TableHead>
                            <TableHead className="text-right">Bank Date</TableHead>
                            <TableHead className="text-right">Bank Amount</TableHead>
                            <TableHead>Status</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {filteredUtrMatches.map((m, idx) => (
                            <TableRow key={idx} className={idx % 2 === 0 ? "bg-white" : "bg-slate-50"}>
                              <TableCell>{m.outlet}</TableCell>
                              <TableCell className="font-mono text-xs">{m.utr}</TableCell>
                              <TableCell className="text-xs">{m.payout_cycle}</TableCell>
                              <TableCell className="text-right">₹{inr(m.settlement_amount || 0)}</TableCell>
                              <TableCell className="text-right text-xs">{m.bank_txn_date}</TableCell>
                              <TableCell className="text-right">₹{inr(m.bank_amount || 0)}</TableCell>
                              <TableCell>
                                {m.match_status === 'exact' ? (
                                  <span className="text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded-full">✓ Exact</span>
                                ) : (
                                  <span className="text-xs bg-amber-100 text-amber-700 px-2 py-0.5 rounded-full">⚠ Amount Diff</span>
                                )}
                              </TableCell>
                            </TableRow>
                          ))}
                          {!filteredUtrMatches.length && (
                            <TableRow>
                              <TableCell colSpan={7} className="text-sm text-slate-600">
                                No UTR matches found for {platform === 'zomato' ? 'Zomato' : 'Swiggy'} this week.
                              </TableCell>
                            </TableRow>
                          )}
                        </TableBody>
                      </Table>
                    </div>
                  </div>

                  {/* Unmatched settlements */}
                  <div className="space-y-2">
                    <div className="font-medium text-slate-700 flex items-center gap-2">
                      Unmatched Settlements 
                      <span className="text-xs bg-red-100 text-red-700 px-2 py-0.5 rounded-full">
                        {filteredUnmatchedSettlements.length} pending
                      </span>
                    </div>
                    <div className="text-xs text-slate-500">
                      UTR from payout file not found in bank statement. Check if bank statement covers the expected settlement date.
                    </div>
                    <div className="overflow-x-auto">
                      <Table>
                        <TableHeader>
                          <TableRow className="bg-white">
                            <TableHead>Outlet</TableHead>
                            <TableHead>UTR</TableHead>
                            <TableHead>Payout Period</TableHead>
                            <TableHead className="text-right">Settlement</TableHead>
                            <TableHead>Expected Bank Date</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {filteredUnmatchedSettlements.slice(0, 30).map((m, idx) => (
                            <TableRow key={idx} className={idx % 2 === 0 ? "bg-white" : "bg-slate-50"}>
                              <TableCell>{m.outlet}</TableCell>
                              <TableCell className="font-mono text-xs">{m.utr}</TableCell>
                              <TableCell className="text-xs">{m.payout_cycle}</TableCell>
                              <TableCell className="text-right">₹{inr(m.settlement_amount || 0)}</TableCell>
                              <TableCell className="text-xs text-amber-600">{m.expected_settlement_date || 'N/A'}</TableCell>
                            </TableRow>
                          ))}
                          {!filteredUnmatchedSettlements.length && (
                            <TableRow>
                              <TableCell colSpan={5} className="text-sm text-slate-600">
                                All {platform === 'zomato' ? 'Zomato' : 'Swiggy'} settlements matched! ✓
                              </TableCell>
                            </TableRow>
                          )}
                        </TableBody>
                      </Table>
                    </div>
                  </div>

                  {/* Unmatched bank credits */}
                  <div className="space-y-2">
                    <div className="font-medium text-slate-700">Unmatched Bank Credits (contains UTR)</div>
                    <div className="overflow-x-auto">
                      <Table>
                        <TableHeader>
                          <TableRow className="bg-white">
                            <TableHead>Bank</TableHead>
                            <TableHead>Date</TableHead>
                            <TableHead>Description</TableHead>
                            <TableHead className="text-right">Amount</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {(report.utr_unmatched_bank_credits || []).slice(0, 30).map((b, idx) => (
                            <TableRow key={idx} className={idx % 2 === 0 ? "bg-white" : "bg-slate-50"}>
                              <TableCell>{b.bank}</TableCell>
                              <TableCell className="text-xs">{b.txn_date}</TableCell>
                              <TableCell className="text-xs text-slate-600">{String(b.description || "").slice(0, 80)}</TableCell>
                              <TableCell className="text-right">₹{inr(b.amount || 0)}</TableCell>
                            </TableRow>
                          ))}
                          {!report.utr_unmatched_bank_credits?.length && (
                            <TableRow>
                              <TableCell colSpan={4} className="text-sm text-slate-600">No unmatched bank credits with UTR.</TableCell>
                            </TableRow>
                          )}
                        </TableBody>
                      </Table>
                    </div>
                  </div>
                </div>
              )}

                
                <div className="text-xs text-slate-600 bg-blue-50 p-3 rounded-lg space-y-1">
                  <div><strong>💡 Settlement Info:</strong></div>
                  <div>• <strong>Cash</strong> → Manual deposit at bank branch (matched with &quot;CASH DEPOSIT&quot; transactions)</div>
                  <div>• <strong>Card/Paytm/UPI</strong> → ONE 97 Communications (Paytm) settles at <strong>T+1</strong></div>
                  <div>• <strong>Dineout</strong> → Swiggy Dineout settles at <strong>T+2</strong></div>
                  <div>• <strong>Zomato Pay</strong> → Eternal (Zomato) - <strong>Balance after Zomato Online allocation</strong></div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      ) : (
        <div data-testid="weekly-empty" className="text-sm text-slate-700">
          Generate a report to see outlet-wise expected payouts and bank reconciliation.
        </div>
      )}
    </div>
  );
}
