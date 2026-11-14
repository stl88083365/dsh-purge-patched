import { fileURLToPath, pathToFileURL } from "node:url";
import z from "@deepseek-ai/schemastery";
import { readFileSync } from "node:fs";
import { join, resolve } from "node:path";
//#region src/composition.ts
/**
* The LiangShen preset's composition reader: just enough YAML to turn the
* bundled `presets/liangshen/agent.cordis.yml` — and the flat `preset.yml`
* display map beside it — into the declaration the agent-preset registry takes.
*
* Under 0.1.7 a preset is an ordinary registry declaration instead of a
* directory the harness discovers, so this plugin hands `ctx.agentPresets` the
* rows of its OWN composition. No YAML package is resolvable from this package
* and the harness's reader is not importable from here, so the subset is owned
* here; the shipped composition is the only file it must read, and tests fence
* it against that whole file. Supported: block maps and sequences, quoted and
* plain scalars, single-line flow sequences, literal and folded block scalars,
* comments, and `!!js` expressions preserved as data (`{ __jsExpr }`, the shape
* the Loader itself hands a plugin).
*
* Fail-closed: a construct outside the subset — anchors, aliases, tags other
* than `!!js`, nested flow collections, multiple documents, tabs — raises
* {@link CompositionError} rather than being guessed at, so an unreadable
* composition is refused instead of half-declared.
*
* Relative module names (`name: ./minimal-prompt.mjs`) are resolved against
* the preset directory handed to {@link readCompositionRows} and emitted as
* file URLs: the registry mounts a declaration under the DECLARING LOADER's
* base, so a relative name would otherwise be resolved outside this package.
* @module @linxin666/dsh-liangshen/composition
*/
/** A construct outside the supported subset, or malformed YAML. */
var CompositionError = class extends Error {
	constructor(message) {
		super(message);
		this.name = "CompositionError";
	}
};
const BLANK_OR_COMMENT_RE = /^[ \t]*(?:#.*)?$/;
const INTEGER_RE = /^[+-]?\d+$/;
const FLOAT_RE = /^[+-]?(?:\d+\.\d*|\.\d+|\d+)(?:[eE][+-]?\d+)?$/;
/** The indentation width of one line (its leading spaces). */
function indentOf(line) {
	const match = /^ */.exec(line);
	return match === null ? 0 : match[0].length;
}
/**
* The indentation of one structurally significant line. A tab there is
* forbidden by YAML; block-scalar content is verbatim and never measured here.
*/
function significantIndent(line, lineNumber) {
	const leading = /^[ \t]*/.exec(line)?.[0] ?? "";
	if (leading.includes("	")) throw new CompositionError(`line ${String(lineNumber)}: tabs must not be used for indentation`);
	return leading.length;
}
/** Advance past blank and comment-only lines. */
function skipInsignificant(cursor) {
	while (cursor.index < cursor.lines.length && BLANK_OR_COMMENT_RE.test(cursor.lines[cursor.index] ?? "")) cursor.index += 1;
}
/** Whether a line at `indent` opens a block sequence entry. */
function isSequenceEntry(line, indent) {
	if (line[indent] !== "-") return false;
	return line.length === indent + 1 || line[indent + 1] === " ";
}
/** The index of the quote that closes a quoted scalar starting at index 0. */
function closingQuote(text) {
	const quote = text[0];
	for (let index = 1; index < text.length; index += 1) {
		const char = text[index];
		if (quote === "\"" && char === "\\") {
			index += 1;
			continue;
		}
		if (quote === "'" && char === "'" && text[index + 1] === "'") {
			index += 1;
			continue;
		}
		if (char === quote) return index;
	}
	return -1;
}
/** Resolve one quoted scalar, or return the text unchanged when unquoted. */
function unquote(text) {
	const trimmed = text.trim();
	if (trimmed.startsWith("\"")) {
		const end = closingQuote(trimmed);
		if (end !== trimmed.length - 1) throw new CompositionError(`unterminated double-quoted scalar: ${trimmed}`);
		return trimmed.slice(1, end).replace(/\\(u[0-9a-fA-F]{4}|x[0-9a-fA-F]{2}|.)/g, (_, escape) => {
			switch (escape[0]) {
				case "n": return "\n";
				case "t": return "	";
				case "r": return "\r";
				case "0": return "\0";
				case "u":
				case "x": return String.fromCharCode(Number.parseInt(escape.slice(1), 16));
				default: return escape;
			}
		});
	}
	if (trimmed.startsWith("'")) {
		const end = closingQuote(trimmed);
		if (end !== trimmed.length - 1) throw new CompositionError(`unterminated single-quoted scalar: ${trimmed}`);
		return trimmed.slice(1, end).replaceAll("''", "'");
	}
	return trimmed;
}
/** Split one block-map line into its key and the raw text after the colon. */
function matchKeyEntry(text) {
	if (text.startsWith("'") || text.startsWith("\"")) {
		const end = closingQuote(text);
		if (end === -1) return void 0;
		const after = text.slice(end + 1).trimStart();
		if (!after.startsWith(":")) return void 0;
		return {
			key: unquote(text.slice(0, end + 1)),
			rest: after.slice(1).trim()
		};
	}
	for (let index = 0; index < text.length; index += 1) {
		const char = text[index];
		if (char === "#" && index > 0 && text[index - 1] === " ") break;
		if (char === ":" && (index + 1 === text.length || text[index + 1] === " ")) return {
			key: text.slice(0, index),
			rest: text.slice(index + 1).trim()
		};
	}
}
/** Resolve a plain scalar to the value YAML's JSON schema would produce. */
function plainScalar(text) {
	const comment = text.indexOf(" #");
	const value = (comment === -1 ? text : text.slice(0, comment)).trim();
	if (value === "" || value === "~" || value === "null" || value === "Null" || value === "NULL") return null;
	if (value === "true" || value === "True" || value === "TRUE") return true;
	if (value === "false" || value === "False" || value === "FALSE") return false;
	if (INTEGER_RE.test(value)) return Number(value);
	if (FLOAT_RE.test(value)) return Number(value);
	return value;
}
/**
* Read one single-line flow sequence (`['mcp__*']`) into its scalar items.
* Nested flow collections are outside the subset and refused.
*/
function flowSequence(text) {
	const end = text.lastIndexOf("]");
	if (end === -1) throw new CompositionError(`unterminated flow sequence: ${text}`);
	const tail = text.slice(end + 1).trim();
	if (tail !== "" && !tail.startsWith("#")) throw new CompositionError(`unexpected content after a flow sequence: ${tail}`);
	const body = text.slice(1, end);
	if (body.trim() === "") return [];
	const items = [];
	for (const raw of body.split(",")) {
		const item = raw.trim();
		if (item === "") throw new CompositionError(`empty item in a flow sequence: ${text}`);
		if (item.startsWith("[") || item.startsWith("{")) throw new CompositionError(`nested flow collections are not supported: ${item}`);
		items.push(inlineScalar(item));
	}
	return items;
}
/** Resolve the text that follows a colon or a dash on one line. */
function inlineScalar(text) {
	const value = text.trim();
	if (value.startsWith("!!js")) {
		const expression = value.slice(4).trim();
		if (expression === "") throw new CompositionError("!!js requires an expression");
		return { __jsExpr: unquote(expression) };
	}
	if (value.startsWith("'") || value.startsWith("\"")) {
		const end = closingQuote(value);
		if (end === -1) throw new CompositionError(`unterminated quoted scalar: ${value}`);
		const tail = value.slice(end + 1).trim();
		if (tail !== "" && !tail.startsWith("#")) throw new CompositionError(`unexpected content after a quoted scalar: ${tail}`);
		return unquote(value.slice(0, end + 1));
	}
	if (value.startsWith("[")) return flowSequence(value);
	if (value.startsWith("{")) throw new CompositionError(`flow mappings are not supported: ${value}`);
	if (value.startsWith("|") || value.startsWith(">")) throw new CompositionError(`block scalars need their own line: ${value}`);
	if (value.startsWith("!") || value.startsWith("&") || value.startsWith("*")) throw new CompositionError(`unsupported YAML node: ${value}`);
	return plainScalar(value);
}
/**
* Read one literal (`|`) or folded (`>`) block scalar, consuming its lines.
* @param cursor - line cursor positioned on the line that follows the header.
* @param parentIndent - indentation of the node that owns the scalar.
* @param header - the header text (`|-`, `>+2`, ...) possibly with a comment.
* @returns the scalar text after indentation stripping and chomping.
*/
function blockScalar(cursor, parentIndent, header) {
	const style = header[0];
	const indicators = header.slice(1).split("#")[0]?.trim() ?? "";
	let explicitIndent;
	let chomp = "clip";
	for (const char of indicators) if (char === "-") chomp = "strip";
	else if (char === "+") chomp = "keep";
	else if (char >= "1" && char <= "9") explicitIndent = Number(char);
	else throw new CompositionError(`unsupported block scalar header: ${header}`);
	const body = [];
	let blockIndent;
	let trailing = 0;
	while (cursor.index < cursor.lines.length) {
		const line = cursor.lines[cursor.index] ?? "";
		if (line.trim() === "") {
			body.push("");
			trailing += 1;
			cursor.index += 1;
			continue;
		}
		const indent = indentOf(line);
		if (indent <= parentIndent) break;
		if (blockIndent === void 0) blockIndent = explicitIndent === void 0 ? indent : parentIndent + explicitIndent;
		if (indent < blockIndent) break;
		body.push(line.slice(blockIndent));
		trailing = 0;
		cursor.index += 1;
	}
	const lines = body.slice(0, body.length - trailing);
	if (style === ">") {
		let folded = "";
		let blank = 0;
		let started = false;
		for (const line of lines) {
			if (line === "") {
				blank += 1;
				continue;
			}
			if (!started) {
				folded = line;
				started = true;
				blank = 0;
				continue;
			}
			folded += blank === 0 ? " " + line : "\n".repeat(blank) + line;
			blank = 0;
		}
		if (chomp === "strip") return folded;
		if (chomp === "keep") return folded + "\n".repeat(trailing + 1);
		return folded === "" ? "" : folded + "\n";
	}
	const text = lines.join("\n");
	if (chomp === "strip") return text;
	if (chomp === "keep") return text + "\n".repeat(trailing + 1);
	return text === "" ? "" : text + "\n";
}
/** Resolve the value of one entry whose line has already been consumed. */
function parseValue(cursor, parentIndent, rest) {
	if (rest !== "") {
		if (rest.startsWith("|") || rest.startsWith(">")) return blockScalar(cursor, parentIndent, rest);
		return inlineScalar(rest);
	}
	skipInsignificant(cursor);
	const line = cursor.lines[cursor.index];
	if (line === void 0 || indentOf(line) <= parentIndent) return null;
	return parseNode(cursor, parentIndent + 1);
}
/** Parse a block map whose keys sit at exactly `indent`. */
function parseMap(cursor, indent) {
	const map = {};
	while (true) {
		skipInsignificant(cursor);
		const line = cursor.lines[cursor.index];
		if (line === void 0) break;
		const lineIndent = significantIndent(line, cursor.index + 1);
		if (lineIndent < indent) break;
		if (lineIndent > indent) throw new CompositionError(`line ${String(cursor.index + 1)}: unexpected indentation`);
		if (isSequenceEntry(line, indent)) break;
		const entry = matchKeyEntry(line.slice(indent));
		if (entry === void 0) throw new CompositionError(`line ${String(cursor.index + 1)}: expected "key: value", got "${line.trim()}"`);
		if (Object.hasOwn(map, entry.key)) throw new CompositionError(`line ${String(cursor.index + 1)}: duplicate key "${entry.key}"`);
		cursor.index += 1;
		map[entry.key] = parseValue(cursor, indent, entry.rest);
	}
	return map;
}
/** Parse a block sequence whose dashes sit at exactly `indent`. */
function parseSequence(cursor, indent) {
	const items = [];
	while (true) {
		skipInsignificant(cursor);
		const line = cursor.lines[cursor.index];
		if (line === void 0) break;
		if (significantIndent(line, cursor.index + 1) !== indent || !isSequenceEntry(line, indent)) break;
		const rest = line.slice(indent + 1);
		const content = rest.trimStart();
		if (content === "") {
			cursor.index += 1;
			skipInsignificant(cursor);
			const nested = cursor.lines[cursor.index];
			const nestedIndent = nested === void 0 ? -1 : significantIndent(nested, cursor.index + 1);
			items.push(nestedIndent <= indent ? null : parseNode(cursor, indent + 1));
			continue;
		}
		const contentIndent = indent + 1 + (rest.length - content.length);
		if (matchKeyEntry(content) !== void 0) {
			cursor.lines[cursor.index] = " ".repeat(contentIndent) + content;
			items.push(parseMap(cursor, contentIndent));
			continue;
		}
		cursor.index += 1;
		items.push(parseValue(cursor, indent, content));
	}
	return items;
}
/** Parse the block node that starts at the cursor. */
function parseNode(cursor, minIndent) {
	skipInsignificant(cursor);
	const line = cursor.lines[cursor.index];
	if (line === void 0) return null;
	const indent = significantIndent(line, cursor.index + 1);
	if (indent < minIndent) return null;
	return isSequenceEntry(line, indent) ? parseSequence(cursor, indent) : parseMap(cursor, indent);
}
/** Read one cordis YAML document (an entry list, or the flat map of `preset.yml`). */
function readYaml(text) {
	const cursor = {
		lines: (text.startsWith("﻿") ? text.slice(1) : text).split("\n"),
		index: 0
	};
	const value = parseNode(cursor, 0);
	skipInsignificant(cursor);
	const extra = cursor.lines[cursor.index];
	if (extra !== void 0) throw new CompositionError(`line ${String(cursor.index + 1)}: unexpected content "${extra.trim()}"`);
	return value;
}
/** Whether a parsed value is one composition row (a map with a string `name`). */
function asRow(value, at) {
	if (typeof value !== "object" || value === null || Array.isArray(value)) throw new CompositionError(`${at} is not a plugin row (expected a map with a "name")`);
	const row = value;
	if (typeof row.name !== "string" || row.name === "") throw new CompositionError(`${at} names no plugin (a "name" string is required)`);
	return row;
}
/**
* Rewrite the relative module names of one row list, recursively through the
* nested entry lists of group rows, into absolute file URLs.
*/
function absolutizeRows(rows, baseDir, at = "row") {
	return rows.map((row, index) => {
		const label = `${at} ${String(index + 1)}`;
		const checked = asRow(row, label);
		const name = checked.name ?? "";
		const out = { ...checked };
		if (name.startsWith("./") || name.startsWith("../")) out.name = pathToFileURL(resolve(baseDir, name)).href;
		if (checked.group === true) {
			if (!Array.isArray(checked.config)) throw new CompositionError(`group ${label} must hold a list of plugin rows`);
			out.config = absolutizeRows(checked.config, baseDir, `${label} group`);
		}
		return out;
	});
}
/**
* Read the child plugin rows of one `agent.cordis.yml`.
* @param text - the raw composition document.
* @param baseDir - directory a relative row `name` resolves against (the preset's own directory).
* @returns the row list to hand the registry, relative names resolved to file URLs.
* @throws {CompositionError} on malformed YAML or a row the registry would reject.
*/
function readCompositionRows(text, baseDir) {
	const value = readYaml(text);
	if (!Array.isArray(value)) throw new CompositionError("agent.cordis.yml must be a top-level list of plugin rows");
	return absolutizeRows(value, baseDir);
}
/** Read the single-line display scalars of one `preset.yml`. */
function readPresetMetadata(text) {
	const value = readYaml(text);
	if (typeof value !== "object" || value === null || Array.isArray(value)) throw new CompositionError("preset.yml must be a mapping");
	const record = value;
	const metadata = {};
	for (const key of ["name", "description"]) {
		const field = record[key];
		if (field === void 0 || field === null) continue;
		if (typeof field !== "string" || field.includes("\n")) throw new CompositionError(`preset.yml: ${key} must be a single-line string`);
		metadata[key] = field;
	}
	const order = record["order"];
	if (order !== void 0 && order !== null) {
		if (typeof order !== "number" || !Number.isFinite(order)) throw new CompositionError("preset.yml: order must be a number");
		metadata.order = order;
	}
	return metadata;
}
/**
* Build the registry declaration of one preset directory.
* @param id - preset identity the roster keys the declaration by.
* @param dir - absolute preset directory holding `agent.cordis.yml` and `preset.yml`.
* @returns the definition to submit to `ctx.agentPresets.register`.
* @throws {CompositionError} when either file is missing, unreadable, or unparsable.
*/
function readPresetDefinition(id, dir) {
	const read = (name) => {
		try {
			return readFileSync(join(dir, name), "utf8");
		} catch (error) {
			throw new CompositionError(`${name} is unreadable: ${error instanceof Error ? error.message : String(error)}`);
		}
	};
	return {
		id,
		...readPresetMetadata(read("preset.yml")),
		plugins: readCompositionRows(read("agent.cordis.yml"), dir)
	};
}
/**
* The overlay table: settings field to composition row and config key.
*
* `presentation` also selects the executor: the catalog declares the wire and
* the official PTC executor row carries it. Native mode disables that row so
* the assembled native roster remains the only surface.
*/
function overrideTargets(overrides) {
	return [["tool-catalog", { ...overrides.presentation === void 0 ? {} : { presentation: overrides.presentation } }], ["minimal-prompt", { ...overrides.dispatcher === void 0 ? {} : { dispatcher: overrides.dispatcher } }]];
}
/**
* Apply the settings overlay to one parsed row list.
*
* Rows are addressed by their `id`, and only a row the composition actually
* carries is touched: the overlay narrows the shipped configuration, it never
* invents a mount the preset did not have. A field the settings surface left
* unset is written as no key at all rather than as a value, so the row keeps the
* value the composition declares.
* @param rows - the parsed composition rows.
* @param overrides - the operator's settings-surface choices.
* @returns a new row list with the overlay applied.
*/
function applyPresetOverrides(rows, overrides) {
	const table = overrideTargets(overrides);
	return rows.map((row) => {
		const id = row.id;
		if (id === "tool-executor-ptc" && overrides.presentation !== void 0) return {
			...row,
			disabled: overrides.presentation !== "ptc"
		};
		const target = table.find(([targetId]) => targetId === id);
		if (target === void 0) return row;
		const [, patch] = target;
		if (Object.keys(patch).length === 0) return row;
		const config = row.config;
		if (typeof config !== "object" || config === null || Array.isArray(config)) return row;
		return {
			...row,
			config: {
				...config,
				...patch
			}
		};
	});
}
//#endregion
//#region src/core/lever.ts
/**
* LiangShen lever logic — framework-free, no DOM, compiled by both programs.
*
* The lever is a homepage control beside the model selector: pulling it down
* turns the current session's preset into LiangShen mode, pushing it up
* restores the preset the user was on before. The facts it needs are the
* current session's preset, whether that session may still change preset at
* all, and the preset roster; the decisions are pure so they can be tested
* without the browser runtime.
*
* A preset is fixed once a session starts (the host refuses the switch with
* `agent-preset/locked`), so the lever is only meaningful while the session is
* blank — which is exactly the new-session screen it renders on.
*/
/** The preset id this lever turns on; also the preset directory name. */
const LIANGSHEN_PRESET_ID = "liangshen";
//#endregion
//#region src/mount-once.ts
/**
* Host single-instance guard shared by the plugin family. The family bundle
* (dsh-web-all / dsh-skins) namespaces every child row id (web-ui-*), so
* the loader accepts a standalone install of the same package side by side;
* without this guard the second instance would still re-register the same
* webserver routes, tools, settings namespaces, and system-prompt sections
* and fail the boot. mountOnce makes a mount of an already-mounted package a
* no-op for as long as the first instance lives (the browser half is already
* deduped by package name in the client module host).
*
* A no-op is only safe while the holder is ALIVE. The holder can be disposed
* long after the refused mount ran its course: the Host reloads a profile by
* creating the new loader entries before the old ones are torn down (a
* plugin-manager enable/disable/install write, a settings-driven row reload,
* HMR), so the new aggregate shell entry mounts its family plugin while the
* previous entry still owns the name. Dropping that refused mount lost the
* plugin for good - the previous entry then disposed its own mount, releasing
* the name with nobody left to take it, and the family row stayed listed as
* active while its host routes 404ed (the task-board panel showed
* "board.hostError.notMounted", no degraded record appeared, and only a Host
* restart recovered it).
*
* The refused mount is therefore QUEUED, not dropped, and replayed the moment
* the holder releases the name - if the waiting fiber is still alive then. The
* single-instance guarantee is unchanged: exactly one mount is live per
* package name, and the replay re-enters the guard so a later mount still
* dedupes against it.
*
* The registry rides a global symbol so two module instances of the same
* package (npm copy vs repository link) still share one verdict. That symbol
* is a CROSS-REPOSITORY contract, not this file's private state: the four
* satellite packages (dsh-skins / dsh-pet / dsh-presets /
* dsh-community-plugins) are separate repositories carrying their own copy of
* this guard, rebuilt on their own schedule, so the value under `MOUNTED`
* must keep the shape every published copy reads (a `Set` of package names
* with `has`/`add`/`delete`). The wait queues this guard added therefore live
* under their own additive key, and the registry reads back a `Set` even when
* some other build left a different value there. Changing `MOUNTED`'s shape
* in place broke that contract once: a satellite's legacy copy created a
* `Set`, the family's new copy read it as a `Map`, and every family row
* mounted after it failed with "claims.get is not a function".
*
* cordis `ctx.effect` runs its callback immediately and treats the callback's
* return value as the fiber disposer, so the unmarker is returned, not run.
*/
/** Published cross-repository contract: package names currently mounted. */
const MOUNTED = Symbol.for("dsh-web.mounted-plugins");
/** Additive key this guard owns: refused mounts waiting for the name. */
const WAITERS = Symbol.for("dsh-web.mounted-plugins.waiters");
/**
* The shared name registry, always a `Set` whatever another build stored here:
* a foreign value (an interim shape, a hand-written global) must not take every
* family plugin down with it.
* @returns the process-wide set of mounted package names.
*/
function mountedSet() {
	const registry = globalThis;
	const existing = registry[MOUNTED];
	if (existing instanceof Set) return existing;
	const created = /* @__PURE__ */ new Set();
	registry[MOUNTED] = created;
	return created;
}
/** Queue per package name for mounts refused while a holder was alive. */
function mountWaiters() {
	const registry = globalThis;
	return registry[WAITERS] ??= /* @__PURE__ */ new Map();
}
/**
* Wrap a cordis plugin apply so the package runs at most once per process.
* The first mount registers normally and releases the name when its fiber
* disposes; a mount refused while that name is held waits for the release and
* then runs, unless its own fiber disposes first.
* @param packageName - npm package identity shared by every install source.
* @param fn - the original plugin apply.
* @returns an apply of the same shape.
*/
function mountOnce(packageName, fn) {
	const mount = (...args) => {
		const mounted = mountedSet();
		const ctx = args[0];
		if (mounted.has(packageName)) {
			const waiters = mountWaiters();
			const queue = waiters.get(packageName) ?? [];
			let alive = true;
			const pending = { run: () => {
				if (alive) mount(...args);
			} };
			ctx?.effect?.(() => () => {
				alive = false;
				const index = queue.indexOf(pending);
				if (index >= 0) queue.splice(index, 1);
			});
			queue.push(pending);
			waiters.set(packageName, queue);
			return;
		}
		mounted.add(packageName);
		ctx?.effect?.(() => () => {
			mounted.delete(packageName);
			const waiters = mountWaiters();
			const queue = waiters.get(packageName);
			if (queue === void 0) return;
			waiters.delete(packageName);
			for (const waiter of queue.splice(0)) queueMicrotask(() => {
				waiter.run();
			});
		});
		return fn(...args);
	};
	return mount;
}
//#endregion
//#region src/index.ts
/**
* dsh-liangshen — LiangShen (梁神) agent preset plugin.
*
* Host half only: at activation it DECLARES the bundled LiangShen agent preset
* to the harness's agent-preset registry (`ctx.agentPresets`), reading the
* composition rows of `presets/liangshen/agent.cordis.yml` and handing the
* registry a definition whose relative module paths resolve inside the bundled
* preset directory. Declare = enabled: the registry mounts the preset's rows
* eagerly and hands back a disposer this plugin owns, so disabling the plugin
* (or the row unloading) unmounts them, and nothing is written to the harness
* home. The registration is released in `ctx.effect`; the plugin's own Config
* is the settings page the Host generates for this profile entry, and a
* settings write re-declares the preset with the new values instead of
* remounting the row. The capability announcement is a system-prompt section
* that ships OFF by default (`announceToAgent: false`) and can be enabled in
* the web settings surface (plugin config) or the profile patch. No browser
* routes, no agent tools — the preset itself provides the tools.
*
* The preset combines a minimal persona with a lifetime-declared tool
* presentation: the system prompt keeps a minimal persona with standing
* working discipline and workspace instructions, and the wire runs the SDK's
* 'ptc' presentation by default — the wire collapses to the `run_code`
* transport and every other tool is reached from inside the program through
* the generated SDK ('native' keeps the assembled roster alone), declared once
* per session instead of staged across a turn boundary. High-fan-out tool families
* (default `mcp__*`) stay paged out of the executed surface through the
* host's scoped tool restriction until the preset's own `tool_activate` tool
* loads their namespace (LRU cap three), with the activation state replayed
* from the durable session event stream. The tool catalog — listing exactly
* the tools the request carries plus the paged-out namespace summaries — and a
* one-line working-context projection travel as durable user messages,
* republished only on change.
*/
/** Stable cordis plugin name. */
const name = "liangshen";
/**
* Settings namespace of the plugin. Under the 0.1.7 settings contract a
* plugin's own Config IS its settings page and the namespace IS the profile
* entry id, so this is the row id the standalone bundle patch inserts; the
* aggregate install names the generated `web-ui-liangshen` row and the family
* binder resolves between the two.
*/
const LIANGSHEN_SETTINGS_NAMESPACE = "liangshen";
/** Prompt assembly must exist before the announcement section can register. */
const inject = ["systemPrompt"];
/** The wire presentations the preset's tool catalog accepts. */
const PRESENTATION_OPTIONS = ["ptc", "native"];
const Config = z.object({
	enabled: z.boolean().default(true).volatile(),
	announceToAgent: z.boolean().default(false).volatile(),
	presentation: z.union([...PRESENTATION_OPTIONS, z.transform("both", () => "ptc").deprecated().hidden()]).default("ptc").volatile(),
	dispatcher: z.boolean().default(true).volatile()
});
/** Schema defaults, re-read for hand-built test contexts. */
const DEFAULT_CONFIG = {
	enabled: true,
	announceToAgent: false,
	presentation: "ptc",
	dispatcher: true
};
/**
* Read one activation field. The Host validates the raw profile config and
* hands volatile fields over as references, so a read goes through `get()`; a
* plain value passes through, and an absent field falls back to the schema
* default.
*/
function readField(field, fallback) {
	if (field === void 0 || field === null) return fallback;
	const ref = field;
	const value = typeof ref.get === "function" ? ref.get() : field;
	return value === void 0 ? fallback : value;
}
/**
* Read the effective settings of this activation.
* @param config - the config the Host passed to the activation.
* @returns every field resolved against the schema defaults.
*/
function resolveConfig(config) {
	const rawPresentation = readField(config?.presentation, DEFAULT_CONFIG.presentation);
	return {
		enabled: readField(config?.enabled, DEFAULT_CONFIG.enabled),
		announceToAgent: readField(config?.announceToAgent, DEFAULT_CONFIG.announceToAgent),
		presentation: rawPresentation === "both" ? "ptc" : rawPresentation,
		dispatcher: readField(config?.dispatcher, DEFAULT_CONFIG.dispatcher)
	};
}
/** Model-facing announcement: plugin presence, principle, and limits. */
const LIANGSHEN_GUIDANCE = "本机已安装 dsh-liangshen 插件（梁神模式 agent preset）：新建会话的预设选择器中可选「梁神模式」。原理：系统提示词保持极简 persona（minimal-prompt 放行该段与 plan 模式的 plan:policy），persona 内置本模式工作纪律（反思熔断——同一假设推演不超过两轮、缺事实立即闭合思考并调用原生检测工具；行动导向——思考只决定下一步具体操作、不在思考中预演代码实现；并发探索——多处独立检查或搜索在单轮内并发发射多个工具调用；YAGNI/PDCA——单步验证单一假设、不写冗余注释；有界收敛——不无限下钻依赖链、前置检查最多2-3轮后立即收敛并作答或编辑），并在组装时追加工作区目录行 Your working directory is <cwd>.。AGENTS.md 工作区指令默认交还宿主自身的 agent-instructions 行，以 user 角色注入，本插件不追加任何系统提示词段、也不改动 pre-step 的消息批次；可选 instructionSource: system-prompt 才由本插件在组装时读取 AGENTS.md 链并追加 workspace-instructions 段（65536 字节预算，每次组装重读）。wire 呈现由 tool-catalog 按会话一次声明，取值 'ptc'（默认：wire 收拢为唯一的 run_code，其余工具经生成的 SDK 调用）或 'native'（组装出的原生清单，无程序化传输），并可在插件设置界面切换（写入所声明预设的 tool-catalog 行）；未挂载 code runtime 时不做声明，会话运行原生工具面。温和工具分页出厂开启（pagedToolPatterns 默认 ['mcp__*']）：匹配工具在激活前被作用域级工具限制移出可见面（既不在 wire，也不在生成的 SDK 声明中），目录消息列出常驻工具签名与未激活命名空间摘要，调用 tool_activate({ namespace }) 按需激活（LRU 上限 3 个活跃命名空间，驱逐最久未用）；激活状态从持久会话事件流重建，resume/压缩后自然恢复。关键事实登记簿（fact_register）让模型把硬约束/已确认决策/失败路径登记为单行事实，随 working-context 行每步投射进局部注意力窗口。working-context 插件在 pre-step 注入单行 [Working Context: ...] 就近状态投射（plan 模式、活跃命名空间、进行中 todo、登记事实，全部从事件流折叠，读不到则省略，全部为空则不注入）。历史工具结果修剪为 4096 字符阈值（head 2048 / tail 1024）。文件操作受宿主沙箱约束；shell 在每个平台都挂上游标准 Stdio 栈（POSIX 为 bash，Windows 为 pwsh），带简短描述标题卡片与确定性退出码。真实推理探针通过不等于模式集成通过，更不等于统计效果提升。预设由插件在激活时向 agent-preset registry 直接注册（不写任何预设目录），插件停用即注销；默认预设由用户自行选择。用户提到「梁神模式 / 锚定模式 / anchored standard」时即指本插件，请据此协作。";
/** Order of the announcement section within the tool-guidance band. */
const SECTION_ORDER = 150;
/**
* Absolute path of the bundled LiangShen preset directory: the composition,
* the display map, and the preset-local `.mjs` plugins this plugin declares.
* @returns the preset directory as a filesystem path.
*/
function bundledPresetDir() {
	return fileURLToPath(new URL("../presets/liangshen/", import.meta.url));
}
/**
* Build the registry declaration of the bundled preset with the settings
* currently committed applied to the rows they shape.
* @param values - the activation's effective settings.
* @returns the definition to submit to `ctx.agentPresets.register`.
*/
function declaration(values) {
	const definition = readPresetDefinition(LIANGSHEN_PRESET_ID, bundledPresetDir());
	return {
		...definition,
		plugins: applyPresetOverrides(definition.plugins, values)
	};
}
/**
* Mount the plugin: declare the bundled preset, register the announcement
* section when announceToAgent is on (off by default), and re-declare on every
* committed settings write.
* @param ctx - host plugin context carrying systemPrompt.
* @param config - resolved plugin config (schema defaults applied by the loader).
*/
const apply = mountOnce("@linxin666/dsh-liangshen", applyImpl);
function applyImpl(ctx, config) {
	/** The live registry, or undefined on a deployment that composes none. */
	const registryOf = () => {
		try {
			return ctx.get("agentPresets");
		} catch {
			return;
		}
	};
	/** Disposer of the live declaration; the declaring plugin owns it. */
	let release;
	/** Declaration generation: a re-arm supersedes the one it replaced. */
	let generation = 0;
	/** Set once the owning fiber unloads: a late re-arm must not declare again. */
	let closed = false;
	/** Serializes declaration work, so a settings write cannot interleave with an in-flight activation. */
	let queue = Promise.resolve();
	/**
	* True when the last declaration attempt found no registry. It is the ONLY
	* state the late-registry recovery below acts on, so a registry that was
	* already present at activation is never re-declared.
	*/
	let registryMissing = false;
	const warn = (message) => {
		ctx.logger?.warn?.(`dsh-liangshen: ${message}`);
	};
	/** Release the live declaration, waiting for the registry to unmount its rows. */
	const undeclare = async () => {
		const dispose = release;
		release = void 0;
		if (dispose === void 0) return;
		try {
			await dispose();
		} catch (error) {
			warn(`releasing the preset declaration failed: ${error instanceof Error ? error.message : String(error)}`);
		}
	};
	/**
	* Declare the preset with the settings committed right now. Queued behind any
	* in-flight activation and skipped when a newer re-arm superseded it, so a
	* burst of settings writes settles on the last one.
	*/
	const declare = () => {
		const target = ++generation;
		queue = queue.then(async () => {
			if (closed || target !== generation) return;
			await undeclare();
			const values = resolveConfig(config);
			if (!values.enabled) {
				registryMissing = false;
				return;
			}
			const registry = registryOf();
			if (registry === void 0) {
				registryMissing = true;
				warn("the agent-preset registry is unavailable; the preset is not declared");
				return;
			}
			try {
				release = await registry.register(declaration(values));
				registryMissing = false;
				ctx.logger?.info?.(`liangshen: preset ${LIANGSHEN_PRESET_ID} declared`);
			} catch (error) {
				warn(`declaring the preset failed: ${error instanceof Error ? error.message : String(error)}`);
			}
		}).catch((error) => {
			warn(`preset declaration failed: ${error instanceof Error ? error.message : String(error)}`);
		});
	};
	/** The live announcement section, replaced on every re-arm. */
	let disposeSection;
	/**
	* Apply the committed settings: swap the announcement section and re-declare
	* the preset. This is the edge the pre-0.1.7 settings `setSource`/`onChange`
	* hooks ran on, from the settings write that the Loader now commits into this
	* row's volatile references instead of remounting it.
	*/
	const rearm = () => {
		disposeSection?.();
		disposeSection = void 0;
		const values = resolveConfig(config);
		if (values.enabled && values.announceToAgent) disposeSection = ctx.systemPrompt.section({
			name: "plugin:dsh-liangshen",
			order: SECTION_ORDER,
			text: LIANGSHEN_GUIDANCE
		});
		declare();
	};
	ctx.on("loader/volatile-update", () => {
		rearm();
	});
	/**
	* Recover the declaration when the agent-preset registry appears.
	*
	* The registry is deliberately NOT a hard inject: a deployment may compose no
	* preset registry at all, and waiting on it would then pend this row forever
	* -- which under the host's boot gate fails the entire web boot, not just this
	* plugin (issue #1712). But the registry's own publication is decided by its
	* dependency chain (the official registry injects `loader` and
	* `sessionProjections`, and reaches `settings` through `ctx.inject`), so this
	* row's single activation can land BEFORE the service exists. Without this
	* edge the one declaration attempt was simply lost until an unrelated settings
	* write happened to re-arm -- exactly the "toggle any switch and the preset
	* appears, and only then" report (issue #1721).
	*
	* `registryMissing` is the gate rather than a plain `rearm()`: the registry is
	* normally already present at activation, and this callback fires
	* asynchronously even then, so re-arming unconditionally would release and
	* re-declare the preset the activation had just registered (and swap the
	* announcement section for nothing). The callback only repairs the missed
	* case -- the one where the earlier attempt warned and gave up -- and `declare`
	* is idempotent (it undeclares first and carries a generation guard), so a
	* recovery racing an in-flight declaration still settles on one live
	* registration. The fiber's `closed` flag keeps a late arrival from declaring
	* after this row unloads.
	*/
	ctx.inject(["agentPresets"], () => {
		if (registryMissing) rearm();
	});
	ctx.effect(() => {
		rearm();
		return async () => {
			disposeSection?.();
			disposeSection = void 0;
			closed = true;
			generation += 1;
			await queue;
			await undeclare();
		};
	}, "dsh-liangshen: preset declaration and announcement");
}
//#endregion
export { Config, DEFAULT_CONFIG, LIANGSHEN_GUIDANCE, LIANGSHEN_SETTINGS_NAMESPACE, PRESENTATION_OPTIONS, apply, bundledPresetDir, inject, name, resolveConfig };
