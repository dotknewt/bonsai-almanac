import { readFileSync, writeFileSync } from 'node:fs';

export function nextPatchVersion(version) {
	const match = /^(\d+)\.(\d+)\.(\d+)$/.exec(String(version));
	if (!match) throw new Error(`Invalid semantic version: ${version}`);
	return `${match[1]}.${match[2]}.${Number(match[3]) + 1}`;
}

export function syncReleaseMetadata({ packageJson, manifest, versions, nextVersion }) {
	return {
		packageJson: {
			...packageJson,
			version: nextVersion,
		},
		manifest: {
			...manifest,
			version: nextVersion,
		},
		versions: {
			...versions,
			[nextVersion]: manifest.minAppVersion,
		},
	};
}

function readJson(path) {
	return JSON.parse(readFileSync(path, 'utf8'));
}

function writeJson(path, value) {
	writeFileSync(path, `${JSON.stringify(value, null, '\t')}\n`);
}

if (import.meta.url === `file://${process.argv[1]}`) {
	const packageJson = readJson('package.json');
	const manifest = readJson('manifest.json');
	const versions = readJson('versions.json');

	const nextVersion = nextPatchVersion(packageJson.version);
	const updated = syncReleaseMetadata({
		packageJson,
		manifest,
		versions,
		nextVersion,
	});

	writeJson('package.json', updated.packageJson);
	writeJson('manifest.json', updated.manifest);
	writeJson('versions.json', updated.versions);

	process.stdout.write(`${nextVersion}\n`);
}
