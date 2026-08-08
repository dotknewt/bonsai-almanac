import { App, PluginSettingTab, Setting, type SettingDefinitionItem } from 'obsidian';
import type BonsaiAlmanacPlugin from './main';

export interface BonsaiAlmanacSettings {
	/** Vault-relative folder containing species Markdown notes. */
	speciesFolder: string;
	/** Completion check-offs, keyed by `speciesId:taskId:year`. */
	completions: Record<string, boolean>;
}

export const DEFAULT_SETTINGS: BonsaiAlmanacSettings = {
	speciesFolder: 'Bonsai/Species',
	completions: {},
};

export class BonsaiAlmanacSettingTab extends PluginSettingTab {
	plugin: BonsaiAlmanacPlugin;

	constructor(app: App, plugin: BonsaiAlmanacPlugin) {
		super(app, plugin);
		this.plugin = plugin;
	}

	// Obsidian 1.13+ uses these definitions for settings rendering and search.
	override getSettingDefinitions(): SettingDefinitionItem[] {
		return [
			{
				name: 'Species folder',
				desc: 'Vault folder containing your species notes (Markdown with frontmatter and ## task sections).',
				control: {
					type: 'text' as const,
					key: 'speciesFolder',
					defaultValue: DEFAULT_SETTINGS.speciesFolder,
				},
			},
		];
	}

	// Keep declarative setting updates aligned with the legacy settings behavior.
	override async setControlValue(key: string, value: unknown): Promise<void> {
		if (key !== 'speciesFolder' || typeof value !== 'string') return;

		this.plugin.settings.speciesFolder = value.trim();
		await this.plugin.saveSettings();
		await this.plugin.refreshAlmanacViews();
	}

	override display(): void {
		const { containerEl } = this;
		containerEl.empty();

		new Setting(containerEl)
			.setName('Species folder')
			.setDesc(
				'Vault folder containing your species notes (Markdown with frontmatter and ## task sections).',
			)
			.addText((text) =>
				text
					.setPlaceholder('Bonsai/species')
					.setValue(this.plugin.settings.speciesFolder)
					.onChange(async (value) => {
						this.plugin.settings.speciesFolder = value.trim();
						await this.plugin.saveSettings();
						await this.plugin.refreshAlmanacViews();
					}),
			);
	}
}
