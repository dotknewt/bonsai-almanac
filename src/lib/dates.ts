import { defaultSpanDays } from './categories';
import { CareTask, WindowStatus } from '../types';

// Day counts for a non-leap year — paired with the fixed REF_YEAR below for
// pure month/day arithmetic; leap years are intentionally not modeled.
export const DAYS_IN_MONTH = [31, 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31];
export const REF_YEAR = 2001; // non-leap year used for pure month/day arithmetic

const SEASON_LABELS: Record<number, string> = {
	1: 'Late winter',
	2: 'Late winter',
	3: 'Early spring',
	4: 'Early spring',
	5: 'Spring',
	6: 'Early summer',
	7: 'Midsummer',
	8: 'Late summer',
	9: 'Autumn',
	10: 'Autumn',
	11: 'Early winter',
	12: 'Winter',
};

export function seasonLabel(month: number): string {
	return SEASON_LABELS[month] ?? '';
}

export function clampDay(month: number, day: number): number {
	const dim = DAYS_IN_MONTH[Math.min(Math.max(month, 1), 12) - 1] ?? 31;
	return Math.max(1, Math.min(day, dim));
}

export function dateFor(year: number, month: number, day: number): Date {
	const d = new Date(year, month - 1, clampDay(month, day));
	d.setHours(0, 0, 0, 0);
	return d;
}

/* Accepts both the current shape (startMonth/startDay/endMonth/endDay) and the
   legacy single-date shape (month/day). A missing end gets the category's
   default span. */
export interface RawTask {
	id?: string;
	title?: string;
	startMonth?: number;
	startDay?: number;
	endMonth?: number;
	endDay?: number;
	month?: number;
	day?: number;
	category?: string;
	description?: string;
}

export function normalizeTask(t: RawTask): CareTask {
	const startMonth = t.startMonth ?? t.month ?? 1;
	const startDay = clampDay(startMonth, t.startDay ?? t.day ?? 1);
	let endMonth = t.endMonth;
	let endDay = t.endDay;
	if (endMonth == null || endDay == null) {
		const end = dateFor(REF_YEAR, startMonth, startDay);
		end.setDate(end.getDate() + defaultSpanDays(t.category));
		endMonth = end.getMonth() + 1;
		endDay = end.getDate();
	} else {
		endDay = clampDay(endMonth, endDay);
	}
	return {
		id: t.id ?? '',
		title: t.title ?? '',
		category: (t.category as CareTask['category']) || 'other',
		description: t.description ?? '',
		startMonth,
		startDay,
		endMonth,
		endDay,
	};
}

/* Where does today fall relative to a task's yearly window? Windows may wrap
   the year boundary (e.g. Nov 15 – Feb 1). */
export function windowStatus(t: CareTask, from: Date = new Date()): WindowStatus {
	const today = new Date(from);
	today.setHours(0, 0, 0, 0);
	const y = today.getFullYear();
	for (const sy of [y - 1, y]) {
		const start = dateFor(sy, t.startMonth, t.startDay);
		let end = dateFor(sy, t.endMonth, t.endDay);
		if (end < start) end = dateFor(sy + 1, t.endMonth, t.endDay);
		if (today >= start && today <= end) return { open: true, start, end };
	}
	let start = dateFor(y, t.startMonth, t.startDay);
	if (start < today) start = dateFor(y + 1, t.startMonth, t.startDay);
	let end = dateFor(start.getFullYear(), t.endMonth, t.endDay);
	if (end < start) end = dateFor(start.getFullYear() + 1, t.endMonth, t.endDay);
	return { open: false, start, end };
}

export function fmtDate(d: Date): string {
	return d.toLocaleDateString(undefined, { day: 'numeric', month: 'short' });
}

export function sortTasksByStart(tasks: CareTask[]): CareTask[] {
	return [...tasks].sort((a, b) => a.startMonth - b.startMonth || a.startDay - b.startDay);
}

export function fmtWindow(status: WindowStatus): string {
	return `${fmtDate(status.start)} – ${fmtDate(status.end)}`;
}

export function daysUntilText(d: Date, from: Date = new Date()): string {
	const today = new Date(from);
	today.setHours(0, 0, 0, 0);
	const diff = Math.round((d.getTime() - today.getTime()) / 86400000);
	if (diff === 0) return 'Today';
	if (diff === 1) return 'Tomorrow';
	if (diff <= 30) return `in ${diff} days`;
	return fmtDate(d);
}
