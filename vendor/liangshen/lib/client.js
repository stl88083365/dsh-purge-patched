window.__ModuleLoader__.load({
	id: "@linxin666/dsh-liangshen",
	factory: (require) => {
		var module = { exports: {} };
		var exports = module.exports;
		Object.defineProperty(exports, Symbol.toStringTag, { value: "Module" });
		let react = require("react");
		let react_jsx_runtime = require("react/jsx-runtime");
		let _deepseek_ai_dsh_client_store = require("@deepseek-ai/dsh-client-store");
		//#region \0dsh-css:packages/dsh-liangshen/src/client/LiangShenLever.module.css.mjs
		const css$1 = ".hYkIZq_lever{align-items:center;font-size:12px;line-height:1;display:inline-flex;position:relative}.hYkIZq_control{color:var(--dsw-alias-label-secondary,inherit);font:inherit;cursor:pointer;touch-action:none;-webkit-user-select:none;user-select:none;background:0 0;border:none;border-radius:999px;align-items:center;gap:6px;margin:0;padding:2px 8px 2px 4px;transition:background-color .16s,color .16s;display:inline-flex}.hYkIZq_control:hover:not(:disabled){background:var(--dsw-alias-interactive-bg-hover,#0000000f)}.hYkIZq_control:focus-visible{outline:2px solid var(--dsw-alias-brand-primary,currentColor);outline-offset:2px}.hYkIZq_control:disabled{cursor:default;opacity:.55}.hYkIZq_track{background:linear-gradient(#2b2f36,#14161a);border-radius:8px;justify-content:center;align-items:flex-end;width:24px;height:28px;display:inline-flex;position:relative;overflow:hidden;box-shadow:inset 0 0 0 1px #ffffff24,inset 0 6px 10px #0000008c}.hYkIZq_track:after{content:\"\";background:#ffffff38;border-radius:2px;height:3px;position:absolute;bottom:2px;left:3px;right:3px}.hYkIZq_arm{transform-origin:50% 24px;width:16px;height:26px;margin-left:-8px;transition:transform .34s cubic-bezier(.2,1.7,.32,1);position:absolute;bottom:2px;left:50%;transform:rotate(-24deg)}.hYkIZq_lever[data-state=on] .hYkIZq_arm{transform:rotate(24deg)}.hYkIZq_rod{fill:#c9ced6;transition:fill .2s}.hYkIZq_knob{fill:#e04a33;stroke:#00000059;stroke-width:.6px;transition:fill .2s}.hYkIZq_lever[data-state=on] .hYkIZq_rod{fill:#ffd76a}.hYkIZq_lever[data-state=on] .hYkIZq_knob{fill:#f7c637}.hYkIZq_lever[data-state=on] .hYkIZq_track{box-shadow:inset 0 0 0 1px var(--dsw-alias-border-l3,#0000001f), 0 0 10px #f7c6378c}.hYkIZq_lever[data-busy=true] .hYkIZq_arm{animation:.42s ease-in-out infinite hYkIZq_lever-jitter}.hYkIZq_readout{white-space:nowrap;letter-spacing:.02em;min-width:4.4em}.hYkIZq_lever[data-state=on] .hYkIZq_readout{color:var(--dsw-alias-label-primary,inherit);font-weight:600}.hYkIZq_error{background:var(--dsw-alias-bg-layer-3,#0000000f);max-width:22ch;color:var(--dsw-alias-state-error-primary,#c0392b);text-overflow:ellipsis;white-space:nowrap;border-radius:6px;margin-left:4px;padding:2px 6px;overflow:hidden}.hYkIZq_burst{z-index:60;pointer-events:none;place-items:center;display:grid;position:fixed;inset:0;overflow:hidden}.hYkIZq_flash{background:radial-gradient(circle at 50% 62%,#fff6c8eb,#ffd04a73 38%,#ffa00000 72%);animation:.72s ease-out both hYkIZq_burst-flash;position:absolute;inset:0}.hYkIZq_ring{border:6px solid #ffd65ad9;border-radius:50%;width:220px;height:220px;animation:1.1s cubic-bezier(.16,.9,.3,1) both hYkIZq_burst-ring;position:absolute}.hYkIZq_ring:nth-of-type(2){animation-delay:.12s}.hYkIZq_ring:nth-of-type(3){animation-delay:.24s}.hYkIZq_banner{color:#ffe9a8;text-align:center;background:linear-gradient(160deg,#181004f0,#402604eb);border-radius:22px;flex-direction:column;align-items:center;gap:6px;padding:22px 40px;animation:.6s cubic-bezier(.16,1.5,.3,1) both hYkIZq_banner-slam,.5s ease-in-out .6s 2 hYkIZq_banner-shake;display:flex;position:relative;box-shadow:0 0 0 2px #ffd65abf,0 24px 70px #00000073}.hYkIZq_bannerName{letter-spacing:.16em;background:linear-gradient(#fff6d0,#ffc93c 55%,#b8730a);color:#0000;text-shadow:0 0 24px #ffc93ca6;-webkit-background-clip:text;background-clip:text;font-size:44px;font-weight:800}.hYkIZq_line{letter-spacing:.08em;font-size:15px}.hYkIZq_code{font-family:var(--dsw-font-mono,ui-monospace, SFMono-Regular, Menlo, monospace);letter-spacing:.06em;opacity:.82;font-size:11px;animation:.5s steps(2,end) 6 hYkIZq_code-blink}.hYkIZq_sparks{place-items:center;display:grid;position:absolute;inset:0}.hYkIZq_spark{transform-origin:50%;background:linear-gradient(#ffeca0f2,#ffaa1400);border-radius:3px;grid-area:1/1;width:3px;height:30px;animation:.95s ease-out both hYkIZq_spark-fly}@keyframes hYkIZq_lever-jitter{0%,to{transform:rotate(-22deg)}50%{transform:rotate(-8deg)}}@keyframes hYkIZq_burst-flash{0%{opacity:0;transform:scale(.6)}18%{opacity:1}to{opacity:0;transform:scale(1.5)}}@keyframes hYkIZq_burst-ring{0%{opacity:.9;transform:scale(.2)}to{opacity:0;transform:scale(3.4)}}@keyframes hYkIZq_banner-slam{0%{opacity:0;transform:scale(3.6)rotate(-9deg)}55%{opacity:1;transform:scale(.94)rotate(1.5deg)}75%{transform:scale(1.06)rotate(-1deg)}to{opacity:1;transform:scale(1)rotate(0)}}@keyframes hYkIZq_banner-shake{0%,to{transform:translate(0)}25%{transform:translate(-9px)rotate(-.6deg)}75%{transform:translate(9px)rotate(.6deg)}}@keyframes hYkIZq_spark-fly{0%{opacity:0;transform:translateY(-40px)scaleY(.3)}18%{opacity:1}to{opacity:0;transform:translateY(-300px)scaleY(1.15)}}@keyframes hYkIZq_code-blink{0%,to{opacity:.35}50%{opacity:1}}@media (prefers-reduced-motion:reduce){.hYkIZq_arm,.hYkIZq_control,.hYkIZq_rod,.hYkIZq_knob{transition:none}.hYkIZq_lever[data-busy=true] .hYkIZq_arm,.hYkIZq_flash,.hYkIZq_ring,.hYkIZq_banner,.hYkIZq_code,.hYkIZq_spark{animation:none}.hYkIZq_burst{animation:.3s ease-out both hYkIZq_burst-flash}.hYkIZq_spark{display:none}}";
		const tagId$1 = "@linxin666/dsh-liangshen/packages/dsh-liangshen/src/client/LiangShenLever.module.css";
		if (typeof document !== "undefined" && document.querySelector("style[data-plugin-css=" + JSON.stringify(tagId$1) + "]") === null) {
			const tag = document.createElement("style");
			tag.dataset.plugin = "@linxin666/dsh-liangshen";
			tag.dataset.pluginCss = tagId$1;
			tag.textContent = css$1;
			document.head.appendChild(tag);
		}
		var LiangShenLever_module_css_default = {
			"arm": "hYkIZq_arm",
			"banner": "hYkIZq_banner",
			"banner-shake": "hYkIZq_banner-shake",
			"banner-slam": "hYkIZq_banner-slam",
			"bannerName": "hYkIZq_bannerName",
			"burst": "hYkIZq_burst",
			"burst-flash": "hYkIZq_burst-flash",
			"burst-ring": "hYkIZq_burst-ring",
			"code": "hYkIZq_code",
			"code-blink": "hYkIZq_code-blink",
			"control": "hYkIZq_control",
			"error": "hYkIZq_error",
			"flash": "hYkIZq_flash",
			"knob": "hYkIZq_knob",
			"lever": "hYkIZq_lever",
			"lever-jitter": "hYkIZq_lever-jitter",
			"line": "hYkIZq_line",
			"readout": "hYkIZq_readout",
			"ring": "hYkIZq_ring",
			"rod": "hYkIZq_rod",
			"spark": "hYkIZq_spark",
			"spark-fly": "hYkIZq_spark-fly",
			"sparks": "hYkIZq_sparks",
			"track": "hYkIZq_track"
		};
		//#endregion
		//#region src/client/LiangShenLever.tsx
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
		/** Vertical travel that separates a pull or push from a plain click. */
		const DRAG_THRESHOLD_PX = 14;
		/** How long the burst overlay stays mounted, matching its CSS duration. */
		const BURST_MS = 2200;
		/** Jackpot lines that read the same in every language. */
		const BINARY = "01001100 01001001 01000001 01001110 01000111";
		const MORSE = "-.. . . .--. ... . . -.- / .... .- .-. -. . ... ...";
		/** One spark per spoke of the burst. */
		const SPARKS = Array.from({ length: 14 }, (_, index) => index);
		/** Sync the hero preset chip above the composer so both controls always agree. */
		function syncHeroChip(label) {
			try {
				if (typeof document === "undefined") return;
				const chip = document.querySelector("button[aria-haspopup=\"menu\"] span[class*=\"seatLabel\"]") ?? Array.from(document.querySelectorAll("button[aria-haspopup=\"menu\"] span")).find((s) => s.className.includes("seatLabel"));
				if (chip && chip.textContent !== label) chip.textContent = label;
			} catch {}
		}
		/** Slot entry for `conversation.input.right` (left of the model selector). */
		function LiangShenLever(face) {
			const { state, restoreLabel, busy, error, burst } = (0, react.useSyncExternalStore)(face.store.subscribe, face.store.getSnapshot);
			const [burstKey, setBurstKey] = (0, react.useState)(0);
			const seen = (0, react.useRef)(burst);
			const drag = (0, react.useRef)(void 0);
			const actionable = !busy && (state === "on" || state === "off");
			const on = state === "on";
			const errorText = error === void 0 ? void 0 : error.kind === "locked" ? face.t("lever.failed.locked") : error.kind === "missing" ? face.t("lever.failed.missing") : error.kind === "timeout" ? face.t("lever.failed.timeout") : face.t("lever.failed.failed", { reason: error.reason });
			(0, react.useEffect)(() => {
				if (burst > seen.current) setBurstKey(burst);
				seen.current = burst;
			}, [burst]);
			(0, react.useEffect)(() => {
				if (burstKey === 0) return;
				const timer = setTimeout(() => {
					setBurstKey(0);
				}, BURST_MS);
				return () => {
					clearTimeout(timer);
				};
			}, [burstKey]);
			const prevState = (0, react.useRef)(state);
			(0, react.useEffect)(() => {
				if (state === "on") syncHeroChip(face.t("lever.name"));
				else if (prevState.current === "on" && state === "off" && restoreLabel !== "") syncHeroChip(restoreLabel);
				prevState.current = state;
			}, [
				state,
				restoreLabel,
				face
			]);
			if (state === "locked" || state === "missing" || state === "on" && restoreLabel === "") return null;
			const toggle = () => {
				if (!actionable) return;
				if (on) face.push();
				else face.pull();
			};
			const onPointerDown = (event) => {
				if (!actionable) return;
				drag.current = {
					x: event.clientX,
					y: event.clientY,
					fired: false
				};
				try {
					event.currentTarget.setPointerCapture?.(event.pointerId);
				} catch {}
			};
			const onPointerMove = (event) => {
				const pending = drag.current;
				if (pending === void 0 || pending.fired) return;
				const travelY = event.clientY - pending.y;
				const travelX = event.clientX - pending.x;
				if (Math.hypot(travelX, travelY) >= DRAG_THRESHOLD_PX) {
					pending.fired = true;
					if (on) face.push();
					else face.pull();
				}
			};
			const onPointerUp = () => {
				const pending = drag.current;
				drag.current = void 0;
				if (pending === void 0 || pending.fired) return;
				toggle();
			};
			return /* @__PURE__ */ (0, react_jsx_runtime.jsxs)("span", {
				className: LiangShenLever_module_css_default.lever,
				"data-dsh-plugin": "liangshen",
				"data-dsh-part": "lever",
				"data-state": state,
				"data-busy": busy ? "true" : void 0,
				children: [
					/* @__PURE__ */ (0, react_jsx_runtime.jsxs)("button", {
						type: "button",
						role: "switch",
						"aria-checked": on,
						"aria-label": face.t("lever.a11y"),
						"aria-busy": busy,
						title: hint(face, state, restoreLabel),
						className: LiangShenLever_module_css_default.control,
						disabled: !actionable,
						onPointerDown,
						onPointerMove,
						onPointerUp,
						onPointerCancel: onPointerUp,
						onClick: (event) => {
							if (event.detail === 0) toggle();
						},
						children: [/* @__PURE__ */ (0, react_jsx_runtime.jsx)("span", {
							className: LiangShenLever_module_css_default.track,
							"data-dsh-part": "lever-track",
							"aria-hidden": "true",
							children: /* @__PURE__ */ (0, react_jsx_runtime.jsxs)("svg", {
								className: LiangShenLever_module_css_default.arm,
								"data-dsh-part": "lever-arm",
								viewBox: "0 0 16 26",
								"aria-hidden": "true",
								children: [/* @__PURE__ */ (0, react_jsx_runtime.jsx)("rect", {
									className: LiangShenLever_module_css_default.rod,
									x: "6.5",
									y: "3.5",
									width: "3",
									height: "21",
									rx: "1.5"
								}), /* @__PURE__ */ (0, react_jsx_runtime.jsx)("circle", {
									className: LiangShenLever_module_css_default.knob,
									cx: "8",
									cy: "4",
									r: "3.4"
								})]
							})
						}), /* @__PURE__ */ (0, react_jsx_runtime.jsx)("span", {
							className: LiangShenLever_module_css_default.readout,
							children: busy ? face.t("lever.busy") : on ? face.t("lever.state.on") : face.t("lever.state.off")
						})]
					}),
					errorText !== void 0 && /* @__PURE__ */ (0, react_jsx_runtime.jsx)("span", {
						className: LiangShenLever_module_css_default.error,
						role: "status",
						title: errorText,
						children: errorText
					}),
					burstKey !== 0 && /* @__PURE__ */ (0, react_jsx_runtime.jsx)(Burst, { face }, burstKey)
				]
			});
		}
		/** The hover hint: what this gesture would do right now. */
		function hint(face, state, restoreLabel) {
			if (state === "locked") return face.t("lever.hint.locked");
			if (state === "missing") return face.t("lever.hint.missing");
			if (state === "on") return face.t("lever.hint.push", { preset: restoreLabel === "" ? face.t("lever.state.off") : restoreLabel });
			return face.t("lever.hint.pull");
		}
		/** The jackpot overlay: flash, shockwave rings, sparks, and the banner. */
		function Burst({ face }) {
			return /* @__PURE__ */ (0, react_jsx_runtime.jsxs)("span", {
				className: LiangShenLever_module_css_default.burst,
				"data-dsh-part": "lever-burst",
				"aria-hidden": "true",
				children: [
					/* @__PURE__ */ (0, react_jsx_runtime.jsx)("span", { className: LiangShenLever_module_css_default.flash }),
					/* @__PURE__ */ (0, react_jsx_runtime.jsx)("span", { className: LiangShenLever_module_css_default.ring }),
					/* @__PURE__ */ (0, react_jsx_runtime.jsx)("span", { className: LiangShenLever_module_css_default.ring }),
					/* @__PURE__ */ (0, react_jsx_runtime.jsx)("span", { className: LiangShenLever_module_css_default.ring }),
					/* @__PURE__ */ (0, react_jsx_runtime.jsxs)("span", {
						className: LiangShenLever_module_css_default.banner,
						"data-dsh-part": "lever-banner",
						children: [
							/* @__PURE__ */ (0, react_jsx_runtime.jsx)("span", {
								className: LiangShenLever_module_css_default.bannerName,
								children: face.t("lever.name")
							}),
							/* @__PURE__ */ (0, react_jsx_runtime.jsx)("span", {
								className: LiangShenLever_module_css_default.line,
								children: face.t("burst.line1")
							}),
							/* @__PURE__ */ (0, react_jsx_runtime.jsx)("span", {
								className: LiangShenLever_module_css_default.line,
								children: face.t("burst.line2")
							}),
							/* @__PURE__ */ (0, react_jsx_runtime.jsx)("span", {
								className: LiangShenLever_module_css_default.code,
								children: BINARY
							}),
							/* @__PURE__ */ (0, react_jsx_runtime.jsx)("span", {
								className: LiangShenLever_module_css_default.code,
								children: MORSE
							})
						]
					}),
					/* @__PURE__ */ (0, react_jsx_runtime.jsx)("span", {
						className: LiangShenLever_module_css_default.sparks,
						children: SPARKS.map((spoke) => /* @__PURE__ */ (0, react_jsx_runtime.jsx)("i", {
							className: LiangShenLever_module_css_default.spark,
							style: { rotate: `${spoke * (360 / SPARKS.length)}deg` }
						}, spoke))
					})
				]
			});
		}
		//#endregion
		//#region src/client/main-session.ts
		/**
		* Resolve the Session the main view currently shows.
		*
		* Reads the catalog's rows rather than a per-id retain-info source: ownership
		* counts ride the list snapshot, so this neither allocates observers nor opens
		* history, and a subscription to the list still fires when the selection moves.
		* @param byId - the session catalog's rows (`SessionListState.byId`), when available.
		* @returns the main-view session id, or undefined when the main view shows none.
		*/
		function mainViewSessionId(byId) {
			if (byId === void 0 || byId === null) return void 0;
			for (const row of Object.values(byId)) if (row !== void 0 && (row.retainedBy?.mainView ?? 0) > 0) return row.id;
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
		/** Resolve what the lever shows for one set of facts. */
		function leverState(facts) {
			if (!facts.available.includes("liangshen")) return "missing";
			if (!facts.blank) return "locked";
			return facts.agentPreset === "liangshen" ? "on" : "off";
		}
		/**
		* The preset a push-up restores: the preset the user was on before pulling the
		* lever, else the deployment default, else the first usable roster row that is
		* not the LiangShen preset. A candidate is skipped when it is the LiangShen
		* preset itself (restoring it would be a no-op) or when the roster no longer
		* supplies it. That last resort is what keeps the push direction alive when the
		* deployment default IS LiangShen mode: `fallback` is skipped then, and after a
		* reload `previous` is gone, so without it the gesture would have no target.
		*/
		function restoreTarget(facts) {
			for (const candidate of [facts.previous, facts.fallback]) {
				if (candidate === void 0 || candidate === "liangshen") continue;
				if (facts.available.includes(candidate)) return candidate;
			}
			return facts.available.find((candidate) => candidate !== LIANGSHEN_PRESET_ID);
		}
		/** Whether the lever can act at all in its current state. */
		function isActionable(state) {
			return state === "on" || state === "off";
		}
		/**
		* Settings entry ids whose writes can move the roster this lever reads: the
		* agent-preset registry's own entry (its default and selection policy) and this
		* plugin's row under either install shape — the aggregate's generated row id
		* and the standalone row id — because disabling the plugin unregisters the
		* preset it declares.
		*/
		const ROSTER_SETTINGS_ENTRY_IDS = [
			"agent-preset-registry",
			"web-ui-liangshen",
			"liangshen"
		];
		/** Read the preset a session summary reports, when it reports one. */
		function presetOf(session) {
			const value = session?.projectionValues?.["agentPreset"];
			return typeof value === "string" ? value : void 0;
		}
		/** The lever controller: roster read, session facts, and the preset switch. */
		var LeverController = class {
			ctx;
			store;
			/**
			* The browser services this controller reads, resolved defensively: the
			* context proxy throws on any service the fiber did not inject, so a
			* deployment that cannot answer one of them must leave the lever inert
			* rather than take the plugin (and the composer row) down with it.
			*/
			sessions;
			remote;
			/** Roster rows as last read; empty until the first read lands. */
			rows = [];
			/** The preset the user was on before the last pull-down. */
			previous;
			loading = false;
			/** Ceiling on one in-flight switch, so a lost Remote answer cannot hang the row. */
			selectTimeoutMs;
			disposers = [];
			constructor(ctx, options = {}) {
				this.ctx = ctx;
				this.selectTimeoutMs = options.selectTimeoutMs ?? 1e4;
				this.sessions = readService(() => ctx.sessions);
				this.remote = readService(() => ctx.remote.agentPresets);
				this.store = (0, _deepseek_ai_dsh_client_store.createSnapshotStore)({
					state: "off",
					restoreLabel: "",
					busy: false,
					burst: 0
				});
			}
			/** The snapshot store the view subscribes to. */
			snapshot() {
				return this.store;
			}
			/** Follow the roster and the current session, then read the roster once. */
			start() {
				const list = this.sessions?.list;
				if (list !== void 0) this.disposers.push(list.subscribe(() => {
					this.refresh();
				}));
				const remote = readService(() => this.ctx.remote);
				if (typeof remote?.$on === "function") this.disposers.push(remote.$on("settings/document-updated", (ns) => {
					if (ROSTER_SETTINGS_ENTRY_IDS.includes(ns)) this.load();
				}));
				this.refresh();
				if (this.remote !== void 0) this.load();
			}
			/** Release every subscription. Idempotent. */
			dispose() {
				for (const dispose of this.disposers.splice(0)) dispose();
			}
			/** The inject face handed to the slot entry. */
			face() {
				return {
					store: this.store,
					pull: () => {
						this.toggle("down");
					},
					push: () => {
						this.toggle("up");
					},
					t: (key, vars) => {
						const translate = readService(() => this.ctx.locale.bind("liangshen"));
						return translate === void 0 ? key : translate(key, vars);
					}
				};
			}
			/** Read the roster; a refusal leaves the lever as it was. */
			async load() {
				if (this.loading) return;
				const remote = this.remote;
				if (remote === void 0) return;
				this.loading = true;
				try {
					const result = await remote.list();
					if (result.ok) this.rows = result.value.presets;
				} catch {} finally {
					this.loading = false;
					this.refresh();
				}
			}
			/**
			* Recompute the snapshot from the current session and the last roster read.
			* Only the derived fields are written: an in-flight switch, the last refusal,
			* and the burst counter belong to the gesture, not to a session refresh.
			*/
			refresh() {
				const facts = this.facts();
				const snapshot = this.store.getSnapshot();
				const state = leverState(facts);
				const target = restoreTarget(facts);
				const restoreLabel = target === void 0 ? "" : this.labelOf(target);
				if (snapshot.state === state && snapshot.restoreLabel === restoreLabel) return;
				this.store.set({
					...snapshot,
					state,
					restoreLabel
				});
			}
			/** The verb behind one gesture direction. */
			async toggle(direction) {
				const snapshot = this.store.getSnapshot();
				if (snapshot.busy) return;
				const remote = this.remote;
				if (remote === void 0) return;
				const facts = this.facts();
				if (!isActionable(leverState(facts))) return;
				const target = direction === "down" ? LIANGSHEN_PRESET_ID : restoreTarget(facts);
				const sessionId = this.currentSessionId();
				if (target === void 0 || sessionId === void 0) return;
				if (facts.agentPreset === target) {
					this.refresh();
					return;
				}
				this.store.set({
					...snapshot,
					busy: true,
					error: void 0
				});
				let result;
				try {
					result = await withTimeout(remote.select(sessionId, target), this.selectTimeoutMs);
				} catch (error) {
					const mapped = error instanceof SwitchTimeout ? { kind: "timeout" } : {
						kind: "failed",
						reason: message(error)
					};
					this.store.set({
						...this.store.getSnapshot(),
						busy: false,
						error: mapped
					});
					this.refresh();
					return;
				}
				if (!result.ok) {
					this.store.set({
						...this.store.getSnapshot(),
						busy: false,
						error: refusal(result.error)
					});
					this.refresh();
					return;
				}
				if (direction === "down") {
					const prev = facts.agentPreset ?? this.detectPreset();
					if (prev !== void 0 && prev !== "liangshen") this.rememberPrevious(prev);
				}
				const next = this.store.getSnapshot();
				this.store.set({
					...next,
					busy: false,
					error: void 0,
					burst: direction === "down" ? next.burst + 1 : next.burst
				});
				this.refresh();
			}
			/**
			* Try to detect the active preset from the DOM hero chip or storage
			* when session.projectionValues.agentPreset is absent.
			*/
			detectPreset() {
				try {
					if (typeof document !== "undefined") {
						const text = (document.querySelector("button[aria-haspopup=\"menu\"] span[class*=\"seatLabel\"]") ?? Array.from(document.querySelectorAll("button[aria-haspopup=\"menu\"] span")).find((s) => s.className.includes("seatLabel")))?.textContent?.trim();
						if (text) {
							const matched = this.rows.find((row) => (row.name === text || row.id === text) && row.id !== "liangshen");
							if (matched) return matched.id;
						}
					}
				} catch {}
				try {
					if (typeof sessionStorage !== "undefined") {
						const stored = sessionStorage.getItem("dsh-liangshen:previous-preset");
						if (stored && stored !== "liangshen" && this.rows.some((r) => r.id === stored)) return stored;
					}
				} catch {}
			}
			rememberPrevious(presetId) {
				if (presetId === void 0 || presetId === "liangshen") return;
				this.previous = presetId;
				try {
					if (typeof sessionStorage !== "undefined") sessionStorage.setItem("dsh-liangshen:previous-preset", presetId);
				} catch {}
			}
			/** The facts one decision reads, from the live session and the roster. */
			facts() {
				const summary = this.currentSession();
				const available = this.rows.filter((row) => row.broken === void 0).map((row) => row.id);
				const fallback = this.rows.find((row) => row.isDefault)?.id;
				const currentPreset = presetOf(summary);
				if (currentPreset !== void 0 && currentPreset !== "liangshen") this.rememberPrevious(currentPreset);
				const previous = this.previous ?? this.detectPreset();
				return {
					blank: summary?.blank === true,
					agentPreset: currentPreset,
					available,
					fallback,
					previous
				};
			}
			currentSessionId() {
				return mainViewSessionId(this.sessions?.list.getSnapshot().byId);
			}
			currentSession() {
				const state = this.sessions?.list.getSnapshot();
				const current = mainViewSessionId(state?.byId);
				if (state === void 0 || current === void 0) return void 0;
				return state.byId[current];
			}
			/** Display name of one preset id, falling back to the id itself. */
			labelOf(id) {
				return this.rows.find((candidate) => candidate.id === id)?.name ?? id;
			}
		};
		/** Raised when one switch outlives {@link SELECT_TIMEOUT_MS}. */
		var SwitchTimeout = class extends Error {
			constructor() {
				super("the preset switch did not answer in time");
				this.name = "SwitchTimeout";
			}
		};
		/** Resolve with `work`, or reject with a {@link SwitchTimeout} after `ms`. */
		function withTimeout(work, ms) {
			return new Promise((resolve, reject) => {
				const timer = setTimeout(() => {
					reject(new SwitchTimeout());
				}, ms);
				work.then((value) => {
					clearTimeout(timer);
					resolve(value);
				}, (error) => {
					clearTimeout(timer);
					reject(error instanceof Error ? error : new Error(String(error)));
				});
			});
		}
		/**
		* Read one context service, treating the proxy's "without inject" refusal (and
		* any other resolution fault) as the service being absent.
		*/
		function readService(read) {
			try {
				return read();
			} catch {
				return;
			}
		}
		/** The host's own reason for a refusal, mapped to lever copy. */
		function refusal(error) {
			if (error.code === "agent-preset/locked") return { kind: "locked" };
			if (error.code === "agent-preset/not-found") return { kind: "missing" };
			const details = error.details;
			if (typeof details === "object" && details !== null && typeof details.reason === "string") return {
				kind: "failed",
				reason: details.reason
			};
			return {
				kind: "failed",
				reason: error.message ?? error.code ?? "unknown"
			};
		}
		function message(error) {
			return error instanceof Error ? error.message : String(error);
		}
		//#endregion
		//#region src/client/LiangShenMark.tsx
		/**
		* Render the LiangShen card mark.
		* @returns the 18x18 lever mark, in the current text color.
		*/
		function LiangShenMark() {
			return /* @__PURE__ */ (0, react_jsx_runtime.jsxs)("svg", {
				width: "18",
				height: "18",
				viewBox: "0 0 18 18",
				fill: "none",
				"aria-hidden": "true",
				children: [/* @__PURE__ */ (0, react_jsx_runtime.jsx)("rect", {
					x: "3.6",
					y: "13.2",
					width: "8.8",
					height: "2.8",
					rx: "1.4",
					fill: "currentColor"
				}), /* @__PURE__ */ (0, react_jsx_runtime.jsxs)("g", {
					transform: "rotate(20 8 14.4)",
					children: [/* @__PURE__ */ (0, react_jsx_runtime.jsx)("rect", {
						x: "6.5",
						y: "4.6",
						width: "3",
						height: "9.8",
						rx: "1.5",
						fill: "currentColor"
					}), /* @__PURE__ */ (0, react_jsx_runtime.jsx)("circle", {
						cx: "8",
						cy: "4.4",
						r: "2.9",
						fill: "currentColor"
					})]
				})]
			});
		}
		//#endregion
		//#region \0dsh-css:packages/dsh-liangshen/src/client/settings-card.module.css.mjs
		const css = "._9t79wq_card{--settings-card-radius:12px;--settings-card-header-pad:16px;--settings-card-header-gap:13px;--settings-card-title-size:15px;--settings-card-description-size:13px;--settings-card-body-inset:16px;--settings-card-motion:.18s;border:1px solid var(--dsw-alias-border-l2);background:var(--dsw-alias-bg-layer-3);border-radius:var(--settings-card-radius);list-style:none;transition:border-color .16s,background .16s}._9t79wq_card:hover{border-color:var(--dsw-alias-label-dimmed)}._9t79wq_cardOpen{background:var(--dsw-alias-bg-layer-2);border-color:var(--dsw-alias-label-dimmed)}._9t79wq_cardNested{--settings-card-radius:10px;--settings-card-header-pad:10px 12px;--settings-card-header-gap:10px;--settings-card-title-size:13px;--settings-card-description-size:12px;--settings-card-body-inset:12px}._9t79wq_cardNested ._9t79wq_description{white-space:nowrap;text-overflow:ellipsis;overflow:hidden}._9t79wq_header{appearance:none;box-sizing:border-box;width:100%;font:inherit;color:inherit;text-align:left;cursor:pointer;border-radius:var(--settings-card-radius);align-items:center;gap:var(--settings-card-header-gap);padding:var(--settings-card-header-pad);background:0 0;border:0;display:flex}._9t79wq_header:focus-visible{outline:2px solid var(--dsw-alias-brand-primary);outline-offset:-2px}._9t79wq_headerStatic{box-sizing:border-box;border-radius:var(--settings-card-radius);align-items:center;gap:var(--settings-card-header-gap);width:100%;padding:var(--settings-card-header-pad);display:flex}._9t79wq_headText{flex-direction:column;flex:1;gap:4px;min-width:0;display:flex}._9t79wq_mark{background:var(--dsw-alias-bg-module-platform);width:34px;height:34px;color:var(--dsw-alias-label-secondary);border-radius:10px;flex:none;place-items:center;transition:color .16s;display:grid}._9t79wq_header:hover ._9t79wq_mark,._9t79wq_cardOpen ._9t79wq_mark{color:var(--dsw-alias-label-primary)}._9t79wq_name{color:var(--dsw-alias-label-primary);font-size:var(--settings-card-title-size);font-weight:600;line-height:1.4}._9t79wq_description{color:var(--dsw-alias-label-secondary);font-size:12px;line-height:18px}._9t79wq_headerAction{flex:none;align-items:center;display:inline-flex}._9t79wq_chevron{color:var(--dsw-alias-label-tertiary);flex:none;width:16px;height:16px;transition:transform .16s,color .16s}._9t79wq_header:hover ._9t79wq_chevron{color:var(--dsw-alias-label-secondary)}._9t79wq_chevronOpen{transform:rotate(180deg)}._9t79wq_disclosure{opacity:0;transition:grid-template-rows var(--settings-card-motion) ease, opacity var(--settings-card-motion) ease;grid-template-rows:0fr;display:grid}._9t79wq_disclosure[data-state=collapsed],._9t79wq_disclosure[data-state=entering],._9t79wq_disclosure[data-state=closing]{overflow:hidden}._9t79wq_disclosure[data-state=entering],._9t79wq_disclosure[data-state=shown]{opacity:1;grid-template-rows:1fr}._9t79wq_disclosure>._9t79wq_body{min-height:0}._9t79wq_body{border-top:1px solid var(--dsw-alias-border-l2);margin:0 var(--settings-card-body-inset);padding-bottom:8px;container:_9t79wq_settings-card/inline-size}._9t79wq_readOnly{color:var(--dsw-alias-label-secondary);margin:12px 0 0;font-size:12px;line-height:1.5}._9t79wq_notExposed{color:var(--dsw-alias-state-warn-primary);margin:12px 0 0;font-size:12px;line-height:1.5}._9t79wq_failed{color:var(--dsw-alias-state-error-primary,#b42318);overflow-wrap:anywhere;margin:8px 0 4px;font-size:12px;line-height:18px}._9t79wq_field{grid-template-columns:minmax(0,1fr) fit-content(50%);grid-template-areas:\"_9t79wq_head _9t79wq_control\"\"_9t79wq_hint _9t79wq_control\";align-items:center;gap:4px 24px;padding:16px 0;display:grid}._9t79wq_field>._9t79wq_head{grid-area:_9t79wq_head}._9t79wq_field>:is(._9t79wq_hint,._9t79wq_invalid){grid-area:_9t79wq_hint}._9t79wq_field>:not(._9t79wq_head,._9t79wq_hint,._9t79wq_invalid){grid-area:_9t79wq_control;justify-self:end;max-width:100%}._9t79wq_field+._9t79wq_field{border-top:1px solid var(--dsw-alias-border-l2)}._9t79wq_head{align-items:center;gap:8px;display:flex}._9t79wq_label{min-width:0;color:var(--dsw-alias-label-primary);flex:1;font-size:14px;font-weight:400;line-height:22px}._9t79wq_badges{align-items:center;gap:8px;display:inline-flex}._9t79wq_badge{white-space:nowrap;background:var(--dsw-alias-bg-module-platform);color:var(--dsw-alias-label-secondary);border-radius:999px;padding:1px 8px;font-size:11px;font-weight:500;line-height:17px}._9t79wq_reset{font:inherit;color:var(--dsw-alias-label-secondary);cursor:pointer;background:0 0;border:none;padding:0;font-size:12px;line-height:1.5}._9t79wq_reset:hover:not(:disabled){color:var(--dsw-alias-label-primary)}._9t79wq_reset:disabled{cursor:default}._9t79wq_reset:focus-visible{outline:2px solid var(--dsw-alias-brand-primary);outline-offset:2px}._9t79wq_segmentGroup{background:color-mix(in srgb, var(--dsw-alias-label-primary) 7%, transparent);box-shadow:inset 0 0 0 1px color-mix(in srgb, var(--dsw-alias-label-primary) 5%, transparent);border-radius:8px;flex-wrap:wrap;align-items:center;gap:2px;padding:2px;display:inline-flex;position:relative}._9t79wq_segment{appearance:none;color:var(--dsw-alias-label-secondary);font:inherit;white-space:nowrap;cursor:pointer;background:0 0;border:0;border-radius:7px;margin:0;padding:3px 12px;font-size:13px;font-weight:500;line-height:18px;transition:background-color .12s,color .12s}._9t79wq_segment:hover:not(:disabled):not([data-active]){color:var(--dsw-alias-label-primary)}._9t79wq_segmentGroup:not([data-pill])>._9t79wq_segment[data-active],._9t79wq_segmentGroup[data-pill]:before{background:var(--dsw-alias-bg-overlay,var(--dsw-alias-bg-layer-3));box-shadow:0 1px 2px #14141314}body[data-ds-dark-theme] ._9t79wq_segmentGroup:not([data-pill])>._9t79wq_segment[data-active],body[data-ds-dark-theme] ._9t79wq_segmentGroup[data-pill]:before{box-shadow:none;background:#ffffff24}._9t79wq_segment[data-active]{color:var(--dsw-alias-label-primary)}._9t79wq_segmentGroup[data-pill]:before{content:\"\";width:var(--segment-pill-w,0px);height:var(--segment-pill-h,0px);transform:translate(var(--segment-pill-x,0px), var(--segment-pill-y,0px));pointer-events:none;border-radius:7px;transition:transform .24s cubic-bezier(.22,.61,.36,1),width .24s cubic-bezier(.22,.61,.36,1),height .24s cubic-bezier(.22,.61,.36,1);position:absolute;top:0;left:0}._9t79wq_segmentGroup>*{z-index:1;position:relative}._9t79wq_segment:focus-visible{outline:2px solid var(--dsw-alias-brand-primary);outline-offset:1px}._9t79wq_segment:disabled{cursor:not-allowed;opacity:.45}._9t79wq_segmentGroup[data-pill]:has(>._9t79wq_segment:disabled):before{opacity:.45}._9t79wq_input,._9t79wq_select{border:1px solid var(--dsw-alias-border-l2);background:var(--dsw-alias-bg-layer-3);height:34px;font:inherit;color:var(--dsw-alias-label-primary);border-radius:8px;padding:0 12px;font-size:13px;line-height:1.5}._9t79wq_input:focus-visible,._9t79wq_select:focus-visible{border-color:var(--dsw-alias-brand-primary);outline:none}._9t79wq_input:disabled,._9t79wq_select:disabled{color:var(--dsw-alias-label-tertiary);cursor:default}._9t79wq_inputInvalid{border:1px solid var(--dsw-alias-state-error-primary,#b42318);background:var(--dsw-alias-bg-layer-3);height:34px;font:inherit;color:var(--dsw-alias-label-primary);border-radius:8px;padding:0 12px;font-size:13px;line-height:1.5}._9t79wq_inputInvalid:focus-visible{outline:2px solid var(--dsw-alias-state-error-primary,#b42318);outline-offset:1px;border-color:var(--dsw-alias-state-error-primary,#b42318)}._9t79wq_field>:is(._9t79wq_input,._9t79wq_inputInvalid,._9t79wq_select,._9t79wq_selectWrap,._9t79wq_rangeAnchor){box-sizing:border-box;width:220px}._9t79wq_rangeAnchor>:is(._9t79wq_input,._9t79wq_inputInvalid){box-sizing:border-box;width:100%}@container _9t79wq_settings-card (width<=440px){._9t79wq_field{grid-template-columns:minmax(0,1fr);grid-template-areas:\"_9t79wq_head\"\"_9t79wq_hint\"\"_9t79wq_control\";row-gap:8px}._9t79wq_field>:not(._9t79wq_head,._9t79wq_hint,._9t79wq_invalid){justify-self:start}._9t79wq_field>:is(._9t79wq_input,._9t79wq_inputInvalid,._9t79wq_select,._9t79wq_selectWrap,._9t79wq_rangeAnchor){justify-self:stretch;width:auto}}._9t79wq_selectWrap{position:relative}._9t79wq_selectButton{appearance:none;text-align:left;cursor:pointer;justify-content:space-between;align-items:center;gap:8px;width:100%;display:flex}._9t79wq_selectLabel{text-overflow:ellipsis;white-space:nowrap;min-width:0;overflow:hidden}._9t79wq_selectChevron{color:var(--dsw-alias-label-tertiary);flex:none;transition:transform .16s}._9t79wq_selectChevronOpen{transform:rotate(180deg)}._9t79wq_selectPopup{z-index:40;border:1px solid var(--dsw-alias-border-l2);background:var(--dsw-alias-bg-layer-3);max-height:240px;box-shadow:0 8px 24px var(--dsw-alias-bg-mask-2);opacity:0;border-radius:8px;flex-direction:column;padding:4px;transition:opacity .1s,transform .1s;display:flex;position:absolute;top:calc(100% + 4px);left:0;right:0;overflow-y:auto;transform:translateY(-4px)}._9t79wq_selectPopupOpen{opacity:1;transform:none}._9t79wq_selectPopupClose{opacity:0;pointer-events:none;transform:translateY(-4px)}._9t79wq_rangeAnchor{display:inline-flex;position:relative}._9t79wq_rangeBubble{z-index:40;box-sizing:border-box;border:1px solid var(--dsw-alias-border-l2);background:var(--dsw-alias-bg-layer-3);width:220px;box-shadow:0 8px 24px var(--dsw-alias-bg-mask-2);opacity:0;visibility:hidden;border-radius:10px;padding:10px 12px 6px;transition:opacity .12s,transform .12s,visibility 0s linear .12s;position:absolute;right:0}._9t79wq_rangeBubble[data-side=above]{bottom:calc(100% + 6px);transform:translateY(4px)}._9t79wq_rangeBubble[data-side=below]{top:calc(100% + 6px);transform:translateY(-4px)}._9t79wq_rangeBubble[data-open]{opacity:1;visibility:visible;transition:opacity .12s,transform .12s,visibility;transform:none}._9t79wq_rangeSlider{appearance:none;cursor:pointer;background:0 0;width:100%;height:18px;margin:0;display:block}._9t79wq_rangeSlider::-webkit-slider-runnable-track{background:linear-gradient(to right, var(--dsw-alias-brand-primary) var(--range-fill,0%), color-mix(in srgb, var(--dsw-alias-label-primary) 12%, transparent) var(--range-fill,0%));border-radius:999px;height:4px}._9t79wq_rangeSlider::-moz-range-track{background:color-mix(in srgb, var(--dsw-alias-label-primary) 12%, transparent);border-radius:999px;height:4px}._9t79wq_rangeSlider::-moz-range-progress{background:var(--dsw-alias-brand-primary);border-radius:999px;height:4px}._9t79wq_rangeSlider::-webkit-slider-thumb{appearance:none;background:#fff;border:0;border-radius:50%;width:14px;height:14px;margin-top:-5px;transition:transform .12s;box-shadow:0 0 0 1px #0000001f,0 1px 3px #00000040}._9t79wq_rangeSlider::-moz-range-thumb{background:#fff;border:0;border-radius:50%;width:14px;height:14px;box-shadow:0 0 0 1px #0000001f,0 1px 3px #00000040}._9t79wq_rangeSlider:active::-webkit-slider-thumb{transform:scale(1.15)}._9t79wq_rangeSlider:focus-visible{outline:none}._9t79wq_rangeSlider:focus-visible::-webkit-slider-thumb{box-shadow:0 0 0 2px var(--dsw-alias-brand-primary)}._9t79wq_rangeSlider:disabled{cursor:not-allowed}._9t79wq_rangeEnds{color:var(--dsw-alias-label-secondary);font-variant-numeric:tabular-nums;justify-content:space-between;margin-top:2px;font-size:11px;line-height:16px;display:flex}._9t79wq_selectOption{color:var(--dsw-alias-label-primary);cursor:pointer;white-space:nowrap;text-overflow:ellipsis;border-radius:6px;flex-shrink:0;padding:6px 10px;font-size:13px;line-height:1.5;overflow:hidden}._9t79wq_selectOption:hover,._9t79wq_selectOptionActive{background:var(--dsw-alias-interactive-bg-hover)}._9t79wq_selectOptionSelected{color:var(--dsw-alias-brand-primary);background:color-mix(in srgb, var(--dsw-alias-brand-primary) 10%, transparent);font-weight:500}._9t79wq_invalid{color:var(--dsw-alias-state-error-primary,#b42318);margin:0;font-size:12px;line-height:18px}._9t79wq_hint{color:var(--dsw-alias-label-secondary);margin:0;font-size:12px;line-height:18px}._9t79wq_toggle{appearance:none;cursor:pointer;font:inherit;background:0 0;border:0;border-radius:999px;align-items:center;margin:0;padding:0;display:inline-flex}._9t79wq_toggleTrack{background:var(--dsw-alias-label-dimmed);border-radius:999px;flex:none;width:36px;height:20px;transition:background-color .18s;position:relative}._9t79wq_toggleThumb{--toggle-travel:16px;--toggle-overshoot:1px;background:var(--dsw-alias-bg-layer-3);border-radius:50%;width:16px;height:16px;transition:translate .18s;position:absolute;top:2px;left:2px;translate:0;box-shadow:0 1px 2px #1414132e}._9t79wq_toggle[aria-checked=true] ._9t79wq_toggleTrack{background:var(--dsw-alias-button-primary-fill,var(--dsw-alias-label-primary))}._9t79wq_toggle[aria-checked=true] ._9t79wq_toggleThumb{translate:var(--toggle-travel) 0;background:var(--dsw-alias-label-primary-foreground,var(--dsw-alias-bg-layer-3))}._9t79wq_toggle[data-moved][aria-checked=true] ._9t79wq_toggleThumb{animation:.35s cubic-bezier(.34,1.45,.64,1) both _9t79wq_toggle-on}._9t79wq_toggle[data-moved][aria-checked=false] ._9t79wq_toggleThumb{animation:.35s cubic-bezier(.34,1.45,.64,1) both _9t79wq_toggle-off}@keyframes _9t79wq_toggle-on{0%{translate:0}55%{translate:calc(var(--toggle-travel) + var(--toggle-overshoot)) 0}80%,to{translate:var(--toggle-travel) 0}}@keyframes _9t79wq_toggle-off{0%{translate:var(--toggle-travel) 0}55%{translate:calc(0px - var(--toggle-overshoot)) 0}80%,to{translate:0}}._9t79wq_toggle:focus-visible{outline:2px solid var(--dsw-alias-brand-primary);outline-offset:2px}._9t79wq_toggle:disabled{opacity:.45;cursor:not-allowed}@media (prefers-reduced-motion:reduce){._9t79wq_card,._9t79wq_header,._9t79wq_mark,._9t79wq_chevron,._9t79wq_chevronOpen,._9t79wq_rangeBubble,._9t79wq_selectChevron,._9t79wq_selectChevronOpen,._9t79wq_selectPopup,._9t79wq_toggleTrack,._9t79wq_toggleThumb{transition:none}._9t79wq_toggle[data-moved] ._9t79wq_toggleThumb{animation:none}._9t79wq_disclosure{transition-property:opacity}}";
		const tagId = "@linxin666/dsh-liangshen/packages/dsh-liangshen/src/client/settings-card.module.css";
		if (typeof document !== "undefined" && document.querySelector("style[data-plugin-css=" + JSON.stringify(tagId) + "]") === null) {
			const tag = document.createElement("style");
			tag.dataset.plugin = "@linxin666/dsh-liangshen";
			tag.dataset.pluginCss = tagId;
			tag.textContent = css;
			document.head.appendChild(tag);
		}
		var settings_card_module_css_default = {
			"badge": "_9t79wq_badge",
			"badges": "_9t79wq_badges",
			"body": "_9t79wq_body",
			"card": "_9t79wq_card",
			"cardNested": "_9t79wq_cardNested",
			"cardOpen": "_9t79wq_cardOpen",
			"chevron": "_9t79wq_chevron",
			"chevronOpen": "_9t79wq_chevronOpen",
			"control": "_9t79wq_control",
			"description": "_9t79wq_description",
			"disclosure": "_9t79wq_disclosure",
			"failed": "_9t79wq_failed",
			"field": "_9t79wq_field",
			"head": "_9t79wq_head",
			"headText": "_9t79wq_headText",
			"header": "_9t79wq_header",
			"headerAction": "_9t79wq_headerAction",
			"headerStatic": "_9t79wq_headerStatic",
			"hint": "_9t79wq_hint",
			"input": "_9t79wq_input",
			"inputInvalid": "_9t79wq_inputInvalid",
			"invalid": "_9t79wq_invalid",
			"label": "_9t79wq_label",
			"mark": "_9t79wq_mark",
			"name": "_9t79wq_name",
			"notExposed": "_9t79wq_notExposed",
			"rangeAnchor": "_9t79wq_rangeAnchor",
			"rangeBubble": "_9t79wq_rangeBubble",
			"rangeEnds": "_9t79wq_rangeEnds",
			"rangeSlider": "_9t79wq_rangeSlider",
			"readOnly": "_9t79wq_readOnly",
			"reset": "_9t79wq_reset",
			"segment": "_9t79wq_segment",
			"segmentGroup": "_9t79wq_segmentGroup",
			"select": "_9t79wq_select",
			"selectButton": "_9t79wq_selectButton",
			"selectChevron": "_9t79wq_selectChevron",
			"selectChevronOpen": "_9t79wq_selectChevronOpen",
			"selectLabel": "_9t79wq_selectLabel",
			"selectOption": "_9t79wq_selectOption",
			"selectOptionActive": "_9t79wq_selectOptionActive",
			"selectOptionSelected": "_9t79wq_selectOptionSelected",
			"selectPopup": "_9t79wq_selectPopup",
			"selectPopupClose": "_9t79wq_selectPopupClose",
			"selectPopupOpen": "_9t79wq_selectPopupOpen",
			"selectWrap": "_9t79wq_selectWrap",
			"settings-card": "_9t79wq_settings-card",
			"toggle": "_9t79wq_toggle",
			"toggle-off": "_9t79wq_toggle-off",
			"toggle-on": "_9t79wq_toggle-on",
			"toggleThumb": "_9t79wq_toggleThumb",
			"toggleTrack": "_9t79wq_toggleTrack"
		};
		//#endregion
		//#region src/client/RangeBubble.tsx
		/**
		* Coarse adjustment for a bounded number: resting the pointer on the control
		* (or moving focus into it) raises a small bubble holding a slider across the
		* field's whole range, so a large change is one drag instead of many presses
		* or a retyped value. The control itself stays the precise entry.
		*
		* The bubble belongs to the anchor's subtree, so moving from the control onto
		* the bubble never counts as leaving. It opens after a short rest and closes a
		* moment after the pointer and focus have both gone, so crossing the control
		* on the way elsewhere does not flash it. While a drag is in progress the
		* bubble stays put even if the pointer strays off it.
		*
		* Dragging reports each value through `onInput`, so the field shows it live;
		* releasing the thumb, or a key press on it, reports `onCommit` once. The
		* bubble opens on the side of the control that has room inside the nearest
		* scrolling ancestor, so a row near the top of a settings page does not hang
		* its bubble under the page edge.
		*/
		//#endregion
		//#region src/client/SegmentGroup.tsx
		/**
		* The family's segmented control: a quiet track whose options share one
		* highlight that slides to the pressed option, instead of each option fading
		* its own background out and the next one in. The settings fields' small
		* choices and the Web Extensions TAB strip both render through it, so the two
		* read as one control.
		*
		* The caller builds the option buttons and marks the pressed one with
		* `data-active`; the group measures that button after every render and writes
		* its box as four custom properties, and the stylesheet draws the highlight
		* there (`.segmentGroup[data-pill]::before`). Attribute and first placement
		* land in the same task, so the highlight appears in place and only later
		* changes slide. A ResizeObserver re-measures when the group or an option
		* changes size: a longer locale, a font arriving, a container growing, a
		* strip wrapping onto a second line.
		*/
		/** The attribute marking a group whose highlight has been placed. */
		const PILL_ATTR = "data-pill";
		/** The pressed option, relative to the group. */
		const ACTIVE_SELECTOR = ":scope > [data-active]";
		const PILL_PROPERTIES = [
			"--segment-pill-x",
			"--segment-pill-y",
			"--segment-pill-w",
			"--segment-pill-h"
		];
		/**
		* Write the highlight's box from the pressed option's box, or take the
		* highlight off when nothing is pressed or the group has no layout yet.
		* The two boxes are read in viewport pixels and turned back into the group's
		* own CSS pixels, so a dialog that opens through a scale transform still
		* lands the highlight on its option.
		*/
		function placePill(group) {
			const item = group.querySelector(ACTIVE_SELECTOR);
			const box = group.getBoundingClientRect();
			if (item === null || group.offsetWidth === 0 || box.width === 0) {
				group.removeAttribute(PILL_ATTR);
				for (const property of PILL_PROPERTIES) group.style.removeProperty(property);
				return;
			}
			const scale = box.width / group.offsetWidth;
			const itemBox = item.getBoundingClientRect();
			[
				(itemBox.left - box.left) / scale - group.clientLeft,
				(itemBox.top - box.top) / scale - group.clientTop,
				itemBox.width / scale,
				itemBox.height / scale
			].forEach((value, index) => {
				group.style.setProperty(PILL_PROPERTIES[index], `${Math.round(value * 100) / 100}px`);
			});
			if (!group.hasAttribute(PILL_ATTR)) group.setAttribute(PILL_ATTR, "");
		}
		/**
		* Render a segmented track around the caller's option buttons.
		* @param props - the track's attributes (role, accessible name, key handler) and its options.
		* @returns the track.
		*/
		function SegmentGroup(props) {
			const { children, className, ...rest } = props;
			const group = (0, react.useRef)(null);
			const count = react.Children.count(children);
			(0, react.useLayoutEffect)(() => {
				if (group.current !== null) placePill(group.current);
			});
			(0, react.useLayoutEffect)(() => {
				const element = group.current;
				if (element === null || typeof ResizeObserver === "undefined") return void 0;
				const observer = new ResizeObserver(() => {
					placePill(element);
				});
				observer.observe(element);
				for (const item of Array.from(element.children)) observer.observe(item);
				return () => {
					observer.disconnect();
				};
			}, [count]);
			return /* @__PURE__ */ (0, react_jsx_runtime.jsx)("div", {
				...rest,
				ref: group,
				className: className === void 0 ? settings_card_module_css_default.segmentGroup : `${settings_card_module_css_default.segmentGroup} ${className}`,
				children
			});
		}
		//#endregion
		//#region src/client/PluginSettingsCard.tsx
		/**
		* Family-shared chrome for plugin settings cards: a disclosure header naming
		* the plugin and what its settings govern, the controls inside, and the line
		* that reports a refused write. A pick is written the moment it is made and a
		* typed value after a pause, so the card has no save button and nothing waits
		* on the reader. Renders nothing while the namespace is unavailable — a
		* deployment that does not compose the owning plugin should show no trace of
		* it. Inlined into each consumer's client bundle; mirrors the official
		* ui-plugin-config PluginCard in a self-contained slice.
		*
		* Every field inside the body is one settings row: the label and its hint on
		* the left, the control on the right, a hairline between two rows; a narrow
		* card stacks the control under the text (settings-card.module.css).
		*/
		/**
		* What a text field inside a card reaches without its plugin wiring it: write
		* the pending draft now (Enter, leaving the field) or put it back (Escape).
		* Picks need neither; they are written the moment they are made.
		*/
		const CardApply = (0, react.createContext)(null);
		/** Length of the body's disclosure motion; it matches `--settings-card-motion` on the card root. */
		const BODY_MOTION_MS = 180;
		/**
		* Render one plugin settings card.
		* @param props - the plugin's copy keys, its form state, and its controls.
		* @returns the card, or nothing while the namespace is still loading.
		*/
		function PluginSettingsCard(props) {
			const [open, setOpen] = (0, react.useState)(props.defaultOpen ?? true);
			const { state, alwaysOpen } = props;
			const expanded = alwaysOpen === true || open;
			const [bodyPhase, setBodyPhase] = (0, react.useState)(expanded ? "shown" : "hidden");
			const bodyRef = (0, react.useRef)(null);
			(0, react.useLayoutEffect)(() => {
				if (expanded) {
					if (bodyPhase === "hidden") setBodyPhase("collapsed");
					else if (bodyPhase === "collapsed") {
						const node = bodyRef.current;
						if (node !== null) node.offsetHeight;
						setBodyPhase("entering");
					} else if (bodyPhase === "closing") setBodyPhase("entering");
					return;
				}
				if (bodyPhase === "collapsed") setBodyPhase("hidden");
				else if (bodyPhase === "entering" || bodyPhase === "shown") setBodyPhase("closing");
			}, [expanded, bodyPhase]);
			(0, react.useEffect)(() => {
				if (bodyPhase !== "entering" && bodyPhase !== "closing") return;
				const timer = setTimeout(() => {
					setBodyPhase(bodyPhase === "entering" ? "shown" : "hidden");
				}, BODY_MOTION_MS);
				return () => {
					clearTimeout(timer);
				};
			}, [bodyPhase]);
			if (!state.available) return null;
			const title = props.t(props.titleKey);
			const description = props.t(props.descriptionKey);
			const descriptionTitle = props.descriptionTitleKey === void 0 ? description : props.t(props.descriptionTitleKey);
			const baseClass = expanded ? `${settings_card_module_css_default.cardOpen} ${settings_card_module_css_default.card}` : settings_card_module_css_default.card;
			const cardClass = props.density === "nested" ? `${baseClass} ${settings_card_module_css_default.cardNested}` : baseClass;
			/** The body region both legs share; a hidden phase renders nothing at all. */
			const bodyRegion = (content) => bodyPhase === "hidden" ? null : /* @__PURE__ */ (0, react_jsx_runtime.jsx)("div", {
				className: settings_card_module_css_default.disclosure,
				"data-state": bodyPhase,
				ref: bodyRef,
				children: /* @__PURE__ */ (0, react_jsx_runtime.jsx)("div", {
					className: settings_card_module_css_default.body,
					children: content
				})
			});
			const header = alwaysOpen === true ? /* @__PURE__ */ (0, react_jsx_runtime.jsxs)("div", {
				className: settings_card_module_css_default.headerStatic,
				children: [
					props.icon !== void 0 ? /* @__PURE__ */ (0, react_jsx_runtime.jsx)("span", {
						className: settings_card_module_css_default.mark,
						"aria-hidden": "true",
						children: props.icon
					}) : null,
					/* @__PURE__ */ (0, react_jsx_runtime.jsxs)("span", {
						className: settings_card_module_css_default.headText,
						children: [/* @__PURE__ */ (0, react_jsx_runtime.jsx)("span", {
							className: settings_card_module_css_default.name,
							id: props.titleId,
							title,
							children: title
						}), /* @__PURE__ */ (0, react_jsx_runtime.jsx)("span", {
							className: settings_card_module_css_default.description,
							title: descriptionTitle,
							children: props.descriptionNode ?? description
						})]
					}),
					props.headerAction !== void 0 ? /* @__PURE__ */ (0, react_jsx_runtime.jsx)("span", {
						className: settings_card_module_css_default.headerAction,
						children: props.headerAction
					}) : null
				]
			}) : /* @__PURE__ */ (0, react_jsx_runtime.jsxs)("button", {
				type: "button",
				className: settings_card_module_css_default.header,
				"aria-expanded": open,
				"aria-label": `${props.t(open ? "settings.collapse" : "settings.expand")}: ${title}`,
				onClick: () => {
					setOpen(!open);
				},
				children: [
					props.icon !== void 0 ? /* @__PURE__ */ (0, react_jsx_runtime.jsx)("span", {
						className: settings_card_module_css_default.mark,
						"aria-hidden": "true",
						children: props.icon
					}) : null,
					/* @__PURE__ */ (0, react_jsx_runtime.jsxs)("span", {
						className: settings_card_module_css_default.headText,
						children: [/* @__PURE__ */ (0, react_jsx_runtime.jsx)("span", {
							className: settings_card_module_css_default.name,
							id: props.titleId,
							title,
							children: title
						}), /* @__PURE__ */ (0, react_jsx_runtime.jsx)("span", {
							className: settings_card_module_css_default.description,
							title: descriptionTitle,
							children: props.descriptionNode ?? description
						})]
					}),
					props.headerAction !== void 0 ? /* @__PURE__ */ (0, react_jsx_runtime.jsx)("span", {
						className: settings_card_module_css_default.headerAction,
						children: props.headerAction
					}) : null,
					/* @__PURE__ */ (0, react_jsx_runtime.jsx)("svg", {
						width: "14",
						height: "14",
						viewBox: "0 0 14 14",
						fill: "none",
						xmlns: "http://www.w3.org/2000/svg",
						className: open ? `${settings_card_module_css_default.chevron} ${settings_card_module_css_default.chevronOpen}` : settings_card_module_css_default.chevron,
						children: /* @__PURE__ */ (0, react_jsx_runtime.jsx)("path", {
							d: "M11.8486 5.5L11.4238 5.92383L8.69727 8.65137C8.44157 8.90706 8.21562 9.13382 8.01172 9.29785C7.79912 9.46883 7.55595 9.61756 7.25 9.66602C7.08435 9.69222 6.91565 9.69222 6.75 9.66602C6.44405 9.61756 6.20088 9.46883 5.98828 9.29785C5.78438 9.13382 5.55843 8.90706 5.30273 8.65137L2.57617 5.92383L2.15137 5.5L3 4.65137L3.42383 5.07617L6.15137 7.80273C6.42595 8.07732 6.59876 8.24849 6.74023 8.3623C6.87291 8.46904 6.92272 8.47813 6.9375 8.48047C6.97895 8.48703 7.02105 8.48703 7.0625 8.48047C7.07728 8.47813 7.12709 8.46904 7.25977 8.3623C7.40124 8.24849 7.57405 8.07732 7.84863 7.80273L10.5762 5.07617L11 4.65137L11.8486 5.5Z",
							fill: "currentColor"
						})
					})
				]
			});
			const notExposedNotice = state.exposed || props.hideNotExposedNotice === true ? null : /* @__PURE__ */ (0, react_jsx_runtime.jsx)("p", {
				className: settings_card_module_css_default.notExposed,
				role: "status",
				children: props.t("settings.notExposed")
			});
			if (!state.exposed && props.renderChildrenWhenNotExposed !== true) return /* @__PURE__ */ (0, react_jsx_runtime.jsxs)("li", {
				className: cardClass,
				children: [header, bodyRegion(notExposedNotice)]
			});
			return /* @__PURE__ */ (0, react_jsx_runtime.jsxs)("li", {
				className: cardClass,
				children: [header, props.headerOnly !== true ? bodyRegion(/* @__PURE__ */ (0, react_jsx_runtime.jsxs)(react_jsx_runtime.Fragment, { children: [
					notExposedNotice,
					!state.writable ? /* @__PURE__ */ (0, react_jsx_runtime.jsx)("p", {
						className: settings_card_module_css_default.readOnly,
						role: "status",
						children: props.t("settings.readOnly")
					}) : null,
					/* @__PURE__ */ (0, react_jsx_runtime.jsx)(CardApply.Provider, {
						value: {
							commit: props.onSave,
							revert: props.onDiscard
						},
						children: props.children
					}),
					props.hideFooter !== true && state.failed ? /* @__PURE__ */ (0, react_jsx_runtime.jsxs)("p", {
						className: settings_card_module_css_default.failed,
						role: "status",
						children: [props.t("settings.saveFailed"), state.failedReason ? " - " + state.failedReason : ""]
					}) : null
				] })) : null]
			});
		}
		const NON_SKIN_BODY_MARKERS = /* @__PURE__ */ new Set(["dshSkinCenter", "dshSidebarCollapsed"]);
		function isSkinActive() {
			return Object.keys(document.body.dataset).some((key) => key.startsWith("dsh") && !NON_SKIN_BODY_MARKERS.has(key));
		}
		const SELECT_CLOSE_MS = 100;
		/**
		* The shared dual-mode select control. While an appearance skin is active it
		* renders the legacy native `<select>` untouched, so element-level skin
		* selectors keep working; under the default appearance it renders a
		* self-drawn `role="listbox"` popup whose open/close is transition-animated.
		* Cards reach it through BooleanField/ChoiceField; editors outside a card
		* (the side-card prefs) bind it directly through onEdit.
		* 双模式下拉框：皮肤激活时用原生 select，默认外观用自绘动画弹层。
		*/
		function SelectField(props) {
			const { id, options, value } = props;
			const [open, setOpen] = (0, react.useState)(false);
			const [closing, setClosing] = (0, react.useState)(false);
			const [phase, setPhase] = (0, react.useState)("initial");
			const [activeIndex, setActiveIndex] = (0, react.useState)(0);
			const closeTimer = (0, react.useRef)(void 0);
			const wrapRef = (0, react.useRef)(null);
			const popupRef = (0, react.useRef)(null);
			const currentIndex = () => {
				const index = options.findIndex((option) => option.value === value);
				return index >= 0 ? index : 0;
			};
			const close = (0, react.useCallback)(() => {
				if (closeTimer.current !== void 0) clearTimeout(closeTimer.current);
				setClosing(true);
				closeTimer.current = setTimeout(() => {
					setClosing(false);
					setOpen(false);
				}, SELECT_CLOSE_MS);
			}, []);
			const openPopup = () => {
				if (closeTimer.current !== void 0) clearTimeout(closeTimer.current);
				setActiveIndex(currentIndex());
				setPhase("initial");
				setClosing(false);
				setOpen(true);
			};
			const commit = (index) => {
				const option = options[index];
				if (option) props.onEdit(option.value);
				close();
			};
			const onTriggerClick = () => {
				if (props.disabled) return;
				if (open && !closing) close();
				else openPopup();
			};
			const onKeyDown = (event) => {
				if (props.disabled) return;
				const count = options.length;
				switch (event.key) {
					case "ArrowDown":
					case "ArrowUp":
					case "Enter":
					case " ":
						event.preventDefault();
						if (!open) openPopup();
						else if (!closing) if (event.key === "ArrowDown") setActiveIndex((index) => (index + 1) % count);
						else if (event.key === "ArrowUp") setActiveIndex((index) => (index - 1 + count) % count);
						else commit(activeIndex);
						break;
					case "Escape":
						if (open) {
							event.preventDefault();
							event.stopPropagation();
							close();
						}
						break;
					case "Tab":
						if (open) close();
						break;
				}
			};
			(0, react.useEffect)(() => () => {
				if (closeTimer.current !== void 0) clearTimeout(closeTimer.current);
			}, []);
			(0, react.useLayoutEffect)(() => {
				if (open && !closing && phase === "initial") {
					popupRef.current?.offsetHeight;
					setPhase("open");
				}
			}, [
				open,
				closing,
				phase
			]);
			(0, react.useEffect)(() => {
				if (!open) return;
				const onPointerDown = (event) => {
					const target = event.target;
					if (target instanceof Node && !wrapRef.current?.contains(target)) close();
				};
				document.addEventListener("pointerdown", onPointerDown);
				return () => document.removeEventListener("pointerdown", onPointerDown);
			}, [open, close]);
			(0, react.useEffect)(() => {
				if (props.disabled && open) close();
			}, [
				props.disabled,
				open,
				close
			]);
			if (isSkinActive()) return /* @__PURE__ */ (0, react_jsx_runtime.jsx)("select", {
				id,
				className: settings_card_module_css_default.select,
				value,
				disabled: props.disabled,
				onChange: (event) => {
					props.onEdit(event.target.value);
				},
				children: options.map((option) => /* @__PURE__ */ (0, react_jsx_runtime.jsx)("option", {
					value: option.value,
					children: option.label
				}, option.value))
			});
			const label = options.find((option) => option.value === value)?.label ?? "";
			const popupClass = closing ? `${settings_card_module_css_default.selectPopup} ${settings_card_module_css_default.selectPopupClose}` : phase === "open" ? `${settings_card_module_css_default.selectPopup} ${settings_card_module_css_default.selectPopupOpen}` : settings_card_module_css_default.selectPopup;
			return /* @__PURE__ */ (0, react_jsx_runtime.jsxs)("div", {
				className: settings_card_module_css_default.selectWrap,
				ref: wrapRef,
				children: [/* @__PURE__ */ (0, react_jsx_runtime.jsxs)("button", {
					type: "button",
					id,
					className: `${settings_card_module_css_default.select} ${settings_card_module_css_default.selectButton}`,
					disabled: props.disabled,
					"aria-haspopup": "listbox",
					"aria-expanded": open,
					"aria-activedescendant": open ? `${id}-o${activeIndex}` : void 0,
					"aria-invalid": props.invalid || void 0,
					onClick: onTriggerClick,
					onKeyDown,
					children: [/* @__PURE__ */ (0, react_jsx_runtime.jsx)("span", {
						className: settings_card_module_css_default.selectLabel,
						children: label
					}), /* @__PURE__ */ (0, react_jsx_runtime.jsx)("svg", {
						width: "14",
						height: "14",
						viewBox: "0 0 14 14",
						fill: "none",
						xmlns: "http://www.w3.org/2000/svg",
						className: open ? `${settings_card_module_css_default.selectChevron} ${settings_card_module_css_default.selectChevronOpen}` : settings_card_module_css_default.selectChevron,
						"aria-hidden": "true",
						children: /* @__PURE__ */ (0, react_jsx_runtime.jsx)("path", {
							d: "M11.8486 5.5L11.4238 5.92383L8.69727 8.65137C8.44157 8.90706 8.21562 9.13382 8.01172 9.29785C7.79912 9.46883 7.55595 9.61756 7.25 9.66602C7.08435 9.69222 6.91565 9.69222 6.75 9.66602C6.44405 9.61756 6.20088 9.46883 5.98828 9.29785C5.78438 9.13382 5.55843 8.90706 5.30273 8.65137L2.57617 5.92383L2.15137 5.5L3 4.65137L3.42383 5.07617L6.15137 7.80273C6.42595 8.07732 6.59876 8.24849 6.74023 8.3623C6.87291 8.46904 6.92272 8.47813 6.9375 8.48047C6.97895 8.48703 7.02105 8.48703 7.0625 8.48047C7.07728 8.47813 7.12709 8.46904 7.25977 8.3623C7.40124 8.24849 7.57405 8.07732 7.84863 7.80273L10.5762 5.07617L11 4.65137L11.8486 5.5Z",
							fill: "currentColor"
						})
					})]
				}), open ? /* @__PURE__ */ (0, react_jsx_runtime.jsx)("div", {
					className: popupClass,
					role: "listbox",
					ref: popupRef,
					children: options.map((option, index) => /* @__PURE__ */ (0, react_jsx_runtime.jsx)("div", {
						id: `${id}-o${index}`,
						role: "option",
						"aria-selected": option.value === value,
						className: `${settings_card_module_css_default.selectOption}${option.value === value ? ` ${settings_card_module_css_default.selectOptionSelected}` : ""}${index === activeIndex && !closing ? ` ${settings_card_module_css_default.selectOptionActive}` : ""}`,
						onClick: () => {
							commit(index);
						},
						children: option.label
					}, option.value))
				}) : null]
			});
		}
		/**
		* A visible segmented group for a small set of mutually exclusive values.
		* Every option stays on screen, so inherit/on/off and short enum fields take
		* one click without opening a popup. The pressed option carries the group's
		* sliding highlight and `aria-pressed`; the group takes the field label as its
		* accessible name.
		*/
		function SegmentField(props) {
			return /* @__PURE__ */ (0, react_jsx_runtime.jsx)(SegmentGroup, {
				id: props.id,
				role: "group",
				"aria-label": props.label,
				"aria-invalid": props.invalid || void 0,
				children: props.options.map((option, index) => {
					const active = option.value === props.value;
					return /* @__PURE__ */ (0, react_jsx_runtime.jsx)("button", {
						type: "button",
						className: settings_card_module_css_default.segment,
						"aria-pressed": active,
						disabled: props.disabled,
						"data-active": active ? "" : void 0,
						"data-segment-index": index,
						onClick: () => {
							if (!active) props.onEdit(option.value);
						},
						children: option.label
					}, option.value);
				})
			});
		}
		/** A boolean field: 继承 / 开 / 关. */
		function BooleanField(props) {
			const segmented = props.presentation !== "select";
			return /* @__PURE__ */ (0, react_jsx_runtime.jsxs)("div", {
				className: settings_card_module_css_default.field,
				children: [
					/* @__PURE__ */ (0, react_jsx_runtime.jsxs)("div", {
						className: settings_card_module_css_default.head,
						children: [segmented ? /* @__PURE__ */ (0, react_jsx_runtime.jsx)("span", {
							className: settings_card_module_css_default.label,
							children: props.label
						}) : /* @__PURE__ */ (0, react_jsx_runtime.jsx)("label", {
							className: settings_card_module_css_default.label,
							htmlFor: props.id,
							children: props.label
						}), props.overridden ? /* @__PURE__ */ (0, react_jsx_runtime.jsxs)("span", {
							className: settings_card_module_css_default.badges,
							children: [/* @__PURE__ */ (0, react_jsx_runtime.jsx)("span", {
								className: settings_card_module_css_default.badge,
								children: props.overriddenLabel
							}), /* @__PURE__ */ (0, react_jsx_runtime.jsx)("button", {
								type: "button",
								className: settings_card_module_css_default.reset,
								disabled: props.disabled,
								onClick: props.onReset,
								children: props.resetLabel
							})]
						}) : null]
					}),
					segmented ? /* @__PURE__ */ (0, react_jsx_runtime.jsx)(SegmentField, {
						id: props.id,
						label: props.label,
						options: [
							{
								value: "",
								label: props.inheritLabel
							},
							{
								value: "true",
								label: props.onLabel
							},
							{
								value: "false",
								label: props.offLabel
							}
						],
						value: props.text,
						disabled: props.disabled,
						invalid: props.invalid,
						onEdit: props.onEdit
					}) : /* @__PURE__ */ (0, react_jsx_runtime.jsx)(SelectField, {
						id: props.id,
						options: [
							{
								value: "",
								label: props.inheritLabel
							},
							{
								value: "true",
								label: props.onLabel
							},
							{
								value: "false",
								label: props.offLabel
							}
						],
						value: props.text,
						disabled: props.disabled,
						invalid: props.invalid,
						onEdit: props.onEdit
					}),
					/* @__PURE__ */ (0, react_jsx_runtime.jsx)("p", {
						className: settings_card_module_css_default.hint,
						title: props.hintTitle,
						children: props.hint
					})
				]
			});
		}
		/** An enumerated field, selecting or segmenting its small choice set. */
		function ChoiceField(props) {
			const segmented = props.presentation === "segment";
			const options = [{
				value: "",
				label: props.inheritLabel
			}, ...props.choices];
			return /* @__PURE__ */ (0, react_jsx_runtime.jsxs)("div", {
				className: settings_card_module_css_default.field,
				children: [
					/* @__PURE__ */ (0, react_jsx_runtime.jsxs)("div", {
						className: settings_card_module_css_default.head,
						children: [segmented ? /* @__PURE__ */ (0, react_jsx_runtime.jsx)("span", {
							className: settings_card_module_css_default.label,
							children: props.label
						}) : /* @__PURE__ */ (0, react_jsx_runtime.jsx)("label", {
							className: settings_card_module_css_default.label,
							htmlFor: props.id,
							children: props.label
						}), props.overridden ? /* @__PURE__ */ (0, react_jsx_runtime.jsxs)("span", {
							className: settings_card_module_css_default.badges,
							children: [/* @__PURE__ */ (0, react_jsx_runtime.jsx)("span", {
								className: settings_card_module_css_default.badge,
								children: props.overriddenLabel
							}), /* @__PURE__ */ (0, react_jsx_runtime.jsx)("button", {
								type: "button",
								className: settings_card_module_css_default.reset,
								disabled: props.disabled,
								onClick: props.onReset,
								children: props.resetLabel
							})]
						}) : null]
					}),
					segmented ? /* @__PURE__ */ (0, react_jsx_runtime.jsx)(SegmentField, {
						id: props.id,
						label: props.label,
						options,
						value: props.text,
						disabled: props.disabled,
						invalid: props.invalid,
						onEdit: props.onEdit
					}) : /* @__PURE__ */ (0, react_jsx_runtime.jsx)(SelectField, {
						id: props.id,
						options,
						value: props.text,
						disabled: props.disabled,
						invalid: props.invalid,
						onEdit: props.onEdit
					}),
					/* @__PURE__ */ (0, react_jsx_runtime.jsx)("p", {
						className: props.invalid ? settings_card_module_css_default.invalid : settings_card_module_css_default.hint,
						title: props.hintTitle,
						children: props.invalid ? props.invalidLabel : props.hint
					})
				]
			});
		}
		/** A boolean field, edited through true/false draft text. */
		function booleanField(field) {
			return {
				field,
				entry: "pick",
				format: (value) => typeof value === "boolean" ? String(value) : "",
				parse: (text) => {
					const trimmed = text.trim();
					if (trimmed === "") return { kind: "clear" };
					if (trimmed === "true") return {
						kind: "set",
						value: true
					};
					if (trimmed === "false") return {
						kind: "set",
						value: false
					};
				}
			};
		}
		/** An enumerated string field; only the listed choices are accepted. An empty draft clears the field. */
		function choiceField(field, choices) {
			return {
				field,
				entry: "pick",
				format: (value) => typeof value === "string" && choices.includes(value) ? value : "",
				parse: (text) => {
					if (text === "") return { kind: "clear" };
					return choices.includes(text) ? {
						kind: "set",
						value: text
					} : void 0;
				}
			};
		}
		/**
		* Applies one card's edits to one settings namespace as the reader makes them.
		*
		* The Host is the only authority on whether a value was accepted — its
		* validators own the constraints no schema can express — so the outcome is
		* read back from the section rather than predicted here. A write that did not
		* land puts each pick back to the stored value, the way a switch that could not
		* flip springs back, and keeps typed text so the reader can correct it instead
		* of retyping.
		*/
		var CardForm = class {
			scope;
			specs;
			staged = /* @__PURE__ */ new Map();
			listeners = /* @__PURE__ */ new Set();
			/** The form subscription installed in the constructor; released by dispose(). */
			disposeForm;
			disposed = false;
			/** The pending write of typed text, waiting for typing to pause. */
			typePause;
			saving = false;
			/** A save asked for while one was in flight; it runs once the first settles (#1754). */
			saveQueued = false;
			failed = false;
			failedReason;
			/** @param scope - the bound configuration form for this card's namespace. */
			constructor(scope, specs) {
				this.scope = scope;
				this.specs = new Map(specs.map((spec) => [spec.field, spec]));
				this.disposeForm = scope.subscribe(() => {
					this.publish();
				});
			}
			/**
			* Release the form subscription and every bound store listener. The card
			* must call this on teardown; later calls are no-ops.
			*/
			dispose() {
				if (this.disposed) return;
				this.disposed = true;
				clearTimeout(this.typePause);
				this.disposeForm();
				this.listeners.clear();
			}
			/** Publish a projection of this form, rebuilt whenever the form or a draft changes. */
			bind(project) {
				const store = (0, _deepseek_ai_dsh_client_store.createSnapshotStore)(project());
				this.listeners.add(() => {
					store.set(project());
				});
				return store;
			}
			/** Read the card-level state: what the Host serves, and what is still waiting to be written. */
			shell() {
				const snapshot = this.scope.getSnapshot();
				const plan = this.plan();
				return {
					available: snapshot.status !== "loading",
					exposed: snapshot.status === "ready",
					writable: snapshot.writable,
					dirty: plan.length > 0,
					invalid: plan.some((item) => item.judge === void 0),
					saving: this.saving,
					failed: this.failed,
					...this.failedReason === void 0 ? {} : { failedReason: this.failedReason }
				};
			}
			/** Read one field's state from the effective section and its staged draft. */
			field(field) {
				const spec = this.specOf(field);
				const staged = this.staged.get(field);
				if (staged === void 0) return {
					text: spec.format(this.sectionValue(field)),
					overridden: this.stored(field),
					invalid: false
				};
				const write = staged.clear ? { kind: "clear" } : spec.parse(staged.text);
				return {
					text: staged.text,
					overridden: write?.kind === "set",
					invalid: write === void 0
				};
			}
			/** The actions the card's slot registration injects. */
			actions() {
				return {
					edit: (field, text) => {
						this.stage(field, {
							text,
							clear: false
						});
					},
					resetField: (field) => {
						this.stage(field, {
							text: this.specOf(field).format(this.baseValue(field)),
							clear: true
						});
					},
					save: () => {
						this.applyNow();
					},
					discard: () => {
						clearTimeout(this.typePause);
						if (this.staged.size === 0 && !this.failed) return;
						this.staged.clear();
						this.failed = false;
						this.failedReason = void 0;
						this.publish();
					}
				};
			}
			/**
			* Run one write, and re-run it once if another was asked for while this one
			* was still in flight.
			*
			* A write is a Host round trip that also drives the profile reconcile, and
			* the Host runs it inside one exclusive transaction. Answering an edit that
			* arrives mid-flight by returning immediately dropped it with no explanation
			* (#1754). Serializing instead means an edit made while another write is
			* still settling is written against the settled state.
			* @returns settlement after the mutation and the read-back.
			*/
			async requestSave() {
				if (this.saving) {
					this.saveQueued = true;
					return;
				}
				await this.save();
				if (!this.saveQueued) return;
				this.saveQueued = false;
				await this.requestSave();
			}
			/**
			* Write every valid draft in one atomic form mutation, then re-seed from
			* what the Host accepted. A draft the field does not accept stays on screen,
			* unwritten, without holding the others back.
			*
			* The batch rides one mutate, so cross-field validate hooks (baseURL+model)
			* judge it as a unit: the Host either applies every write or refuses the
			* batch. The form contract answers a refusal or a skipped write with `false`
			* (it recovers with a fresh Host view instead of throwing), so the outcome is
			* judged twice: the answer itself, and then the settled snapshot read back
			* one planned write at a time. One missed write fails the whole batch. A
			* transport that rejects instead (the dsh-web bridge controller on a dead
			* connection) reports through the same failure path with its rejection
			* message. A batch that did not land puts its picks and clears back to the
			* stored value and keeps its typed text, so the reader can correct it.
			* @returns settlement after the mutation and the read-back.
			*/
			async save() {
				const valid = this.plan().filter((item) => item.judge !== void 0);
				if (valid.length === 0 || this.saving) return;
				const pending = /* @__PURE__ */ new Map();
				for (const item of valid) pending.set(item.field, this.staged.get(item.field));
				this.saving = true;
				this.failed = false;
				this.failedReason = void 0;
				this.publish();
				const ops = valid.map((item) => item.op.op === "set" ? {
					op: "set",
					path: [item.field],
					value: item.op.value
				} : {
					op: "unset",
					path: [item.field]
				});
				let failedReason;
				let accepted = false;
				try {
					accepted = await this.scope.mutate(ops);
				} catch (error) {
					failedReason = error instanceof Error ? error.message : String(error);
				}
				const landed = accepted && failedReason === void 0 && valid.every((item) => item.judge());
				for (const [field, before] of pending) {
					if (this.staged.get(field) !== before) continue;
					if (landed || before === void 0 || before.clear || this.specOf(field).entry === "pick") this.staged.delete(field);
				}
				this.saving = false;
				this.failed = !landed;
				this.failedReason = failedReason;
				this.publish();
			}
			/**
			* Every staged edit a write would carry. An entry whose draft is not a value
			* its field accepts carries no write: the form is still dirty, and the draft
			* stays on screen rather than being dropped. A staged edit that matches the
			* effective section is not a write at all.
			* @returns the planned writes, in the order the fields were staged.
			*/
			plan() {
				const plan = [];
				for (const [field, staged] of this.staged) {
					const spec = this.specOf(field);
					if (staged.clear) {
						if (this.stored(field)) plan.push({
							field,
							op: {
								field,
								op: "unset"
							},
							judge: () => this.landedUnset(field)
						});
						continue;
					}
					if (staged.text === spec.format(this.sectionValue(field))) continue;
					const write = spec.parse(staged.text);
					if (write === void 0) plan.push({
						field,
						op: {
							field,
							op: "unset"
						},
						judge: void 0
					});
					else if (write.kind === "clear") plan.push({
						field,
						op: {
							field,
							op: "unset"
						},
						judge: () => this.landedUnset(field)
					});
					else plan.push({
						field,
						op: {
							field,
							op: "set",
							value: write.value
						},
						judge: () => this.landedSet(field, write.value)
					});
				}
				return plan;
			}
			/**
			* Read-back judgment for a planned set: the user layer must hold the
			* intended value once the mutation has settled.
			*/
			landedSet(field, value) {
				if (this.specOf(field).secret) return true;
				return this.userLayer()?.[field] === value;
			}
			/**
			* Read-back judgment for a planned unset: the field must be gone from the
			* user layer once the mutation has settled.
			*/
			landedUnset(field) {
				return !this.stored(field);
			}
			/**
			* Take one edit and schedule its write: a pick or a clear is written now,
			* typed text once typing has rested for TYPE_PAUSE_MS.
			*/
			stage(field, edit) {
				this.staged.set(field, edit);
				this.failed = false;
				this.failedReason = void 0;
				this.publish();
				if (edit.clear || this.specOf(field).entry === "pick") {
					this.applyNow();
					return;
				}
				clearTimeout(this.typePause);
				this.typePause = setTimeout(() => {
					this.applyNow();
				}, 600);
			}
			/** Write every pending draft now, taking the place of a waiting pause. */
			applyNow() {
				clearTimeout(this.typePause);
				this.typePause = void 0;
				if (this.disposed) return;
				this.requestSave();
			}
			specOf(field) {
				const spec = this.specs.get(field);
				if (spec === void 0) throw new Error(`settings card has no field ${field}`);
				return spec;
			}
			snapshotOf() {
				return this.scope.getSnapshot();
			}
			sectionValue(field) {
				return this.snapshotOf().value?.[field];
			}
			baseValue(field) {
				return this.snapshotOf().base?.[field];
			}
			userLayer() {
				return this.snapshotOf().user;
			}
			stored(field) {
				const user = this.userLayer();
				return user !== void 0 && Object.hasOwn(user, field);
			}
			publish() {
				for (const listener of this.listeners) listener();
			}
		};
		//#endregion
		//#region src/client/LiangShenSettingsCard.tsx
		/** Wire presentations the tool catalog accepts (mirrors the Host schema). */
		const PRESENTATION_CHOICES = ["ptc", "native"];
		/** Bridges the `liangshen` settings form onto the card's staged form. */
		var LiangShenSettingsCardController = class {
			form;
			store;
			/** @param scope - the bound configuration form of the entry that owns this namespace. */
			constructor(scope) {
				this.form = new CardForm(scope, [
					booleanField("enabled"),
					booleanField("announceToAgent"),
					choiceField("presentation", PRESENTATION_CHOICES),
					booleanField("dispatcher")
				]);
				this.store = this.form.bind(() => this.projection());
			}
			projection() {
				return {
					...this.form.shell(),
					enabled: this.form.field("enabled"),
					announceToAgent: this.form.field("announceToAgent"),
					presentation: this.form.field("presentation"),
					dispatcher: this.form.field("dispatcher")
				};
			}
			/**
			* Build the face the card's slot registration injects.
			* @returns the card's snapshot and its form actions.
			*/
			inject() {
				return {
					hooks: { liangShenSettingsCard: this.store },
					...this.form.actions()
				};
			}
			/** Release the card's scope subscription and bound stores. */
			dispose() {
				this.form.dispose();
			}
		};
		/**
		* Render the LiangShen card.
		* @param props - locale copy, the card snapshot, and its form actions.
		* @returns the card.
		*/
		function LiangShenSettingsCard(props) {
			const { t } = props;
			const state = props.useLiangShenSettingsCard((snapshot) => snapshot);
			const fieldProps = {
				overriddenLabel: t("settings.overridden"),
				resetLabel: t("settings.reset"),
				invalidLabel: t("settings.invalidValue"),
				disabled: !state.writable,
				inheritLabel: t("settings.inherit")
			};
			return /* @__PURE__ */ (0, react_jsx_runtime.jsxs)(PluginSettingsCard, {
				t,
				titleKey: "settings.title",
				descriptionKey: "settings.description",
				icon: /* @__PURE__ */ (0, react_jsx_runtime.jsx)(LiangShenMark, {}),
				defaultOpen: false,
				state,
				renderChildrenWhenNotExposed: true,
				hideNotExposedNotice: true,
				onSave: props.save,
				onDiscard: props.discard,
				children: [
					/* @__PURE__ */ (0, react_jsx_runtime.jsx)(BooleanField, {
						id: "settings-liangshen-enabled",
						label: t("settings.enabled"),
						hint: t("settings.enabledHint"),
						onLabel: t("settings.on"),
						offLabel: t("settings.off"),
						...fieldProps,
						...state.enabled,
						onEdit: (text) => {
							props.edit("enabled", text);
						},
						onReset: () => {
							props.resetField("enabled");
						}
					}),
					/* @__PURE__ */ (0, react_jsx_runtime.jsx)(BooleanField, {
						id: "settings-liangshen-announce",
						label: t("settings.announceToAgent"),
						hint: t("settings.announceToAgentHint"),
						onLabel: t("settings.on"),
						offLabel: t("settings.off"),
						...fieldProps,
						...state.announceToAgent,
						onEdit: (text) => {
							props.edit("announceToAgent", text);
						},
						onReset: () => {
							props.resetField("announceToAgent");
						}
					}),
					/* @__PURE__ */ (0, react_jsx_runtime.jsx)(ChoiceField, {
						id: "settings-liangshen-presentation",
						label: t("settings.presentation"),
						hint: t("settings.presentationHint"),
						choices: PRESENTATION_CHOICES.map((choice) => ({
							value: choice,
							label: t(`presentation.${choice}`)
						})),
						presentation: "segment",
						...fieldProps,
						...state.presentation,
						onEdit: (text) => {
							props.edit("presentation", text);
						},
						onReset: () => {
							props.resetField("presentation");
						}
					}),
					/* @__PURE__ */ (0, react_jsx_runtime.jsx)(BooleanField, {
						id: "settings-liangshen-dispatcher",
						label: t("settings.dispatcher"),
						hint: t("settings.dispatcherHint"),
						onLabel: t("settings.on"),
						offLabel: t("settings.off"),
						...fieldProps,
						...state.dispatcher,
						onEdit: (text) => {
							props.edit("dispatcher", text);
						},
						onReset: () => {
							props.resetField("dispatcher");
						}
					})
				]
			});
		}
		//#endregion
		//#region src/client/locales.ts
		/**
		* Lever copy: zh-first dictionary with an English counterpart. The zh side is
		* the key-set source of truth; `packages/dsh-i18n` mirrors the keys into the
		* centralized ru dictionary and `pnpm i18n:check` enforces the parity.
		*/
		/** Lever copy, key source of truth. */
		const zh = {
			"lever.a11y": "梁神模式拨杆",
			"lever.name": "梁神模式",
			"lever.hint.pull": "拨下拨杆：开启「梁神模式」",
			"lever.hint.push": "上拨拨杆：返回「{preset}」",
			"lever.hint.locked": "会话已开始，模式不可再更改",
			"lever.hint.missing": "未找到「梁神模式」预设，请先启用该插件行",
			"lever.state.on": "梁神模式",
			"lever.state.off": "普通模式",
			"lever.busy": "正在切换…",
			"lever.failed.locked": "会话已经开始，模式已锁定",
			"lever.failed.missing": "没有找到「梁神模式」预设",
			"lever.failed.timeout": "切换超时，请重试",
			"lever.failed.failed": "切换失败：{reason}",
			"burst.line1": "三秒，三辈子的代码",
			"burst.line2": "文言文 · 二进制 · 摩斯电码",
			"settings.title": "梁神模式",
			"settings.description": "梁神模式的开关、工具面与调度身份。",
			"settings.enabled": "总开关",
			"settings.enabledHint": "关掉后不再声明预设。",
			"settings.announceToAgent": "公告给 agent",
			"settings.announceToAgentHint": "每一轮系统提示都带上本插件公告。",
			"settings.presentation": "工具面",
			"settings.presentationHint": "ptc 把工具收进 run_code，native 保留原生清单。",
			"settings.dispatcher": "调度身份",
			"settings.dispatcherHint": "按调度 Agent 工作：分诊、访谈、派发子代理。",
			"settings.on": "开",
			"settings.off": "关",
			"settings.inherit": "继承",
			"settings.overridden": "已修改",
			"settings.reset": "恢复默认",
			"settings.notExposed": "这个版本的 DSH 没有开放梁神模式的设置。",
			"settings.readOnly": "设置只读。",
			"settings.expand": "展开设置",
			"settings.collapse": "收起设置",
			"settings.saveFailed": "没有保存成功。",
			"settings.invalidValue": "填一个可用的值。",
			"presentation.ptc": "ptc",
			"presentation.native": "native"
		};
		/** English counterpart; the key set mirrors {@link zh} exactly. */
		const en = {
			"lever.a11y": "LiangShen mode lever",
			"lever.name": "LiangShen mode",
			"lever.hint.pull": "Pull the lever down to turn on LiangShen mode",
			"lever.hint.push": "Push the lever up to return to \"{preset}\"",
			"lever.hint.locked": "The session has started, so its mode can no longer change",
			"lever.hint.missing": "The LiangShen preset is not installed; enable that plugin row first",
			"lever.state.on": "LiangShen",
			"lever.state.off": "Standard",
			"lever.busy": "Switching…",
			"lever.failed.locked": "The session already started, so the mode is locked",
			"lever.failed.missing": "The LiangShen preset was not found",
			"lever.failed.timeout": "The switch timed out; try again",
			"lever.failed.failed": "Switch failed: {reason}",
			"burst.line1": "Three seconds, three lifetimes of code",
			"burst.line2": "Classical Chinese · Binary · Morse code",
			"settings.title": "LiangShen mode",
			"settings.description": "The mode switch, the wire presentation and the dispatcher identity.",
			"settings.enabled": "Master switch",
			"settings.enabledHint": "When off, the preset is no longer declared.",
			"settings.announceToAgent": "Announce to agents",
			"settings.announceToAgentHint": "Every system prompt carries this plugin note.",
			"settings.presentation": "Wire",
			"settings.presentationHint": "ptc folds tools into run_code; native keeps the native roster.",
			"settings.dispatcher": "Dispatcher",
			"settings.dispatcherHint": "Works as a dispatcher: triage, interview, then dispatch subagents.",
			"settings.on": "On",
			"settings.off": "Off",
			"settings.inherit": "Inherit",
			"settings.overridden": "Changed",
			"settings.reset": "Reset to default",
			"settings.notExposed": "This DSH version does not open the LiangShen settings.",
			"settings.readOnly": "Settings are read-only.",
			"settings.expand": "Show settings",
			"settings.collapse": "Hide settings",
			"settings.saveFailed": "Not saved.",
			"settings.invalidValue": "Enter a value this field accepts.",
			"presentation.ptc": "ptc",
			"presentation.native": "native"
		};
		//#endregion
		//#region src/client/plugin-card-seat.ts
		/**
		* Family plugin-card seat.
		*
		* A family plugin contributes its settings card to whichever plugin-card seat
		* the running host actually renders:
		*
		* - `web-ui.plugin.item` — the list seat declared by the dsh-web-settings
		*   group section (this family's own first-level "Web UI plugins" section);
		* - `plugins.bundle.config` — the official keyed seat of the harness's plugin
		*   manager page, keyed by the bundle's package name and rendered on that
		*   bundle's page. alpha.2 removed the `settings.plugin.item` keyed seat of the
		*   `ui-settings-plugins` tab that this helper used before, so a card keyed by
		*   its settings namespace has no seat to land in any more.
		*
		* SEAT SELECTION IS NOT A DECLARATION PROBE. The official plugin surface
		* belongs to the harness bundle and declares its seats before any external
		* plugin's `apply()` runs, so "is the official seat declared?" answers yes even
		* in the deployment whose whole point is the family group. Choosing on that
		* probe sends every family card to the official page and leaves the group's own
		* section permanently empty — the family of reports where the section renders
		* its heading and zero cards.
		*
		* The signal that actually distinguishes the two deployments is whether
		* dsh-web-settings is loaded: it is the package that owns the group section and
		* it publishes the `webUiSettings` service during `apply()`, which every
		* family plugin already reads for its settings form. Group loaded -> the family
		* seat; group absent -> the official seat.
		*
		* The decision is re-evaluated on every `slots/changed` because the group may
		* apply after this plugin (the family aggregate orders it first, a profile that
		* installs the group separately need not): the initial contribution goes to the
		* official seat, then moves to the family seat the moment the group's section
		* registers. The entry is disposed before the replacement is registered, so a
		* card is never in two seats at once.
		*
		* The shared tree has no client-SDK dependency, so this module reads its
		* context through the structural shape below; callers pass the plugin's own
		* `ctx`.
		*/
		/** The family list seat key. */
		const FAMILY_PLUGIN_CARD_SEAT = "web-ui.plugin.item";
		/** The official keyed plugin-card seat key (the alpha.2 bundle-configuration seat). */
		const OFFICIAL_PLUGIN_CARD_SEAT = "plugins.bundle.config";
		/** The service dsh-web-settings publishes while it is loaded. */
		const FAMILY_GROUP_SERVICE = "webUiSettings";
		/**
		* Whether the family group (dsh-web-settings) is loaded in this page. The
		* service is the group package's own contract, so the probe cannot be fooled
		* by a harness release that starts declaring the official seat differently.
		*/
		function familyGroupLoaded(ctx) {
			const get = ctx.get;
			if (typeof get !== "function") return false;
			try {
				return get.call(ctx, FAMILY_GROUP_SERVICE) !== void 0;
			} catch {
				return false;
			}
		}
		/** Report a refused registration instead of leaving the user with no card. */
		function warnRefusedSeat(seat, error) {
			try {
				console.warn(`[dsh-web] plugin card registration into "${seat}" was refused; the card will not render`, error);
			} catch {}
		}
		/**
		* Contribute one family plugin card to the seat this host renders, following
		* the group if it loads later. The entry is disposed and re-registered on a
		* seat change, never duplicated.
		* @param ctx - client context (its slot registry decides the seat).
		* @param seat - the card contribution.
		*/
		function installPluginCard(ctx, seat) {
			const slots = ctx.slots;
			const component = seat.component;
			const inject = seat.inject;
			let dispose;
			let current;
			/**
			* Re-entrancy latch. The registry emits a change event synchronously from
			* inside both `register` and the previous entry's disposer, so an unguarded
			* reconcile would re-enter itself mid-move and register the card twice into
			* the seat it is leaving ("already has an entry for key ...").
			*/
			let reconciling = false;
			/** Reconcile the contribution with the currently live seat (no-op when unchanged). */
			const reconcile = () => {
				if (reconciling) return;
				const target = familyGroupLoaded(ctx) ? FAMILY_PLUGIN_CARD_SEAT : OFFICIAL_PLUGIN_CARD_SEAT;
				if (current === target) return;
				if (typeof slots.spec === "function" && slots.spec(target) === void 0) return;
				reconciling = true;
				const previous = dispose;
				dispose = void 0;
				current = void 0;
				previous?.();
				try {
					dispose = slots.register(target === "web-ui.plugin.item" ? {
						name: FAMILY_PLUGIN_CARD_SEAT,
						id: seat.id,
						...seat.order === void 0 ? {} : { order: seat.order },
						...seat.label === void 0 ? {} : { label: seat.label },
						locale: seat.locale,
						...seat.children === void 0 ? {} : { children: seat.children },
						...seat.inject === void 0 ? {} : { inject }
					} : {
						name: OFFICIAL_PLUGIN_CARD_SEAT,
						key: seat.bundle,
						locale: seat.locale,
						...seat.children === void 0 ? {} : { children: seat.children },
						...seat.inject === void 0 ? {} : { inject }
					}, component);
					current = target;
				} catch (error) {
					warnRefusedSeat(target, error);
				} finally {
					reconciling = false;
				}
			};
			if (typeof ctx.on === "function") try {
				ctx.on("slots/changed", (() => {
					reconcile();
				}));
			} catch {}
			reconcile();
		}
		//#endregion
		//#region src/client/settings-entry-form.ts
		/** The snapshot a form reports before the Host has answered with this entry. */
		function pendingSnapshot() {
			return {
				status: "loading",
				value: void 0,
				base: void 0,
				user: void 0,
				revision: void 0,
				writable: false
			};
		}
		/**
		* Create a settings form bound to the profile entry id this Host serves, and
		* rebound whenever the shared describe mirror names a different one of this
		* package's rows.
		* @param options - the shared forms service and this package's candidate row ids.
		* @returns a form delegating to the currently resolved entry's own form.
		*/
		function createServedEntryForm(options) {
			const { forms, entryIds } = options;
			const fallbackId = entryIds[0];
			const namespaceId = entryIds[entryIds.length - 1];
			const listeners = /* @__PURE__ */ new Set();
			let boundId;
			let bound;
			let offBound;
			let snapshot = pendingSnapshot();
			/** Republish: the delegated snapshot when one is bound, the pending one otherwise. */
			const publish = () => {
				if (bound !== void 0) snapshot = bound.getSnapshot();
				for (const listener of [...listeners]) listener();
			};
			/**
			* The entry id the mirror currently justifies. An unanswered or empty mirror
			* is not evidence of absence, so it keeps the first candidate; a mirror that
			* answers without any of this package's rows leaves the namespace itself.
			* @returns the entry id to bind.
			*/
			const resolve = () => {
				let served;
				try {
					served = forms.describe().getSnapshot().view?.namespaces.map((row) => row.ns);
				} catch {
					served = void 0;
				}
				if (served === void 0 || served.length === 0) return fallbackId;
				return entryIds.find((id) => served.includes(id)) ?? namespaceId;
			};
			/** Bind (or rebind) the resolved entry's form; a no-op while it is unchanged. */
			const bind = () => {
				const target = resolve();
				if (target === boundId) return;
				offBound?.();
				offBound = void 0;
				let form;
				try {
					form = forms.get(target);
				} catch {
					boundId = void 0;
					return;
				}
				boundId = target;
				bound = form;
				offBound = form.subscribe(() => {
					publish();
				});
				publish();
			};
			try {
				forms.describe().subscribe(() => {
					bind();
				});
			} catch {}
			bind();
			return {
				getSnapshot: () => snapshot,
				subscribe: (listener) => {
					listeners.add(listener);
					return () => {
						listeners.delete(listener);
					};
				},
				set: (field, value) => bound?.set(field, value) ?? Promise.resolve(false),
				unset: (field) => bound?.unset(field) ?? Promise.resolve(false),
				mutate: (ops, expectedRevision) => bound?.mutate(ops, expectedRevision) ?? Promise.resolve(false)
			};
		}
		//#endregion
		//#region src/client/index.ts
		/** Locale namespace this half owns. */
		const NS = "liangshen";
		/**
		* Settings namespace the settings card edits: the family identity of this
		* plugin's own settings form, and the row id a standalone bundle install
		* carries. The aggregate install mounts the generated `web-ui-liangshen` row
		* instead, and the family binder resolves between the two.
		*/
		const SETTINGS_NAMESPACE = "liangshen";
		/**
		* Profile entry id the family aggregate's generated row carries — the shape
		* nearly every user runs, and the id the shared-forms fallback binds when the
		* family binder cannot resolve the namespace.
		*/
		const AGGREGATE_ENTRY_ID = "web-ui-liangshen";
		/** Profile entry ids this package's patch rows carry, most specific first. */
		const LIANGSHEN_ENTRY_IDS = [
			AGGREGATE_ENTRY_ID,
			"ui-liangshen",
			SETTINGS_NAMESPACE
		];
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
		function servedEntryId(forms) {
			let served;
			try {
				served = forms.describe().getSnapshot().view?.namespaces.map((view) => view.ns);
			} catch {
				served = void 0;
			}
			if (served === void 0 || served.length === 0) return AGGREGATE_ENTRY_ID;
			return LIANGSHEN_ENTRY_IDS.find((id) => served.includes(id)) ?? "liangshen";
		}
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
		function bindSettingsForm(ctx) {
			const binder = ctx.get("webUiSettings");
			if (binder !== void 0 && typeof binder.bind === "function") return binder.bind({ namespace: SETTINGS_NAMESPACE });
			return createServedEntryForm({
				forms: ctx.configForms,
				entryIds: LIANGSHEN_ENTRY_IDS
			});
		}
		/**
		* Required client services: the slot registry, locale, sessions, the shared
		* configuration forms, and the roster Remote. Both `remote` and
		* `remote.agentPresets` are declared: the context proxy refuses an uninjected
		* service, and a nested service name does not imply its parent, so reading
		* `ctx.remote.agentPresets` needs `remote` as well.
		*/
		const inject = [
			"slots",
			"locale",
			"sessions",
			"configForms",
			"remote",
			"remote.agentPresets"
		];
		/**
		* Mount the lever: register the copy, follow the roster and the current
		* session, and claim the composer tool row.
		* @param ctx - the browser plugin context.
		*/
		function apply(ctx) {
			ctx.effect(() => {
				try {
					return ctx.locale.register(NS, {
						zh,
						en
					});
				} catch {
					return () => {};
				}
			}, "liangshen: lever dictionaries");
			const controller = new LeverController(ctx);
			ctx.effect(() => () => controller.dispose(), "liangshen: lever controller");
			try {
				controller.start();
			} catch {}
			try {
				const settingsCard = new LiangShenSettingsCardController(bindSettingsForm(ctx));
				installPluginCard(ctx, {
					bundle: "@linxin666/dsh-liangshen",
					id: "liangshen",
					order: 120,
					locale: NS,
					inject: () => settingsCard.inject(),
					component: LiangShenSettingsCard
				});
				ctx.effect(() => () => {
					settingsCard.dispose();
				}, "liangshen: settings card");
			} catch {}
			ctx.slots.inject("conversation.input.right", () => {
				try {
					const unregister = ctx.slots.register({
						name: "conversation.input.right",
						id: "liangshen-lever",
						order: 20,
						inject: () => controller.face()
					}, LiangShenLever);
					return () => {
						unregister();
					};
				} catch {
					return () => {};
				}
			});
		}
		//#endregion
		exports.LIANGSHEN_PRESET_ID = LIANGSHEN_PRESET_ID;
		exports.LeverController = LeverController;
		exports.LiangShenLever = LiangShenLever;
		exports.NS = NS;
		exports.SETTINGS_NAMESPACE = SETTINGS_NAMESPACE;
		exports.apply = apply;
		exports.bindSettingsForm = bindSettingsForm;
		exports.inject = inject;
		exports.leverState = leverState;
		exports.restoreTarget = restoreTarget;
		exports.servedEntryId = servedEntryId;
		return module.exports;
	}
});

//# sourceMappingURL=client.js.map