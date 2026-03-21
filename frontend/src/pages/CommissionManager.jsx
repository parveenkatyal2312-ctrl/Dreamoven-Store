import React, { useEffect, useMemo, useState } from "react";
import { api } from "@/lib/api";
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
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";

const partners = ["swiggy", "zomato"];

export default function CommissionManager() {
  const [partner, setPartner] = useState("swiggy");
  const [rows, setRows] = useState([]);
  const [msg, setMsg] = useState(null);
  const [err, setErr] = useState(null);

  const [keyName, setKeyName] = useState("");
  const [commissionPct, setCommissionPct] = useState("0");
  const [convPct, setConvPct] = useState("0");
  const [gstPct, setGstPct] = useState("0.18");
  const [totalPct, setTotalPct] = useState("0");

  const filtered = useMemo(() => {
    return (rows || []).filter((r) => r.partner === partner);
  }, [rows, partner]);

  const load = async () => {
    setErr(null);
    setMsg(null);
    try {
      const res = await api.get("/commissions");
      setRows(res.data || []);
    } catch (e) {
      setErr(e?.response?.data?.detail || "Failed to load commissions");
    }
  };

  useEffect(() => {
    // Avoid lint rule about synchronous setState in effect
    const t = setTimeout(() => {
      load();
    }, 0);
    return () => clearTimeout(t);
  }, []);

  const upsert = async () => {
    setErr(null);
    setMsg(null);
    if (!keyName.trim()) {
      setErr("Commission key is required");
      return;
    }
    try {
      await api.post("/commissions/upsert", {
        partner,
        key: keyName.trim(),
        commission_pct: Number(commissionPct),
        conv_pct: Number(convPct),
        gst_pct: Number(gstPct),
        total_pct: Number(totalPct),
      });
      setMsg("Commission updated");
      setKeyName("");
      await load();
    } catch (e) {
      setErr(e?.response?.data?.detail || "Failed to update commission");
    }
  };

  const refresh = async () => {
    await load();
  };


  return (
    <div data-testid="commission-manager" className="space-y-6">
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <Card data-testid="commission-manager-edit-card" className="rounded-2xl">
          <CardHeader>
            <CardTitle className="text-lg">Update commission (manual)</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <div className="space-y-1">
                <Label data-testid="commission-manager-partner-label">Partner</Label>
                <Select value={partner} onValueChange={setPartner}>
                  <SelectTrigger data-testid="commission-manager-partner-select" className="rounded-xl">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {partners.map((p) => (
                      <SelectItem key={p} value={p} data-testid={`commission-manager-partner-${p}`}>
                        {p}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-1">
                <Label data-testid="commission-manager-key-label">Commission key</Label>
                <Input
                  data-testid="commission-manager-key-input"
                  value={keyName}
                  onChange={(e) => setKeyName(e.target.value)}
                  placeholder="e.g., SR NFC"
                />
              </div>

              <div className="flex items-center justify-between">
                <div
                  data-testid="commission-manager-refresh-note"
                  className="text-xs text-slate-600"
                >
                  Use refresh to pull latest saved commission table.
                </div>
                <Button
                  data-testid="commission-manager-refresh-button"
                  variant="secondary"
                  className="rounded-xl"
                  onClick={refresh}
                >
                  Refresh
                </Button>
              </div>
            </div>

            <div className="grid grid-cols-1 gap-3 sm:grid-cols-4">
              <div className="space-y-1">
                <Label data-testid="commission-manager-commission-label">Comm%</Label>
                <Input
                  data-testid="commission-manager-commission-input"
                  value={commissionPct}
                  onChange={(e) => setCommissionPct(e.target.value)}
                  type="number"
                  step="0.0001"
                />
              </div>
              <div className="space-y-1">
                <Label data-testid="commission-manager-conv-label">Conv%</Label>
                <Input
                  data-testid="commission-manager-conv-input"
                  value={convPct}
                  onChange={(e) => setConvPct(e.target.value)}
                  type="number"
                  step="0.0001"
                />
              </div>
              <div className="space-y-1">
                <Label data-testid="commission-manager-gst-label">GST%</Label>
                <Input
                  data-testid="commission-manager-gst-input"
                  value={gstPct}
                  onChange={(e) => setGstPct(e.target.value)}
                  type="number"
                  step="0.01"
                />
              </div>
              <div className="space-y-1">
                <Label data-testid="commission-manager-total-label">Total%</Label>
                <Input
                  data-testid="commission-manager-total-input"
                  value={totalPct}
                  onChange={(e) => setTotalPct(e.target.value)}
                  type="number"
                  step="0.0001"
                />
              </div>
            </div>

            <Button data-testid="commission-manager-upsert-button" className="rounded-xl" onClick={upsert}>
              Save / Update
            </Button>

            {err ? (
              <Alert data-testid="commission-manager-error-alert" variant="destructive">
                <AlertTitle>Error</AlertTitle>
                <AlertDescription data-testid="commission-manager-error-text">{err}</AlertDescription>
              </Alert>
            ) : null}
            {msg ? (
              <Alert data-testid="commission-manager-success-alert">
                <AlertTitle>Done</AlertTitle>
                <AlertDescription data-testid="commission-manager-success-text">{msg}</AlertDescription>
              </Alert>
            ) : null}

            <div data-testid="commission-manager-help" className="text-xs text-slate-600">
              Tip: If you change Comm%/Conv%/GST%, make sure Total% matches your agreement (or the system will use Total% as final deduction).
            </div>
          </CardContent>
        </Card>

        <Card data-testid="commission-manager-list-card" className="rounded-2xl">
          <CardHeader>
            <CardTitle className="text-lg">Current commission table</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="rounded-xl border">
              <Table data-testid="commission-manager-table">
                <TableHeader>
                  <TableRow>
                    <TableHead>Key</TableHead>
                    <TableHead>Comm%</TableHead>
                    <TableHead>Conv%</TableHead>
                    <TableHead>GST%</TableHead>
                    <TableHead>Total%</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filtered.slice(0, 120).map((r, idx) => (
                    <TableRow key={`${r.key}-${idx}`} data-testid={`commission-manager-row-${idx}`}>
                      <TableCell data-testid={`commission-manager-row-key-${idx}`}>{r.key}</TableCell>
                      <TableCell data-testid={`commission-manager-row-comm-${idx}`}>{Number(r.commission_pct).toFixed(4)}</TableCell>
                      <TableCell data-testid={`commission-manager-row-conv-${idx}`}>{Number(r.conv_pct).toFixed(4)}</TableCell>
                      <TableCell data-testid={`commission-manager-row-gst-${idx}`}>{Number(r.gst_pct).toFixed(2)}</TableCell>
                      <TableCell data-testid={`commission-manager-row-total-${idx}`}>{Number(r.total_pct).toFixed(4)}</TableCell>
                    </TableRow>
                  ))}
                  {!filtered.length ? (
                    <TableRow>
                      <TableCell colSpan={5} data-testid="commission-manager-empty" className="text-sm text-slate-600">
                        No rows for this partner yet. Upload commission file first.
                      </TableCell>
                    </TableRow>
                  ) : null}
                </TableBody>
              </Table>
            </div>
            <div data-testid="commission-manager-footnote" className="mt-2 text-xs text-slate-600">
              Showing first 120 rows.
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
