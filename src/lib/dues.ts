import type { IuranType } from "@/lib/supabase/types";

function pad(n: number) {
  return String(n).padStart(2, "0");
}

function toMonthPeriod(date: Date) {
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}`;
}

function toDayPeriod(date: Date) {
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
}

/**
 * All periods a member is expected to have paid for, from their join date up
 * to (and including) today. Monthly mode = one period per calendar month;
 * daily mode = one period per school day (Mon–Fri), matching the "kas
 * harian" convention from the original project.
 */
export function getExpectedPeriods(
  iuranType: IuranType,
  joinDate: Date,
  today: Date
): string[] {
  const periods: string[] = [];
  if (joinDate > today) return periods;

  if (iuranType === "bulanan") {
    const cursor = new Date(joinDate.getFullYear(), joinDate.getMonth(), 1);
    const end = new Date(today.getFullYear(), today.getMonth(), 1);
    while (cursor <= end) {
      periods.push(toMonthPeriod(cursor));
      cursor.setMonth(cursor.getMonth() + 1);
    }
    return periods;
  }

  const cursor = new Date(
    joinDate.getFullYear(),
    joinDate.getMonth(),
    joinDate.getDate()
  );
  while (cursor <= today) {
    const day = cursor.getDay();
    if (day >= 1 && day <= 5) {
      periods.push(toDayPeriod(cursor));
    }
    cursor.setDate(cursor.getDate() + 1);
  }
  return periods;
}

export function getRateForPeriod(
  period: string,
  defaultAmount: number,
  overrides: Map<string, number>
): number {
  return overrides.get(period) ?? defaultAmount;
}

export type PeriodDue = {
  period: string;
  required: number;
  paid: number;
  owed: number;
};

export type MemberDues = {
  totalOwed: number;
  expectedCount: number;
  unpaidPeriods: PeriodDue[];
};

export function computeMemberDues({
  iuranType,
  joinDate,
  today,
  defaultAmount,
  overrides,
  payments,
}: {
  iuranType: IuranType;
  joinDate: Date;
  today: Date;
  defaultAmount: number;
  overrides: Map<string, number>;
  payments: { period: string; amount: number }[];
}): MemberDues {
  const expected = getExpectedPeriods(iuranType, joinDate, today);

  const paidByPeriod = new Map<string, number>();
  for (const p of payments) {
    paidByPeriod.set(p.period, (paidByPeriod.get(p.period) ?? 0) + p.amount);
  }

  let totalOwed = 0;
  const unpaidPeriods: PeriodDue[] = [];

  for (const period of expected) {
    const required = getRateForPeriod(period, defaultAmount, overrides);
    const paid = paidByPeriod.get(period) ?? 0;
    if (paid < required) {
      const owed = required - paid;
      totalOwed += owed;
      unpaidPeriods.push({ period, required, paid, owed });
    }
  }

  return { totalOwed, expectedCount: expected.length, unpaidPeriods };
}

/** The period a new payment should default to today, given the current mode. */
export function currentPeriod(iuranType: IuranType, today: Date): string {
  return iuranType === "bulanan" ? toMonthPeriod(today) : toDayPeriod(today);
}
