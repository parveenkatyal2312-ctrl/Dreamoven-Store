import React, { useEffect, useMemo, useState } from "react";
import { api, downloadUrl } from "@/lib/api";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
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
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";

const companies = ["DO", "KINFOLK", "DOPL", "ALL"];

function inr(n) {
  const x = Number(n || 0);
  return x.toLocaleString("en-IN", { maximumFractionDigits: 2 });
}

function pct(n) {
  if (n === null || n === undefined) return "—";
  return `${Number(n || 0).toFixed(2)}%`;
}

function UploadBlock({ title, testidPrefix, onUpload }) {
  const [file, setFile] = useState(null);
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState(null);
  const [err, setErr] = useState(null);

  const submit = async () => {
    setErr(null);
    setMsg(null);
    if (!file) {
      setErr("Please choose a file.");
      return;
    }
    setBusy(true);
    try {
      const res = await onUpload(file);
      setMsg(res?.message || "Uploaded");
    } catch (e) {
      setErr(e?.response?.data?.detail || "Upload failed");
    } finally {
      setBusy(false);
    }
  };

  return (
    <Card data-testid={`${testidPrefix}-card`} className="rounded-2xl">
      <CardHeader>
        <CardTitle data-testid={`${testidPrefix}-title`} className="text-lg">
          {title}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        <Input
          data-testid={`${testidPrefix}-file-input`}
          type="file"
          onChange={(e) => setFile(e.target.files?.[0] || null)}
        />

        {err ? (
          <Alert data-testid={`${testidPrefix}-error-alert`} variant="destructive">
            <AlertTitle>Error</AlertTitle>
            <AlertDescription data-testid={`${testidPrefix}-error-text`}>
              {err}
            </AlertDescription>
          </Alert>
        ) : null}

        {msg ? (
          <Alert data-testid={`${testidPrefix}-success-alert`}>
            <AlertTitle>Done</AlertTitle>
            <AlertDescription data-testid={`${testidPrefix}-success-text`}>
              {msg}
            </AlertDescription>
          </Alert>
        ) : null}

        <Button
          data-testid={`${testidPrefix}-upload-button`}
          className="rounded-xl"
          onClick={submit}
          disabled={busy}
        >
          {busy ? "Uploading…" : "Upload"}
        </Button>
      </CardContent>
    </Card>
  );
}

