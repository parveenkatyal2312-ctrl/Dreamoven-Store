import React, { useState, useEffect } from "react";
import { api } from "@/lib/api";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Trash2, FileText, RefreshCw } from "lucide-react";

const companies = ["DO", "KINFOLK", "DOPL"];
const banks = ["HDFC", "IDFC"];

import { formatDateIN } from "@/lib/date";

function formatDate(dateStr) {
  return formatDateIN(dateStr);
}

function UploadedFilesList({ files, category, onDelete, deleting }) {
  if (!files || files.length === 0) {
    return (
      <div className="text-xs text-slate-500 italic mt-2">
        No files uploaded yet
      </div>
    );
  }

  return (
    <div className="mt-3 space-y-2">
      <div className="text-xs font-medium text-slate-600 flex items-center gap-1">
        <FileText className="w-3 h-3" />
        Uploaded Files ({files.length})
      </div>
      <div className="max-h-40 overflow-y-auto space-y-1">
        {files.map((f) => (
          <div 
            key={f.id} 
            className="flex items-center justify-between bg-slate-50 rounded-lg px-2 py-1.5 text-xs"
          >
            <div className="flex-1 min-w-0">
              <div className="font-medium truncate">{f.filename}</div>
              <div className="text-slate-500">
                {f.company && <span className="mr-2">{f.company}</span>}
                {f.bank && <span className="mr-2">{f.bank}</span>}
                {f.platform && <span className="mr-2">{String(f.platform).toUpperCase()}</span>}
                {f.payout_cycle && <span className="mr-2">{f.payout_cycle}</span>}
                {f.utr && <span className="mr-2">UTR: {f.utr}</span>}
                {f.rows && <span>{f.rows} rows</span>}
                {" • "}
                {formatDate(f.uploaded_at)}
              </div>
            </div>
            <Button
              variant="ghost"
              size="sm"
              className="h-6 w-6 p-0 text-red-500 hover:text-red-700 hover:bg-red-50"
              onClick={() => onDelete(category, f.id)}
              disabled={deleting === f.id}
            >
              {deleting === f.id ? (
                <RefreshCw className="w-3 h-3 animate-spin" />
              ) : (
                <Trash2 className="w-3 h-3" />
              )}
            </Button>
          </div>
        ))}
      </div>
    </div>
  );
}

function FileBlock({ title, description, testidPrefix, onUpload, extra, files, category, onDelete, deleting, onRefresh }) {
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
      setFile(null);
      // Reset file input
      const fileInput = document.querySelector(`[data-testid="${testidPrefix}-file-input"]`);
      if (fileInput) fileInput.value = "";
      // Refresh the file list
      if (onRefresh) onRefresh();
    } catch (e) {
      setErr(e?.response?.data?.detail || "Upload failed");
    } finally {
      setBusy(false);
    }
  };

  return (
    <Card data-testid={`${testidPrefix}-card`} className="rounded-2xl">
      <CardHeader className="pb-2">
        <CardTitle className="text-lg flex items-center justify-between" data-testid={`${testidPrefix}-title`}>
          <span>{title}</span>
          {files && files.length > 0 && (
            <span className="text-xs font-normal bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full">
              {files.length} file{files.length > 1 ? "s" : ""}
            </span>
          )}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        <div
          data-testid={`${testidPrefix}-description`}
          className="text-sm text-slate-700"
        >
          {description}
        </div>

        {extra}

        <div className="space-y-1">
          <Label data-testid={`${testidPrefix}-file-label`}>File</Label>
          <Input
            data-testid={`${testidPrefix}-file-input`}
            type="file"
            onChange={(e) => setFile(e.target.files?.[0] || null)}
          />
        </div>

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

        <UploadedFilesList 
          files={files} 
          category={category} 
          onDelete={onDelete}
          deleting={deleting}
        />
      </CardContent>
    </Card>
  );
}

