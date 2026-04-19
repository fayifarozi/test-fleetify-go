import { useState, useEffect, useRef, useCallback, FormEvent } from "react";
import { useRouter } from "next/router";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import api from "@/lib/api";
import { useStore, InvoiceItem } from "@/store/useStore";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Field, FieldGroup, FieldLabel, FieldError } from "@/components/ui/field";

// ─── Types ───────────────────────────────────────────────────────────────────
interface ApiItem {
  id: number;
  code: string;
  name: string;
  price: number;
}

interface CreateInvoicePayload {
  sender_name: string;
  sender_address: string;
  receiver_name: string;
  items: {
    item_id: number;
    quantity: number;
    price?: number;
  }[];
}

function formatRupiah(val: number) {
  return new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    maximumFractionDigits: 0,
  }).format(val);
}

// ─── Step Indicator ───────────────────────────────────────────────────────────
function StepBar({ step }: { step: number }) {
  const steps = ["Data Klien", "Data Barang", "Review & Kirim"];
  return (
    <div className="flex items-center gap-0 mb-8">
      {steps.map((label, i) => {
        const num = i + 1;
        const active = num === step;
        const done = num < step;
        return (
          <div key={num} className="flex items-center flex-1 last:flex-none">
            <div className="flex items-center gap-2">
              <div
                className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold shrink-0
                  ${done ? "bg-primary text-primary-foreground" : active ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground"}`}
              >
                {done ? "✓" : num}
              </div>
              <span className={`text-sm hidden sm:block ${active ? "font-medium" : "text-muted-foreground"}`}>
                {label}
              </span>
            </div>
            {i < steps.length - 1 && (
              <div className={`flex-1 h-px mx-3 ${done ? "bg-primary" : "bg-border"}`} />
            )}
          </div>
        );
      })}
    </div>
  );
}

// ─── Step 1 ───────────────────────────────────────────────────────────────────
function Step1({ onNext }: { onNext: () => void }) {
  const { step1, setStep1 } = useStore();
  const [form, setForm] = useState(step1);
  const [errors, setErrors] = useState<Partial<typeof form>>({});

  function validate() {
    const e: Partial<typeof form> = {};
    if (!form.senderName.trim()) e.senderName = "Wajib diisi";
    if (!form.senderAddress.trim()) e.senderAddress = "Wajib diisi";
    if (!form.receiverName.trim()) e.receiverName = "Wajib diisi";
    return e;
  }

  function handleSubmit(e: FormEvent) {
    e.preventDefault();
    const e2 = validate();
    if (Object.keys(e2).length) { setErrors(e2); return; }
    setStep1(form);
    onNext();
  }

  return (
    <form onSubmit={handleSubmit}>
      <FieldGroup>
        <Field>
          <FieldLabel htmlFor="senderName">Nama Pengirim</FieldLabel>
          <Input
            id="senderName"
            placeholder="PT. Logistik Nusantara"
            value={form.senderName}
            onChange={(e) => setForm({ ...form, senderName: e.target.value })}
          />
          {errors.senderName && <FieldError>{errors.senderName}</FieldError>}
        </Field>
        <Field>
          <FieldLabel htmlFor="senderAddress">Alamat Pengirim</FieldLabel>
          <Input
            id="senderAddress"
            placeholder="Jl. Raya No. 1, Jakarta"
            value={form.senderAddress}
            onChange={(e) => setForm({ ...form, senderAddress: e.target.value })}
          />
          {errors.senderAddress && <FieldError>{errors.senderAddress}</FieldError>}
        </Field>
        <Field>
          <FieldLabel htmlFor="receiverName">Nama Penerima</FieldLabel>
          <Input
            id="receiverName"
            placeholder="CV. Maju Bersama"
            value={form.receiverName}
            onChange={(e) => setForm({ ...form, receiverName: e.target.value })}
          />
          {errors.receiverName && <FieldError>{errors.receiverName}</FieldError>}
        </Field>
        <Button type="submit" className="w-full">Lanjut →</Button>
      </FieldGroup>
    </form>
  );
}

// ─── Step 2 ───────────────────────────────────────────────────────────────────
function Step2({ onNext, onBack }: { onNext: () => void; onBack: () => void }) {
  const { items, setItems } = useStore();
  const [rows, setRows] = useState<InvoiceItem[]>(items.length ? items : []);
  const [codeInput, setCodeInput] = useState("");
  const [qty, setQty] = useState(1);
  const [searching, setSearching] = useState(false);
  const [found, setFound] = useState<ApiItem | null>(null);
  const [searchError, setSearchError] = useState("");
  const [error, setError] = useState("");

  // Debounce + AbortController
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const abortRef = useRef<AbortController | null>(null);

  const doSearch = useCallback((code: string) => {
    if (abortRef.current) abortRef.current.abort();
    if (!code.trim()) { setFound(null); setSearchError(""); setSearching(false); return; }

    const ctrl = new AbortController();
    abortRef.current = ctrl;
    setSearching(true);
    setSearchError("");
    setFound(null);

    api
      .get(`/api/items?code=${encodeURIComponent(code)}`, { signal: ctrl.signal })
      .then((res) => {
        const list: ApiItem[] = res.data.data ?? [];
        const exact = list.find((i) => i.code.toLowerCase() === code.toLowerCase());
        if (exact) {
          setFound(exact);
        } else if (list.length > 0) {
          setFound(list[0]);
        } else {
          setSearchError("Barang tidak ditemukan");
        }
      })
      .catch((err) => {
        if (err?.code !== "ERR_CANCELED") setSearchError("Gagal mencari barang");
      })
      .finally(() => setSearching(false));
  }, []);

  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => doSearch(codeInput), 500);
    return () => { if (debounceRef.current) clearTimeout(debounceRef.current); };
  }, [codeInput, doSearch]);

  function addRow() {
    if (!found) { setSearchError("Pilih barang terlebih dahulu"); return; }
    if (qty < 1) return;
    const existing = rows.findIndex((r) => r.itemId === found.id);
    if (existing >= 0) {
      const updated = [...rows];
      updated[existing] = { ...updated[existing], quantity: updated[existing].quantity + qty };
      setRows(updated);
    } else {
      setRows([...rows, { itemId: found.id, itemCode: found.code, itemName: found.name, quantity: qty, price: found.price }]);
    }
    setCodeInput("");
    setFound(null);
    setQty(1);
  }

  function removeRow(idx: number) {
    setRows(rows.filter((_, i) => i !== idx));
  }

  function handleNext() {
    if (rows.length === 0) { setError("Tambahkan minimal 1 barang"); return; }
    setItems(rows);
    onNext();
  }

  const grandTotal = rows.reduce((s, r) => s + r.price * r.quantity, 0);

  return (
    <div className="space-y-6">
      {/* Add item row */}
      <div className="border rounded-lg p-4 bg-muted/30 space-y-3">
        <p className="text-sm font-medium">Tambah Barang</p>
        <div className="flex gap-2 flex-wrap">
          <div className="flex-1 min-w-48">
            <Input
              id="codeInput"
              placeholder="Kode barang (cth: BRG-001)"
              value={codeInput}
              onChange={(e) => setCodeInput(e.target.value)}
            />
          </div>
          <div className="w-24">
            <Input
              id="qtyInput"
              type="number"
              min={1}
              value={qty}
              onChange={(e) => setQty(parseInt(e.target.value) || 1)}
              placeholder="Qty"
            />
          </div>
          <Button type="button" onClick={addRow} disabled={searching || !found}>
            + Tambah
          </Button>
        </div>
        {searching && <p className="text-xs text-muted-foreground">Mencari...</p>}
        {found && (
          <p className="text-xs text-green-600 dark:text-green-400">
            ✓ {found.code} – {found.name} ({formatRupiah(found.price)})
          </p>
        )}
        {searchError && <p className="text-xs text-destructive">{searchError}</p>}
      </div>

      {/* Table */}
      {rows.length > 0 && (
        <div className="border rounded-lg overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b bg-muted/50">
                <th className="text-left px-3 py-2 font-medium text-muted-foreground">Kode</th>
                <th className="text-left px-3 py-2 font-medium text-muted-foreground">Nama Barang</th>
                <th className="text-right px-3 py-2 font-medium text-muted-foreground">Harga</th>
                <th className="text-right px-3 py-2 font-medium text-muted-foreground">Qty</th>
                <th className="text-right px-3 py-2 font-medium text-muted-foreground">Subtotal</th>
                <th className="px-3 py-2"></th>
              </tr>
            </thead>
            <tbody>
              {rows.map((row, i) => (
                <tr key={i} className="border-b last:border-0">
                  <td className="px-3 py-2 font-mono text-xs">{row.itemCode}</td>
                  <td className="px-3 py-2">{row.itemName}</td>
                  <td className="px-3 py-2 text-right">{formatRupiah(row.price)}</td>
                  <td className="px-3 py-2 text-right">{row.quantity}</td>
                  <td className="px-3 py-2 text-right font-medium">{formatRupiah(row.price * row.quantity)}</td>
                  <td className="px-3 py-2">
                    <button
                      onClick={() => removeRow(i)}
                      className="text-destructive text-xs hover:underline"
                    >
                      Hapus
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
            <tfoot>
              <tr className="border-t bg-muted/30">
                <td colSpan={4} className="px-3 py-2 text-right font-semibold text-sm">Grand Total</td>
                <td className="px-3 py-2 text-right font-bold">{formatRupiah(grandTotal)}</td>
                <td />
              </tr>
            </tfoot>
          </table>
        </div>
      )}

      {error && <p className="text-sm text-destructive">{error}</p>}

      <div className="flex gap-2 pt-2">
        <Button variant="outline" onClick={onBack}>← Kembali</Button>
        <Button onClick={handleNext} className="flex-1">Lanjut →</Button>
      </div>
    </div>
  );
}

// ─── Step 3 ───────────────────────────────────────────────────────────────────
function Step3({ onBack }: { onBack: () => void }) {
  const router = useRouter();
  const qc = useQueryClient();
  const { step1, items, user, resetWizard } = useStore();
  const [submitError, setSubmitError] = useState("");

  const grandTotal = items.reduce((s, r) => s + r.price * r.quantity, 0);

  const mutation = useMutation({
    mutationFn: (payload: CreateInvoicePayload) =>
      api.post("/api/invoices", payload).then((r) => r.data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["invoices"] });
      resetWizard();
      router.push("/invoices");
    },
    onError: (err: unknown) => {
      const msg =
        (err as { response?: { data?: { error?: string } } })?.response?.data?.error ||
        "Gagal membuat invoice";
      setSubmitError(msg);
    },
  });

  function handleSubmit() {
    setSubmitError("");
    const isKerani = user?.role === "kerani";

    const payload: CreateInvoicePayload = {
      sender_name: step1.senderName,
      sender_address: step1.senderAddress,
      receiver_name: step1.receiverName,
      items: items.map((it) => {
        const base: CreateInvoicePayload["items"][0] = {
          item_id: it.itemId,
          quantity: it.quantity,
        };
        // Role-based transform: kerani tidak kirim price, admin kirim semua
        if (!isKerani) base.price = it.price;
        return base;
      }),
    };

    mutation.mutate(payload);
  }

  function handlePrint() {
    window.print();
  }

  return (
    <div className="space-y-6">
      <div className="border rounded-lg p-4 space-y-2">
        <p className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">Data Klien</p>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-sm">
          <div><span className="text-muted-foreground">Pengirim</span><p className="font-medium mt-0.5">{step1.senderName}</p></div>
          <div><span className="text-muted-foreground">Alamat</span><p className="font-medium mt-0.5">{step1.senderAddress}</p></div>
          <div><span className="text-muted-foreground">Penerima</span><p className="font-medium mt-0.5">{step1.receiverName}</p></div>
        </div>
      </div>

      <div className="border rounded-lg overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b bg-muted/50">
              <th className="text-left px-3 py-2 font-medium text-muted-foreground">Barang</th>
              <th className="text-right px-3 py-2 font-medium text-muted-foreground">Qty</th>
              {user?.role === "admin" && (
                <>
                  <th className="text-right px-3 py-2 font-medium text-muted-foreground">Harga</th>
                  <th className="text-right px-3 py-2 font-medium text-muted-foreground">Subtotal</th>
                </>
              )}
            </tr>
          </thead>
          <tbody>
            {items.map((it, i) => (
              <tr key={i} className="border-b last:border-0">
                <td className="px-3 py-2">
                  <p className="font-medium">{it.itemName}</p>
                  <p className="text-xs text-muted-foreground font-mono">{it.itemCode}</p>
                </td>
                <td className="px-3 py-2 text-right">{it.quantity}</td>
                {user?.role === "admin" && (
                  <>
                    <td className="px-3 py-2 text-right">{formatRupiah(it.price)}</td>
                    <td className="px-3 py-2 text-right font-medium">{formatRupiah(it.price * it.quantity)}</td>
                  </>
                )}
              </tr>
            ))}
          </tbody>
          {user?.role === "admin" && (
            <tfoot>
              <tr className="border-t bg-muted/30">
                <td colSpan={3} className="px-3 py-2 text-right font-semibold">Grand Total</td>
                <td className="px-3 py-2 text-right font-bold text-base">{formatRupiah(grandTotal)}</td>
              </tr>
            </tfoot>
          )}
        </table>
      </div>

      {submitError && <p className="text-sm text-destructive">{submitError}</p>}

      <div className="flex gap-2 pt-2 print:hidden">
        <Button variant="outline" onClick={onBack} disabled={mutation.isPending}>← Kembali</Button>
        <Button variant="outline" onClick={handlePrint}>🖨 Cetak</Button>
        <Button onClick={handleSubmit} disabled={mutation.isPending} className="flex-1">
          {mutation.isPending ? "Menyimpan..." : "Submit Invoice"}
        </Button>
      </div>
    </div>
  );
}

export default function CreateInvoicePage() {
  const { step, setStep } = useStore();

  return (
    <div className="min-h-screen bg-muted/30 py-8 px-4">
      <div className="max-w-2xl mx-auto">
        <div className="mb-6">
          <h1 className="text-2xl font-bold">Buat Invoice Baru</h1>
          <p className="text-sm text-muted-foreground mt-1">Isi data pengiriman langkah demi langkah</p>
        </div>
        <StepBar step={step} />
        <Card>
          <CardHeader>
            <CardTitle className="text-base">
              {step === 1 && "Step 1: Data Klien"}
              {step === 2 && "Step 2: Data Barang"}
              {step === 3 && "Step 3: Review & Kirim"}
            </CardTitle>
          </CardHeader>
          <CardContent>
            {step === 1 && <Step1 onNext={() => setStep(2)} />}
            {step === 2 && <Step2 onNext={() => setStep(3)} onBack={() => setStep(1)} />}
            {step === 3 && <Step3 onBack={() => setStep(2)} />}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
