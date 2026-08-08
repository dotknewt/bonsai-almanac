import { App, TFile, TFolder } from 'obsidian';
import { parseSpeciesMarkdown } from './speciesMarkdown';
import { Species } from '../types';

/* Loads every species note under `folderPath` and parses it with
   parseSpeciesMarkdown(). Mirrors dotknewt/bonsai's build-time
   `import.meta.glob("../../species/*.md")` loader, but reads from the vault
   at runtime instead of bundling seed data. */
export async function loadSpeciesFromFolder(app: App, folderPath: string): Promise<Species[]> {
	const normalized = normalizeFolderPath(folderPath);
	const folder = normalized
		? app.vault.getAbstractFileByPath(normalized)
		: app.vault.getRoot();
	if (!(folder instanceof TFolder)) return [];

	const files: TFile[] = [];
	collectMarkdownFiles(folder, files);

	const species = await Promise.all(
		files.map(async (file) => {
			const raw = await app.vault.cachedRead(file);
			return parseSpeciesMarkdown(raw, { fallbackName: file.basename, filePath: file.path });
		}),
	);

	return species.sort(
		(a, b) => (a.order ?? Infinity) - (b.order ?? Infinity) || a.name.localeCompare(b.name),
	);
}

function collectMarkdownFiles(folder: TFolder, out: TFile[]): void {
	for (const child of folder.children) {
		if (child instanceof TFile && child.extension === 'md') {
			out.push(child);
		} else if (child instanceof TFolder) {
			collectMarkdownFiles(child, out);
		}
	}
}

function normalizeFolderPath(folderPath: string): string {
	return folderPath.replace(/^\/+|\/+$/g, '');
}
