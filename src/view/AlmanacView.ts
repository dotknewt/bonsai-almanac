import { ItemView, WorkspaceLeaf, setIcon, Notice } from 'obsidian';
import type BonsaiAlmanacPlugin from '../main';
import { CATS } from '../lib/categories';
import { windowStatus, fmtWindow, seasonLabel, sortTasksByStart } from '../lib/dates';
import { completionKey } from '../lib/storage';
import { CareTask, Species } from '../types';

export const ALMANAC_VIEW_TYPE = 'bonsai-almanac-view';

const OPEN_CAP = 8;
const UPCOMING_CAP = 5;
const COMPLETED_CAP = 5;

interface BenchRow {
	species: Species;
	task: CareTask;
	open: boolean;
	start: Date;
	end: Date;
	done: boolean;
}

export class AlmanacView extends ItemView {
	plugin: BonsaiAlmanacPlugin;
	private activeSpeciesId: string | null = null;
	private showAllBench = false;

	constructor(leaf: WorkspaceLeaf, plugin: BonsaiAlmanacPlugin) {
		super(leaf);
		this.plugin = plugin;
	}

	getViewType(): string {
		return ALMANAC_VIEW_TYPE;
	}

	getDisplayText(): string {
		return 'Bonsai almanac';
	}

	getIcon(): string {
		return 'sprout';
	}

	async onOpen(): Promise<void> {
		await this.render();
	}

	async onClose(): Promise<void> {
		this.contentEl.empty();
	}

	async refresh(): Promise<void> {
		await this.render();
	}

	private async render(): Promise<void> {
		const container = this.contentEl;
		container.empty();
		container.addClass('bonsai-almanac-view');

		const species = await this.plugin.getSpecies();

		if (species.length === 0) {
			this.renderEmptyState(container);
			return;
		}

		const year = new Date().getFullYear();
		const completions = this.plugin.settings.completions;
		const rows: BenchRow[] = [];
		species.forEach((s) => {
			s.tasks.forEach((t) => {
				const st = windowStatus(t);
				rows.push({
					species: s,
					task: t,
					...st,
					done: !!completions[completionKey(s.id, t.id, year)],
				});
			});
		});

		const openRows = rows.filter((r) => r.open && !r.done).sort((a, b) => a.end.getTime() - b.end.getTime());
		const upcomingRows = rows
			.filter((r) => !r.open && !r.done)
			.sort((a, b) => a.start.getTime() - b.start.getTime());
		const completedRows = rows
			.filter((r) => r.done)
			.sort(
				(a, b) =>
					a.species.name.localeCompare(b.species.name) || a.task.title.localeCompare(b.task.title),
			);

		const groups: { label: string; rows: BenchRow[]; total: number }[] = [
			{
				label: 'Open now',
				total: openRows.length,
				rows: this.showAllBench ? openRows : openRows.slice(0, OPEN_CAP),
			},
			{
				label: 'Coming up',
				total: upcomingRows.length,
				rows: this.showAllBench ? upcomingRows : upcomingRows.slice(0, UPCOMING_CAP),
			},
			{
				label: 'Completed',
				total: completedRows.length,
				rows: this.showAllBench ? completedRows : completedRows.slice(0, COMPLETED_CAP),
			},
		].filter((g) => g.total > 0);

		const benchTotal = openRows.length + upcomingRows.length + completedRows.length;
		const benchShown = groups.reduce((sum, g) => sum + g.rows.length, 0);

		container.createEl('h2', { text: 'On the bench' });
		const benchSection = container.createDiv({ cls: 'bonsai-bench' });
		if (groups.length === 0) {
			benchSection.createEl('p', { text: 'Nothing due. Enjoy the bench.', cls: 'bonsai-muted' });
		}
		for (const group of groups) {
			benchSection.createEl('h3', { text: group.label });
			const list = benchSection.createDiv({ cls: 'bonsai-task-list' });
			for (const row of group.rows) {
				this.renderTaskRow(list, row, year, true);
			}
		}
		if (benchTotal > benchShown) {
			const toggle = benchSection.createEl('button', {
				text: this.showAllBench ? 'Show less' : `Show all ${benchTotal}`,
				cls: 'bonsai-link-button',
			});
			toggle.addEventListener('click', () => {
				this.showAllBench = !this.showAllBench;
				void this.render();
			});
		}

		container.createEl('hr');

		// Per-species care plan
		const firstSpecies = species[0];
		if (!firstSpecies) return;
		const active = species.find((s) => s.id === this.activeSpeciesId) ?? firstSpecies;
		this.activeSpeciesId = active.id;

		const header = container.createDiv({ cls: 'bonsai-species-header' });
		const select = header.createEl('select', { cls: 'dropdown' });
		for (const s of species) {
			const opt = select.createEl('option', { text: s.name, value: s.id });
			if (s.id === active.id) opt.selected = true;
		}
		select.addEventListener('change', () => {
			this.activeSpeciesId = select.value;
			void this.render();
		});

		if (active.botanicalName) {
			header.createSpan({ text: active.botanicalName, cls: 'bonsai-botanical-name' });
		}

		const activeTasks = sortTasksByStart(active.tasks);
		const pending = activeTasks.filter(
			(t) => !completions[completionKey(active.id, t.id, year)],
		);
		const completed = activeTasks.filter(
			(t) => completions[completionKey(active.id, t.id, year)],
		);

		container.createEl('h3', { text: 'Care plan' });
		if (activeTasks.length === 0) {
			container.createEl('p', {
				text: 'No care tasks defined for this species yet.',
				cls: 'bonsai-muted',
			});
		}
		const pendingList = container.createDiv({ cls: 'bonsai-task-list' });
		for (const t of pending) {
			this.renderTaskRow(pendingList, { species: active, task: t, done: false, ...windowStatus(t) }, year, false);
		}
		if (completed.length > 0) {
			container.createEl('h4', { text: 'Completed' });
			const completedList = container.createDiv({ cls: 'bonsai-task-list' });
			for (const t of completed) {
				this.renderTaskRow(completedList, { species: active, task: t, done: true, ...windowStatus(t) }, year, false);
			}
		}
	}

