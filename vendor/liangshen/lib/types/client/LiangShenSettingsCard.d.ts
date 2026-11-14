/**
 * LiangShen settings card: availability, the wire presentation, and the
 * dispatcher identity. Registers into the `web-ui.plugin.item` child slot the
 * Web UI plugin group renders, bound to the `liangshen` settings namespace
 * (the Host profile entry id).
 *
 * No field acts on this client half: the Host applies the presentation and the
 * dispatcher switch to the preset it declares to the agent-preset registry, so
 * a session reads both from its preset. The card is the operator's only handle
 * on them, which is why every field the Host schema carries appears here.
 */
import type { InjectFace, PropsLocale, PropsRuntime } from '@deepseek-ai/dsh-client-ui-slots';
import type { SnapshotStore } from '@deepseek-ai/dsh-client-store';
import type { ConfigForm } from '@deepseek-ai/dsh-client-ui-settings/client';
import { type CardActions, type CardShell, type FieldState as CardFieldState } from './settings-form.ts';
/** Wire presentations the tool catalog accepts (mirrors the Host schema). */
export declare const PRESENTATION_CHOICES: readonly ["ptc", "native"];
/** The LiangShen fields this card edits (the namespace's full schema). */
export interface LiangShenSettings {
    /** Master switch for the plugin. */
    enabled?: boolean;
    /** Whether the plugin announces itself in every agent's system prompt. */
    announceToAgent?: boolean;
    /** Wire presentation the Host applies to the preset's tool-catalog row. */
    presentation?: string;
    /** Whether the preset appends the dispatcher rules section after the persona. */
    dispatcher?: boolean;
}
/** What the LiangShen card renders. */
export interface LiangShenSettingsCardState extends CardShell {
    enabled: CardFieldState;
    announceToAgent: CardFieldState;
    presentation: CardFieldState;
    dispatcher: CardFieldState;
}
/** The registration-side face the card's slot entry injects. */
export interface LiangShenSettingsCardFace extends CardActions {
    hooks: {
        /** Card snapshot bound by the renderer as useLiangShenSettingsCard. */
        liangShenSettingsCard: SnapshotStore<LiangShenSettingsCardState>;
    };
}
/** Bridges the `liangshen` settings form onto the card's staged form. */
export declare class LiangShenSettingsCardController {
    private readonly form;
    private readonly store;
    /** @param scope - the bound configuration form of the entry that owns this namespace. */
    constructor(scope: ConfigForm<LiangShenSettings>);
    private projection;
    /**
     * Build the face the card's slot registration injects.
     * @returns the card's snapshot and its form actions.
     */
    inject(): LiangShenSettingsCardFace;
    /** Release the card's scope subscription and bound stores. */
    dispose(): void;
}
/** Props the renderer binds for the LiangShen card. */
export type LiangShenSettingsCardProps = PropsRuntime<'web-ui.plugin.item'> & PropsLocale<'liangshen'> & InjectFace<LiangShenSettingsCardFace>;
/**
 * Render the LiangShen card.
 * @param props - locale copy, the card snapshot, and its form actions.
 * @returns the card.
 */
export declare function LiangShenSettingsCard(props: LiangShenSettingsCardProps): import("react").JSX.Element;
