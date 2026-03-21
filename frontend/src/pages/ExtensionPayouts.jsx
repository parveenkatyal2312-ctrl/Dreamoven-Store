import React, { useCallback, useEffect, useMemo, useState } from "react";
import { api } from "@/lib/api";
import { formatDateIN } from "@/lib/date";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
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
import { Loader2, RefreshCw, Trash2 } from "lucide-react";

const formatCurrency = (amount) => {
  if (!amount) return "₹0";
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
};

export default function ExtensionPayouts() {
  const [payouts, setPayouts] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [companyFilter, setCompanyFilter] = useState("all");
  const [platformFilter, setPlatformFilter] = useState("all");
  const [sourceFilter, setSourceFilter] = useState("all");
  const [deleting, setDeleting] = useState(null);

  const fetchPayouts = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const params = {};
      if (companyFilter !== "all") params.company = companyFilter;
      if (platformFilter !== "all") params.platform = platformFilter;

      const res = await api.get("/extension/payouts", { params });
      setPayouts(res.data.payouts || []);
    } catch (e) {
      setError(e?.response?.data?.detail || "Failed to fetch payouts");
    } finally {
      setLoading(false);
    }
  }, [companyFilter, platformFilter]);

  const handleDelete = async (id) => {
    if (!window.confirm("Are you sure you want to delete this payout record?")) {
      return;
    }
    
    setDeleting(id);
    try {
      await api.delete(`/extension/payouts/${id}`);
      await fetchPayouts();
    } catch (e) {
      alert(e?.response?.data?.detail || "Delete failed");
    } finally {
      setDeleting(null);
    }
  };

  const handleDeleteAll = async () => {
    if (!window.confirm("Are you sure you want to delete ALL payout records? This cannot be undone.")) {
      return;
    }
    
    setLoading(true);
    try {
      await api.delete("/extension/payouts/all");
      await fetchPayouts();
    } catch (e) {
      alert(e?.response?.data?.detail || "Delete failed");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPayouts();
  }, [fetchPayouts]);

  const filteredPayouts = useMemo(() => {
    if (sourceFilter === "all") return payouts;
    if (sourceFilter === "portal") return payouts.filter((p) => p.source === "portal_upload");
    if (sourceFilter === "extension") return payouts.filter((p) => !p.source || p.source === "extension");
    return payouts;
  }, [payouts, sourceFilter]);

  // Calculate totals
  const totals = filteredPayouts.reduce((acc, p) => {
    acc.netOrderValue += p.net_order_value || 0;
    acc.commission += p.commission || 0;
    acc.taxDeductions += p.tax_deductions || 0;
    acc.adCharges += p.ad_charges || 0;
    acc.netPayout += p.net_payout || 0;
    acc.orders += p.orders || 0;
    return acc;
  }, { netOrderValue: 0, commission: 0, taxDeductions: 0, adCharges: 0, netPayout: 0, orders: 0 });

  return (
    <div data-testid="extension-payouts" className="space-y-6">
      <Card className="rounded-2xl">
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              📊 Payouts
              <Badge variant="outline">{filteredPayouts.length} records</Badge>
            </CardTitle>
            <div className="flex gap-2">
              <Button onClick={fetchPayouts} disabled={loading} variant="outline" size="sm">
                {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <RefreshCw className="h-4 w-4" />}
              </Button>
              {payouts.length > 0 && (
                <Button onClick={handleDeleteAll} disabled={loading} variant="destructive" size="sm">
                  <Trash2 className="h-4 w-4 mr-1" /> Delete All
                </Button>
              )}
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {/* Filters */}
          <div className="flex flex-wrap gap-4 mb-4">
            <div className="space-y-1">
              <label className="text-sm text-slate-500">Company</label>
              <Select value={companyFilter} onValueChange={setCompanyFilter}>
                <SelectTrigger className="w-32">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All</SelectItem>
                  <SelectItem value="DO">DO</SelectItem>
                  <SelectItem value="KINFOLK">KINFOLK</SelectItem>
                  <SelectItem value="DOPL">DOPL</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1">
              <label className="text-sm text-slate-500">Platform</label>
              <Select value={platformFilter} onValueChange={setPlatformFilter}>
                <SelectTrigger className="w-32">
                  <SelectValue />
            <div className="space-y-1">
              <label className="text-sm text-slate-500">Source</label>
              <Select value={sourceFilter} onValueChange={setSourceFilter}>
                <SelectTrigger className="w-40">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All</SelectItem>
                  <SelectItem value="portal">Portal Upload</SelectItem>
                  <SelectItem value="extension">Extension</SelectItem>
                </SelectContent>
              </Select>
            </div>

                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All</SelectItem>
                  <SelectItem value="zomato">Zomato</SelectItem>
                  <SelectItem value="swiggy">Swiggy</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Summary Cards */}
          <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-6">
            <div className="bg-slate-50 rounded-xl p-4">
              <div className="text-sm text-slate-500">Total Orders</div>
              <div className="text-xl font-bold">{totals.orders.toLocaleString()}</div>
            </div>
            <div className="bg-blue-50 rounded-xl p-4">
              <div className="text-sm text-slate-500">Net Order Value</div>
              <div className="text-xl font-bold text-blue-600">{formatCurrency(totals.netOrderValue)}</div>
            </div>
            <div className="bg-red-50 rounded-xl p-4">
              <div className="text-sm text-slate-500">Commission</div>
              <div className="text-xl font-bold text-red-600">{formatCurrency(totals.commission)}</div>
            </div>
            <div className="bg-orange-50 rounded-xl p-4">
              <div className="text-sm text-slate-500">Ad Charges</div>
              <div className="text-xl font-bold text-orange-600">{formatCurrency(totals.adCharges)}</div>
            </div>
            <div className="bg-green-50 rounded-xl p-4">
              <div className="text-sm text-slate-500">Net Payout</div>
              <div className="text-xl font-bold text-green-600">{formatCurrency(totals.netPayout)}</div>
            </div>
          </div>

          {error && (
            <Alert variant="destructive" className="mb-4">
              <AlertTitle>Error</AlertTitle>
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          {/* Payouts Table */}
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Outlet</TableHead>
                  <TableHead>Period</TableHead>
                  <TableHead>Platform</TableHead>
                  <TableHead>Source</TableHead>
                  <TableHead>UTR</TableHead>
                  <TableHead className="text-right">Orders</TableHead>
                  <TableHead className="text-right">Net Order Value</TableHead>
                  <TableHead className="text-right">Commission</TableHead>
                  <TableHead className="text-right">Tax/GST</TableHead>
                  <TableHead className="text-right">Ad Charges</TableHead>
                  <TableHead className="text-right">Net Payout</TableHead>
                  <TableHead>Imported</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading ? (
                  <TableRow>
                    <TableCell colSpan={13} className="text-center py-8">
                      <Loader2 className="h-6 w-6 animate-spin mx-auto" />
                    </TableCell>
                  </TableRow>
                ) : payouts.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={13} className="text-center py-8 text-slate-500">
                      No payouts imported yet. Use the browser extension OR upload portal payout report from Upload Center.
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredPayouts.map((payout, idx) => (
                    <TableRow key={payout.id} className={idx % 2 === 0 ? "bg-slate-50" : ""}>
                      <TableCell className="font-medium">
                        {payout.outlet}
                        <div className="text-xs text-slate-400">{payout.company}</div>
                      </TableCell>
                      <TableCell>{payout.payout_cycle || "-"}</TableCell>
                      <TableCell>
                        <Badge variant={payout.platform === "zomato" ? "destructive" : "default"}>
                          {payout.platform}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <Badge variant={payout.source === "portal_upload" ? "outline" : "secondary"}>
                          {payout.source === "portal_upload" ? "portal" : "extension"}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-xs text-slate-600">{payout.utr || "-"}</TableCell>
                      <TableCell className="text-right">{payout.orders || "-"}</TableCell>
                      <TableCell className="text-right">{formatCurrency(payout.net_order_value)}</TableCell>
                      <TableCell className="text-right text-red-600">{formatCurrency(payout.commission)}</TableCell>
                      <TableCell className="text-right text-red-600">{formatCurrency(payout.tax_deductions)}</TableCell>
                      <TableCell className="text-right text-orange-600">{formatCurrency(payout.ad_charges)}</TableCell>
                      <TableCell className="text-right font-medium text-green-600">{formatCurrency(payout.net_payout)}</TableCell>
                      <TableCell className="text-xs text-slate-400">
                        {formatDateIN(payout.created_at)}
                      </TableCell>
                      <TableCell>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-8 w-8 p-0 text-red-500 hover:text-red-700 hover:bg-red-50"
                          onClick={() => handleDelete(payout.id)}
                          disabled={deleting === payout.id}
                        >
                          {deleting === payout.id ? (
                            <Loader2 className="h-4 w-4 animate-spin" />
                          ) : (
                            <Trash2 className="h-4 w-4" />
                          )}
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
