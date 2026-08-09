import type { App, TAbstractFile, TFile, TFolder } from 'obsidian';

export interface SpeciesTemplateFile {
	fileName: string;
	content: string;
}

export interface SpeciesTemplateWrite {
	path: string;
	content: string;
}

export function normalizeSpeciesFolderPath(folderPath: string): string {
	return folderPath.trim().replace(/^\/+|\/+$/g, '');
}

function toSpeciesTemplatePath(folderPath: string, fileName: string): string {
	return folderPath ? `${folderPath}/${fileName}` : fileName;
}

export function buildSpeciesTemplateWritePlan({
	folderPath,
	templates,
	existingPaths,
	overwrite = false,
}: {
	folderPath: string;
	templates: SpeciesTemplateFile[];
	existingPaths: ReadonlySet<string>;
	overwrite?: boolean;
}): SpeciesTemplateWrite[] {
	const normalized = normalizeSpeciesFolderPath(folderPath);
	return templates
		.map((template) => ({
			path: toSpeciesTemplatePath(normalized, template.fileName),
			content: template.content,
		}))
		.filter((write) => overwrite || !existingPaths.has(write.path));
}

async function ensureFolderExists(app: App, folderPath: string): Promise<void> {
	if (!folderPath) return;
	const parts = folderPath.split('/').filter(Boolean);
	let current = '';
	for (const part of parts) {
		current = current ? `${current}/${part}` : part;
		const existing = app.vault.getAbstractFileByPath(current);
		if (isTFolder(existing)) continue;
		if (isTFile(existing)) {
			throw new Error(`Cannot create species folder. File exists at "${current}".`);
		}
		await app.vault.createFolder(current);
	}
}

export async function importBundledSpeciesTemplates({
	app,
	folderPath,
	templates,
	overwrite = false,
}: {
	app: App;
	folderPath: string;
	templates: SpeciesTemplateFile[];
	overwrite?: boolean;
}): Promise<{ written: number; skipped: number }> {
	const normalizedFolder = normalizeSpeciesFolderPath(folderPath);
	await ensureFolderExists(app, normalizedFolder);

	const existingPaths = new Set<string>();
	for (const template of templates) {
		const path = toSpeciesTemplatePath(normalizedFolder, template.fileName);
		const file = app.vault.getAbstractFileByPath(path);
		if (isTFolder(file)) {
			throw new Error(`Cannot import species template. Folder exists at "${path}".`);
		}
		if (isTFile(file)) existingPaths.add(path);
	}

	const writes = buildSpeciesTemplateWritePlan({
		folderPath: normalizedFolder,
		templates,
		existingPaths,
		overwrite,
	});

	for (const write of writes) {
		const existing = app.vault.getAbstractFileByPath(write.path);
		if (isTFile(existing)) {
			await app.vault.modify(existing, write.content);
		} else {
			await app.vault.create(write.path, write.content);
		}
	}

	return { written: writes.length, skipped: templates.length - writes.length };
}
function isTFile(file: TAbstractFile | null): file is TFile {
	return !!file && typeof (file as { path?: unknown }).path === 'string' && 'extension' in file;
}

function isTFolder(file: TAbstractFile | null): file is TFolder {
	return !!file && Array.isArray((file as { children?: unknown }).children);
}
