import React, { useEffect, useState } from "react";
import { api } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Trash2, Plus, Upload, RefreshCw, Wand2 } from "lucide-react";

const companies = ["DO", "KINFOLK", "DOPL"];

export default function OutletMaster() {
  const [company, setCompany] = useState("KINFOLK");
  const [records, setRecords] = useState([]);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState(null);
  const [success, setSuccess] = useState(null);
  
  // Form state for adding new record
  const [newPlatform, setNewPlatform] = useState("zomato");
  const [newResId, setNewResId] = useState("");
  const [newOutletName, setNewOutletName] = useState("");
  const [newLocation, setNewLocation] = useState("");

  const fetchRecords = async () => {
    setErr(null);
    setBusy(true);
    try {
      const res = await api.get("/outlet-master", { params: { company } });
      setRecords(res.data || []);
    } catch (e) {
      setErr(e?.response?.data?.detail || "Failed to fetch outlet master");
    } finally {
      setBusy(false);
    }
  };

  useEffect(() => {
    fetchRecords();
  }, [company]);

  const handleAddRecord = async () => {
    if (!newResId.trim()) {
      setErr("Res ID is required");
      return;
    }
    setErr(null);
    setSuccess(null);
    try {
      await api.post("/outlet-master", {
        company,
        platform: newPlatform,
        res_id: newResId.trim(),
        outlet_name: newOutletName.trim(),
        location: newLocation.trim(),
      });
      setSuccess("Record added successfully");
      setNewResId("");
      setNewOutletName("");
      setNewLocation("");
      fetchRecords();
    } catch (e) {
      setErr(e?.response?.data?.detail || "Failed to add record");
    }
  };

  const handleDelete = async (platform, resId) => {
    if (!window.confirm(`Delete mapping for ${platform} - ${resId}?`)) return;
    setErr(null);
    try {
      await api.delete(`/outlet-master/${platform}/${resId}`, { params: { company } });
      fetchRecords();
    } catch (e) {
      setErr(e?.response?.data?.detail || "Failed to delete");
    }
  };

  const handleFileUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    
    setErr(null);
    setSuccess(null);
    setBusy(true);
    
    const formData = new FormData();
    formData.append("company", company);
    formData.append("file", file);
    
    try {
      const res = await api.post("/outlet-master/bulk", formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      setSuccess(res.data.message);
      fetchRecords();
    } catch (e) {
      setErr(e?.response?.data?.detail || "Failed to upload file");
    } finally {
      setBusy(false);
      e.target.value = "";
    }
  };

  const handleAutoMatch = async () => {
    if (!window.confirm("This will auto-match POS outlet names to payout file outlets and create new mappings. Continue?")) {
      return;
    }
    setErr(null);
    setSuccess(null);
    setBusy(true);
    try {
      const res = await api.post("/outlet-master/auto-match", null, { params: { company } });
      const { created, matches } = res.data;
      if (created > 0) {
        setSuccess(`Auto-matched ${created} outlets! Check the new entries below.`);
        fetchRecords();
      } else {
        setSuccess("No new matches found. All outlets may already be mapped.");
      }
    } catch (e) {
      setErr(e?.response?.data?.detail || "Failed to auto-match");
    } finally {
      setBusy(false);
    }
  };

  const zomatoRecords = records.filter(r => r.platform === "zomato");
  const swiggyRecords = records.filter(r => r.platform === "swiggy");

  return (
    <div data-testid="outlet-master" className="space-y-6">
      {/* Company selector and actions */}
      <Card className="rounded-2xl">
        <CardHeader>
          <CardTitle className="text-lg">Outlet Master - Res ID Mapping</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex flex-wrap items-end gap-4">
            <div className="space-y-2">
              <Label>Company</Label>
              <Select value={company} onValueChange={setCompany}>
                <SelectTrigger data-testid="outlet-master-company" className="w-40 rounded-xl">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {companies.map((c) => (
                    <SelectItem key={c} value={c}>{c}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <Button onClick={fetchRecords} disabled={busy} variant="outline" className="rounded-xl">
              <RefreshCw className={`h-4 w-4 mr-2 ${busy ? "animate-spin" : ""}`} />
              Refresh
            </Button>
            <div className="relative">
              <input
                type="file"
                accept=".xlsx,.xls"
                onChange={handleFileUpload}
                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                disabled={busy}
              />
              <Button variant="secondary" className="rounded-xl" disabled={busy}>
                <Upload className="h-4 w-4 mr-2" />
                Bulk Upload Excel
              </Button>
            </div>
            <Button 
              onClick={handleAutoMatch} 
              disabled={busy} 
              className="rounded-xl bg-emerald-600 hover:bg-emerald-700"
              data-testid="outlet-master-auto-match"
            >
              <Wand2 className={`h-4 w-4 mr-2 ${busy ? "animate-spin" : ""}`} />
              Auto-Match All
            </Button>
          </div>
          
          <div className="text-sm text-slate-500">
            Upload an Excel with columns: <strong>Platform</strong> (Zomato/Swiggy), <strong>Res ID</strong>, <strong>Outlet Name</strong>, <strong>Location</strong> (optional)
          </div>
        </CardContent>
      </Card>

      {err && (
        <Alert variant="destructive">
          <AlertTitle>Error</AlertTitle>
          <AlertDescription>{err}</AlertDescription>
        </Alert>
      )}

      {success && (
        <Alert className="border-green-200 bg-green-50">
          <AlertTitle className="text-green-800">Success</AlertTitle>
          <AlertDescription className="text-green-700">{success}</AlertDescription>
        </Alert>
      )}

      {/* Add new record form */}
      <Card className="rounded-2xl">
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <Plus className="h-5 w-5" /> Add New Mapping
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-5">
            <div className="space-y-2">
              <Label>Platform</Label>
              <Select value={newPlatform} onValueChange={setNewPlatform}>
                <SelectTrigger className="rounded-xl">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="zomato">Zomato</SelectItem>
                  <SelectItem value="swiggy">Swiggy</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Res ID *</Label>
              <Input
                data-testid="new-res-id"
                value={newResId}
                onChange={(e) => setNewResId(e.target.value)}
                placeholder="e.g., 18616442"
                className="rounded-xl"
              />
            </div>
            <div className="space-y-2">
              <Label>Outlet Name</Label>
              <Input
                data-testid="new-outlet-name"
                value={newOutletName}
                onChange={(e) => setNewOutletName(e.target.value)}
                placeholder="e.g., Dashi Dimsum"
                className="rounded-xl"
              />
            </div>
            <div className="space-y-2">
              <Label>Location</Label>
              <Input
                data-testid="new-location"
                value={newLocation}
                onChange={(e) => setNewLocation(e.target.value)}
                placeholder="e.g., Punjabi Bagh"
                className="rounded-xl"
              />
            </div>
            <div className="flex items-end">
              <Button onClick={handleAddRecord} className="rounded-xl w-full">
                <Plus className="h-4 w-4 mr-2" /> Add
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Zomato Records */}
      <Card className="rounded-2xl">
        <CardHeader>
          <CardTitle className="text-lg text-red-600">Zomato Outlets ({zomatoRecords.length})</CardTitle>
        </CardHeader>
        <CardContent>
          {zomatoRecords.length === 0 ? (
            <div className="text-sm text-slate-500 py-4">No Zomato outlet mappings found. Add one above or upload an Excel file.</div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Res ID</TableHead>
                  <TableHead>Outlet Name</TableHead>
                  <TableHead>Location</TableHead>
                  <TableHead>Source</TableHead>
                  <TableHead className="w-20"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {zomatoRecords.map((r, idx) => (
                  <TableRow key={idx}>
                    <TableCell className="font-mono">{r.res_id}</TableCell>
                    <TableCell className="font-medium">{r.outlet_name || "-"}</TableCell>
                    <TableCell>{r.location || "-"}</TableCell>
                    <TableCell>
                      {r.auto_matched ? (
                        <span className="text-xs bg-emerald-100 text-emerald-700 px-2 py-1 rounded-full">Auto</span>
                      ) : (
                        <span className="text-xs bg-slate-100 text-slate-600 px-2 py-1 rounded-full">Manual</span>
                      )}
                    </TableCell>
                    <TableCell>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleDelete(r.platform, r.res_id)}
                        className="text-red-500 hover:text-red-700"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Swiggy Records */}
      <Card className="rounded-2xl">
        <CardHeader>
          <CardTitle className="text-lg text-orange-600">Swiggy Outlets ({swiggyRecords.length})</CardTitle>
        </CardHeader>
        <CardContent>
          {swiggyRecords.length === 0 ? (
            <div className="text-sm text-slate-500 py-4">No Swiggy outlet mappings found. Add one above or upload an Excel file.</div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Res ID</TableHead>
                  <TableHead>Outlet Name</TableHead>
                  <TableHead>Location</TableHead>
                  <TableHead>Source</TableHead>
                  <TableHead className="w-20"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {swiggyRecords.map((r, idx) => (
                  <TableRow key={idx}>
                    <TableCell className="font-mono">{r.res_id}</TableCell>
                    <TableCell className="font-medium">{r.outlet_name || "-"}</TableCell>
                    <TableCell>{r.location || "-"}</TableCell>
                    <TableCell>
                      {r.auto_matched ? (
                        <span className="text-xs bg-emerald-100 text-emerald-700 px-2 py-1 rounded-full">Auto</span>
                      ) : (
                        <span className="text-xs bg-slate-100 text-slate-600 px-2 py-1 rounded-full">Manual</span>
                      )}
                    </TableCell>
                    <TableCell>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleDelete(r.platform, r.res_id)}
                        className="text-red-500 hover:text-red-700"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
