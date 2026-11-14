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
import type { Context, Volatile } from '@deepseek-ai/cordis';
import type { SettingsNamespace } from '@deepseek-ai/dsh-settings';
import z from '@deepseek-ai/schemastery';
/** Stable cordis plugin name. */
export declare const name = "liangshen";
/**
 * Settings namespace of the plugin. Under the 0.1.7 settings contract a
 * plugin's own Config IS its settings page and the namespace IS the profile
 * entry id, so this is the row id the standalone bundle patch inserts; the
 * aggregate install names the generated `web-ui-liangshen` row and the family
 * binder resolves between the two.
 */
export declare const LIANGSHEN_SETTINGS_NAMESPACE: SettingsNamespace;
/** Prompt assembly must exist before the announcement section can register. */
export declare const inject: string[];
/** The wire presentations the preset's tool catalog accepts. */
export declare const PRESENTATION_OPTIONS: readonly ["ptc", "native"];
/** One wire presentation. */
export type Presentation = (typeof PRESENTATION_OPTIONS)[number];
/**
 * One activation field as the Host hands it over: a stable reference whose
 * `get()` reads the value committed for this instance (a settings write updates
 * it in place, without remounting the row), or the plain value a profile patch
 * or a hand-built test context passes.
 */
export type ConfigField<T> = Volatile<T> | T | undefined;
/**
 * Plugin config, validated by the same-named schemastery schema.
 *
 * Every field is `volatile()`: the Host serves exactly the volatile fields of a
 * Config as this entry's settings form and refuses writes anywhere else, and a
 * volatile write is committed into the references this activation holds instead
 * of remounting the row.
 */
export interface Config {
    /** Master switch: when false, neither the preset declaration nor the announcement runs. */
    enabled?: ConfigField<boolean>;
    /** When true, a system-prompt section announces the plugin (default false — keep prompts clean unless the user opts in). */
    announceToAgent?: ConfigField<boolean>;
    /**
     * Wire presentation written into the declared preset's tool-catalog row.
     * `ptc` (default) collapses the wire to the single `run_code` transport and
     * reaches every other tool through the generated SDK; `native` keeps the
     * assembled roster alone. Legacy `'both'` (the pre-0.2.1 shipped default) is
     * accepted from older saved profiles and normalized to `'ptc'`.
     */
    presentation?: ConfigField<Presentation | 'both'>;
    /**
     * When true, the preset appends the dispatcher rule block to its persona:
     * the session becomes a dispatch agent whose deliverable is the plan, the
     * task book, the review verdict, and the hand-off, on top of the mode's own
     * working discipline. Orthogonal to `presentation` — the tool wire is the
     * same either way. Default true: the shipped preset runs as a dispatcher,
     * and the switch is what returns a session to the bare persona.
     */
    dispatcher?: ConfigField<boolean>;
}
export declare const Config: z<Schemastery.ObjectS<NoInfer<{
    enabled: z<boolean, boolean, "volatile-defined">;
    announceToAgent: z<boolean, boolean, "volatile-defined">;
    presentation: z<string, "ptc" | "native", "volatile-defined">;
    dispatcher: z<boolean, boolean, "volatile-defined">;
}>>, Schemastery.ObjectT<NoInfer<{
    enabled: z<boolean, boolean, "volatile-defined">;
    announceToAgent: z<boolean, boolean, "volatile-defined">;
    presentation: z<string, "ptc" | "native", "volatile-defined">;
    dispatcher: z<boolean, boolean, "volatile-defined">;
}>>, "plain">;
/** The settings the runtime acts on, every field read at its use site. */
export interface ResolvedConfig {
    /** Whether the preset is declared at all. */
    enabled: boolean;
    /** Whether the announcement section registers. */
    announceToAgent: boolean;
    /** Wire presentation the declared preset's tool-catalog row carries. */
    presentation: Presentation;
    /** Whether the declared preset's minimal-prompt row appends the dispatcher rule block. */
    dispatcher: boolean;
}
/** Schema defaults, re-read for hand-built test contexts. */
export declare const DEFAULT_CONFIG: ResolvedConfig;
/**
 * Read the effective settings of this activation.
 * @param config - the config the Host passed to the activation.
 * @returns every field resolved against the schema defaults.
 */
