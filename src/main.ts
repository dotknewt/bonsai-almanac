import { Plugin, WorkspaceLeaf } from 'obsidian';
import { BonsaiAlmanacSettings, DEFAULT_SETTINGS, BonsaiAlmanacSettingTab } from './settings';
import { ALMANAC_VIEW_TYPE, AlmanacView, notifySpeciesLoadError } from './view/AlmanacView';
import { loadSpeciesFromFolder } from './lib/speciesLoader';
import { pruneCompletionsToYear } from './lib/storage';
import { Species } from './types';

export default class BonsaiAlmanacPlugin extends Plugin {
	settings!: BonsaiAlmanacSettings;
	private speciesCache: Species[] | null = null;

	async onload() {
		await this.loadSettings();

		this.registerView(ALMANAC_VIEW_TYPE, (leaf) => new AlmanacView(leaf, this));

		this.addRibbonIcon('sprout', 'Open bonsai almanac', () => {
			void this.activateView();
		});

		this.addCommand({
			id: 'open-almanac',
			name: 'Open almanac',
			callback: () => {
				void this.activateView();
			},
		});

		// Invalidate the species cache when notes change under the vault so
		// the almanac reflects edits without needing a manual reload.
		this.registerEvent(
			this.app.vault.on('modify', (file) => this.onVaultChange(file.path)),
		);
		this.registerEvent(this.app.vault.on('create', (file) => this.onVaultChange(file.path)));
		this.registerEvent(this.app.vault.on('delete', (file) => this.onVaultChange(file.path)));
		this.registerEvent(this.app.vault.on('rename', (file) => this.onVaultChange(file.path)));

		this.addSettingTab(new BonsaiAlmanacSettingTab(this.app, this));
	}

	onunload() {}

	async loadSettings() {
		this.settings = Object.assign(
			{},
			DEFAULT_SETTINGS,
			(await this.loadData()) as Partial<BonsaiAlmanacSettings>,
		);
		// Drop completion entries from years other than the current one so
		// the stored data doesn't grow forever.
		this.settings.completions = pruneCompletionsToYear(
			this.settings.completions,
			new Date().getFullYear(),
		);
	}

	async saveSettings() {
		this.settings.completions = pruneCompletionsToYear(
			this.settings.completions,
			new Date().getFullYear(),
		);
		await this.saveData(this.settings);
	}

	async getSpecies(): Promise<Species[]> {
		if (this.speciesCache) return this.speciesCache;
		try {
			this.speciesCache = await loadSpeciesFromFolder(this.app, this.settings.speciesFolder);
		} catch (err) {
			notifySpeciesLoadError(err);
			this.speciesCache = [];
		}
		return this.speciesCache;
	}

	async refreshAlmanacViews(): Promise<void> {
		this.speciesCache = null;
		for (const leaf of this.app.workspace.getLeavesOfType(ALMANAC_VIEW_TYPE)) {
			if (leaf.view instanceof AlmanacView) {
				await leaf.view.refresh();
			}
		}
	}

	private onVaultChange(path: string): void {
		const folder = this.settings.speciesFolder.replace(/^\/+|\/+$/g, '');
		if (!folder || path.startsWith(`${folder}/`) || path === folder) {
			void this.refreshAlmanacViews();
		}
	}

	private async activateView(): Promise<void> {
		const { workspace } = this.app;
		let leaf: WorkspaceLeaf | null = null;
		const existing = workspace.getLeavesOfType(ALMANAC_VIEW_TYPE);
		if (existing.length > 0) {
			leaf = existing[0] ?? null;
		} else {
			leaf = workspace.getLeaf('tab');
			await leaf.setViewState({ type: ALMANAC_VIEW_TYPE, active: true });
		}
		if (leaf) await workspace.revealLeaf(leaf);
	}
}
