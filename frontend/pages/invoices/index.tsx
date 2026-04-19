import { useQuery } from "@tanstack/react-query";
import { useRouter } from "next/router";
import Link from "next/link";
import Cookies from "js-cookie";
import api from "@/lib/api";
import { useStore } from "@/store/useStore";
import { Button } from "@/components/ui/button";

interface InvoiceItem {
  id: number;
  itemCode: string;
  itemName: string;
  quantity: number;
  price: number;
  subtotal: number;
}

interface Invoice {
  id: number;
  invoice_number: string;
  sender_name: string;
  receiver_name: string;
  total_amount: number;
  creator_name: string;
  created_at: string;
  items?: InvoiceItem[];
}

function formatRupiah(val: number) {
  return new Intl.NumberFormat("id-ID", { style: "currency", currency: "IDR", maximumFractionDigits: 0 }).format(val);
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString("id-ID", { day: "2-digit", month: "short", year: "numeric" });
}

export default function InvoicesPage() {
  const router = useRouter();
  const { user, clearAuth } = useStore();

  const { data, isLoading, isError } = useQuery<{ data: Invoice[] }>({
    queryKey: ["invoices"],
    queryFn: () => api.get("/api/invoices").then((r) => r.data),
  });

  function handleLogout() {
    Cookies.remove("token");
    clearAuth();
    router.push("/login");
  }

  const invoices = data?.data ?? [];

  return (
    <div className="min-h-screen bg-muted/30">
      <nav className="border-b bg-background sticky top-0 z-10">
        <div className="max-w-6xl mx-auto px-4 h-14 flex items-center justify-between">
          <span className="font-semibold text-lg">Fleetify</span>
          <div className="flex items-center gap-3">
            <span className="text-sm text-muted-foreground">
              {user?.username} ({user?.role})
            </span>
            <Button size="sm" variant="outline" onClick={handleLogout}>
              Keluar
            </Button>
          </div>
        </div>
      </nav>

      <main className="max-w-6xl mx-auto px-4 py-8">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold">Daftar Invoice</h1>
            <p className="text-sm text-muted-foreground mt-0.5">Kelola semua resi pengiriman</p>
          </div>
          <Link href="/invoices/create">
            <Button>+ Buat Invoice</Button>
          </Link>
        </div>

        <div className="border rounded-lg bg-background overflow-hidden">
          {isLoading ? (
            <div className="p-12 text-center text-muted-foreground">Memuat data...</div>
          ) : isError ? (
            <div className="p-12 text-center text-destructive">Gagal memuat data.</div>
          ) : invoices.length === 0 ? (
            <div className="p-12 text-center text-muted-foreground">
              Belum ada invoice.{" "}
              <Link href="/invoices/create" className="text-primary underline underline-offset-4">
                Buat sekarang
              </Link>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b bg-muted/50">
                    <th className="text-left px-4 py-3 font-medium text-muted-foreground">No. Invoice</th>
                    <th className="text-left px-4 py-3 font-medium text-muted-foreground">Pengirim</th>
                    <th className="text-left px-4 py-3 font-medium text-muted-foreground">Penerima</th>
                    <th className="text-right px-4 py-3 font-medium text-muted-foreground">Total</th>
                    <th className="text-left px-4 py-3 font-medium text-muted-foreground">Dibuat</th>
                    <th className="text-left px-4 py-3 font-medium text-muted-foreground">Oleh</th>
                  </tr>
                </thead>
                <tbody>
                  {invoices.map((inv, i) => (
                    <tr
                      key={inv.id}
                      className={`border-b last:border-0 hover:bg-muted/30 transition-colors ${i % 2 === 0 ? "" : "bg-muted/10"}`}
                    >
                      <td className="px-4 py-3 font-mono font-medium">{inv.invoice_number}</td>
                      <td className="px-4 py-3">{inv.sender_name}</td>
                      <td className="px-4 py-3">{inv.receiver_name}</td>
                      <td className="px-4 py-3 text-right font-medium">{formatRupiah(inv.total_amount)}</td>
                      <td className="px-4 py-3 text-muted-foreground">{formatDate(inv.created_at)}</td>
                      <td className="px-4 py-3 text-muted-foreground">{inv.creator_name}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
        <p className="text-xs text-muted-foreground mt-2">{invoices.length} invoice ditemukan</p>
      </main>
    </div>
  );
}
