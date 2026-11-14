/**
 * The homepage lever: a slot-machine arm beside the model selector.
 *
 * Pull it down and the session about to start becomes LiangShen mode; push it
 * up and the preset the user was on comes back. The arm tracks the real preset
 * (never a local guess), and the theatrical part — flash, shockwave, sparks,
 * and the three-language jackpot banner — plays only once the switch actually
 * landed, so a refused switch never celebrates.
 *
 * The component is pure: every fact and verb arrives through the injected face.
 * A pointer drag past {@link DRAG_THRESHOLD_PX} counts as a pull or a push; a
 * plain click or a keyboard activation toggles instead.
 */
import { type ReactElement } from 'react';
import type { LeverFace } from './lever-controller.ts';
/** Slot entry for `conversation.input.right` (left of the model selector). */
export declare function LiangShenLever(face: LeverFace): ReactElement | null;
