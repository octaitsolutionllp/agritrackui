// Crop type names come from the backend in English (agritrack.CropTypes.Name) — this maps
// them to the selected language using the common.* dictionary, falling back to the raw
// English name for any crop type not yet translated (e.g. a future custom crop type).
export function translateCropName(name, common) {
  if (!name) return name;
  return common[name.toLowerCase()] ?? name;
}
