import test from 'node:test';
import assert from 'node:assert/strict';

import { buildSpeciesTemplateWritePlan, normalizeSpeciesFolderPath } from '../src/lib/bundledSpeciesImport.ts';

test('normalizeSpeciesFolderPath trims surrounding slashes', () => {
	assert.equal(normalizeSpeciesFolderPath('/Bonsai/Species/'), 'Bonsai/Species');
	assert.equal(normalizeSpeciesFolderPath(''), '');
});

test('buildSpeciesTemplateWritePlan writes only missing files by default', () => {
	const plan = buildSpeciesTemplateWritePlan({
		folderPath: 'Bonsai/Species',
		templates: [
			{ fileName: 'Juniper.md', content: 'juniper' },
			{ fileName: 'Japanese Maple.md', content: 'maple' },
		],
		existingPaths: new Set(['Bonsai/Species/Juniper.md']),
	});

	assert.deepEqual(plan, [{ path: 'Bonsai/Species/Japanese Maple.md', content: 'maple' }]);
});

test('buildSpeciesTemplateWritePlan supports overwrite mode', () => {
	const plan = buildSpeciesTemplateWritePlan({
		folderPath: 'Bonsai/Species',
		templates: [{ fileName: 'Juniper.md', content: 'new content' }],
		existingPaths: new Set(['Bonsai/Species/Juniper.md']),
		overwrite: true,
	});

	assert.deepEqual(plan, [{ path: 'Bonsai/Species/Juniper.md', content: 'new content' }]);
});
