import React, { useEffect, useMemo, useState } from "react";
import { api } from "@/lib/api";
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
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";

const companies = ["DO", "KINFOLK", "DOPL"];
const partners = ["swiggy", "zomato"];

export default function Settings() {
  const [company, setCompany] = useState("DO");
  const [settings, setSettings] = useState(null);
  const [commissions, setCommissions] = useState([]);
  const [outlets, setOutlets] = useState([]);
  const [mappings, setMappings] = useState([]);
  const [suggestions, setSuggestions] = useState([]);
  const [msg, setMsg] = useState(null);
  const [err, setErr] = useState(null);

  // add outlet
  const [newOutlet, setNewOutlet] = useState("");

  // add mapping
  const [mapOutlet, setMapOutlet] = useState("");
  const [mapPartner, setMapPartner] = useState("swiggy");
  const [mapKey, setMapKey] = useState("");

  const keysForPartner = useMemo(() => {
    const k = { swiggy: [], zomato: [] };
    commissions.forEach((r) => {
      if (r.partner === "swiggy") k.swiggy.push(r.key);
      if (r.partner === "zomato") k.zomato.push(r.key);
    });
    return k;
  }, [commissions]);

  const load = async () => {
    setErr(null);
    setMsg(null);
    try {
      const [s, c, o, m, sug] = await Promise.all([
        api.get(`/settings/${company}`),
        api.get("/commissions"),
        api.get("/outlets", { params: { company } }),
        api.get("/mappings", { params: { company } }),
        api.get("/mappings/suggestions", { params: { company } }),
      ]);
      setSettings(s.data);
      setCommissions(c.data || []);
      setOutlets(o.data || []);
      setMappings(m.data || []);
      setSuggestions((sug.data || {}).suggestions || []);

      if (!mapOutlet && (o.data || []).length) setMapOutlet(o.data[0].outlet);
    } catch (e) {
      setErr(e?.response?.data?.detail || "Failed to load settings");
    }
  };

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [company]);

  const saveSettings = async () => {
    setErr(null);
    setMsg(null);
    try {
      const res = await api.put(`/settings/${company}`, settings);
      setSettings(res.data);
      setMsg("Settings saved");
    } catch (e) {
      setErr(e?.response?.data?.detail || "Failed to save settings");
    }
  };

  const addOutlet = async () => {
    setErr(null);
    setMsg(null);
    if (!newOutlet.trim()) {
      setErr("Please enter outlet name");
      return;
    }
    try {
      await api.post("/outlets", {
        company,
        outlet: newOutlet.trim(),
        is_upcoming: true,
      });
      setNewOutlet("");
      setMsg("Outlet added");
      await load();
    } catch (e) {
      setErr(e?.response?.data?.detail || "Failed to add outlet");
    }
  };

  const addMapping = async () => {
    setErr(null);
    setMsg(null);
    if (!mapOutlet || !mapPartner || !mapKey) {
      setErr("Please select outlet, partner and commission key");
      return;
    }
    try {
      await api.post("/mappings", {
        company,
        outlet: mapOutlet,
        partner: mapPartner,
        commission_key: mapKey,
      });
      setMsg("Mapping saved");
      await load();
    } catch (e) {
      setErr(e?.response?.data?.detail || "Failed to save mapping");
    }
  };

  const removeMapping = async (id) => {
    setErr(null);
    setMsg(null);
    try {
      await api.delete(`/mappings/${id}`);
      setMsg("Mapping deleted");
      await load();
    } catch (e) {
      setErr(e?.response?.data?.detail || "Failed to delete mapping");
    }
  };

  const applySuggestions = async () => {
    setErr(null);
    setMsg(null);
    try {
      if (!suggestions.length) {
        setMsg("No suggestions available");
        return;
      }
      await api.post("/mappings/bulk", { mappings: suggestions });
      setMsg(`Applied ${suggestions.length} suggestions`);
      await load();
    } catch (e) {
      setErr(e?.response?.data?.detail || "Failed to apply suggestions");
    }
  };

  return (
    <div data-testid="settings" className="space-y-6">
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-4">
        <Card data-testid="settings-company-card" className="rounded-2xl">
          <CardHeader>
            <CardTitle className="text-lg">Company</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <Label data-testid="settings-company-label">Select company</Label>
            <Select value={company} onValueChange={setCompany}>
              <SelectTrigger
                data-testid="settings-company-select"
                className="rounded-xl"
              >
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {companies.map((c) => (
                  <SelectItem
                    key={c}
                    value={c}
                    data-testid={`settings-company-${c}`}
                  >
                    {c}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </CardContent>
        </Card>

        <Card data-testid="settings-tds-card" className="rounded-2xl">
          <CardHeader>
            <CardTitle className="text-lg">TDS rules</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {settings ? (
              <>
                <div className="space-y-1">
                  <Label data-testid="settings-tds-deducted-label">
                    TDS deducted by partners (rate)
                  </Label>
                  <Input
                    data-testid="settings-tds-deducted-input"
                    value={settings.tds_deducted_at_source_rate}
                    onChange={(e) =>
                      setSettings({
                        ...settings,
                        tds_deducted_at_source_rate: Number(e.target.value),
                      })
                    }
                    type="number"
                    step="0.0001"
                  />
                </div>
                <div className="space-y-1">
                  <Label data-testid="settings-tds-payable-zomato-label">
                    TDS payable by us on commission (Zomato)
                  </Label>
                  <Input
                    data-testid="settings-tds-payable-zomato-input"
                    value={settings.tds_payable_on_commission_zomato}
                    onChange={(e) =>
                      setSettings({
                        ...settings,
                        tds_payable_on_commission_zomato: Number(e.target.value),
                      })
                    }
                    type="number"
                    step="0.0001"
                  />
                </div>
                <div className="space-y-1">
                  <Label data-testid="settings-tds-payable-swiggy-label">
                    TDS payable by us on commission (Swiggy)
                  </Label>
                  <Input
                    data-testid="settings-tds-payable-swiggy-input"
                    value={settings.tds_payable_on_commission_swiggy}
                    onChange={(e) =>
                      setSettings({
                        ...settings,
                        tds_payable_on_commission_swiggy: Number(e.target.value),
                      })
                    }
                    type="number"
                    step="0.0001"
                  />
                </div>
                <Button
                  data-testid="settings-save-button"
                  className="rounded-xl"
                  onClick={saveSettings}
                >
                  Save Settings
                </Button>
              </>
            ) : (
              <div data-testid="settings-loading">Loading…</div>
            )}
          </CardContent>
        </Card>

        <Card data-testid="settings-add-outlet-card" className="rounded-2xl">
          <CardHeader>
            <CardTitle className="text-lg">Upcoming outlets</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div
              data-testid="settings-add-outlet-note"
              className="text-sm text-slate-700"
            >
              Add new outlets even before sales start, so mappings are ready.
            </div>
            <div className="space-y-1">
              <Label data-testid="settings-new-outlet-label">Outlet name</Label>
              <Input
                data-testid="settings-new-outlet-input"
                value={newOutlet}
                onChange={(e) => setNewOutlet(e.target.value)}
                placeholder="e.g., Sticky Rice (New Location)"
              />
            </div>
            <Button
              data-testid="settings-add-outlet-button"
              className="rounded-xl"
              onClick={addOutlet}
            >
              Add Outlet
            </Button>
          </CardContent>
        </Card>

        <Card data-testid="settings-suggestions-card" className="rounded-2xl">
          <CardHeader>
            <CardTitle className="text-lg">Suggestions</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div
              data-testid="settings-suggestions-note"
              className="text-sm text-slate-700"
            >
              We can suggest commission keys for outlets based on names. Review
              and apply.
            </div>
            <div
              data-testid="settings-suggestions-count"
              className="text-sm text-slate-900"
            >
              Suggestions found: <span className="font-semibold">{suggestions.length}</span>
            </div>
            <Button
              data-testid="settings-apply-suggestions-button"
              variant="secondary"
              className="rounded-xl"
              onClick={applySuggestions}
              disabled={!suggestions.length}
            >
              Apply Suggestions
            </Button>
          </CardContent>
        </Card>
      </div>

      {err ? (
        <Alert data-testid="settings-error-alert" variant="destructive">
          <AlertTitle>Error</AlertTitle>
          <AlertDescription data-testid="settings-error-text">{err}</AlertDescription>
        </Alert>
      ) : null}
      {msg ? (
        <Alert data-testid="settings-success-alert">
          <AlertTitle>Done</AlertTitle>
          <AlertDescription data-testid="settings-success-text">{msg}</AlertDescription>
        </Alert>
      ) : null}

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <Card data-testid="settings-mappings-card" className="rounded-2xl">
          <CardHeader>
            <CardTitle className="text-lg">Outlet → commission mapping</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
              <div className="space-y-1">
                <Label data-testid="settings-map-outlet-label">Outlet</Label>
                <Select value={mapOutlet} onValueChange={setMapOutlet}>
                  <SelectTrigger
                    data-testid="settings-map-outlet-select"
                    className="rounded-xl"
                  >
                    <SelectValue placeholder="Select outlet" />
                  </SelectTrigger>
                  <SelectContent>
                    {outlets.map((o) => (
                      <SelectItem
                        key={o.id}
                        value={o.outlet}
                        data-testid={`settings-outlet-${o.id}`}
                      >
                        {o.outlet}
                        {o.is_upcoming ? " (upcoming)" : ""}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1">
                <Label data-testid="settings-map-partner-label">Partner</Label>
                <Select value={mapPartner} onValueChange={setMapPartner}>
                  <SelectTrigger
                    data-testid="settings-map-partner-select"
                    className="rounded-xl"
                  >
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {partners.map((p) => (
                      <SelectItem
                        key={p}
                        value={p}
                        data-testid={`settings-partner-${p}`}
                      >
                        {p}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1">
                <Label data-testid="settings-map-key-label">Commission key</Label>
                <Select value={mapKey} onValueChange={setMapKey}>
                  <SelectTrigger
                    data-testid="settings-map-key-select"
                    className="rounded-xl"
                  >
                    <SelectValue placeholder="Select key" />
                  </SelectTrigger>
                  <SelectContent>
                    {(keysForPartner[mapPartner] || []).map((k) => (
                      <SelectItem
                        key={k}
                        value={k}
                        data-testid={`settings-key-${mapPartner}-${k}`}
                      >
                        {k}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <Button
              data-testid="settings-save-mapping-button"
              className="rounded-xl"
              onClick={addMapping}
            >
              Save Mapping
            </Button>

            <div className="rounded-xl border">
              <Table data-testid="settings-mappings-table">
                <TableHeader>
                  <TableRow>
                    <TableHead>Outlet</TableHead>
                    <TableHead>Partner</TableHead>
                    <TableHead>Commission key</TableHead>
                    <TableHead />
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {mappings.map((m) => (
                    <TableRow
                      key={m.id}
                      data-testid={`settings-mapping-row-${m.id}`}
                    >
                      <TableCell
                        data-testid={`settings-mapping-outlet-${m.id}`}
                      >
                        {m.outlet}
                      </TableCell>
                      <TableCell
                        data-testid={`settings-mapping-partner-${m.id}`}
                      >
                        {m.partner}
                      </TableCell>
                      <TableCell
                        data-testid={`settings-mapping-key-${m.id}`}
                      >
                        {m.commission_key}
                      </TableCell>
                      <TableCell className="text-right">
                        <Button
                          data-testid={`settings-mapping-delete-${m.id}`}
                          variant="secondary"
                          className="rounded-xl"
                          onClick={() => removeMapping(m.id)}
                        >
                          Delete
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                  {!mappings.length ? (
                    <TableRow>
                      <TableCell
                        colSpan={4}
                        data-testid="settings-no-mappings"
                        className="text-sm text-slate-600"
                      >
                        No mappings yet. Add one above.
                      </TableCell>
                    </TableRow>
                  ) : null}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>

        <Card data-testid="settings-commission-table-card" className="rounded-2xl">
          <CardHeader>
            <CardTitle className="text-lg">Commission table (imported)</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="rounded-xl border">
              <Table data-testid="settings-commissions-table">
                <TableHeader>
                  <TableRow>
                    <TableHead>Partner</TableHead>
                    <TableHead>Key</TableHead>
                    <TableHead>Comm%</TableHead>
                    <TableHead>Conv%</TableHead>
                    <TableHead>GST%</TableHead>
                    <TableHead>Total%</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {commissions.slice(0, 80).map((r, idx) => (
                    <TableRow
                      key={`${r.partner}-${r.key}-${idx}`}
                      data-testid={`settings-commission-row-${idx}`}
                    >
                      <TableCell
                        data-testid={`settings-commission-partner-${idx}`}
                      >
                        {r.partner}
                      </TableCell>
                      <TableCell
                        data-testid={`settings-commission-key-${idx}`}
                      >
                        {r.key}
                      </TableCell>
                      <TableCell
                        data-testid={`settings-commission-comm-${idx}`}
                      >
                        {Number(r.commission_pct).toFixed(4)}
                      </TableCell>
                      <TableCell
                        data-testid={`settings-commission-conv-${idx}`}
                      >
                        {Number(r.conv_pct).toFixed(4)}
                      </TableCell>
                      <TableCell
                        data-testid={`settings-commission-gst-${idx}`}
                      >
                        {Number(r.gst_pct).toFixed(2)}
                      </TableCell>
                      <TableCell
                        data-testid={`settings-commission-total-${idx}`}
                      >
                        {Number(r.total_pct).toFixed(4)}
                      </TableCell>
                    </TableRow>
                  ))}
                  {!commissions.length ? (
                    <TableRow>
                      <TableCell
                        colSpan={6}
                        data-testid="settings-no-commissions"
                        className="text-sm text-slate-600"
                      >
                        No commission file imported yet.
                      </TableCell>
                    </TableRow>
                  ) : null}
                </TableBody>
              </Table>
            </div>
            <div
              data-testid="settings-commissions-footnote"
              className="mt-3 text-xs text-slate-600"
            >
              Showing first 80 rows for speed.
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
