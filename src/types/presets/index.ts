const PRESETS = [
  "custom",
  "this-month",
  "last-month",
  "last-3-months",
] as const;

type Preset = (typeof PRESETS)[number];

type ResolvedRange = {
  preset: Preset;
  from: Date | string;
  to: Date | string;
};

export { PRESETS, Preset, ResolvedRange };
