/**
 * The composition reader the preset declaration is built from. It is the only
 * thing standing between the shipped `agent.cordis.yml` and the registry, and
 * it must not guess: these tests fence the supported subset against the real
 * file, the settings overlay, and every construct it refuses.
 */
export {};
