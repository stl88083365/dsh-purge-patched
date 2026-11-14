/**
 * dsh-liangshen browser half: the LiangShen lever in the composer tool row.
 *
 * The slot is `conversation.input.right` — "compact controls before the
 * composer submit action", which renders immediately left of the model
 * selector (`conversation.input.model`) inside the same composer card, on the
 * homepage's new-session hero as well as in a session. The lever lives only
 * while the session is still blank, because that is the only window in which a
 * preset can change at all: `agentPresets.select` refuses an already-started
 * session, and the arm would have nothing to do in one.
 *
 * This half talks to the host over the agent-preset Remote namespace rather
 * than through the official preset package's browser module: cross-plugin
 * collaboration here goes through cordis services and Remote surfaces, not
 * value imports.
 *
 * Failure policy: a missing slot or a refused Remote call is handled, never
 * thrown — one external plugin must not take the GUI boot down.
 */
import type { Context as ClientContext } from '@deepseek-ai/cordis';
import type { ConfigForm, ConfigForms } from '@deepseek-ai/dsh-client-ui-settings/client';
import { type LiangShenSettings } from './LiangShenSettingsCard.tsx';
import { type LiangShenKey } from './locales.ts';
/** Locale namespace this half owns. */
export declare const NS = "liangshen";
/**
 * Settings namespace the settings card edits: the family identity of this
 * plugin's own settings form, and the row id a standalone bundle install
 * carries. The aggregate install mounts the generated `web-ui-liangshen` row
 * instead, and the family binder resolves between the two.
 */
export declare const SETTINGS_NAMESPACE = "liangshen";
/**
 * The profile entry id this package's own row carries, for a page that serves
 * no family binder.
 *
 * The shared describe mirror is the only local evidence of which row id this
 * profile actually serves, but it answers asynchronously: at plugin activation
 * it usually holds nothing yet. An unanswered or empty mirror is therefore NOT
 * evidence of absence, and binding the bare namespace there is what made every
 * save fail with `No configurable plugin entry "liangshen"` — the form is
 * bound once per session, so a wrong guess never recovers. The aggregate row id
 * is the answer that matches nearly every deployment; only a mirror that
 * answers with OTHER plugins' rows keeps the namespace as the last resort (the
 * pre-0.1.7 keying shape), because that answer is the one that actually proves
 * this package's own row is not served.
 * @param forms - the shared configuration forms service.
 * @returns the entry id to bind.
 */
export declare function servedEntryId(forms: ConfigForms): string;
/**
 * Bind the settings form the card stages over.
 *
 * The family binder comes first: it is what resolves this package's family
 * namespace onto the profile entry id the Host serves the form under, and it
 * keeps the loopback bridge as its own fallback. A page without that group (or
 * one where its client half has not applied yet) binds through the shared forms
 * service, on the entry id the describe mirror justifies and rebound as soon as
 * the mirror answers — see {@link createServedEntryForm} for why a one-shot
 * guess cannot be right for both an aggregate and a standalone install.
 * @param ctx - the browser plugin context.
 * @returns the form the settings card reads and writes.
 */
export declare function bindSettingsForm(ctx: ClientContext): ConfigForm<LiangShenSettings>;
/** Owner share of a plugin card (the section supplies nothing). */
export interface SettingsPluginItemOwnerProps {
    /** Marker field: card owner props are intentionally empty. */
    children?: never;
}
declare module '@deepseek-ai/dsh-client-ui-slots' {
    interface SlotMap {
        /**
         * The child slot the Web UI plugin group declares; this card registers into
         * the group's list seat rather than the official bundle-configuration
         * seat. Declared here so this package needs no dependency on the sibling UI
         * package.
         */
        'web-ui.plugin.item': {
            kind: 'list';
            scope: 'root';
            owner: SettingsPluginItemOwnerProps;
        };
    }
}
declare module '@deepseek-ai/cordis' {
    interface Context {
        /**
         * Optional family settings binder provided by dsh-web-settings; absent when
         * that group plugin is not installed, so callers bind the shared forms
         * service (`ctx.configForms`) by profile entry id directly.
         */
        webUiSettings?: {
            bind<S>(spec: LiangShenFormSpec<S>): ConfigForm<S>;
        };
    }
}
/**
 * One settings namespace a family card binds. The 0.1.7 client exports no spec
 * type (the form controller takes it privately), so the binder's input shape is
 * restated here.
 */
export interface LiangShenFormSpec<T> {
    /** Settings namespace registered by the owning host plugin. */
    namespace: string;
    /** Narrow one wire section; undefined keeps the last accepted value. */
    decode?: (section: unknown) => T | undefined;
}
/**
 * Required client services: the slot registry, locale, sessions, the shared
 * configuration forms, and the roster Remote. Both `remote` and
 * `remote.agentPresets` are declared: the context proxy refuses an uninjected
 * service, and a nested service name does not imply its parent, so reading
 * `ctx.remote.agentPresets` needs `remote` as well.
 */
export declare const inject: string[];
declare module '@deepseek-ai/dsh-client-ui-slots' {
    interface LocaleNamespaceMap {
        /** The LiangShen lever copy. */
        'liangshen': LiangShenKey;
    }
}
export { LiangShenLever } from './LiangShenLever.tsx';
export { LeverController, type LeverFace, type LeverSnapshot } from './lever-controller.ts';
export { LIANGSHEN_PRESET_ID, leverState, restoreTarget, type LeverFacts, type LeverState } from '../core/lever.ts';
/**
 * Mount the lever: register the copy, follow the roster and the current
 * session, and claim the composer tool row.
 * @param ctx - the browser plugin context.
 */
export declare function apply(ctx: ClientContext): void;
