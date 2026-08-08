/* Parses a species Markdown note — YAML-ish frontmatter plus one `## Title`
   section per care task — into the plain species object the rest of the
   plugin works with ({ id, name, botanicalName, notes, tasks }). This is the
   format ported from dotknewt/bonsai's `/species/*.md` seed data: one note
   per species, editable by hand directly in Obsidian.

   Example:

   ---
   id: juniper-juniperus-procumbens
   order: 1
   name: Juniper
   botanicalName: Juniperus procumbens
   ---

   Optional free-text notes on sourcing/provenance for the care data below.

   ## Spring health check
   - id: j1
   - category: other
   - start: 04-20
   - end: 05-10

   Junipers wake late, and a dead one can hold normal foliage colour for
   weeks after the roots have died...
*/

import { normalizeTask } from './dates';
import { Species } from '../types';

const FRONTMATTER_RE = /^---\r?\n([\s\S]*?)\r?\n---\r?\n?/;

function stripQuotes(raw: string): string {
	const v = raw.trim();
	if (v.length >= 2 && v.startsWith('"') && v.endsWith('"')) {
		return v.slice(1, -1).replace(/\\"/g, '"').replace(/\\\\/g, '\\');
	}
	return v;
}

function parseFrontmatter(block: string): Record<string, string> {
	const out: Record<string, string> = {};
	for (const line of block.split(/\r?\n/)) {
		if (!line.trim()) continue;
		const i = line.indexOf(':');
		if (i === -1) continue;
		out[line.slice(0, i).trim()] = stripQuotes(line.slice(i + 1));
	}
	return out;
}

/* "MM-DD" -> { month, day }, or null if it doesn't match. */
function parseMonthDay(s?: string): { month: number; day: number } | null {
	const m = /^(\d{1,2})-(\d{1,2})$/.exec((s || '').trim());
	return m ? { month: Number(m[1]), day: Number(m[2]) } : null;
}

interface Section {
	title: string;
	rest: string;
}

/* raw -> one { title, meta-lines, description } chunk per `## Heading`
   section; text before the first heading is returned separately as notes. */
function splitSections(body: string): { notes: string; sections: Section[] } {
	const chunks = body
		.split(/\n(?=##[ \t]+)/)
		.map((s) => s.trim())
		.filter(Boolean);
	const notes: string[] = [];
	const sections: Section[] = [];
	for (const chunk of chunks) {
		const m = /^##[ \t]+(.+)/.exec(chunk);
		if (!m) {
			notes.push(chunk);
			continue;
		}
		sections.push({ title: (m[1] ?? '').trim(), rest: chunk.slice(m[0].length).replace(/^\n/, '') });
	}
	return { notes: notes.join('\n\n').trim(), sections };
}

/* A task section's body is `- key: value` metadata lines followed by a blank
   line, then the free-text description. */
function parseTaskSection({ title, rest }: Section, index: number, speciesId?: string) {
	const lines = rest.split('\n');
	const meta: Record<string, string> = {};
	let i = 0;
	for (; i < lines.length; i++) {
		const line = lines[i] ?? '';
		const m = /^-\s*([A-Za-z]+)\s*:\s*(.*)$/.exec(line);
		if (!m) break;
		const key = (m[1] ?? '').toLowerCase();
		meta[key] = (m[2] ?? '').trim();
	}
	const description = lines.slice(i).join('\n').trim();
	const start = parseMonthDay(meta.start);
	const end = parseMonthDay(meta.end);
	const task = {
		id: meta.id || `${speciesId || 'species'}-t${index + 1}`,
		title,
		startMonth: start?.month ?? 1,
		startDay: start?.day ?? 1,
		category: meta.category || 'other',
		description,
		endMonth: end?.month,
		endDay: end?.day,
	};
	return normalizeTask(task);
}

/* Parse one species Markdown note's raw text into { id, name, botanicalName,
   notes, tasks }. `notes` (free text before the first task heading — usually
   sourcing/provenance context) is carried along for reference but isn't part
   of the plugin's data contract beyond display. */
export function parseSpeciesMarkdown(
	raw: string,
	{ fallbackName, filePath }: { fallbackName?: string; filePath?: string } = {},
): Species {
	const text = raw.replace(/^\uFEFF/, '').replace(/\r\n/g, '\n');
	const fmMatch = FRONTMATTER_RE.exec(text);
	const front = fmMatch ? parseFrontmatter(fmMatch[1] ?? '') : {};
	const body = fmMatch ? text.slice(fmMatch[0].length) : text;
	const { notes, sections } = splitSections(body);

	return {
		id: front.id || fallbackName || '',
		name: front.name || fallbackName || 'Untitled',
		botanicalName: front.botanicalName || '',
		order: front.order ? Number(front.order) : undefined,
		notes,
		tasks: sections.map((s, i) => parseTaskSection(s, i, front.id)),
		filePath: filePath ?? '',
	};
}
