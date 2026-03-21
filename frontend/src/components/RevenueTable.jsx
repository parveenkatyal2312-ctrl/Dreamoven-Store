import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

function inr(n) {
  const x = Number(n || 0);
  return x.toLocaleString("en-IN", { maximumFractionDigits: 0 });
}

export default function RevenueTable({ data }) {
  const companies = data?.companies || [];
  const total = data?.all_companies_total;

  return (
    <Card data-testid="dashboard-revenue-card" className="rounded-2xl">
      <CardHeader>
        <CardTitle data-testid="dashboard-revenue-title" className="text-lg">
          Current month revenue snapshot
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        <div
          data-testid="dashboard-revenue-subtitle"
          className="text-sm text-slate-700"
        >
          Month: <span className="font-medium">{data?.month || "—"}</span> (
          {data?.start_date || "—"} to {data?.end_date || "—"})
        </div>

        <div className="rounded-xl border">
          <Table data-testid="dashboard-revenue-table">
            <TableHeader>
              <TableRow>
                <TableHead>Company</TableHead>
                <TableHead>Dine-in</TableHead>
                <TableHead>Zomato</TableHead>
                <TableHead>Swiggy</TableHead>
                <TableHead>Takeaway</TableHead>
                <TableHead className="text-right">Total</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {companies.map((r) => (
                <TableRow key={r.company} data-testid={`dashboard-revenue-row-${r.company}`}>
                  <TableCell data-testid={`dashboard-revenue-company-${r.company}`} className="font-medium">
                    {r.company}
                  </TableCell>
                  <TableCell data-testid={`dashboard-revenue-dinein-${r.company}`}>₹{inr(r.dinein_sales)}</TableCell>
                  <TableCell data-testid={`dashboard-revenue-zomato-${r.company}`}>₹{inr(r.zomato_sales)}</TableCell>
                  <TableCell data-testid={`dashboard-revenue-swiggy-${r.company}`}>₹{inr(r.swiggy_sales)}</TableCell>
                  <TableCell data-testid={`dashboard-revenue-takeaway-${r.company}`}>₹{inr(r.takeaway_sales)}</TableCell>
                  <TableCell data-testid={`dashboard-revenue-total-${r.company}`} className="text-right font-semibold">
                    ₹{inr(r.total_sales)}
                  </TableCell>
                </TableRow>
              ))}

              {total ? (
                <TableRow data-testid="dashboard-revenue-row-all" className="bg-slate-50">
                  <TableCell data-testid="dashboard-revenue-company-all" className="font-semibold">
                    All Companies
                  </TableCell>
                  <TableCell data-testid="dashboard-revenue-dinein-all" className="font-medium">
                    ₹{inr(total.dinein_sales)}
                  </TableCell>
                  <TableCell data-testid="dashboard-revenue-zomato-all" className="font-medium">
                    ₹{inr(total.zomato_sales)}
                  </TableCell>
                  <TableCell data-testid="dashboard-revenue-swiggy-all" className="font-medium">
                    ₹{inr(total.swiggy_sales)}
                  </TableCell>
                  <TableCell data-testid="dashboard-revenue-takeaway-all" className="font-medium">
                    ₹{inr(total.takeaway_sales)}
                  </TableCell>
                  <TableCell data-testid="dashboard-revenue-total-all" className="text-right text-base font-semibold">
                    ₹{inr(total.total_sales)}
                  </TableCell>
                </TableRow>
              ) : null}
            </TableBody>
          </Table>
        </div>

        <div data-testid="dashboard-revenue-footnote" className="text-xs text-slate-600">
          Note: This uses uploaded POS data for the current month.
        </div>
      </CardContent>
    </Card>
  );
}
