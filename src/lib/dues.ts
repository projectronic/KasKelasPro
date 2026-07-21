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

/**
 * Kas biasanya berlaku satu tahun ajaran, dihitung dari settings.period_start_date
 * — tapi anggota yang baru gabung di tengah jalan tidak dianggap nunggak
 * sejak awal tahun, jadi dipakai yang lebih belakangan.
 */
export function effectiveStartDate(periodStartDate: Date, joinDate: Date): Date {
  return joinDate > periodStartDate ? joinDate : periodStartDate;
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
  periodStartDate,
  joinDate,
  today,
  defaultAmount,
  overrides,
  payments,
}: {
  iuranType: IuranType;
  periodStartDate: Date;
  joinDate: Date;
  today: Date;
  defaultAmount: number;
  overrides: Map<string, number>;
  payments: { period: string; amount: number }[];
}): MemberDues {
  const start = effectiveStartDate(periodStartDate, joinDate);
  const expected = getExpectedPeriods(iuranType, start, today);

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

/**
 * The next `count` calendar-month periods after today's month, for recording
 * prepayments ahead of when they're actually due (bulanan mode only — daily
 * mode has no "pay ahead" flow yet).
 */
export function getUpcomingPeriods(today: Date, count: number): string[] {
  const periods: string[] = [];
  const cursor = new Date(today.getFullYear(), today.getMonth() + 1, 1);
  for (let i = 0; i < count; i++) {
    periods.push(toMonthPeriod(cursor));
    cursor.setMonth(cursor.getMonth() + 1);
  }
  return periods;
}

/**
 * School days (Mon–Fri, minus `holidays`) from `start` to `end` inclusive.
 * Used by the daily payment form's date-range picker so a range spanning a
 * weekend or a holiday doesn't get charged for those days.
 */
export function getSchoolDaysInRange(
  start: Date,
  end: Date,
  holidays: Set<string>
): string[] {
  const days: string[] = [];
  const cursor = new Date(start.getFullYear(), start.getMonth(), start.getDate());
  const last = new Date(end.getFullYear(), end.getMonth(), end.getDate());
  while (cursor <= last) {
    const day = cursor.getDay();
    const period = toDayPeriod(cursor);
    if (day >= 1 && day <= 5 && !holidays.has(period)) {
      days.push(period);
    }
    cursor.setDate(cursor.getDate() + 1);
  }
  return days;
}
