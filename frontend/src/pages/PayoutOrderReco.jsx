import React, { useEffect, useMemo, useState } from "react";
import { inToIso } from "@/lib/date";
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
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
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

function startOfWeek(endDateStr, preset) {
  if (!endDateStr) return "";
  const d = new Date(`${endDateStr}T00:00:00`);
  const day = d.getDay();
  // JS: 0 Sun ... 6 Sat
  if (preset === "zomato") {
    // Mon(1) - Sun(0)
    const diffToMon = (day + 6) % 7;
    d.setDate(d.getDate() - diffToMon);
  } else if (preset === "swiggy") {
    // Sun(0) - Sat(6)
    d.setDate(d.getDate() - day);
  }
  const yyyy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const dd = String(d.getDate()).padStart(2, "0");
  return `${yyyy}-${mm}-${dd}`;
}

export default function PayoutOrderReco() {
  const [company, setCompany] = useState("DO");
  const [outlets, setOutlets] = useState([]);
  const [outlet, setOutlet] = useState("ALL");

  const [weekPreset, setWeekPreset] = useState("none");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");

  const [timeTol, setTimeTol] = useState(5);
  const [amtTol, setAmtTol] = useState(1);

  const [posFile, setPosFile] = useState(null);
  const [payoutFile, setPayoutFile] = useState(null);

  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState(null);
  const [msg, setMsg] = useState(null);
  const [result, setResult] = useState(null);

  useEffect(() => {
    (async () => {
      try {
        const res = await api.get("/outlets", { params: { company } });
        setOutlets(res.data || []);
      } catch (e) {
        setOutlets([]);
      }
    })();
  }, [company]);

  useEffect(() => {
    if (weekPreset === "none") return;
    if (!endDate) return;
    setStartDate(startOfWeek(endDate, weekPreset));
  }, [weekPreset, endDate]);

  const runReco = async () => {
    setErr(null);
    setMsg(null);
    setResult(null);

    if (!posFile) {
      setErr("Please upload POS file.");
      return;
    }
    if (!payoutFile) {
      setErr("Please upload partner payout file.");
      return;
    }

    setBusy(true);
    try {
      // 1) Upload payout file
      const fd1 = new FormData();
      fd1.append("company", company);
      fd1.append("file", payoutFile);
      const up = await api.post("/uploads/partner-payout", fd1);
      const payoutImportId = up.data?.id;

      // 2) Reconcile with POS file (fuzzy)
      const fd2 = new FormData();
      fd2.append("company", company);
      fd2.append("payout_import_id", payoutImportId);
      fd2.append("pos_file", posFile);
      if (outlet && outlet !== "ALL") fd2.append("outlet", outlet);
      if (startDate && endDate) {
        fd2.append("start_date", inToIso(startDate));
        fd2.append("end_date", inToIso(endDate));
      }
      fd2.append("time_tolerance_minutes", String(timeTol));
      fd2.append("amount_tolerance_rupees", String(amtTol));

      const rec = await api.post("/reports/payout-orders/file", fd2);
      setResult(rec.data);
      setMsg(
        `Done. Matched: ${rec.data?.summary?.matched || 0} / ${rec.data?.summary?.payout_orders || 0}`,
      );
    } catch (e) {
      setErr(e?.response?.data?.detail || "Failed to run reconciliation");
    } finally {
      setBusy(false);
    }
  };

  const summary = result?.summary;

  return (
    <div data-testid="payout-order-reco" className="space-y-6">
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        <Card
          data-testid="payout-order-reco-filters-card"
          className="rounded-2xl lg:col-span-2"
        >
          <CardHeader>
            <CardTitle className="text-lg">
              Order-wise payout reconciliation (FUZZY)
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div
              data-testid="payout-order-reco-note"
              className="text-sm text-slate-700"
            >
              Use the date range to match Zomato/Swiggy settlement weeks:
              Zomato = Mon–Sun, Swiggy = Sun–Sat.
            </div>

            <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
              <div className="space-y-1">
                <Label data-testid="payout-order-reco-company-label">
                  Company
                </Label>
                <Select value={company} onValueChange={setCompany}>
                  <SelectTrigger
                    data-testid="payout-order-reco-company-select"
                    className="rounded-xl"
                  >
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {companies.map((c) => (
                      <SelectItem
                        key={c}
                        value={c}
                        data-testid={`payout-order-reco-company-${c}`}
                      >
                        {c}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-1">
                <Label data-testid="payout-order-reco-outlet-label">Outlet</Label>
                <Select value={outlet} onValueChange={setOutlet}>
                  <SelectTrigger
                    data-testid="payout-order-reco-outlet-select"
                    className="rounded-xl"
                  >
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem
                      value="ALL"
                      data-testid="payout-order-reco-outlet-all"
                    >
                      All outlets
                    </SelectItem>
                    {(outlets || []).map((o) => (
                      <SelectItem
                        key={o.id}
                        value={o.outlet}
                        data-testid={`payout-order-reco-outlet-${o.id}`}
                      >
                        {o.outlet}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-1">
                <Label data-testid="payout-order-reco-week-preset-label">
                  Week preset
                </Label>
                <Select value={weekPreset} onValueChange={setWeekPreset}>
                  <SelectTrigger
                    data-testid="payout-order-reco-week-preset-select"
                    className="rounded-xl"
                  >
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem
                      value="none"
                      data-testid="payout-order-reco-week-preset-none"
                    >
                      Manual
                    </SelectItem>
                    <SelectItem
                      value="zomato"
                      data-testid="payout-order-reco-week-preset-zomato"
                    >
                      Zomato week (Mon–Sun)
                    </SelectItem>
                    <SelectItem
                      value="swiggy"
                      data-testid="payout-order-reco-week-preset-swiggy"
                    >
                      Swiggy week (Sun–Sat)
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <div className="space-y-1">
                <Label data-testid="payout-order-reco-start-date-label">
                  Start date
                </Label>
                <Input
                  data-testid="payout-order-reco-start-date-input"
                  placeholder="DD/MM/YYYY"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                />
              </div>
              <div className="space-y-1">
                <Label data-testid="payout-order-reco-end-date-label">
                  End date
                </Label>
                <Input
                  data-testid="payout-order-reco-end-date-input"
                  placeholder="DD/MM/YYYY"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                />
              </div>
            </div>

            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <div className="space-y-1">
                <Label data-testid="payout-order-reco-time-tol-label">
                  Time tolerance (minutes)
                </Label>
                <Input
                  data-testid="payout-order-reco-time-tol-input"
                  type="number"
                  value={timeTol}
                  onChange={(e) => setTimeTol(Number(e.target.value))}
                  min={0}
                  step={1}
                />
              </div>
              <div className="space-y-1">
                <Label data-testid="payout-order-reco-amt-tol-label">
                  Amount tolerance (₹)
                </Label>
                <Input
                  data-testid="payout-order-reco-amt-tol-input"
                  type="number"
                  value={amtTol}
                  onChange={(e) => setAmtTol(Number(e.target.value))}
                  min={0}
                  step={0.5}
                />
              </div>
            </div>

            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <div className="space-y-1">
                <Label data-testid="payout-order-reco-pos-file-label">
                  POS file (Excel)
                </Label>
                <Input
                  data-testid="payout-order-reco-pos-file-input"
                  type="file"
                  onChange={(e) => setPosFile(e.target.files?.[0] || null)}
                />
              </div>
              <div className="space-y-1">
                <Label data-testid="payout-order-reco-payout-file-label">
                  Swiggy/Zomato payout file (Excel)
                </Label>
                <Input
                  data-testid="payout-order-reco-payout-file-input"
                  type="file"
                  onChange={(e) => setPayoutFile(e.target.files?.[0] || null)}
                />
              </div>
            </div>

            <div className="flex flex-wrap gap-2">
              <Button
                data-testid="payout-order-reco-run-button"
                className="rounded-xl"
                onClick={runReco}
                disabled={busy}
              >
                {busy ? "Running…" : "Run Reconciliation"}
              </Button>

              {result?.export_url ? (
                <Button
                  data-testid="payout-order-reco-export-button"
                  variant="secondary"
                  className="rounded-xl"
                  onClick={() =>
                    window.open(downloadUrl(result.export_url), "_blank")
                  }
                >
                  Export Excel
                </Button>
              ) : null}
            </div>

            {err ? (
              <Alert
                data-testid="payout-order-reco-error-alert"
                variant="destructive"
              >
                <AlertTitle>Error</AlertTitle>
                <AlertDescription data-testid="payout-order-reco-error-text">
                  {err}
                </AlertDescription>
              </Alert>
            ) : null}

            {msg ? (
              <Alert data-testid="payout-order-reco-success-alert">
                <AlertTitle>Done</AlertTitle>
                <AlertDescription data-testid="payout-order-reco-success-text">
                  {msg}
                </AlertDescription>
              </Alert>
            ) : null}
          </CardContent>
        </Card>

        <Card data-testid="payout-order-reco-summary-card" className="rounded-2xl">
          <CardHeader>
            <CardTitle className="text-lg">Summary</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 text-sm">
            <div data-testid="payout-order-reco-summary-pos">POS online orders: {summary?.pos_online_orders ?? "—"}</div>
            <div data-testid="payout-order-reco-summary-payout">Payout orders: {summary?.payout_orders ?? "—"}</div>
            <div data-testid="payout-order-reco-summary-matched" className="font-medium">Matched: {summary?.matched ?? "—"}</div>
            <div data-testid="payout-order-reco-summary-missing-payout">Missing in payout: {summary?.missing_in_payout_count ?? "—"}</div>
            <div data-testid="payout-order-reco-summary-missing-pos">Missing in POS: {summary?.missing_in_pos_count ?? "—"}</div>
          </CardContent>
        </Card>
      </div>

      {result ? (
        <Accordion
          type="single"
          collapsible
          defaultValue="missing-in-payout"
          data-testid="payout-order-reco-accordion"
          className="space-y-3"
        >
          <AccordionItem value="missing-in-payout" className="rounded-2xl border bg-white/70">
            <AccordionTrigger data-testid="payout-order-reco-missing-payout-trigger" className="px-4">
              Missing in payout (POS orders not found)
            </AccordionTrigger>
            <AccordionContent className="px-4 pb-4">
              <div className="rounded-xl border">
                <Table data-testid="payout-order-reco-missing-payout-table">
                  <TableHeader>
                    <TableRow>
                      <TableHead>Invoice</TableHead>
                      <TableHead>Partner</TableHead>
                      <TableHead>Date</TableHead>
                      <TableHead>Food</TableHead>
                      <TableHead>Pack</TableHead>
                      <TableHead>Total</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {(result.missing_in_payout || []).map((r, idx) => (
                      <TableRow key={idx} data-testid={`payout-order-reco-missing-payout-row-${idx}`}>
                        <TableCell data-testid={`payout-order-reco-missing-payout-invoice-${idx}`}>{r.invoice_no}</TableCell>
                        <TableCell data-testid={`payout-order-reco-missing-payout-partner-${idx}`}>{r.partner}</TableCell>
                        <TableCell data-testid={`payout-order-reco-missing-payout-date-${idx}`}>{String(r.order_datetime || "").slice(0, 19)}</TableCell>
                        <TableCell data-testid={`payout-order-reco-missing-payout-food-${idx}`}>₹{inr(r.food_value)}</TableCell>
                        <TableCell data-testid={`payout-order-reco-missing-payout-pack-${idx}`}>₹{inr(r.packaging_charge)}</TableCell>
                        <TableCell data-testid={`payout-order-reco-missing-payout-total-${idx}`}>₹{inr(r.pos_total)}</TableCell>
                      </TableRow>
                    ))}
                    {!result.missing_in_payout?.length ? (
                      <TableRow>
                        <TableCell colSpan={6} data-testid="payout-order-reco-missing-payout-empty" className="text-sm text-slate-600">
                          None
                        </TableCell>
                      </TableRow>
                    ) : null}
                  </TableBody>
                </Table>
              </div>
            </AccordionContent>
          </AccordionItem>

          <AccordionItem value="missing-in-pos" className="rounded-2xl border bg-white/70">
            <AccordionTrigger data-testid="payout-order-reco-missing-pos-trigger" className="px-4">
              Missing in POS (payout orders not found)
            </AccordionTrigger>
            <AccordionContent className="px-4 pb-4">
              <div className="rounded-xl border">
                <Table data-testid="payout-order-reco-missing-pos-table">
                  <TableHeader>
                    <TableRow>
                      <TableHead>Partner</TableHead>
                      <TableHead>Partner Order ID</TableHead>
                      <TableHead>Date</TableHead>
                      <TableHead>Food</TableHead>
                      <TableHead>Pack</TableHead>
                      <TableHead>Net payout</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {(result.missing_in_pos || []).map((r, idx) => (
                      <TableRow key={idx} data-testid={`payout-order-reco-missing-pos-row-${idx}`}>
                        <TableCell data-testid={`payout-order-reco-missing-pos-partner-${idx}`}>{r.partner}</TableCell>
                        <TableCell data-testid={`payout-order-reco-missing-pos-id-${idx}`}>{r.partner_order_id}</TableCell>
                        <TableCell data-testid={`payout-order-reco-missing-pos-date-${idx}`}>{String(r.payout_datetime || "").slice(0, 19)}</TableCell>
                        <TableCell data-testid={`payout-order-reco-missing-pos-food-${idx}`}>₹{inr(r.payout_food_value)}</TableCell>
                        <TableCell data-testid={`payout-order-reco-missing-pos-pack-${idx}`}>₹{inr(r.payout_packaging_charge)}</TableCell>
                        <TableCell data-testid={`payout-order-reco-missing-pos-net-${idx}`}>₹{inr(r.payout_net)}</TableCell>
                      </TableRow>
                    ))}
                    {!result.missing_in_pos?.length ? (
                      <TableRow>
                        <TableCell colSpan={6} data-testid="payout-order-reco-missing-pos-empty" className="text-sm text-slate-600">
                          None
                        </TableCell>
                      </TableRow>
                    ) : null}
                  </TableBody>
                </Table>
              </div>
            </AccordionContent>
          </AccordionItem>

          <AccordionItem value="matches" className="rounded-2xl border bg-white/70">
            <AccordionTrigger data-testid="payout-order-reco-matches-trigger" className="px-4">
              Matches (sample)
            </AccordionTrigger>
            <AccordionContent className="px-4 pb-4">
              <div className="rounded-xl border">
                <Table data-testid="payout-order-reco-matches-table">
                  <TableHeader>
                    <TableRow>
                      <TableHead>Partner</TableHead>
                      <TableHead>Partner Order ID</TableHead>
                      <TableHead>POS Invoice</TableHead>
                      <TableHead>Match</TableHead>
                      <TableHead>Confidence</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {(result.matches || []).slice(0, 80).map((r, idx) => (
                      <TableRow key={idx} data-testid={`payout-order-reco-match-row-${idx}`}>
                        <TableCell data-testid={`payout-order-reco-match-partner-${idx}`}>{r.partner}</TableCell>
                        <TableCell data-testid={`payout-order-reco-match-id-${idx}`}>{r.partner_order_id}</TableCell>
                        <TableCell data-testid={`payout-order-reco-match-invoice-${idx}`}>{r.pos_invoice_no ?? "—"}</TableCell>
                        <TableCell data-testid={`payout-order-reco-match-type-${idx}`}>{r.match_type}</TableCell>
                        <TableCell data-testid={`payout-order-reco-match-confidence-${idx}`}>{r.confidence || "—"}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
              <div data-testid="payout-order-reco-matches-footnote" className="mt-2 text-xs text-slate-600">
                Showing first 80 matches.
              </div>
            </AccordionContent>
          </AccordionItem>
        </Accordion>
      ) : (
        <div data-testid="payout-order-reco-empty" className="text-sm text-slate-700">
          Upload files and run reconciliation to see missing orders.
        </div>
      )}
    </div>
  );
}