	private renderEmptyState(container: HTMLElement): void {
		container.createEl('h2', { text: 'On the bench' });
		const p = container.createEl('p', { cls: 'bonsai-muted' });
		p.setText(
			`No species notes found in "${this.plugin.settings.speciesFolder}". Add Markdown notes with frontmatter (id, name, botanicalName) and ## task sections, or change the folder in the plugin settings.`,
		);
	}

	private renderTaskRow(
		container: HTMLElement,
		row: BenchRow,
		year: number,
		showSpeciesName: boolean,
	): void {
		const { species, task, open, done } = row;
		const cat = CATS[task.category] ?? CATS.other;

		const rowEl = container.createDiv({ cls: 'bonsai-task-row' });
		if (open) rowEl.addClass('bonsai-task-row-open');

		const toggle = rowEl.createEl('button', {
			cls: 'bonsai-task-toggle',
			attr: { 'aria-label': done ? 'Mark incomplete' : 'Mark complete' },
		});
		toggle.style.setProperty('--bonsai-cat-color', cat.color);
		if (done) toggle.addClass('bonsai-task-toggle-done');
		if (done) setIcon(toggle, 'check');
		toggle.addEventListener('click', () => {
			void (async () => {
				const key = completionKey(species.id, task.id, year);
				if (this.plugin.settings.completions[key]) {
					delete this.plugin.settings.completions[key];
				} else {
					this.plugin.settings.completions[key] = true;
				}
				await this.plugin.saveSettings();
				await this.render();
			})();
		});

		const body = rowEl.createDiv({ cls: 'bonsai-task-body' });
		const titleLine = body.createDiv({ cls: 'bonsai-task-title-line' });
		titleLine.createSpan({
			text: task.title,
			cls: done ? 'bonsai-task-title bonsai-task-title-done' : 'bonsai-task-title',
		});
		if (showSpeciesName) {
			titleLine.createSpan({ text: species.name, cls: 'bonsai-task-species' });
		}
		const badge = titleLine.createSpan({ text: cat.label, cls: 'bonsai-badge' });
		badge.style.setProperty('--bonsai-cat-color', cat.color);

		if (task.description) {
			body.createEl('p', { text: task.description, cls: 'bonsai-task-desc' });
		}
		const meta = body.createEl('p', { cls: 'bonsai-task-meta' });
		meta.setText(`${seasonLabel(task.startMonth)} · ${fmtWindow({ open, start: row.start, end: row.end })}`);
		if (open) {
			meta.createSpan({ text: ' · open now', cls: 'bonsai-task-open-tag' });
		}
	}
}

export function notifySpeciesLoadError(err: unknown): void {
	console.error('Bonsai Almanac: failed to load species notes', err);
	new Notice('Bonsai almanac: failed to load species notes. See console for details.');
}
