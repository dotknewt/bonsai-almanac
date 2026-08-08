/* Key into the completions map persisted via the plugin's saveData(). */
export function completionKey(speciesId: string, taskId: string, year: number): string {
	return `${speciesId}:${taskId}:${year}`;
}

/* Drop completion entries from years other than `year` so the stored data
   doesn't grow forever — nothing in the UI ever reads a prior year's
   entries anyway. */
export function pruneCompletionsToYear(
	completions: Record<string, boolean>,
	year: number,
): Record<string, boolean> {
	const suffix = `:${year}`;
	return Object.fromEntries(Object.entries(completions).filter(([k]) => k.endsWith(suffix)));
}
