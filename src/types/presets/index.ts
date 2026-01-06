const PRESETS = [
  "this-month",
  "last-month",
  "last-3-months",
  "custom",
] as const;

type Preset = (typeof PRESETS)[number];

type ResolvedRange<T = string> = {
  preset: Preset;
  from: T;
  to: T;
};

export { PRESETS, Preset, ResolvedRange };
