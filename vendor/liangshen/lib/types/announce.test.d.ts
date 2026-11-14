/**
 * The host half against a fake cordis context: announcing (issue #839) and the
 * preset DECLARATION that replaces the pre-0.1.7 preset-file sync.
 *
 * Declare = enabled: activation registers the bundled preset with
 * `ctx.agentPresets` and keeps the returned disposer, a committed settings write
 * re-declares through `loader/volatile-update`, and unloading releases the
 * registration. Each test re-imports the module so the mount-once guard cannot
 * swallow a second apply call.
 */
export {};
