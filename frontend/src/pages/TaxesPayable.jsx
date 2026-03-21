import React, { useEffect, useMemo, useState } from "react";
import { api, downloadUrl } from "@/lib/api";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
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

const companies = ["DO", "KINFOLK", "DOPL"];

function inr(n) {
  const x = Number(n || 0);
  return x.toLocaleString("en-IN", { maximumFractionDigits: 2 });
}

export default function TaxesPayable() {
  const [company, setCompany] = useState("DO");
  const [month, setMonth] = useState("2025-11");
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState(null);
  const [data, setData] = useState(null);

  const [tanyanFile, setTanyanFile] = useState(null);
  const [uploadBusy, setUploadBusy] = useState(false);
  const [uploadMsg, setUploadMsg] = useState(null);

  const load = async () => {
    setErr(null);
    setBusy(true);
    try {
      const res = await api.get("/taxes/payable", { params: { company, month } });
      setData(res.data);
    } catch (e) {
      setErr(e?.response?.data?.detail || "Failed to load taxes");
    } finally {
      setBusy(false);
    }
  };

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [company, month]);

  const uploadTanyan = async () => {
    setErr(null);
    setUploadMsg(null);
    if (!tanyanFile) {
      setErr("Please select TAN YAN item-wise file");
      return;
    }
    setUploadBusy(true);
    try {
      const fd = new FormData();
      fd.append("company", "KINFOLK");
      fd.append("outlet", "TAN YAN");
      fd.append("file", tanyanFile);
      const res = await api.post("/uploads/itemwise-sales", fd);
      setUploadMsg(res.data?.message || "Uploaded");
      await load();
    } catch (e) {
      setErr(e?.response?.data?.detail || "Upload failed");
    } finally {
      setUploadBusy(false);
    }
  };

  const tan = data?.tan_yan;

  return (
    <div data-testid="taxes-payable" className="space-y-6">
      <Card data-testid="taxes-filters-card" className="rounded-2xl">
        <CardHeader>
          <CardTitle className="text-lg">Filters</CardTitle>
        </CardHeader>
        <CardContent className="grid grid-cols-1 gap-3 sm:grid-cols-3">
          <div className="space-y-1">
            <Label data-testid="taxes-company-label">Company</Label>
            <Select value={company} onValueChange={setCompany}>
              <SelectTrigger data-testid="taxes-company-select" className="rounded-xl">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {companies.map((c) => (
                  <SelectItem key={c} value={c} data-testid={`taxes-company-${c}`}>
                    {c}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1">
            <Label data-testid="taxes-month-label">Month (YYYY-MM)</Label>
            <Input
              data-testid="taxes-month-input"
              value={month}
              onChange={(e) => setMonth(e.target.value)}
              placeholder="2025-11"
            />
          </div>
          <div className="flex items-end">
            <Button
              data-testid="taxes-refresh-button"
              className="w-full rounded-xl"
              onClick={load}
              disabled={busy}
            >
              {busy ? "Loading…" : "Refresh"}
            </Button>
          </div>
        </CardContent>
      </Card>

      {err ? (
        <Alert data-testid="taxes-error-alert" variant="destructive">
          <AlertTitle>Error</AlertTitle>
          <AlertDescription data-testid="taxes-error-text">{err}</AlertDescription>
        </Alert>
      ) : null}

      {data ? (
        <div data-testid="taxes-content" className="grid grid-cols-1 gap-4 lg:grid-cols-3">
          <Card data-testid="taxes-gst-card" className="rounded-2xl lg:col-span-2">
            <CardHeader>
              <CardTitle className="text-lg">GST payable (5%)</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div data-testid="taxes-gst-note" className="text-sm text-slate-700">
                We calculate GST on dine-in + takeaway + self-delivery. We also show variance vs POS tax totals.
              </div>
              <div className="rounded-xl border">
                <Table data-testid="taxes-gst-table">
                  <TableHeader>
                    <TableRow>
                      <TableHead>Metric</TableHead>
                      <TableHead className="text-right">Amount</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    <TableRow>
                      <TableCell data-testid="taxes-gst-taxable-base-label">Taxable base (Total - POS Tax)</TableCell>
                      <TableCell data-testid="taxes-gst-taxable-base" className="text-right">₹{inr(data.gst?.taxable_base)}</TableCell>
                    </TableRow>
                    <TableRow>
                      <TableCell data-testid="taxes-gst-calculated-label">Calculated GST @5% (base * 5%)</TableCell>
                      <TableCell data-testid="taxes-gst-calculated" className="text-right font-medium">₹{inr(data.gst?.gst_calculated)}</TableCell>
                    </TableRow>
                    <TableRow>
                      <TableCell data-testid="taxes-gst-pos-label">POS tax total (Total Tax)</TableCell>
                      <TableCell data-testid="taxes-gst-pos" className="text-right">₹{inr(data.gst?.gst_pos_total_tax)}</TableCell>
                    </TableRow>
                    <TableRow className="bg-slate-50">
                      <TableCell data-testid="taxes-gst-variance-label">Variance (Calculated - POS)</TableCell>
                      <TableCell data-testid="taxes-gst-variance" className="text-right font-semibold">₹{inr(data.gst?.variance)}</TableCell>
                    </TableRow>
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>

          <Card data-testid="taxes-tds-card" className="rounded-2xl">
            <CardHeader>
              <CardTitle className="text-lg">TDS summary</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2 text-sm">
              <div data-testid="taxes-tds-partner-deducted">TDS deducted by partners (1% on base): ₹{inr(data.tds?.deducted_by_partners)}</div>
              <div data-testid="taxes-tds-payable-zomato">TDS payable on commission (Zomato): ₹{inr(data.tds?.payable_by_us_zomato)}</div>
              <div data-testid="taxes-tds-payable-swiggy">TDS payable on commission (Swiggy): ₹{inr(data.tds?.payable_by_us_swiggy)}</div>
              <div data-testid="taxes-tds-total" className="font-medium">Total TDS impact: ₹{inr(data.tds?.total_tds_impact)}</div>
            </CardContent>
          </Card>

          {company === "KINFOLK" ? (
            <Card data-testid="taxes-tanyan-card" className="rounded-2xl lg:col-span-3">
              <CardHeader>
                <CardTitle className="text-lg">TAN YAN — Food + Liquor (GST + VAT)</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div data-testid="taxes-tanyan-upload" className="grid grid-cols-1 gap-3 sm:grid-cols-3">
                  <div className="sm:col-span-2 space-y-1">
                    <Label data-testid="taxes-tanyan-file-label">Upload TAN YAN item-wise report (Nov)</Label>
                    <Input data-testid="taxes-tanyan-file-input" type="file" onChange={(e) => setTanyanFile(e.target.files?.[0] || null)} />
                  </div>
                  <div className="flex items-end">
                    <Button data-testid="taxes-tanyan-upload-button" className="w-full rounded-xl" onClick={uploadTanyan} disabled={uploadBusy}>
                      {uploadBusy ? "Uploading…" : "Upload"}
                    </Button>
                  </div>
                </div>

                {uploadMsg ? (
                  <Alert data-testid="taxes-tanyan-upload-success">
                    <AlertTitle>Done</AlertTitle>
                    <AlertDescription data-testid="taxes-tanyan-upload-success-text">{uploadMsg}</AlertDescription>
                  </Alert>
                ) : null}

                {tan ? (
                  <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
                    <Card data-testid="taxes-tanyan-sales-card" className="rounded-2xl">
                      <CardHeader>
                        <CardTitle className="text-base">Sales</CardTitle>
                      </CardHeader>
                      <CardContent className="space-y-1 text-sm">
                        <div data-testid="taxes-tanyan-food-sales">Food sales: ₹{inr(tan.food_sales)}</div>
                        <div data-testid="taxes-tanyan-liquor-sales">Liquor sales: ₹{inr(tan.liquor_sales)}</div>
                        <div data-testid="taxes-tanyan-total-sales" className="font-medium">Total sale: ₹{inr(tan.total_sales)}</div>
                      </CardContent>
                    </Card>
                    <Card data-testid="taxes-tanyan-gst-card" className="rounded-2xl">
                      <CardHeader>
                        <CardTitle className="text-base">GST on Food (5%)</CardTitle>
                      </CardHeader>
                      <CardContent className="space-y-1 text-sm">
                        <div data-testid="taxes-tanyan-gst-calc">Calculated: ₹{inr(tan.gst_food_calculated)}</div>
                        <div data-testid="taxes-tanyan-gst-pos">POS GST (CGST+SGST): ₹{inr(tan.gst_food_pos)}</div>
                        <div data-testid="taxes-tanyan-gst-var" className="font-medium">Variance: ₹{inr(tan.gst_variance)}</div>
                      </CardContent>
                    </Card>
                    <Card data-testid="taxes-tanyan-vat-card" className="rounded-2xl">
                      <CardHeader>
                        <CardTitle className="text-base">VAT on Liquor (18%)</CardTitle>
                      </CardHeader>
                      <CardContent className="space-y-1 text-sm">
                        <div data-testid="taxes-tanyan-vat-base">VAT base (from report): ₹{inr(tan.vat_taxable_base)}</div>
                        <div data-testid="taxes-tanyan-vat-calc">Calculated VAT: ₹{inr(tan.vat_calculated)}</div>
                        <div data-testid="taxes-tanyan-vat-pos">POS VAT: ₹{inr(tan.vat_pos)}</div>
                        <div data-testid="taxes-tanyan-vat-var" className="font-medium">Variance: ₹{inr(tan.vat_variance)}</div>
                      </CardContent>
                    </Card>
                  </div>
                ) : (
                  <div data-testid="taxes-tanyan-empty" className="text-sm text-slate-700">
                    Upload the item-wise report to calculate TAN YAN liquor VAT + food GST.
                  </div>
                )}
              </CardContent>
            </Card>
          ) : null}

          <div className="lg:col-span-3 flex justify-end">
            {data.export_url ? (
              <Button
                data-testid="taxes-export-button"
                className="rounded-xl"
                onClick={() => window.open(downloadUrl(data.export_url), "_blank")}
              >
                Export Taxes Excel
              </Button>
            ) : null}
          </div>
        </div>
      ) : (
        <div data-testid="taxes-loading" className="text-sm text-slate-700">
          Loading…
        </div>
      )}
    </div>
  );
}
