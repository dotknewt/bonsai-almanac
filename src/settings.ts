import { App, PluginSettingTab, Setting } from 'obsidian';
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

	display(): void {
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
