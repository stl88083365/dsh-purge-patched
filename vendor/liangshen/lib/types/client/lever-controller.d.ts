/**
 * Lever controller: the business face behind the homepage lever.
 *
 * The view stays pure; every fact and verb comes from here. The roster arrives
 * over the agent-preset Remote namespace (the same one the official surfaces
 * read), the main-view session comes from the catalog's ownership marker, and the
 * switch goes through `agentPresets.select`, which the host accepts only while
 * the session is still blank.
 *
 * Nothing is cached across reloads except in memory: the lever reads the
 * session's `agentPreset` projection, so a page reload still shows the true
 * state, while `previous` (the preset a push-up restores) is remembered for
 * the length of the page visit and otherwise falls back to the deployment
 * default.
 */
import type { Context as ClientContext } from '@deepseek-ai/cordis';
import type { AgentPresetRoster } from '@deepseek-ai/dsh-agent-preset-registry/types';
import type { RemoteResult } from '@deepseek-ai/dsh-api-remotes/client';
import { type SnapshotStore } from '@deepseek-ai/dsh-client-store';
import { type LeverState } from '../core/lever.ts';
import type { LiangShenKey } from './locales.ts';
/**
 * Why the last switch was refused, mapped from the Remote failure code so the
 * view can render localized copy instead of a host message.
 */
export type LeverError = 
/** The session already started; its composition is fixed. */
{
    kind: 'locked';
}
/** The deployment supplies no such preset. */
 | {
    kind: 'missing';
}
/**
 * The switch outlived its ceiling. A Remote answer can be lost on the way
 * back even though the host committed the change, so the lever must stop
 * claiming to be busy and let the next session read report the truth.
 */
 | {
    kind: 'timeout';
}
/** Anything else, carrying the host's own reason. */
 | {
    kind: 'failed';
    reason: string;
};
/** How long one preset switch may stay in flight before it is reported as timed out. */
export declare const SELECT_TIMEOUT_MS = 10000;
/**
 * Settings entry ids whose writes can move the roster this lever reads: the
 * agent-preset registry's own entry (its default and selection policy) and this
 * plugin's row under either install shape — the aggregate's generated row id
 * and the standalone row id — because disabling the plugin unregisters the
 * preset it declares.
 */
export declare const ROSTER_SETTINGS_ENTRY_IDS: readonly string[];
/** What the lever view renders. */
export interface LeverSnapshot {
    /** Resolved lever state. */
    state: LeverState;
    /** Display name of the preset a push-up restores; empty when there is none. */
    restoreLabel: string;
    /** A switch is in flight. */
    busy: boolean;
    /** The last refusal, cleared by the next attempt. */
    error?: LeverError;
    /** Increments when a pull-down landed, so the view replays the burst once. */
    burst: number;
}
/**
 * The two agent-preset Remote calls this plugin makes. Spelled locally: the
 * generated namespace merge belongs to the SDK's own client packages, and this
 * browser bundle only needs the two members it calls.
 */
export interface AgentPresetRemote {
    list(): Promise<RemoteResult<AgentPresetRoster>>;
    select(sessionId: string, agentPreset: string): Promise<RemoteResult<string>>;
}
/** The injected face the lever view consumes. */
export interface LeverFace {
    /** The snapshot store the view subscribes to. */
    store: SnapshotStore<LeverSnapshot>;
    /** Pull the lever down: turn LiangShen mode on. */
    pull: () => void;
    /** Push the lever up: restore the previous preset. */
    push: () => void;
    /** Translate one lever key. */
    t: (key: LiangShenKey, vars?: Record<string, string | number>) => string;
}
/** The lever controller: roster read, session facts, and the preset switch. */
export declare class LeverController {
    private readonly ctx;
    private readonly store;
    /**
     * The browser services this controller reads, resolved defensively: the
     * context proxy throws on any service the fiber did not inject, so a
     * deployment that cannot answer one of them must leave the lever inert
     * rather than take the plugin (and the composer row) down with it.
     */
    private readonly sessions;
    private readonly remote;
    /** Roster rows as last read; empty until the first read lands. */
    private rows;
    /** The preset the user was on before the last pull-down. */
    private previous;
    private loading;
    /** Ceiling on one in-flight switch, so a lost Remote answer cannot hang the row. */
    private readonly selectTimeoutMs;
    private readonly disposers;
    constructor(ctx: ClientContext, options?: LeverControllerOptions);
    /** The snapshot store the view subscribes to. */
    snapshot(): SnapshotStore<LeverSnapshot>;
    /** Follow the roster and the current session, then read the roster once. */
    start(): void;
    /** Release every subscription. Idempotent. */
    dispose(): void;
    /** The inject face handed to the slot entry. */
    face(): LeverFace;
    /** Read the roster; a refusal leaves the lever as it was. */
    load(): Promise<void>;
    /**
     * Recompute the snapshot from the current session and the last roster read.
     * Only the derived fields are written: an in-flight switch, the last refusal,
     * and the burst counter belong to the gesture, not to a session refresh.
     */
    refresh(): void;
    /** The verb behind one gesture direction. */
    private toggle;
    /**
     * Try to detect the active preset from the DOM hero chip or storage
     * when session.projectionValues.agentPreset is absent.
     */
    private detectPreset;
    private rememberPrevious;
    /** The facts one decision reads, from the live session and the roster. */
    private facts;
    private currentSessionId;
    private currentSession;
    /** Display name of one preset id, falling back to the id itself. */
    private labelOf;
}
/** The face constructor options; tests narrow the switch ceiling. */
export interface LeverControllerOptions {
    /** Override {@link SELECT_TIMEOUT_MS}. */
    selectTimeoutMs?: number;
}
