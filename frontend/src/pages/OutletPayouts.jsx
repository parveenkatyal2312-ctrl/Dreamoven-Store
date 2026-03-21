import React, { useEffect, useState, useMemo } from "react";
import { api } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { CheckCircle, XCircle, RefreshCw } from "lucide-react";

const companies = ["DO", "KINFOLK", "DOPL"];
const platforms = ["zomato", "swiggy"];

function inr(n) {
  const x = Number(n || 0);
  return x.toLocaleString("en-IN", { maximumFractionDigits: 2 });
}

export default function OutletPayouts() {
  const [company, setCompany] = useState("KINFOLK");
  const [platform, setPlatform] = useState("zomato");
  const [payoutCycles, setPayoutCycles] = useState([]);
  const [selectedCycle, setSelectedCycle] = useState("");
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState(null);
  const [data, setData] = useState(null);

  // Fetch available payout cycles
  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        const res = await api.get("/outlet-payouts", { params: { company, platform } });
        if (mounted) {
          const cycles = [...new Set((res.data.outlets || []).map(o => o.payout_cycle))];
          setPayoutCycles(cycles);
          if (cycles.length > 0) {
            setSelectedCycle(cycles[0]);
          } else {
            setSelectedCycle("");
            setData(null);
          }
        }
      } catch (e) {
        console.error("Failed to fetch payout cycles:", e);
      }
    })();
    return () => { mounted = false; };
  }, [company, platform]);

  const fetchSummary = async () => {
    if (!selectedCycle) return;
    setErr(null);
    setBusy(true);
    try {
      const res = await api.get("/outlet-payouts/summary", {
        params: { company, payout_cycle: selectedCycle, platform }
      });
      setData(res.data);
    } catch (e) {
      setErr(e?.response?.data?.detail || "Failed to fetch outlet payouts");
    } finally {
      setBusy(false);
    }
  };

  useEffect(() => {
    if (selectedCycle) {
      fetchSummary();
    }
  }, [selectedCycle, company, platform]);

  const outlets = data?.outlets || [];
  const totals = data?.outlet_totals || {};
  const consolidated = data?.consolidated || {};
  const verification = data?.verification || {};

  return (
    <div data-testid="outlet-payouts" className="space-y-6">
      {/* Filters */}
      <Card data-testid="outlet-payouts-filters" className="rounded-2xl">
        <CardHeader>
          <CardTitle className="text-lg">Outlet-wise Payout Analysis</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Company</label>
              <Select value={company} onValueChange={(v) => { setCompany(v); setSelectedCycle(""); setData(null); }}>
                <SelectTrigger data-testid="outlet-payouts-company-select" className="rounded-xl">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {companies.map((c) => (
                    <SelectItem key={c} value={c}>{c}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Platform</label>
              <Select value={platform} onValueChange={(v) => { setPlatform(v); setSelectedCycle(""); setData(null); }}>
                <SelectTrigger data-testid="outlet-payouts-platform-select" className="rounded-xl">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="zomato">
                    <span className="text-red-600 font-medium">Zomato</span>
                  </SelectItem>
                  <SelectItem value="swiggy">
                    <span className="text-orange-600 font-medium">Swiggy</span>
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Payout Cycle</label>
              <Select value={selectedCycle} onValueChange={setSelectedCycle}>
                <SelectTrigger data-testid="outlet-payouts-cycle-select" className="rounded-xl">
                  <SelectValue placeholder="Select payout cycle" />
                </SelectTrigger>
                <SelectContent>
                  {payoutCycles.map((c) => (
                    <SelectItem key={c} value={c}>{c}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="flex items-end">
              <Button 
                data-testid="outlet-payouts-refresh-btn"
                onClick={fetchSummary} 
                disabled={busy || !selectedCycle}
                className="rounded-xl"
              >
                <RefreshCw className={`h-4 w-4 mr-2 ${busy ? "animate-spin" : ""}`} />
                Refresh
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {err && (
        <Alert variant="destructive">
          <AlertTitle>Error</AlertTitle>
          <AlertDescription>{err}</AlertDescription>
        </Alert>
      )}

      {payoutCycles.length === 0 && !busy && (
        <Alert>
          <AlertTitle>No Data</AlertTitle>
          <AlertDescription>
            No Zomato payout files found for {company}. Please upload a Zomato Settlement Report first.
          </AlertDescription>
        </Alert>
      )}

      {/* Verification Status */}
      {data && Object.keys(verification).length > 0 && (
        <Card data-testid="outlet-payouts-verification" className="rounded-2xl">
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              Verification Status
              {verification.orders_match && verification.gross_match && verification.commission_match ? (
                <Badge variant="default" className="bg-green-600">
                  <CheckCircle className="h-3 w-3 mr-1" /> All Matched
                </Badge>
              ) : (
                <Badge variant="destructive">
                  <XCircle className="h-3 w-3 mr-1" /> Mismatch Found
                </Badge>
              )}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-3 gap-4 text-sm">
              <div className="flex items-center gap-2">
                {verification.orders_match ? (
                  <CheckCircle className="h-4 w-4 text-green-600" />
                ) : (
                  <XCircle className="h-4 w-4 text-red-600" />
                )}
                <span>Orders: {verification.orders_match ? "Match" : "Mismatch"}</span>
              </div>
              <div className="flex items-center gap-2">
                {verification.gross_match ? (
                  <CheckCircle className="h-4 w-4 text-green-600" />
                ) : (
                  <XCircle className="h-4 w-4 text-red-600" />
                )}
                <span>Gross Value: {verification.gross_match ? "Match" : "Mismatch"}</span>
              </div>
              <div className="flex items-center gap-2">
                {verification.commission_match ? (
                  <CheckCircle className="h-4 w-4 text-green-600" />
                ) : (
                  <XCircle className="h-4 w-4 text-red-600" />
                )}
                <span>Commission: {verification.commission_match ? "Match" : "Mismatch"}</span>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Outlet Breakdown Table */}
      {outlets.length > 0 && (
        <Card data-testid="outlet-payouts-table-card" className="rounded-2xl">
          <CardHeader>
            <CardTitle className="text-lg">Outlet Breakdown - {selectedCycle}</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="whitespace-nowrap">Outlet</TableHead>
                    <TableHead className="whitespace-nowrap">Res ID</TableHead>
                    <TableHead className="whitespace-nowrap">Location</TableHead>
                    <TableHead className="text-right whitespace-nowrap">Orders</TableHead>
                    <TableHead className="text-right whitespace-nowrap">Gross Value (₹)</TableHead>
                    <TableHead className="text-right whitespace-nowrap">Commission (₹)</TableHead>
                    <TableHead className="text-right whitespace-nowrap">GST on Comm (₹)</TableHead>
                    <TableHead className="text-right whitespace-nowrap">Long Distance (₹)</TableHead>
                    <TableHead className="text-right whitespace-nowrap">TDS (₹)</TableHead>
                    <TableHead className="text-right whitespace-nowrap">TCS (₹)</TableHead>
                    <TableHead className="text-right whitespace-nowrap font-semibold">Order Payout (₹)</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {outlets.map((o, idx) => (
                    <TableRow key={idx} data-testid={`outlet-row-${idx}`}>
                      <TableCell className="font-medium whitespace-nowrap">
                        {o.mapped_name || o.outlet}
                        {o.mapped_name && o.mapped_name !== o.outlet && (
                          <span className="text-xs text-slate-400 ml-1">({o.outlet})</span>
                        )}
                      </TableCell>
                      <TableCell className="text-slate-500 text-xs font-mono">{o.res_id}</TableCell>
                      <TableCell className="text-slate-600 text-sm">{o.location || "-"}</TableCell>
                      <TableCell className="text-right">{o.orders}</TableCell>
                      <TableCell className="text-right">{inr(o.gross_order_value)}</TableCell>
                      <TableCell className="text-right text-red-600">{inr(o.commission)}</TableCell>
                      <TableCell className="text-right text-red-600">{inr(o.gst_on_commission)}</TableCell>
                      <TableCell className="text-right text-red-600">{inr(o.long_distance_charges)}</TableCell>
                      <TableCell className="text-right text-red-600">{inr(o.tds)}</TableCell>
                      <TableCell className="text-right text-red-600">{inr(o.tcs)}</TableCell>
                      <TableCell className="text-right font-semibold text-green-600">{inr(o.order_level_payout)}</TableCell>
                    </TableRow>
                  ))}
                  {/* Outlet Totals Row */}
                  <TableRow className="bg-slate-100 font-semibold">
                    <TableCell>OUTLET TOTALS</TableCell>
                    <TableCell></TableCell>
                    <TableCell></TableCell>
                    <TableCell className="text-right">{totals.orders}</TableCell>
                    <TableCell className="text-right">{inr(totals.gross_order_value)}</TableCell>
                    <TableCell className="text-right text-red-600">{inr(totals.commission)}</TableCell>
                    <TableCell className="text-right text-red-600">{inr(totals.gst_on_commission)}</TableCell>
                    <TableCell className="text-right text-red-600">{inr(totals.long_distance_charges)}</TableCell>
                    <TableCell className="text-right text-red-600">{inr(totals.tds)}</TableCell>
                    <TableCell className="text-right text-red-600">{inr(totals.tcs)}</TableCell>
                    <TableCell className="text-right text-green-600">{inr(totals.order_level_payout)}</TableCell>
                  </TableRow>
                  {/* Consolidated (Payout Page) Row */}
                  {consolidated && (
                    <TableRow className="bg-blue-50 font-semibold">
                      <TableCell>PAYOUT PAGE TOTAL</TableCell>
                      <TableCell></TableCell>
                      <TableCell></TableCell>
                      <TableCell className="text-right">{consolidated.orders}</TableCell>
                      <TableCell className="text-right">{inr(consolidated.gross_order_value)}</TableCell>
                      <TableCell className="text-right text-red-600">{inr(consolidated.commission)}</TableCell>
                      <TableCell className="text-right text-red-600">{inr(consolidated.gst_on_commission)}</TableCell>
                      <TableCell className="text-right text-red-600">{inr(consolidated.long_distance_charges)}</TableCell>
                      <TableCell className="text-right text-red-600">{inr(consolidated.tds)}</TableCell>
                      <TableCell className="text-right text-red-600">{inr(consolidated.tcs)}</TableCell>
                      <TableCell className="text-right text-green-600">{inr(consolidated.net_payout)}</TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </div>
            
            {/* Net Payout Difference Note */}
            {consolidated && totals.order_level_payout && (
              <div className="mt-4 p-4 bg-amber-50 rounded-xl text-sm">
                <p className="font-medium text-amber-800">Note on Payout Difference:</p>
                <p className="text-amber-700 mt-1">
                  Outlet Order Payout Total: ₹{inr(totals.order_level_payout)} vs Payout Page Net: ₹{inr(consolidated.net_payout)}
                </p>
                <p className="text-amber-700">
                  Difference: ₹{inr(Math.abs(totals.order_level_payout - consolidated.net_payout))} 
                  (due to Additions: ₹{inr(consolidated.additions || 0)} and Ad Charges: ₹{inr(consolidated.ad_charges || 0)})
                </p>
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}
