import React, { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "../components/ui/card";
import { Button } from "../components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "../components/ui/table";
import { Alert, AlertDescription, AlertTitle } from "../components/ui/alert";
import { Badge } from "../components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../components/ui/tabs";
import { api } from "@/lib/api";
import { RefreshCw, Building, CreditCard, Banknote, Lock, Clock, AlertTriangle, CheckCircle, History } from "lucide-react";

const inr = (n) => (n || 0).toLocaleString("en-IN", { maximumFractionDigits: 0 });

export default function BankReconciliation() {
  const [company, setCompany] = useState("DO");
  const [startDate, setStartDate] = useState("2025-12-01");
  const [endDate, setEndDate] = useState("2025-12-31");
  const [loading, setLoading] = useState(false);
  const [report, setReport] = useState(null);
  const [error, setError] = useState(null);
  const [history, setHistory] = useState([]);
  const [showHistory, setShowHistory] = useState(false);

  const generateReport = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await api.post("/reports/bank-reconciliation", {
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

  const fetchHistory = async () => {
    try {
      const res = await api.get(`/reconciliation-history?company=${company}`);
      setHistory(res.data.locks || []);
    } catch (e) {
      console.error("Failed to fetch history", e);
    }
  };

  useEffect(() => {
    if (showHistory) {
      fetchHistory();
    }
  }, [showHistory, company]);

  const reco = report?.reconciliation;

  const StatusBadge = ({ status }) => {
    if (status === "locked" || status === "auto_locked") {
      return (
        <Badge className="bg-green-100 text-green-700">
          <Lock className="h-3 w-3 mr-1" />
          {status === "auto_locked" ? "Auto-Locked" : "Locked"}
        </Badge>
      );
    }
    if (status === "pending") {
      return (
        <Badge className="bg-amber-100 text-amber-700">
          <AlertTriangle className="h-3 w-3 mr-1" />
          Review
        </Badge>
      );
    }
    return <Badge variant="outline"><Clock className="h-3 w-3 mr-1" />Pending</Badge>;
  };

  const WeeklyTable = ({ platform, data, color, onRefresh }) => {
    const [locking, setLocking] = useState(null);

    const handleLock = async (week) => {
      setLocking(week.payout_cycle);
      try {
        await api.post("/reconciliation-lock", {
          company,
          platform: platform.toLowerCase(),
          payout_cycle: week.payout_cycle,
          expected: week.expected_bank,
          received: week.bank_received,
          difference: week.difference,
          utr: week.utr || "",
          utr_matched: week.utr_matched || false,
        });
        if (onRefresh) await onRefresh();
      } catch (err) {
        console.error("Lock error:", err);
      } finally {
        setLocking(null);
      }
    };

    const handleUnlock = async (week) => {
      setLocking(week.payout_cycle);
      try {
        await api.post("/reconciliation-unlock", {
          company,
          platform: platform.toLowerCase(),
          payout_cycle: week.payout_cycle,
        });
        if (onRefresh) await onRefresh();
      } catch (err) {
        console.error("Unlock error:", err);
      } finally {
        setLocking(null);
      }
    };

    if (!data?.weeks?.length) {
      return (
        <div className="text-center py-8 text-slate-500">
          No payout files found for {platform} in this period
        </div>
      );
    }

    return (
      <div className="space-y-4">
        {/* Summary */}
        <div className="grid grid-cols-3 gap-4 mb-4">
          <div className="bg-slate-50 rounded-xl p-4">
            <div className="text-xs text-slate-500 mb-1">Total Expected</div>
            <div className="text-lg font-semibold">₹{inr(data.total_expected)}</div>
            <div className="text-xs text-slate-400">Net + Ad + LD</div>
          </div>
          <div className="bg-slate-50 rounded-xl p-4">
            <div className="text-xs text-slate-500 mb-1">Total Bank Received</div>
            <div className="text-lg font-semibold text-green-600">₹{inr(data.total_received)}</div>
          </div>
          <div className="bg-slate-50 rounded-xl p-4">
            <div className="text-xs text-slate-500 mb-1">Difference</div>
            <div className={`text-lg font-semibold ${data.total_difference >= 0 ? 'text-green-600' : 'text-red-600'}`}>
              ₹{inr(data.total_difference)}
            </div>
          </div>
        </div>

        {/* Week-wise Table */}
        <div className="rounded-xl border overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow className="bg-slate-50">
                <TableHead>Sales Week</TableHead>
                <TableHead className="text-right">Net Payout</TableHead>
                <TableHead className="text-right">+ Ad</TableHead>
                <TableHead className="text-right">+ LD</TableHead>
                <TableHead className="text-right">= Expected</TableHead>
                <TableHead className="text-right">Bank Rcvd</TableHead>
                <TableHead className="text-right">Diff</TableHead>
                <TableHead className="text-center">Status</TableHead>
                <TableHead className="text-center">Action</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {data.weeks.map((week, idx) => (
                <TableRow key={idx} className={week.status === "pending" ? "bg-amber-50" : ""}>
                  <TableCell>
                    <div className="font-medium">{week.payout_cycle}</div>
                    <div className="text-xs text-slate-400">Settle: {week.settlement_window?.split(" to ")[0]}</div>
                  </TableCell>
                  <TableCell className="text-right font-mono">₹{inr(week.net_payout)}</TableCell>
                  <TableCell className="text-right font-mono text-slate-500">₹{inr(week.ad_charges)}</TableCell>
                  <TableCell className="text-right font-mono text-slate-500">₹{inr(week.long_distance)}</TableCell>
                  <TableCell className="text-right font-mono font-medium">₹{inr(week.expected_bank)}</TableCell>
                  <TableCell className="text-right font-mono text-green-600 font-medium">
                    ₹{inr(week.bank_received)}
                    <div className="text-xs text-slate-400">{week.bank_txn_count} txns</div>
                  </TableCell>
                  <TableCell className={`text-right font-mono font-semibold ${week.difference >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                    ₹{week.difference >= 0 ? '+' : ''}{inr(week.difference)}
                  </TableCell>
                  <TableCell className="text-center">
                    <StatusBadge status={week.status} />
                    {week.utr_matched && (
                      <div className="text-xs text-green-600 mt-1">
                        <CheckCircle className="h-3 w-3 inline mr-1" />UTR ✓
                      </div>
                    )}
                  </TableCell>
                  <TableCell className="text-center">
                    {(week.status === "locked" || week.status === "auto_locked") ? (
                      <Button 
                        variant="ghost" 
                        size="sm" 
                        onClick={() => handleUnlock(week)}
                        disabled={locking === week.payout_cycle}
                        className="text-xs text-slate-500 hover:text-red-600"
                      >
                        {locking === week.payout_cycle ? "..." : "Unlock"}
                      </Button>
                    ) : (
                      <Button 
                        variant="outline" 
                        size="sm" 
                        onClick={() => handleLock(week)}
                        disabled={locking === week.payout_cycle}
                        className="text-xs"
                      >
                        <Lock className="h-3 w-3 mr-1" />
                        {locking === week.payout_cycle ? "..." : "Lock"}
                      </Button>
                    )}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-6 p-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Bank Reconciliation</h1>
          <p className="text-sm text-slate-500">Week-wise payout matching with auto-lock</p>
        </div>
        <Button
          variant="outline"
          onClick={() => setShowHistory(!showHistory)}
          className="rounded-xl"
        >
          <History className="h-4 w-4 mr-2" />
          {showHistory ? "Hide History" : "View History"}
        </Button>
      </div>

      {/* Filters */}
      <Card className="rounded-2xl">
        <CardContent className="pt-6">
          <div className="flex flex-wrap items-end gap-4">
            <div>
              <label className="text-sm font-medium mb-1 block">Company</label>
              <Select value={company} onValueChange={setCompany}>
                <SelectTrigger className="w-40 rounded-xl" data-testid="bank-reco-company">
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
              data-testid="bank-reco-generate"
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

      {/* Reconciliation History */}
      {showHistory && (
        <Card className="rounded-2xl">
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <History className="h-5 w-5" />
              Reconciliation History ({company})
            </CardTitle>
          </CardHeader>
          <CardContent>
            {history.length === 0 ? (
              <div className="text-center py-8 text-slate-500">No locked reconciliations yet</div>
            ) : (
              <div className="rounded-xl border overflow-hidden max-h-80 overflow-y-auto">
                <Table>
                  <TableHeader className="sticky top-0 bg-white">
                    <TableRow>
                      <TableHead>Platform</TableHead>
                      <TableHead>Payout Cycle</TableHead>
                      <TableHead className="text-right">Expected</TableHead>
                      <TableHead className="text-right">Received</TableHead>
                      <TableHead className="text-right">Diff</TableHead>
                      <TableHead>Locked At</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {history.map((lock, idx) => (
                      <TableRow key={idx}>
                        <TableCell className="capitalize font-medium">{lock.platform}</TableCell>
                        <TableCell>{lock.payout_cycle}</TableCell>
                        <TableCell className="text-right font-mono">₹{inr(lock.expected)}</TableCell>
                        <TableCell className="text-right font-mono text-green-600">₹{inr(lock.received)}</TableCell>
                        <TableCell className={`text-right font-mono ${lock.difference >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                          ₹{inr(lock.difference)}
                        </TableCell>
                        <TableCell className="text-sm text-slate-500">
                          {lock.locked_at ? new Date(lock.locked_at).toLocaleDateString() : '-'}
                          {lock.auto_locked && <Badge variant="outline" className="ml-2 text-xs">Auto</Badge>}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {reco && (
        <>
          {/* Payment Category Summary - All Channels */}
          <Card className="rounded-2xl border-2 border-slate-200">
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                📊 Payment Category Reconciliation
              </CardTitle>
              <p className="text-xs text-slate-500">
                POS Sales vs Bank Deposits by payment category
              </p>
            </CardHeader>
            <CardContent>
              <div className="rounded-xl border overflow-hidden">
                <Table>
                  <TableHeader>
                    <TableRow className="bg-slate-100">
                      <TableHead>Category</TableHead>
                      <TableHead className="text-right">POS Sales</TableHead>
                      <TableHead className="text-right">Bank Received</TableHead>
                      <TableHead className="text-right">Difference</TableHead>
                      <TableHead className="text-center">Status</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {/* Cash */}
                    <TableRow className="bg-green-50">
                      <TableCell className="font-medium">
                        <div className="flex items-center gap-2">
                          <Banknote className="h-4 w-4 text-green-600" />
                          Cash (Dine-in)
                        </div>
                      </TableCell>
                      <TableCell className="text-right font-mono">₹{inr(reco.payment_category_reco?.cash?.pos_sales)}</TableCell>
                      <TableCell className="text-right font-mono text-green-600">₹{inr(reco.payment_category_reco?.cash?.bank_received)}</TableCell>
                      <TableCell className={`text-right font-mono ${(reco.payment_category_reco?.cash?.difference || 0) >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                        ₹{(reco.payment_category_reco?.cash?.difference || 0) >= 0 ? '+' : ''}{inr(reco.payment_category_reco?.cash?.difference)}
                      </TableCell>
                      <TableCell className="text-center">
                        {reco.payment_category_reco?.cash?.status === "matched" ? 
                          <Badge className="bg-green-100 text-green-700"><CheckCircle className="h-3 w-3 mr-1" />Matched</Badge> :
                          <Badge className="bg-amber-100 text-amber-700"><AlertTriangle className="h-3 w-3 mr-1" />Review</Badge>
                        }
                      </TableCell>
                    </TableRow>
                    {/* Card/UPI */}
                    <TableRow className="bg-blue-50">
                      <TableCell className="font-medium">
                        <div className="flex items-center gap-2">
                          <CreditCard className="h-4 w-4 text-blue-600" />
                          Card/UPI (Dine-in)
                        </div>
                        <div className="text-xs text-slate-400">After ~2% gateway fees</div>
                      </TableCell>
                      <TableCell className="text-right font-mono">₹{inr(reco.payment_category_reco?.card_upi?.pos_sales)}</TableCell>
                      <TableCell className="text-right font-mono text-blue-600">₹{inr(reco.payment_category_reco?.card_upi?.bank_received)}</TableCell>
                      <TableCell className={`text-right font-mono ${(reco.payment_category_reco?.card_upi?.difference || 0) >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                        ₹{(reco.payment_category_reco?.card_upi?.difference || 0) >= 0 ? '+' : ''}{inr(reco.payment_category_reco?.card_upi?.difference)}
                      </TableCell>
                      <TableCell className="text-center">
                        {reco.payment_category_reco?.card_upi?.status === "matched" ? 
                          <Badge className="bg-green-100 text-green-700"><CheckCircle className="h-3 w-3 mr-1" />Matched</Badge> :
                          <Badge className="bg-amber-100 text-amber-700"><AlertTriangle className="h-3 w-3 mr-1" />Review</Badge>
                        }
                      </TableCell>
                    </TableRow>
                    {/* Zomato Pay */}
                    <TableRow className="bg-purple-50">
                      <TableCell className="font-medium">
                        <div className="flex items-center gap-2">
                          <span className="text-purple-600">💳</span>
                          Zomato Pay (Dine-in)
                        </div>
                        <div className="text-xs text-slate-400">Online Partner</div>
                      </TableCell>
                      <TableCell className="text-right font-mono">₹{inr(reco.payment_category_reco?.zomato_pay?.pos_sales)}</TableCell>
                      <TableCell className="text-right font-mono text-purple-600">₹{inr(reco.payment_category_reco?.zomato_pay?.bank_received)}</TableCell>
                      <TableCell className={`text-right font-mono ${(reco.payment_category_reco?.zomato_pay?.difference || 0) >= 0 ? 'text-green-600' : 'text-amber-600'}`}>
                        ₹{(reco.payment_category_reco?.zomato_pay?.difference || 0) >= 0 ? '+' : ''}{inr(reco.payment_category_reco?.zomato_pay?.difference)}
                      </TableCell>
                      <TableCell className="text-center">
                        {reco.payment_category_reco?.zomato_pay?.status === "matched" ? 
                          <Badge className="bg-green-100 text-green-700"><CheckCircle className="h-3 w-3 mr-1" />Matched</Badge> :
                          <Badge className="bg-amber-100 text-amber-700"><Clock className="h-3 w-3 mr-1" />₹{inr(reco.payment_category_reco?.zomato_pay?.pending)} Pending</Badge>
                        }
                      </TableCell>
                    </TableRow>
                    {/* Dineout */}
                    <TableRow className="bg-purple-50">
                      <TableCell className="font-medium">
                        <div className="flex items-center gap-2">
                          <span className="text-purple-600">🍽️</span>
                          Dineout (Dine-in)
                        </div>
                        <div className="text-xs text-slate-400">Online Partner</div>
                      </TableCell>
                      <TableCell className="text-right font-mono">₹{inr(reco.payment_category_reco?.dineout?.pos_sales)}</TableCell>
                      <TableCell className="text-right font-mono text-purple-600">₹{inr(reco.payment_category_reco?.dineout?.bank_received)}</TableCell>
                      <TableCell className={`text-right font-mono ${(reco.payment_category_reco?.dineout?.difference || 0) >= 0 ? 'text-green-600' : 'text-amber-600'}`}>
                        ₹{(reco.payment_category_reco?.dineout?.difference || 0) >= 0 ? '+' : ''}{inr(reco.payment_category_reco?.dineout?.difference)}
                      </TableCell>
                      <TableCell className="text-center">
                        {reco.payment_category_reco?.dineout?.status === "matched" ? 
                          <Badge className="bg-green-100 text-green-700"><CheckCircle className="h-3 w-3 mr-1" />Matched</Badge> :
                          <Badge className="bg-amber-100 text-amber-700"><Clock className="h-3 w-3 mr-1" />₹{inr(reco.payment_category_reco?.dineout?.pending)} Pending</Badge>
                        }
                      </TableCell>
                    </TableRow>
                    {/* Zomato Delivery */}
                    <TableRow className="bg-red-50">
                      <TableCell className="font-medium">
                        <div className="flex items-center gap-2">
                          <span className="text-red-600">🛵</span>
                          Zomato Delivery
                        </div>
                        <div className="text-xs text-slate-400">Expected = Net + Ad + LD</div>
                      </TableCell>
                      <TableCell className="text-right font-mono">
                        <div>₹{inr(reco.payment_category_reco?.zomato_delivery?.pos_sales)}</div>
                        <div className="text-xs text-slate-400">Exp: ₹{inr(reco.payment_category_reco?.zomato_delivery?.payout_expected)}</div>
                      </TableCell>
                      <TableCell className="text-right font-mono text-red-600">₹{inr(reco.payment_category_reco?.zomato_delivery?.bank_received)}</TableCell>
                      <TableCell className={`text-right font-mono ${(reco.payment_category_reco?.zomato_delivery?.difference || 0) >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                        ₹{(reco.payment_category_reco?.zomato_delivery?.difference || 0) >= 0 ? '+' : ''}{inr(reco.payment_category_reco?.zomato_delivery?.difference)}
                      </TableCell>
                      <TableCell className="text-center">
                        {reco.payment_category_reco?.zomato_delivery?.status === "matched" ? 
                          <Badge className="bg-green-100 text-green-700"><CheckCircle className="h-3 w-3 mr-1" />Matched</Badge> :
                          <Badge className="bg-amber-100 text-amber-700"><AlertTriangle className="h-3 w-3 mr-1" />Review</Badge>
                        }
                      </TableCell>
                    </TableRow>
                    {/* Swiggy Delivery */}
                    <TableRow className="bg-orange-50">
                      <TableCell className="font-medium">
                        <div className="flex items-center gap-2">
                          <span className="text-orange-600">🛵</span>
                          Swiggy Delivery
                        </div>
                        <div className="text-xs text-slate-400">Expected from payout file</div>
                      </TableCell>
                      <TableCell className="text-right font-mono">
                        <div>₹{inr(reco.payment_category_reco?.swiggy_delivery?.pos_sales)}</div>
                        <div className="text-xs text-slate-400">Exp: ₹{inr(reco.payment_category_reco?.swiggy_delivery?.payout_expected)}</div>
                      </TableCell>
                      <TableCell className="text-right font-mono text-orange-600">₹{inr(reco.payment_category_reco?.swiggy_delivery?.bank_received)}</TableCell>
                      <TableCell className={`text-right font-mono ${(reco.payment_category_reco?.swiggy_delivery?.difference || 0) >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                        ₹{(reco.payment_category_reco?.swiggy_delivery?.difference || 0) >= 0 ? '+' : ''}{inr(reco.payment_category_reco?.swiggy_delivery?.difference)}
                      </TableCell>
                      <TableCell className="text-center">
                        {reco.payment_category_reco?.swiggy_delivery?.status === "matched" ? 
                          <Badge className="bg-green-100 text-green-700"><CheckCircle className="h-3 w-3 mr-1" />Matched</Badge> :
                          <Badge className="bg-amber-100 text-amber-700"><AlertTriangle className="h-3 w-3 mr-1" />Review</Badge>
                        }
                      </TableCell>
                    </TableRow>
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>

          {/* Platform Payouts - Week-wise */}
          <Card className="rounded-2xl">
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <Building className="h-5 w-5" />
                Platform Payouts (Week-wise)
              </CardTitle>
              <p className="text-xs text-slate-500">
                Formula: Expected = Net Payout + Ad Charges + Long Distance | Auto-locks when diff &lt; ₹20K
              </p>
            </CardHeader>
            <CardContent>
              <Tabs defaultValue="zomato" className="w-full">
                <TabsList className="mb-4">
                  <TabsTrigger value="zomato" className="data-[state=active]:bg-red-100 data-[state=active]:text-red-700">
                    Zomato
                    {reco.platform_payouts?.zomato?.weeks?.length > 0 && (
                      <Badge variant="outline" className="ml-2">
                        {reco.platform_payouts.zomato.weeks.filter(w => w.status === "locked" || w.status === "auto_locked").length}/
                        {reco.platform_payouts.zomato.weeks.length}
                      </Badge>
                    )}
                  </TabsTrigger>
                  <TabsTrigger value="swiggy" className="data-[state=active]:bg-orange-100 data-[state=active]:text-orange-700">
                    Swiggy
                    {reco.platform_payouts?.swiggy?.weeks?.length > 0 && (
                      <Badge variant="outline" className="ml-2">
                        {reco.platform_payouts.swiggy.weeks.filter(w => w.status === "locked" || w.status === "auto_locked").length}/
                        {reco.platform_payouts.swiggy.weeks.length}
                      </Badge>
                    )}
                  </TabsTrigger>
                </TabsList>
                <TabsContent value="zomato">
                  <WeeklyTable platform="Zomato" data={reco.platform_payouts?.zomato} color="red" onRefresh={generateReport} />
                </TabsContent>
                <TabsContent value="swiggy">
                  <WeeklyTable platform="Swiggy" data={reco.platform_payouts?.swiggy} color="orange" onRefresh={generateReport} />
                </TabsContent>
              </Tabs>
            </CardContent>
          </Card>

          {/* Zomato Pay Reconciliation */}
          {reco.zomato_pay && (
            <Card className="rounded-2xl border-red-200">
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <span className="text-red-600">💳 Zomato Pay Reconciliation</span>
                </CardTitle>
                <p className="text-xs text-slate-500">{reco.zomato_pay?.note}</p>
              </CardHeader>
              <CardContent>
                {/* Summary */}
                <div className="grid grid-cols-3 gap-4 mb-4">
                  <div className="bg-red-50 rounded-xl p-4">
                    <div className="text-xs text-slate-500 mb-1">POS Zomato Pay Sales</div>
                    <div className="text-lg font-semibold">₹{inr(reco.zomato_pay?.pos_sales)}</div>
                  </div>
                  <div className="bg-green-50 rounded-xl p-4">
                    <div className="text-xs text-slate-500 mb-1">Bank Settled (Balance)</div>
                    <div className="text-lg font-semibold text-green-600">₹{inr(reco.zomato_pay?.bank_settled)}</div>
                    <div className="text-xs text-slate-400">Total Zomato Credits - UTR-Matched Delivery</div>
                  </div>
                  <div className={`rounded-xl p-4 ${(reco.zomato_pay?.difference || 0) >= 0 ? 'bg-green-50' : 'bg-amber-50'}`}>
                    <div className="text-xs text-slate-500 mb-1">Pending Settlement</div>
                    <div className={`text-lg font-semibold ${(reco.zomato_pay?.difference || 0) >= 0 ? 'text-green-600' : 'text-amber-600'}`}>
                      ₹{inr(Math.abs(reco.zomato_pay?.pos_sales - reco.zomato_pay?.bank_settled))}
                    </div>
                    <div className="text-xs text-slate-400">
                      {(reco.zomato_pay?.bank_settled || 0) >= (reco.zomato_pay?.pos_sales || 0) ? '✅ Fully settled' : '⏳ Awaiting settlement'}
                    </div>
                  </div>
                </div>

                {/* Week-wise breakdown */}
                {reco.zomato_pay?.weeks?.length > 0 && (
                  <div className="rounded-xl border overflow-hidden">
                    <Table>
                      <TableHeader>
                        <TableRow className="bg-slate-50">
                          <TableHead>Sales Week</TableHead>
                          <TableHead className="text-right">POS ZPay Sales</TableHead>
                          <TableHead className="text-right">ZPay Settled</TableHead>
                          <TableHead className="text-right">Difference</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {reco.zomato_pay.weeks.map((week, idx) => {
                          const settled = week.zpay_settled_approx ?? week.zpay_settled ?? 0;
                          const diff = week.zpay_difference ?? 0;
                          return (
                            <TableRow key={idx}>
                              <TableCell className="font-medium">{week.payout_cycle}</TableCell>
                              <TableCell className="text-right font-mono">₹{inr(week.pos_zpay_sales)}</TableCell>
                              <TableCell className={`text-right font-mono ${settled >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                                ₹{inr(settled)}
                              </TableCell>
                              <TableCell className={`text-right font-mono font-semibold ${diff >= 0 ? 'text-green-600' : 'text-amber-600'}`}>
                                ₹{diff >= 0 ? '+' : ''}{inr(diff)}
                              </TableCell>
                            </TableRow>
                          );
                        })}
                      </TableBody>
                    </Table>
                  </div>
                )}
              </CardContent>
            </Card>
          )}

          {/* Dineout Reconciliation */}
          {reco.dineout && reco.dineout.pos_sales > 0 && (
            <Card className="rounded-2xl border-purple-200">
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <span className="text-purple-600">🍽️ Dineout Reconciliation</span>
                </CardTitle>
                <p className="text-xs text-slate-500">{reco.dineout?.note}</p>
              </CardHeader>
              <CardContent>
                {/* Summary */}
                <div className="grid grid-cols-3 gap-4 mb-4">
                  <div className="bg-purple-50 rounded-xl p-4">
                    <div className="text-xs text-slate-500 mb-1">POS Dineout Sales</div>
                    <div className="text-lg font-semibold">₹{inr(reco.dineout?.pos_sales)}</div>
                  </div>
                  <div className="bg-green-50 rounded-xl p-4">
                    <div className="text-xs text-slate-500 mb-1">Bank Received</div>
                    <div className="text-lg font-semibold text-green-600">₹{inr(reco.dineout?.bank_received)}</div>
                  </div>
                  <div className={`rounded-xl p-4 ${(reco.dineout?.pending || 0) > 0 ? 'bg-amber-50' : 'bg-green-50'}`}>
                    <div className="text-xs text-slate-500 mb-1">Pending Settlement</div>
                    <div className={`text-lg font-semibold ${(reco.dineout?.pending || 0) > 0 ? 'text-amber-600' : 'text-green-600'}`}>
                      ₹{inr(reco.dineout?.pending)}
                    </div>
                    <div className="text-xs text-slate-400">
                      {(reco.dineout?.pending || 0) > 0 ? '⏳ Awaiting settlement' : '✅ Fully settled'}
                    </div>
                  </div>
                </div>

                {/* Week-wise breakdown */}
                {reco.dineout?.weeks?.length > 0 && (
                  <div className="rounded-xl border overflow-hidden">
                    <Table>
                      <TableHeader>
                        <TableRow className="bg-slate-50">
                          <TableHead>Week</TableHead>
                          <TableHead>Date Range</TableHead>
                          <TableHead className="text-right">POS Sales</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {reco.dineout.weeks.map((week, idx) => (
                          <TableRow key={idx}>
                            <TableCell className="font-medium">{week.week}</TableCell>
                            <TableCell className="text-sm text-slate-500">{week.date_range}</TableCell>
                            <TableCell className="text-right font-mono">₹{inr(week.pos_sales)}</TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                )}
              </CardContent>
            </Card>
          )}

          {/* Card/UPI Settlements Section */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Card className="rounded-2xl">
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <CreditCard className="h-5 w-5" />
                  Card & UPI Settlements
                </CardTitle>
                <p className="text-xs text-slate-500">T+1 settlement</p>
              </CardHeader>
              <CardContent>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-slate-600">POS Card Sales:</span>
                    <span className="font-medium">₹{inr(reco.card_upi_settlements?.pos_card_sales)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-600">POS UPI Sales:</span>
                    <span className="font-medium">₹{inr(reco.card_upi_settlements?.pos_upi_sales)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-600">Total (before fees):</span>
                    <span className="font-medium">₹{inr(reco.card_upi_settlements?.pos_total)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-600">Bank Received:</span>
                    <span className="font-medium text-green-600">₹{inr(reco.card_upi_settlements?.bank_received)}</span>
                  </div>
                  <div className="flex justify-between border-t pt-2">
                    <span className="text-slate-600">Difference:</span>
                    <span className={`font-semibold ${Math.abs(reco.card_upi_settlements?.difference || 0) < 50000 ? 'text-green-600' : 'text-amber-600'}`}>
                      ₹{inr(reco.card_upi_settlements?.difference)}
                    </span>
                  </div>
                  <p className="text-xs text-slate-400 mt-1">{reco.card_upi_settlements?.note}</p>
                </div>
              </CardContent>
            </Card>

            <Card className="rounded-2xl">
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <Banknote className="h-5 w-5" />
                  Cash Deposits
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-slate-600">POS Cash Sales:</span>
                    <span className="font-medium">₹{inr(reco.cash_deposits?.pos_cash_sales)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-600">Bank Deposits:</span>
                    <span className="font-medium text-green-600">₹{inr(reco.cash_deposits?.bank_deposits)}</span>
                  </div>
                  <div className="flex justify-between border-t pt-2">
                    <span className="text-slate-600">Difference:</span>
                    <span className={`font-semibold ${Math.abs(reco.cash_deposits?.difference || 0) < 50000 ? 'text-green-600' : 'text-amber-600'}`}>
                      ₹{inr(reco.cash_deposits?.difference)}
                    </span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Bank Summary Table */}
          <Card className="rounded-2xl">
            <CardHeader>
              <CardTitle className="text-lg">Bank Credits by Category</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="rounded-xl border overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Category</TableHead>
                      <TableHead className="text-right">Transactions</TableHead>
                      <TableHead className="text-right">Total Amount</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {Object.entries(reco.bank_summary || {})
                      .sort(([,a], [,b]) => b.total - a.total)
                      .map(([cat, data]) => (
                        <TableRow key={cat}>
                          <TableCell className="font-medium capitalize">{cat || 'Uncategorized'}</TableCell>
                          <TableCell className="text-right">{data.count}</TableCell>
                          <TableCell className="text-right text-green-600 font-medium">₹{inr(data.total)}</TableCell>
                        </TableRow>
                      ))}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        </>
      )}
    </div>
  );
}
