import { TaskCategory } from '../types';

/* Theme tokens per care-task category. `icon` is a lucide icon id usable
   with Obsidian's `setIcon()`. `spanDays` is the default window length when
   a task is given without an end date. */
export interface CategoryInfo {
	label: string;
	color: string;
	icon: string;
	spanDays: number;
}

export const CATS: Record<TaskCategory, CategoryInfo> = {
	repot: { label: 'Repot', color: '#C97A3D', icon: 'rotate-ccw', spanDays: 21 },
	feed: { label: 'Feed', color: '#8FA876', icon: 'droplet', spanDays: 90 },
	prune: { label: 'Prune', color: '#D9A441', icon: 'scissors', spanDays: 30 },
	wire: { label: 'Wire', color: '#C1552E', icon: 'link-2', spanDays: 60 },
	propagate: { label: 'Propagate', color: '#5B8C7B', icon: 'sprout', spanDays: 30 },
	seed: { label: 'Seed', color: '#B08968', icon: 'leaf', spanDays: 21 },
	pest: { label: 'Pest watch', color: '#B4483A', icon: 'bug', spanDays: 90 },
	other: { label: 'General', color: '#8A9086', icon: 'calendar-days', spanDays: 14 },
};

export function defaultSpanDays(category?: string): number {
	return (CATS[category as TaskCategory] || CATS.other).spanDays;
}

export function catOf(category?: string): TaskCategory {
	return (CATS as Record<string, CategoryInfo>)[category ?? '']
		? (category as TaskCategory)
		: 'other';
}
