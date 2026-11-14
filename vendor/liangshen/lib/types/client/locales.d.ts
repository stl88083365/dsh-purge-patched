/**
 * Lever copy: zh-first dictionary with an English counterpart. The zh side is
 * the key-set source of truth; `packages/dsh-i18n` mirrors the keys into the
 * centralized ru dictionary and `pnpm i18n:check` enforces the parity.
 */
/** Lever copy, key source of truth. */
export declare const zh: {
    'lever.a11y': string;
    'lever.name': string;
    'lever.hint.pull': string;
    'lever.hint.push': string;
    'lever.hint.locked': string;
    'lever.hint.missing': string;
    'lever.state.on': string;
    'lever.state.off': string;
    'lever.busy': string;
    'lever.failed.locked': string;
    'lever.failed.missing': string;
    'lever.failed.timeout': string;
    'lever.failed.failed': string;
    'burst.line1': string;
    'burst.line2': string;
    'settings.title': string;
    'settings.description': string;
    'settings.enabled': string;
    'settings.enabledHint': string;
    'settings.announceToAgent': string;
    'settings.announceToAgentHint': string;
    'settings.presentation': string;
    'settings.presentationHint': string;
    'settings.dispatcher': string;
    'settings.dispatcherHint': string;
    'settings.on': string;
    'settings.off': string;
    'settings.inherit': string;
    'settings.overridden': string;
    'settings.reset': string;
    'settings.notExposed': string;
    'settings.readOnly': string;
    'settings.expand': string;
    'settings.collapse': string;
    'settings.saveFailed': string;
    'settings.invalidValue': string;
    'presentation.ptc': string;
    'presentation.native': string;
};
/** English counterpart; the key set mirrors {@link zh} exactly. */
export declare const en: Record<keyof typeof zh, string>;
/** Every key in the locale catalog. */
export type LiangShenKey = keyof typeof zh;