export declare function resolveConfig(config?: Config): ResolvedConfig;
/** Model-facing announcement: plugin presence, principle, and limits. */
export declare const LIANGSHEN_GUIDANCE = "\u672C\u673A\u5DF2\u5B89\u88C5 dsh-liangshen \u63D2\u4EF6\uFF08\u6881\u795E\u6A21\u5F0F agent preset\uFF09\uFF1A\u65B0\u5EFA\u4F1A\u8BDD\u7684\u9884\u8BBE\u9009\u62E9\u5668\u4E2D\u53EF\u9009\u300C\u6881\u795E\u6A21\u5F0F\u300D\u3002\u539F\u7406\uFF1A\u7CFB\u7EDF\u63D0\u793A\u8BCD\u4FDD\u6301\u6781\u7B80 persona\uFF08minimal-prompt \u653E\u884C\u8BE5\u6BB5\u4E0E plan \u6A21\u5F0F\u7684 plan:policy\uFF09\uFF0Cpersona \u5185\u7F6E\u672C\u6A21\u5F0F\u5DE5\u4F5C\u7EAA\u5F8B\uFF08\u53CD\u601D\u7194\u65AD\u2014\u2014\u540C\u4E00\u5047\u8BBE\u63A8\u6F14\u4E0D\u8D85\u8FC7\u4E24\u8F6E\u3001\u7F3A\u4E8B\u5B9E\u7ACB\u5373\u95ED\u5408\u601D\u8003\u5E76\u8C03\u7528\u539F\u751F\u68C0\u6D4B\u5DE5\u5177\uFF1B\u884C\u52A8\u5BFC\u5411\u2014\u2014\u601D\u8003\u53EA\u51B3\u5B9A\u4E0B\u4E00\u6B65\u5177\u4F53\u64CD\u4F5C\u3001\u4E0D\u5728\u601D\u8003\u4E2D\u9884\u6F14\u4EE3\u7801\u5B9E\u73B0\uFF1B\u5E76\u53D1\u63A2\u7D22\u2014\u2014\u591A\u5904\u72EC\u7ACB\u68C0\u67E5\u6216\u641C\u7D22\u5728\u5355\u8F6E\u5185\u5E76\u53D1\u53D1\u5C04\u591A\u4E2A\u5DE5\u5177\u8C03\u7528\uFF1BYAGNI/PDCA\u2014\u2014\u5355\u6B65\u9A8C\u8BC1\u5355\u4E00\u5047\u8BBE\u3001\u4E0D\u5199\u5197\u4F59\u6CE8\u91CA\uFF1B\u6709\u754C\u6536\u655B\u2014\u2014\u4E0D\u65E0\u9650\u4E0B\u94BB\u4F9D\u8D56\u94FE\u3001\u524D\u7F6E\u68C0\u67E5\u6700\u591A2-3\u8F6E\u540E\u7ACB\u5373\u6536\u655B\u5E76\u4F5C\u7B54\u6216\u7F16\u8F91\uFF09\uFF0C\u5E76\u5728\u7EC4\u88C5\u65F6\u8FFD\u52A0\u5DE5\u4F5C\u533A\u76EE\u5F55\u884C Your working directory is <cwd>.\u3002AGENTS.md \u5DE5\u4F5C\u533A\u6307\u4EE4\u9ED8\u8BA4\u4EA4\u8FD8\u5BBF\u4E3B\u81EA\u8EAB\u7684 agent-instructions \u884C\uFF0C\u4EE5 user \u89D2\u8272\u6CE8\u5165\uFF0C\u672C\u63D2\u4EF6\u4E0D\u8FFD\u52A0\u4EFB\u4F55\u7CFB\u7EDF\u63D0\u793A\u8BCD\u6BB5\u3001\u4E5F\u4E0D\u6539\u52A8 pre-step \u7684\u6D88\u606F\u6279\u6B21\uFF1B\u53EF\u9009 instructionSource: system-prompt \u624D\u7531\u672C\u63D2\u4EF6\u5728\u7EC4\u88C5\u65F6\u8BFB\u53D6 AGENTS.md \u94FE\u5E76\u8FFD\u52A0 workspace-instructions \u6BB5\uFF0865536 \u5B57\u8282\u9884\u7B97\uFF0C\u6BCF\u6B21\u7EC4\u88C5\u91CD\u8BFB\uFF09\u3002wire \u5448\u73B0\u7531 tool-catalog \u6309\u4F1A\u8BDD\u4E00\u6B21\u58F0\u660E\uFF0C\u53D6\u503C 'ptc'\uFF08\u9ED8\u8BA4\uFF1Awire \u6536\u62E2\u4E3A\u552F\u4E00\u7684 run_code\uFF0C\u5176\u4F59\u5DE5\u5177\u7ECF\u751F\u6210\u7684 SDK \u8C03\u7528\uFF09\u6216 'native'\uFF08\u7EC4\u88C5\u51FA\u7684\u539F\u751F\u6E05\u5355\uFF0C\u65E0\u7A0B\u5E8F\u5316\u4F20\u8F93\uFF09\uFF0C\u5E76\u53EF\u5728\u63D2\u4EF6\u8BBE\u7F6E\u754C\u9762\u5207\u6362\uFF08\u5199\u5165\u6240\u58F0\u660E\u9884\u8BBE\u7684 tool-catalog \u884C\uFF09\uFF1B\u672A\u6302\u8F7D code runtime \u65F6\u4E0D\u505A\u58F0\u660E\uFF0C\u4F1A\u8BDD\u8FD0\u884C\u539F\u751F\u5DE5\u5177\u9762\u3002\u6E29\u548C\u5DE5\u5177\u5206\u9875\u51FA\u5382\u5F00\u542F\uFF08pagedToolPatterns \u9ED8\u8BA4 ['mcp__*']\uFF09\uFF1A\u5339\u914D\u5DE5\u5177\u5728\u6FC0\u6D3B\u524D\u88AB\u4F5C\u7528\u57DF\u7EA7\u5DE5\u5177\u9650\u5236\u79FB\u51FA\u53EF\u89C1\u9762\uFF08\u65E2\u4E0D\u5728 wire\uFF0C\u4E5F\u4E0D\u5728\u751F\u6210\u7684 SDK \u58F0\u660E\u4E2D\uFF09\uFF0C\u76EE\u5F55\u6D88\u606F\u5217\u51FA\u5E38\u9A7B\u5DE5\u5177\u7B7E\u540D\u4E0E\u672A\u6FC0\u6D3B\u547D\u540D\u7A7A\u95F4\u6458\u8981\uFF0C\u8C03\u7528 tool_activate({ namespace }) \u6309\u9700\u6FC0\u6D3B\uFF08LRU \u4E0A\u9650 3 \u4E2A\u6D3B\u8DC3\u547D\u540D\u7A7A\u95F4\uFF0C\u9A71\u9010\u6700\u4E45\u672A\u7528\uFF09\uFF1B\u6FC0\u6D3B\u72B6\u6001\u4ECE\u6301\u4E45\u4F1A\u8BDD\u4E8B\u4EF6\u6D41\u91CD\u5EFA\uFF0Cresume/\u538B\u7F29\u540E\u81EA\u7136\u6062\u590D\u3002\u5173\u952E\u4E8B\u5B9E\u767B\u8BB0\u7C3F\uFF08fact_register\uFF09\u8BA9\u6A21\u578B\u628A\u786C\u7EA6\u675F/\u5DF2\u786E\u8BA4\u51B3\u7B56/\u5931\u8D25\u8DEF\u5F84\u767B\u8BB0\u4E3A\u5355\u884C\u4E8B\u5B9E\uFF0C\u968F working-context \u884C\u6BCF\u6B65\u6295\u5C04\u8FDB\u5C40\u90E8\u6CE8\u610F\u529B\u7A97\u53E3\u3002working-context \u63D2\u4EF6\u5728 pre-step \u6CE8\u5165\u5355\u884C [Working Context: ...] \u5C31\u8FD1\u72B6\u6001\u6295\u5C04\uFF08plan \u6A21\u5F0F\u3001\u6D3B\u8DC3\u547D\u540D\u7A7A\u95F4\u3001\u8FDB\u884C\u4E2D todo\u3001\u767B\u8BB0\u4E8B\u5B9E\uFF0C\u5168\u90E8\u4ECE\u4E8B\u4EF6\u6D41\u6298\u53E0\uFF0C\u8BFB\u4E0D\u5230\u5219\u7701\u7565\uFF0C\u5168\u90E8\u4E3A\u7A7A\u5219\u4E0D\u6CE8\u5165\uFF09\u3002\u5386\u53F2\u5DE5\u5177\u7ED3\u679C\u4FEE\u526A\u4E3A 4096 \u5B57\u7B26\u9608\u503C\uFF08head 2048 / tail 1024\uFF09\u3002\u6587\u4EF6\u64CD\u4F5C\u53D7\u5BBF\u4E3B\u6C99\u7BB1\u7EA6\u675F\uFF1Bshell \u5728\u6BCF\u4E2A\u5E73\u53F0\u90FD\u6302\u4E0A\u6E38\u6807\u51C6 Stdio \u6808\uFF08POSIX \u4E3A bash\uFF0CWindows \u4E3A pwsh\uFF09\uFF0C\u5E26\u7B80\u77ED\u63CF\u8FF0\u6807\u9898\u5361\u7247\u4E0E\u786E\u5B9A\u6027\u9000\u51FA\u7801\u3002\u771F\u5B9E\u63A8\u7406\u63A2\u9488\u901A\u8FC7\u4E0D\u7B49\u4E8E\u6A21\u5F0F\u96C6\u6210\u901A\u8FC7\uFF0C\u66F4\u4E0D\u7B49\u4E8E\u7EDF\u8BA1\u6548\u679C\u63D0\u5347\u3002\u9884\u8BBE\u7531\u63D2\u4EF6\u5728\u6FC0\u6D3B\u65F6\u5411 agent-preset registry \u76F4\u63A5\u6CE8\u518C\uFF08\u4E0D\u5199\u4EFB\u4F55\u9884\u8BBE\u76EE\u5F55\uFF09\uFF0C\u63D2\u4EF6\u505C\u7528\u5373\u6CE8\u9500\uFF1B\u9ED8\u8BA4\u9884\u8BBE\u7531\u7528\u6237\u81EA\u884C\u9009\u62E9\u3002\u7528\u6237\u63D0\u5230\u300C\u6881\u795E\u6A21\u5F0F / \u951A\u5B9A\u6A21\u5F0F / anchored standard\u300D\u65F6\u5373\u6307\u672C\u63D2\u4EF6\uFF0C\u8BF7\u636E\u6B64\u534F\u4F5C\u3002";
/**
 * Absolute path of the bundled LiangShen preset directory: the composition,
 * the display map, and the preset-local `.mjs` plugins this plugin declares.
 * @returns the preset directory as a filesystem path.
 */
export declare function bundledPresetDir(): string;
/**
 * Mount the plugin: declare the bundled preset, register the announcement
 * section when announceToAgent is on (off by default), and re-declare on every
 * committed settings write.
 * @param ctx - host plugin context carrying systemPrompt.
 * @param config - resolved plugin config (schema defaults applied by the loader).
 */
export declare const apply: typeof applyImpl;
declare function applyImpl(ctx: Context, config?: Config): void;
declare module '@deepseek-ai/cordis' {
    interface Events {
        /**
         * Volatile config values were committed into the running fiber without a
         * remount; dispatched to the owning fiber only. Spelled here because the
         * Loader package is not a dependency of this plugin, with the Loader's own
         * shape so the two declarations merge when a Host program carries both.
         * @param paths - changed config paths as key arrays; every value is committed before dispatch.
         * @mode emit
         */
        'loader/volatile-update'(paths: readonly (readonly string[])[]): void;
    }
}
export {};