function PortalPayoutBlock({ uploads, onDelete, deleting, onRefresh }) {
  const [company, setCompany] = useState("DO");
  const [platform, setPlatform] = useState("zomato");
  const [payoutYear, setPayoutYear] = useState("2025");
  const [payoutMonth, setPayoutMonth] = useState("");
  const [payoutWeek, setPayoutWeek] = useState("");

  // Generate week options based on selected platform and month
  const getWeekOptions = () => {
    if (!payoutMonth) return [];
    
    const year = parseInt(payoutYear);
    const month = parseInt(payoutMonth);
    const weeks = [];
    
    // Get first and last day of month
    const firstDay = new Date(year, month - 1, 1);
    const lastDay = new Date(year, month, 0);
    
    if (platform === "zomato") {
      // Zomato: Monday to Sunday
      // Find first Monday on or before the first day of month
      let current = new Date(firstDay);
      // Go back to find the Monday of the week containing the 1st
      while (current.getDay() !== 1) {
        current.setDate(current.getDate() - 1);
      }
      // If that Monday is more than 6 days before the 1st, move forward a week
      if ((firstDay - current) / (1000 * 60 * 60 * 24) > 6) {
        current.setDate(current.getDate() + 7);
      }
      
      let weekNum = 1;
      while (current <= lastDay) {
        const weekStart = new Date(current);
        const weekEnd = new Date(current);
        weekEnd.setDate(weekEnd.getDate() + 6);
        
        const startStr = weekStart.toLocaleDateString('en-GB', { day: '2-digit', month: 'short' });
        const endStr = weekEnd.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
        
        weeks.push({
          value: `${weekStart.toISOString().split('T')[0]}_${weekEnd.toISOString().split('T')[0]}`,
          label: `Week ${weekNum}: ${startStr} - ${endStr}`,
          crossMonth: weekStart.getMonth() !== weekEnd.getMonth() || weekEnd.getMonth() !== (month - 1)
        });
        
        current.setDate(current.getDate() + 7);
        weekNum++;
        
        if (weekNum > 6) break; // Safety limit
      }
    } else {
      // Swiggy: Sunday to Saturday, but settles WITHIN the month (no cross-month)
      // First partial week: 1st of month to first Saturday
      // Middle weeks: Full Sun-Sat
      // Last partial week: Last Sunday to end of month
      
      const firstDayOfWeek = firstDay.getDay(); // 0=Sun, 1=Mon, ... 6=Sat
      
      // Week 1: First partial week (1st to first Saturday)
      if (firstDayOfWeek !== 0) { // If month doesn't start on Sunday
        const firstSat = new Date(firstDay);
        firstSat.setDate(firstSat.getDate() + (6 - firstDayOfWeek));
        
        const startStr = firstDay.toLocaleDateString('en-GB', { day: '2-digit', month: 'short' });
        const endStr = firstSat.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
        
        weeks.push({
          value: `${firstDay.toISOString().split('T')[0]}_${firstSat.toISOString().split('T')[0]}`,
          label: `Week 1 (Partial): ${startStr} - ${endStr}`,
          crossMonth: false
        });
      }
      
      // Find first Sunday (start of first full week)
      let current = new Date(firstDay);
      while (current.getDay() !== 0) {
        current.setDate(current.getDate() + 1);
      }
      
      let weekNum = firstDayOfWeek !== 0 ? 2 : 1; // Start from 2 if we had a partial week
      
      // Full weeks (Sun-Sat)
      while (current <= lastDay) {
        const weekStart = new Date(current);
        const weekEnd = new Date(current);
        weekEnd.setDate(weekEnd.getDate() + 6);
        
        // Check if this is a full week or partial (last week of month)
        if (weekEnd > lastDay) {
          // Last partial week: Sunday to end of month
          const startStr = weekStart.toLocaleDateString('en-GB', { day: '2-digit', month: 'short' });
          const endStr = lastDay.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
          
          weeks.push({
            value: `${weekStart.toISOString().split('T')[0]}_${lastDay.toISOString().split('T')[0]}`,
            label: `Week ${weekNum} (Partial): ${startStr} - ${endStr}`,
            crossMonth: false
          });
        } else {
          // Full week
          const startStr = weekStart.toLocaleDateString('en-GB', { day: '2-digit', month: 'short' });
          const endStr = weekEnd.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
          
          weeks.push({
            value: `${weekStart.toISOString().split('T')[0]}_${weekEnd.toISOString().split('T')[0]}`,
            label: `Week ${weekNum}: ${startStr} - ${endStr}`,
            crossMonth: false
          });
        }
        
        current.setDate(current.getDate() + 7);
        weekNum++;
        
        if (weekNum > 6) break; // Safety limit
      }
    }
    
    return weeks;
  };

  const months = [
    { value: "1", label: "January" },
    { value: "2", label: "February" },
    { value: "3", label: "March" },
    { value: "4", label: "April" },
    { value: "5", label: "May" },
    { value: "6", label: "June" },
    { value: "7", label: "July" },
    { value: "8", label: "August" },
    { value: "9", label: "September" },
    { value: "10", label: "October" },
    { value: "11", label: "November" },
    { value: "12", label: "December" },
  ];

  const years = ["2024", "2025", "2026"];
  const weekOptions = getWeekOptions();

  return (
    <FileBlock
      title="Portal Payout Statement (Swiggy/Zomato)"
      description={platform === "zomato" 
        ? "Zomato: Weekly payouts (Mon-Sun). Select year, month, and week before uploading." 
        : "Swiggy: Weekly payouts (Sun-Sat). Select year, month, and week before uploading."
      } 
      testidPrefix="upload-portal-payouts"
      files={uploads?.portal_payouts}
      category="portal_payouts"
      onDelete={onDelete}
      deleting={deleting}
      onRefresh={onRefresh}
      extra={
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          <div className="space-y-1">
            <Label data-testid="upload-portal-payouts-company-label">Company</Label>
            <Select value={company} onValueChange={setCompany}>
              <SelectTrigger data-testid="upload-portal-payouts-company-select" className="rounded-xl">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {companies.map((c) => (
                  <SelectItem key={c} value={c} data-testid={`upload-portal-payouts-company-${c}`}>
                    {c}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-1">
            <Label data-testid="upload-portal-payouts-platform-label">Platform</Label>
            <Select value={platform} onValueChange={(v) => { setPlatform(v); setPayoutWeek(""); }}>
              <SelectTrigger data-testid="upload-portal-payouts-platform-select" className="rounded-xl">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="swiggy" data-testid="upload-portal-payouts-platform-swiggy">Swiggy</SelectItem>
                <SelectItem value="zomato" data-testid="upload-portal-payouts-platform-zomato">Zomato</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-1">
            <Label>Year</Label>
            <Select value={payoutYear} onValueChange={(v) => { setPayoutYear(v); setPayoutWeek(""); }}>
              <SelectTrigger className="rounded-xl">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {years.map((y) => (
                  <SelectItem key={y} value={y}>{y}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-1">
            <Label>Month</Label>
            <Select value={payoutMonth} onValueChange={(v) => { setPayoutMonth(v); setPayoutWeek(""); }}>
              <SelectTrigger className="rounded-xl">
                <SelectValue placeholder="Select month" />
              </SelectTrigger>
              <SelectContent>
                {months.map((m) => (
                  <SelectItem key={m.value} value={m.value}>{m.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {payoutMonth && (
            <div className="space-y-1 col-span-2 sm:col-span-4">
              <Label>Payout Week ({platform === "zomato" ? "Zomato: Mon-Sun" : "Swiggy: Sun-Sat"})</Label>
              <Select value={payoutWeek} onValueChange={setPayoutWeek}>
                <SelectTrigger className="rounded-xl">
                  <SelectValue placeholder="Select week" />
                </SelectTrigger>
                <SelectContent>
                  {weekOptions.map((w) => (
                    <SelectItem key={w.value} value={w.value}>
                      {w.label} {w.crossMonth && "⚡ Cross-month"}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {payoutWeek && weekOptions.find(w => w.value === payoutWeek)?.crossMonth && (
                <p className="text-xs text-amber-600">⚡ This week spans two months - will be auto-split based on sales</p>
              )}
            </div>
          )}
        </div>
      }
      onUpload={async (file) => {
        const fd = new FormData();
        fd.append("company", company);
        fd.append("platform", platform);
        fd.append("payout_year", payoutYear);
        fd.append("payout_month", payoutMonth);
        if (platform === "zomato" && payoutWeek) {
          fd.append("payout_week", payoutWeek);
        }
        fd.append("file", file);
        const res = await api.post("/uploads/portal-payouts", fd);
        return res.data;
      }}
    />
  );
}


export default function UploadCenter() {
  const [bankCompany, setBankCompany] = useState("DO");
  const [bankName, setBankName] = useState("HDFC");
  const [adChargesCompany, setAdChargesCompany] = useState("DO");
  const [longDistanceCompany, setLongDistanceCompany] = useState("DO");
  
  const [uploads, setUploads] = useState({
    pos: [],
    bank: [],
    commissions: [],
    ad_charges: [],
    long_distance: [],
    portal_payouts: [],
  });
  const [deleting, setDeleting] = useState(null);

  const fetchUploads = async () => {
    try {
      const res = await api.get("/uploads/list");
      setUploads(res.data);
    } catch (e) {
      console.error("Failed to fetch uploads:", e);
    }
  };

  useEffect(() => {
    fetchUploads();
  }, []);

  const handleDelete = async (category, importId) => {
    if (!window.confirm("Are you sure you want to delete this file and all its data?")) {
      return;
    }
    
    setDeleting(importId);
    try {
      const endpoints = {
        pos: `/uploads/pos/${importId}`,
        bank: `/uploads/bank/${importId}`,
        commissions: `/uploads/commissions/${importId}`,
        ad_charges: `/uploads/ad-charges/${importId}`,
        long_distance: `/uploads/long-distance/${importId}`,
        portal_payouts: `/uploads/portal-payouts/${importId}`,
      };
      
      await api.delete(endpoints[category]);
      await fetchUploads();
    } catch (e) {
      alert(e?.response?.data?.detail || "Delete failed");
    } finally {
      setDeleting(null);
    }
  };

  return (
    <div data-testid="upload-center" className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-semibold">Upload Center</h2>
        <Button 
          variant="outline" 
          size="sm" 
          onClick={fetchUploads}
          className="rounded-xl"
        >
          <RefreshCw className="w-4 h-4 mr-1" />
          Refresh
        </Button>
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        <FileBlock
          title="POS Sales Export"
          description="Upload weekly POS sales export (Excel). We aggregate it by company/outlet/day/channel." 
          testidPrefix="upload-pos"
          files={uploads.pos}
          category="pos"
          onDelete={handleDelete}
          deleting={deleting}
          onRefresh={fetchUploads}
          onUpload={async (file) => {
            const fd = new FormData();
            fd.append("file", file);
            const res = await api.post("/uploads/pos", fd);
            return res.data;
          }}
        />

        <FileBlock
          title="Commission Structure"
          description="Upload your Swiggy & Zomato commission structure file." 
          testidPrefix="upload-commissions"
          files={uploads.commissions}
          category="commissions"
          onDelete={handleDelete}
          deleting={deleting}
          onRefresh={fetchUploads}
          onUpload={async (file) => {
            const fd = new FormData();
            fd.append("file", file);
            const res = await api.post("/uploads/commissions", fd);
            return res.data;
          }}
        />

        <FileBlock
          title="Bank Statement"
          description="Upload bank statement Excel (company-wise). We auto-detect date/narration/credit." 
          testidPrefix="upload-bank"
          files={uploads.bank}
          category="bank"
          onDelete={handleDelete}
          deleting={deleting}
          onRefresh={fetchUploads}
          extra={
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <div className="space-y-1">
                <Label data-testid="upload-bank-company-label">Company</Label>
                <Select value={bankCompany} onValueChange={setBankCompany}>
                  <SelectTrigger data-testid="upload-bank-company-select" className="rounded-xl">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {companies.map((c) => (
                      <SelectItem key={c} value={c} data-testid={`upload-bank-company-${c}`}>
                        {c}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1">
                <Label data-testid="upload-bank-bank-label">Bank</Label>
                <Select value={bankName} onValueChange={setBankName}>
                  <SelectTrigger data-testid="upload-bank-bank-select" className="rounded-xl">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {banks.map((b) => (
                      <SelectItem key={b} value={b} data-testid={`upload-bank-bank-${b}`}>
                        {b}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          }
          onUpload={async (file) => {
            const fd = new FormData();
            fd.append("company", bankCompany);
            fd.append("bank", bankName);
            fd.append("file", file);
            const res = await api.post("/uploads/bank", fd);
            return res.data;
          }}
        />
      </div>

      {/* New row for Ad Charges and Long Distance Charges */}
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <FileBlock
          title="Ad Charges (Zomato/Swiggy)"
          description="Upload monthly ad charges from Zomato/Swiggy (outlet-wise). Expected columns: Outlet, Partner, Month, Ad Amount, GST on Ads." 
          testidPrefix="upload-ad-charges"
          files={uploads.ad_charges}
          category="ad_charges"
          onDelete={handleDelete}
          deleting={deleting}
          onRefresh={fetchUploads}
          extra={
            <div className="space-y-1">
              <Label data-testid="upload-ad-charges-company-label">Company</Label>
              <Select value={adChargesCompany} onValueChange={setAdChargesCompany}>
                <SelectTrigger data-testid="upload-ad-charges-company-select" className="rounded-xl">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {companies.map((c) => (
                    <SelectItem key={c} value={c} data-testid={`upload-ad-charges-company-${c}`}>
                      {c}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          }
          onUpload={async (file) => {
            const fd = new FormData();
            fd.append("company", adChargesCompany);
            fd.append("file", file);
            const res = await api.post("/uploads/ad-charges", fd);
            return res.data;
          }}
        />

        <FileBlock
          title="Long Distance Charges (Zomato/Swiggy)"
          description="Upload monthly long distance delivery charges from Zomato/Swiggy (outlet-wise). Expected columns: Outlet, Partner, Month, Distance Charge Amount." 
          testidPrefix="upload-long-distance"
          files={uploads.long_distance}
          category="long_distance"
          onDelete={handleDelete}
          deleting={deleting}
          onRefresh={fetchUploads}
          extra={
            <div className="space-y-1">
              <Label data-testid="upload-long-distance-company-label">Company</Label>
              <Select value={longDistanceCompany} onValueChange={setLongDistanceCompany}>
                <SelectTrigger data-testid="upload-long-distance-company-select" className="rounded-xl">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {companies.map((c) => (
                    <SelectItem key={c} value={c} data-testid={`upload-long-distance-company-${c}`}>
                      {c}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          }
          onUpload={async (file) => {
            const fd = new FormData();
            fd.append("company", longDistanceCompany);
            fd.append("file", file);
            const res = await api.post("/uploads/long-distance-charges", fd);
            return res.data;
          }}
        />
      </div>


      {/* Portal Payout Statements */}
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <PortalPayoutBlock
          uploads={uploads}
          onDelete={handleDelete}
          deleting={deleting}
          onRefresh={fetchUploads}
        />
      </div>


      <div
        data-testid="upload-center-note"
        className="rounded-2xl border bg-slate-50 p-4 text-sm text-slate-700"
      >
        Tip: After uploading commissions, open <b>Settings</b> and map each outlet
        to the correct Swiggy/Zomato commission key. This also covers upcoming
        outlets.
      </div>
    </div>
  );
}