export default function AggregatorsMonthly() {
  const [company, setCompany] = useState("ALL");
  const [month, setMonth] = useState("2025-11");

  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState(null);
  const [report, setReport] = useState(null);

  const load = async () => {
    setErr(null);
    setReport(null);
    setBusy(true);
    try {
      const payload = { month };
      if (company !== "ALL") payload.company = company;
      const res = await api.post("/reports/aggregators-monthly", payload);
      setReport(res.data);
    } catch (e) {
      setErr(e?.response?.data?.detail || "Failed to generate report");
    } finally {
      setBusy(false);
    }
  };

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const companiesRows = report?.companies || [];

  return (
    <div data-testid="aggregators-monthly" className="space-y-6">
      <Card data-testid="aggregators-filters-card" className="rounded-2xl">
        <CardHeader>
          <CardTitle className="text-lg">Monthly aggregator summary</CardTitle>
        </CardHeader>
        <CardContent className="grid grid-cols-1 gap-3 sm:grid-cols-4">
          <div className="space-y-1">
            <Label data-testid="aggregators-company-label">Company</Label>
            <Select value={company} onValueChange={setCompany}>
              <SelectTrigger data-testid="aggregators-company-select" className="rounded-xl">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {companies.map((c) => (
                  <SelectItem key={c} value={c} data-testid={`aggregators-company-${c}`}>
                    {c}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1">
            <Label data-testid="aggregators-month-label">Month (YYYY-MM)</Label>
            <Input
              data-testid="aggregators-month-input"
              value={month}
              onChange={(e) => setMonth(e.target.value)}
              placeholder="2025-11"
            />
          </div>
          <div className="flex items-end">
            <Button
              data-testid="aggregators-generate-button"
              className="w-full rounded-xl"
              onClick={load}
              disabled={busy}
            >
              {busy ? "Generating…" : "Generate"}
            </Button>
          </div>
          <div className="flex items-end">
            {report?.export_url ? (
              <Button
                data-testid="aggregators-export-button"
                variant="secondary"
                className="w-full rounded-xl"
                onClick={() => window.open(downloadUrl(report.export_url), "_blank")}
              >
                Export Excel
              </Button>
            ) : (
              <Button
                data-testid="aggregators-export-disabled"
                variant="secondary"
                className="w-full rounded-xl"
                disabled
              >
                Export Excel
              </Button>
            )}
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <UploadBlock
          title="Upload Ads/Promo charges (Outlet-wise)"
          testidPrefix="aggregators-upload-ads"
          onUpload={async (file) => {
            const fd = new FormData();
            fd.append("company", company === "ALL" ? "DO" : company);
            fd.append("month", month);
            fd.append("type", "ads");
            fd.append("file", file);
            const res = await api.post("/uploads/partner-deductions", fd);
            return res.data;
          }}
        />
        <UploadBlock
          title="Upload Long Distance Charges (LDC) (Outlet-wise)"
          testidPrefix="aggregators-upload-ldc"
          onUpload={async (file) => {
            const fd = new FormData();
            fd.append("company", company === "ALL" ? "DO" : company);
            fd.append("month", month);
            fd.append("type", "ldc");
            fd.append("file", file);
            const res = await api.post("/uploads/partner-deductions", fd);
            return res.data;
          }}
        />
      </div>

      {err ? (
        <Alert data-testid="aggregators-error-alert" variant="destructive">
          <AlertTitle>Error</AlertTitle>
          <AlertDescription data-testid="aggregators-error-text">{err}</AlertDescription>
        </Alert>
      ) : null}

      {report ? (
        <div data-testid="aggregators-report" className="space-y-4">
          <Card data-testid="aggregators-companywise-card" className="rounded-2xl">
            <CardHeader>
              <CardTitle className="text-lg">Company-wise summary</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="rounded-xl border">
                <Table data-testid="aggregators-companywise-table">
                  <TableHeader>
                    <TableRow>
                      <TableHead>Company</TableHead>
                      <TableHead>Revenue (Food+Container)</TableHead>
                      <TableHead>Commission+Conv</TableHead>
                      <TableHead>LDC</TableHead>
                      <TableHead>Ads</TableHead>
                      <TableHead>GST 18% on (Comm+LDC+Ads)</TableHead>
                      <TableHead className="text-right">Net receivable</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {companiesRows.map((r, idx) => (
                      <TableRow key={r.company} data-testid={`aggregators-company-row-${idx}`}>
                        <TableCell data-testid={`aggregators-company-name-${idx}`} className="font-medium">
                          {r.company}
                        </TableCell>
                        <TableCell data-testid={`aggregators-company-revenue-${idx}`}>₹{inr(r.revenue)}</TableCell>
                        <TableCell data-testid={`aggregators-company-comm-${idx}`}>₹{inr(r.commission_conv)}</TableCell>
                        <TableCell data-testid={`aggregators-company-ldc-${idx}`}>₹{inr(r.ldc)}</TableCell>
                        <TableCell data-testid={`aggregators-company-ads-${idx}`}>₹{inr(r.ads)}</TableCell>
                        <TableCell data-testid={`aggregators-company-gst-${idx}`}>₹{inr(r.gst_on_deductions)}</TableCell>
                        <TableCell data-testid={`aggregators-company-net-${idx}`} className="text-right font-semibold">₹{inr(r.net_receivable)}</TableCell>
                      </TableRow>
                    ))}
                    {report?.all_companies_total ? (
                      <TableRow data-testid="aggregators-company-row-all" className="bg-slate-50">
                        <TableCell data-testid="aggregators-company-name-all" className="font-semibold">All Companies</TableCell>
                        <TableCell data-testid="aggregators-company-revenue-all" className="font-medium">₹{inr(report.all_companies_total.revenue)}</TableCell>
                        <TableCell data-testid="aggregators-company-comm-all" className="font-medium">₹{inr(report.all_companies_total.commission_conv)}</TableCell>
                        <TableCell data-testid="aggregators-company-ldc-all" className="font-medium">₹{inr(report.all_companies_total.ldc)}</TableCell>
                        <TableCell data-testid="aggregators-company-ads-all" className="font-medium">₹{inr(report.all_companies_total.ads)}</TableCell>
                        <TableCell data-testid="aggregators-company-gst-all" className="font-medium">₹{inr(report.all_companies_total.gst_on_deductions)}</TableCell>
                        <TableCell data-testid="aggregators-company-net-all" className="text-right text-base font-semibold">₹{inr(report.all_companies_total.net_receivable)}</TableCell>
                      </TableRow>
                    ) : null}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>

          <Accordion type="single" collapsible defaultValue="partner" data-testid="aggregators-accordion" className="space-y-3">
            <AccordionItem value="partner" className="rounded-2xl border bg-white/70">
              <AccordionTrigger data-testid="aggregators-partner-trigger" className="px-4">
                Partner summary (Zomato vs Swiggy)
              </AccordionTrigger>
              <AccordionContent className="px-4 pb-4">
                <div className="rounded-xl border">
                  <Table data-testid="aggregators-partner-table">
                    <TableHeader>
                      <TableRow>
                        <TableHead>Company</TableHead>
                        <TableHead>Partner</TableHead>
                        <TableHead>Revenue</TableHead>
                        <TableHead>Comm+Conv</TableHead>
                        <TableHead>LDC</TableHead>
                        <TableHead>Ads</TableHead>
                        <TableHead>GST 18%</TableHead>
                        <TableHead className="text-right">Net</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {(report.partner_summaries || []).map((r, idx) => (
                        <TableRow key={`${r.company}-${r.partner}-${idx}`} data-testid={`aggregators-partner-row-${idx}`}>
                          <TableCell data-testid={`aggregators-partner-company-${idx}`}>{r.company}</TableCell>
                          <TableCell data-testid={`aggregators-partner-name-${idx}`} className="font-medium">{r.partner}</TableCell>
                          <TableCell data-testid={`aggregators-partner-revenue-${idx}`}>₹{inr(r.revenue)}</TableCell>
                          <TableCell data-testid={`aggregators-partner-comm-${idx}`}>₹{inr(r.commission_conv)}</TableCell>
                          <TableCell data-testid={`aggregators-partner-ldc-${idx}`}>₹{inr(r.ldc)}</TableCell>
                          <TableCell data-testid={`aggregators-partner-ads-${idx}`}>₹{inr(r.ads)}</TableCell>
                          <TableCell data-testid={`aggregators-partner-gst-${idx}`}>₹{inr(r.gst_on_deductions)}</TableCell>
                          <TableCell data-testid={`aggregators-partner-net-${idx}`} className="text-right font-semibold">₹{inr(r.net_receivable)}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              </AccordionContent>
            </AccordionItem>

            <AccordionItem value="outlet" className="rounded-2xl border bg-white/70">
              <AccordionTrigger data-testid="aggregators-outlet-trigger" className="px-4">
                Outlet-wise (sample)
              </AccordionTrigger>
              <AccordionContent className="px-4 pb-4">
                <div data-testid="aggregators-outlet-note" className="text-sm text-slate-700">
                  Showing first 200 rows (export Excel for full list). Percentages are of Revenue.
                </div>
                <div className="mt-3 rounded-xl border">
                  <Table data-testid="aggregators-outlet-table">
                    <TableHeader>
                      <TableRow>
                        <TableHead>Company</TableHead>
                        <TableHead>Outlet</TableHead>
                        <TableHead>Partner</TableHead>
                        <TableHead>Revenue</TableHead>
                        <TableHead>Comm%</TableHead>
                        <TableHead>LDC%</TableHead>
                        <TableHead>Ads%</TableHead>
                        <TableHead>GST%</TableHead>
                        <TableHead className="text-right">Net%</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {(report.outlet_lines || []).slice(0, 200).map((r, idx) => (
                        <TableRow key={`${r.company}-${r.outlet}-${r.partner}-${idx}`} data-testid={`aggregators-outlet-row-${idx}`}>
                          <TableCell data-testid={`aggregators-outlet-company-${idx}`}>{r.company}</TableCell>
                          <TableCell data-testid={`aggregators-outlet-name-${idx}`}>{r.outlet}</TableCell>
                          <TableCell data-testid={`aggregators-outlet-partner-${idx}`}>{r.partner}</TableCell>
                          <TableCell data-testid={`aggregators-outlet-revenue-${idx}`}>₹{inr(r.revenue)}</TableCell>
                          <TableCell data-testid={`aggregators-outlet-comm-pct-${idx}`}>{pct(r.commission_conv_pct)}</TableCell>
                          <TableCell data-testid={`aggregators-outlet-ldc-pct-${idx}`}>{pct(r.ldc_pct)}</TableCell>
                          <TableCell data-testid={`aggregators-outlet-ads-pct-${idx}`}>{pct(r.ads_pct)}</TableCell>
                          <TableCell data-testid={`aggregators-outlet-gst-pct-${idx}`}>{pct(r.gst_pct)}</TableCell>
                          <TableCell data-testid={`aggregators-outlet-net-pct-${idx}`} className="text-right font-semibold">{pct(r.net_pct)}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              </AccordionContent>
            </AccordionItem>
          </Accordion>
        </div>
      ) : (
        <div data-testid="aggregators-empty" className="text-sm text-slate-700">
          Generate a report to view company-wise aggregator net receivable.
        </div>
      )}
    </div>
  );
}
