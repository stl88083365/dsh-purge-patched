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
import type { PresetDefinition } from '@deepseek-ai/dsh-agent-preset-registry';
/** A construct outside the supported subset, or malformed YAML. */
export declare class CompositionError extends Error {
    constructor(message: string);
}
/** A Loader `!!js` expression preserved as data instead of executed. */
export interface JsExpression {
    __jsExpr: string;
}
/**
 * One parsed composition row. Deliberately loose: the Loader owns each child
 * plugin's own schema, and this reader only has to preserve what the file says.
 */
export interface CompositionRow {
    /** Row id; the settings overlay and the Loader's patch index address a row by it. */
    id?: string;
    /** Module specifier: a bare package name, a `cordis:` builtin, or a relative path. */
    name?: string;
    /** Whether this row's `config` is a nested entry list. */
    group?: boolean;
    /** Boolean or `!!js` expression. */
    disabled?: unknown;
    /** Shared-realm declarations of the group this row opens. */
    isolate?: unknown;
    /** Row configuration, or the nested entry list of a group row. */
    config?: unknown;
}
/**
 * Read the child plugin rows of one `agent.cordis.yml`.
 * @param text - the raw composition document.
 * @param baseDir - directory a relative row `name` resolves against (the preset's own directory).
 * @returns the row list to hand the registry, relative names resolved to file URLs.
 * @throws {CompositionError} on malformed YAML or a row the registry would reject.
 */
export declare function readCompositionRows(text: string, baseDir: string): PresetDefinition['plugins'];
/** The display text `preset.yml` contributes to a declaration. */
export interface PresetMetadata {
    /** Display name the roster shows. */
    name?: string;
    /** One sentence on what the preset is for. */
    description?: string;
    /** Roster ordering rank. */
    order?: number;
}
/** Read the single-line display scalars of one `preset.yml`. */
export declare function readPresetMetadata(text: string): PresetMetadata;
/**
 * Build the registry declaration of one preset directory.
 * @param id - preset identity the roster keys the declaration by.
 * @param dir - absolute preset directory holding `agent.cordis.yml` and `preset.yml`.
 * @returns the definition to submit to `ctx.agentPresets.register`.
 * @throws {CompositionError} when either file is missing, unreadable, or unparsable.
 */
export declare function readPresetDefinition(id: string, dir: string): PresetDefinition;
/**
 * The preset-row settings the plugin exposes in the web settings surface, as the
 * values to apply to the declared composition.
 *
 * The settings surface edits the PLUGIN's own Config, while the values that
 * shape a session live in the declared preset's rows; applying them here is what
 * connects the two. Every field is optional, and an absent OR `undefined` value
 * writes nothing at all — the key stays out of the row.
 */
export interface PresetOverrides {
    /** The `tool-catalog` row's `presentation` value. */
    presentation?: string;
    /** The `minimal-prompt` row's `dispatcher` switch. */
    dispatcher?: boolean;
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
export declare function applyPresetOverrides(rows: PresetDefinition['plugins'], overrides: PresetOverrides): PresetDefinition['plugins'];
