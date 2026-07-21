import type { IuranType } from "@/lib/supabase/types";
import { effectiveStartDate, getExpectedPeriods, getRateForPeriod } from "@/lib/dues";

function pad(n: number) {
  return String(n).padStart(2, "0");
}

function monthKey(date: Date) {
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}`;
}

/** First 7 chars of a period string is its month, for both "YYYY-MM" and "YYYY-MM-DD". */
function monthOfPeriod(period: string) {
  return period.slice(0, 7);
}

function allMonthsBetween(start: Date, end: Date): string[] {
  const months: string[] = [];
  const cursor = new Date(start.getFullYear(), start.getMonth(), 1);
  const last = new Date(end.getFullYear(), end.getMonth(), 1);
  while (cursor <= last) {
    months.push(monthKey(cursor));
    cursor.setMonth(cursor.getMonth() + 1);
  }
  return months;
}

export type MonthlyFlow = {
  /** "YYYY-MM" */
  month: string;
  /** Total pembayaran iuran yang diterima untuk periode-periode di bulan ini. */
  diterima: number;
  /** Snapshot: total nominal yang seharusnya dibayar dikurangi yang diterima, untuk periode-periode di bulan ini (bukan akumulasi tunggakan lama). */
  tunggakan: number;
  /** Total deposit ke dompet/bank bulan ini (biasanya = diterima, tapi dari sisi ledger, bukan tabel payments). */
  pemasukan: number;
  /** Total penarikan dari dompet/bank bulan ini. */
  pengeluaran: number;
};

/**
 * One row per calendar month from `periodStartDate` through `today`,
 * combining dues-side numbers (diterima/tunggakan, from members+payments)
 * with ledger-side numbers (pemasukan/pengeluaran, from wallet_transactions)
 * — feeds the dashboard's monthly combo chart.
 */
export function computeMonthlyFlow({
  iuranType,
  periodStartDate,
  today,
  defaultAmount,
  overrides,
  members,
  payments,
  walletTransactions,
}: {
  iuranType: IuranType;
  periodStartDate: Date;
  today: Date;
  defaultAmount: number;
  overrides: Map<string, number>;
  members: { id: string; join_date: string }[];
  payments: { member_id: string; period: string; amount: number }[];
  walletTransactions: { type: string; amount: number; created_at: string }[];
}): MonthlyFlow[] {
  const months = allMonthsBetween(periodStartDate, today);

  const diterimaByMonth = new Map<string, number>(months.map((m) => [m, 0]));
  const tunggakanByMonth = new Map<string, number>(months.map((m) => [m, 0]));
  const pemasukanByMonth = new Map<string, number>(months.map((m) => [m, 0]));
  const pengeluaranByMonth = new Map<string, number>(months.map((m) => [m, 0]));

  for (const p of payments) {
    const month = monthOfPeriod(p.period);
    if (diterimaByMonth.has(month)) {
      diterimaByMonth.set(month, (diterimaByMonth.get(month) ?? 0) + p.amount);
    }
  }

  const paymentsByMember = new Map<string, { period: string; amount: number }[]>();
  for (const p of payments) {
    const list = paymentsByMember.get(p.member_id) ?? [];
    list.push(p);
    paymentsByMember.set(p.member_id, list);
  }

  for (const member of members) {
    const start = effectiveStartDate(periodStartDate, new Date(member.join_date));
    const expected = getExpectedPeriods(iuranType, start, today);
    const paidByPeriod = new Map<string, number>();
    for (const p of paymentsByMember.get(member.id) ?? []) {
      paidByPeriod.set(p.period, (paidByPeriod.get(p.period) ?? 0) + p.amount);
    }

    for (const period of expected) {
      const required = getRateForPeriod(period, defaultAmount, overrides);
      const paid = paidByPeriod.get(period) ?? 0;
      const owed = Math.max(0, required - paid);
      if (owed <= 0) continue;
      const month = monthOfPeriod(period);
      if (tunggakanByMonth.has(month)) {
        tunggakanByMonth.set(month, (tunggakanByMonth.get(month) ?? 0) + owed);
      }
    }
  }

  for (const t of walletTransactions) {
    const month = monthKey(new Date(t.created_at));
    if (t.type === "deposit" && pemasukanByMonth.has(month)) {
      pemasukanByMonth.set(month, (pemasukanByMonth.get(month) ?? 0) + t.amount);
    } else if (t.type === "withdrawal" && pengeluaranByMonth.has(month)) {
      pengeluaranByMonth.set(month, (pengeluaranByMonth.get(month) ?? 0) + t.amount);
    }
  }

  return months.map((month) => ({
    month,
    diterima: diterimaByMonth.get(month) ?? 0,
    tunggakan: tunggakanByMonth.get(month) ?? 0,
    pemasukan: pemasukanByMonth.get(month) ?? 0,
    pengeluaran: pengeluaranByMonth.get(month) ?? 0,
  }));
}
