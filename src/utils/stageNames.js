// Crop cycle stage comes from the backend as a raw enum-ish string (agritrack.CropCycles.
// CurrentStage: 'LandPreparation', 'Sowing', ...) — this maps it to the selected language's
// short stage label (cropCycle.stage*), the same ones StageProgressBar's labels use, so a
// stage pill reads correctly regardless of language instead of always showing the raw English.
const STAGE_KEYS = {
  LandPreparation: 'stageLandPrep',
  Sowing: 'stageSow',
  Germination: 'stageGerm',
  Vegetative: 'stageVeg',
  Flowering: 'stageFlower',
  Fruiting: 'stageFruit',
  Harvested: 'stageHarvested',
};

export function translateStageName(stage, cropCycle) {
  if (!stage) return stage;
  const key = STAGE_KEYS[stage];
  return key ? cropCycle[key] : stage;
}
