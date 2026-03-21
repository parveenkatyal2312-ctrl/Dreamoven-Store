import React, { useState } from "react";

import { api, downloadUrl } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

const companies = ["DO", "KINFOLK", "DOPL"];

function inr(n) {
  const x = Number(n || 0);
  return x.toLocaleString("en-IN", { maximumFractionDigits: 2 });
}

function pct(n) {
  if (n === null || n === undefined) return "—";
  const x = Number(n);
  const sign = x > 0 ? "+" : "";
  return `${sign}${x.toFixed(1)}%`;
}

export default function Monthly() {
  const [company, setCompany] = useState("DO");
  const [month, setMonth] = useState("2025-12");
  const [compareMonth, setCompareMonth] = useState("");
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState(null);
  const [report, setReport] = useState(null);

  const generate = async () => {
    setErr(null);
    setReport(null);
    setBusy(true);
    try {
      const payload = { company, month };
      if (compareMonth.trim()) payload.compare_month = compareMonth.trim();
      const res = await api.post("/reports/monthly", payload);
      setReport(res.data);
    } catch (e) {
      setErr(e?.response?.data?.detail || "Failed to generate monthly report");
    } finally {
      setBusy(false);
    }
  };

  return (
    <div data-testid="monthly" className="space-y-6">
      <Card data-testid="monthly-filters-card" className="rounded-2xl">
        <CardHeader>
          <CardTitle className="text-lg">Monthly report</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-4">
            <div className="space-y-1">
              <Label data-testid="monthly-company-label">Company</Label>
              <Select value={company} onValueChange={setCompany}>
                <SelectTrigger
                  data-testid="monthly-company-select"
                  className="rounded-xl"
                >
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {companies.map((c) => (
                    <SelectItem
                      key={c}
                      value={c}
                      data-testid={`monthly-company-${c}`}
                    >
                      {c}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1">
              <Label data-testid="monthly-month-label">Month (YYYY-MM)</Label>
              <Input
                data-testid="monthly-month-input"
                value={month}
                onChange={(e) => setMonth(e.target.value)}
                placeholder="2025-11"
              />
            </div>
            <div className="space-y-1">
              <Label data-testid="monthly-compare-month-label">
                Compare with (optional)
              </Label>
              <Input
                data-testid="monthly-compare-month-input"
                value={compareMonth}
                onChange={(e) => setCompareMonth(e.target.value)}
                placeholder="e.g., 2025-10 or 2025-04"
              />
            </div>
            <div className="flex items-end">
              <Button
                data-testid="monthly-generate-button"
                className="w-full rounded-xl"
                onClick={generate}
                disabled={busy}
              >
                {busy ? "Generating…" : "Generate"}
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {err ? (
        <Alert data-testid="monthly-error-alert" variant="destructive">
          <AlertTitle>Error</AlertTitle>
          <AlertDescription data-testid="monthly-error-text">{err}</AlertDescription>
        </Alert>
      ) : null}

      {report ? (
        <div data-testid="monthly-report" className="space-y-4">
          <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
            <div
              data-testid="monthly-report-id"
              className="text-sm text-slate-700"
            >
              Report ID: <span className="font-mono">{report.id}</span>
            </div>
            <Button
              data-testid="monthly-export-button"
              className="rounded-xl"
              onClick={() => window.open(downloadUrl(report.export_url), "_blank")}
            >
              Export Excel
            </Button>
          </div>

          <div className="grid grid-cols-1 gap-4 lg:grid-cols-4">
            <Card data-testid="monthly-metric-sales" className="rounded-2xl lg:col-span-2">
              <CardHeader>
                <CardTitle className="text-lg">Sales</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2 text-sm">
                <div data-testid="monthly-sales-total">
                  Total sales: ₹{inr(report.summary?.sales_total)}
                </div>
                <div data-testid="monthly-orders-total">
                  Orders: {report.summary?.orders_total}
                </div>
              </CardContent>
            </Card>
            <Card data-testid="monthly-metric-online" className="rounded-2xl">
              <CardHeader>
                <CardTitle className="text-lg">Online</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2 text-sm">
                <div data-testid="monthly-online-sales">
                  Sales: ₹{inr(report.summary?.online_sales_total)}
                </div>
                <div data-testid="monthly-online-orders">
                  Orders: {report.summary?.online_orders}
                </div>
              </CardContent>
            </Card>
            <Card data-testid="monthly-metric-gst" className="rounded-2xl">
              <CardHeader>
                <CardTitle className="text-lg">GST</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2 text-sm">
                <div data-testid="monthly-gst-payable">
                  GST payable (POS total_tax): ₹
                  {inr(report.summary?.gst_payable_dinein_total_tax)}
                </div>
              </CardContent>
            </Card>
          </div>

          <Card data-testid="monthly-mom-card" className="rounded-2xl">
            <CardHeader>
              <CardTitle className="text-lg">Outlet MoM by platform</CardTitle>
            </CardHeader>
            <CardContent>
              <div data-testid="monthly-mom-note" className="text-sm text-slate-700">
                Platforms: Swiggy, Zomato, Dine-in, Takeaway, Self-delivery.
                AOV is used for non-dine-in; APC is used for dine-in.
              </div>
              <div
                data-testid="monthly-mom-compare-note"
                className="mt-1 text-xs text-slate-600"
              >
                Compare month used: {report.compare_month || "(none)"}
              </div>

              <div className="mt-3 rounded-xl border">
                <Table data-testid="monthly-mom-table">
                  <TableHeader>
                    <TableRow>
                      <TableHead>Outlet</TableHead>
                      <TableHead>Platform</TableHead>
                      <TableHead>Orders</TableHead>
                      <TableHead>Sales</TableHead>
                      <TableHead>Avg (AOV/APC)</TableHead>
                      <TableHead>MoM Sales</TableHead>
                      <TableHead>MoM Orders</TableHead>
                      <TableHead>Status</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {(report.outlet_mom || []).slice(0, 200).map((r, idx) => (
                      <TableRow
                        key={`${r.outlet}-${r.platform}-${idx}`}
                        data-testid={`monthly-mom-row-${idx}`}
                      >
                        <TableCell data-testid={`monthly-mom-outlet-${idx}`}>
                          {r.outlet}
                        </TableCell>
                        <TableCell data-testid={`monthly-mom-platform-${idx}`}>
                          {r.platform}
                        </TableCell>
                        <TableCell data-testid={`monthly-mom-orders-${idx}`}>
                          {r.orders}
                        </TableCell>
                        <TableCell data-testid={`monthly-mom-sales-${idx}`}>
                          ₹{inr(r.sales)}
                        </TableCell>
                        <TableCell data-testid={`monthly-mom-avg-${idx}`}>
                          <div className="flex items-center gap-2">
                            <span>₹{inr(r.avg_value)}</span>
                            <span
                              data-testid={`monthly-mom-avg-type-${idx}`}
                              className={
                                r.avg_type === "APC"
                                  ? "rounded-full bg-emerald-50 px-2 py-0.5 text-[11px] font-medium text-emerald-700"
                                  : r.avg_type === "APC_EST"
                                    ? "rounded-full bg-amber-50 px-2 py-0.5 text-[11px] font-medium text-amber-800"
                                    : "rounded-full bg-slate-100 px-2 py-0.5 text-[11px] font-medium text-slate-700"
                              }
                            >
                              {r.avg_type}
                            </span>
                          </div>
                        </TableCell>
                        <TableCell data-testid={`monthly-mom-sales-pct-${idx}`}>
                          {pct(r.sales_mom_pct)}
                        </TableCell>
                        <TableCell data-testid={`monthly-mom-orders-pct-${idx}`}>
                          {pct(r.orders_mom_pct)}
                        </TableCell>
                        <TableCell data-testid={`monthly-mom-status-${idx}`}>
                          {r.mom_status === "New" ? (
                            <span className="rounded-full bg-indigo-50 px-2 py-1 text-xs font-medium text-indigo-700">
                              New
                            </span>
                          ) : (
                            <span className="rounded-full bg-slate-100 px-2 py-1 text-xs font-medium text-slate-700">
                              OK
                            </span>
                          )}
                        </TableCell>
                      </TableRow>
                    ))}

                    {!report.outlet_mom?.length ? (
                      <TableRow>
                        <TableCell
                          colSpan={8}
                          data-testid="monthly-mom-empty"
                          className="text-sm text-slate-600"
                        >
                          No outlet MoM rows for this month. Upload POS for this
                          month (and optionally a compare month).
                        </TableCell>
                      </TableRow>
                    ) : null}
                  </TableBody>
                </Table>
              </div>

              <div
                data-testid="monthly-mom-footnote"
                className="mt-2 text-xs text-slate-600"
              >
                Showing first 200 rows for speed.
              </div>
            </CardContent>
          </Card>
        </div>
      ) : (
        <div data-testid="monthly-empty" className="text-sm text-slate-700">
          Generate a month-end report (and optionally compare with any other
          month like April).
        </div>
      )}
    </div>
  );
}
