import test from 'node:test';
import assert from 'node:assert/strict';

import { nextPatchVersion, syncReleaseMetadata } from './prepare-release.mjs';

test('nextPatchVersion increments patch only', () => {
	assert.equal(nextPatchVersion('0.1.4'), '0.1.5');
	assert.equal(nextPatchVersion('2.9.99'), '2.9.100');
});

test('syncReleaseMetadata updates package and manifest versions and appends versions map', () => {
	const updated = syncReleaseMetadata({
		packageJson: { version: '0.1.4', name: 'bonsai-almanac' },
		manifest: { version: '0.1.4', minAppVersion: '1.7.2' },
		versions: { '0.1.4': '1.7.2' },
		nextVersion: '0.1.5',
	});

	assert.equal(updated.packageJson.version, '0.1.5');
	assert.equal(updated.manifest.version, '0.1.5');
	assert.equal(updated.versions['0.1.5'], '1.7.2');
});
