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
export declare const LIANGSHEN_PRESET_ID = "liangshen";
/** What the lever currently reports. */
export type LeverState = 
/** LiangShen mode is the current preset. */
'on'
/** Another preset is current and the session may still switch. */
 | 'off'
/** The session has started; the preset can no longer change. */
 | 'locked'
/** The deployment does not supply the LiangShen preset. */
 | 'missing';
/** The facts one lever decision reads. */
export interface LeverFacts {
    /** Whether the current session may still change preset (blank). */
    blank: boolean;
    /** The preset the current session runs, when the session reports one. */
    agentPreset?: string;
    /** Ids every usable roster row supplies, in roster order. */
    available: readonly string[];
    /** The deployment default preset id, when the roster names one. */
    fallback?: string;
    /** The preset the user ran before the last pull-down, remembered by the client. */
    previous?: string;
}
/** Resolve what the lever shows for one set of facts. */
export declare function leverState(facts: LeverFacts): LeverState;
/**
 * The preset a push-up restores: the preset the user was on before pulling the
 * lever, else the deployment default, else the first usable roster row that is
 * not the LiangShen preset. A candidate is skipped when it is the LiangShen
 * preset itself (restoring it would be a no-op) or when the roster no longer
 * supplies it. That last resort is what keeps the push direction alive when the
 * deployment default IS LiangShen mode: `fallback` is skipped then, and after a
 * reload `previous` is gone, so without it the gesture would have no target.
 */
export declare function restoreTarget(facts: LeverFacts): string | undefined;
/** Whether the lever can act at all in its current state. */
export declare function isActionable(state: LeverState): boolean;
