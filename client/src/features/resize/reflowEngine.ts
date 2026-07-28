import type {
  BrandProfile,
  CanvasPreset,
  DesignDiff,
  FabricJsonDesign,
  FabricJsonObject,
  ReflowOptions,
  ReflowResult,
  ReflowWarning,
} from "./types";

type Bounds = {
  left: number;
  top: number;
  right: number;
  bottom: number;
  width: number;
  height: number;
  centerX: number;
  centerY: number;
};

type IndexedObject = {
  object: FabricJsonObject;
  index: number;
  bounds: Bounds;
};

function clamp(value: number, min: number, max: number) {
  return Math.min(max, Math.max(min, value));
}

function safeNumber(value: unknown, fallback: number) {
  return typeof value === "number" && Number.isFinite(value) ? value : fallback;
}

function createId(prefix: string) {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return `${prefix}-${crypto.randomUUID()}`;
  }

  return `${prefix}-${Date.now().toString(36)}-${Math.random()
    .toString(36)
    .slice(2)}`;
}

function cloneDesign(
  sourceDesign: string | FabricJsonDesign
): FabricJsonDesign {
  const source =
    typeof sourceDesign === "string"
      ? (JSON.parse(sourceDesign) as FabricJsonDesign)
      : sourceDesign;

  return JSON.parse(JSON.stringify(source)) as FabricJsonDesign;
}

function getObjectBounds(object: FabricJsonObject): Bounds {
  const left = safeNumber(object.left, 0);
  const top = safeNumber(object.top, 0);
  const width = Math.max(0, safeNumber(object.width, 0));
  const height = Math.max(0, safeNumber(object.height, 0));
  const scaleX = safeNumber(object.scaleX, 1);
  const scaleY = safeNumber(object.scaleY, 1);
  const displayWidth = Math.abs(width * scaleX);
  const displayHeight = Math.abs(height * scaleY);
  const right = left + displayWidth;
  const bottom = top + displayHeight;

  return {
    left,
    top,
    right,
    bottom,
    width: displayWidth,
    height: displayHeight,
    centerX: left + displayWidth / 2,
    centerY: top + displayHeight / 2,
  };
}

function mergeBounds(bounds: Bounds[]): Bounds | null {
  if (bounds.length === 0) {
    return null;
  }

  const left = Math.min(...bounds.map(item => item.left));
  const top = Math.min(...bounds.map(item => item.top));
  const right = Math.max(...bounds.map(item => item.right));
  const bottom = Math.max(...bounds.map(item => item.bottom));

  return {
    left,
    top,
    right,
    bottom,
    width: right - left,
    height: bottom - top,
    centerX: left + (right - left) / 2,
    centerY: top + (bottom - top) / 2,
  };
}

function isTextObject(object: FabricJsonObject) {
  return (
    object.type === "textbox" ||
    object.type === "i-text" ||
    object.type === "text"
  );
}

function isImageObject(object: FabricJsonObject) {
  return object.type === "image";
}

function countTextObjects(object: FabricJsonObject): number {
  const childCount = Array.isArray(object.objects)
    ? object.objects.reduce(
        (count, child) => count + countTextObjects(child),
        0
      )
    : 0;

  return (isTextObject(object) ? 1 : 0) + childCount;
}

function isProbableBackground(
  item: IndexedObject,
  sourceWidth: number,
  sourceHeight: number
) {
  const { object, bounds, index } = item;
  const coversMostCanvas =
    bounds.width >= sourceWidth * 0.82 &&
    bounds.height >= sourceHeight * 0.82 &&
    bounds.left <= sourceWidth * 0.12 &&
    bounds.top <= sourceHeight * 0.12;

  if (index === 0 && coversMostCanvas) {
    return true;
  }

  return (
    isImageObject(object) &&
    bounds.width >= sourceWidth * 0.9 &&
    bounds.height >= sourceHeight * 0.9
  );
}

function scaleBackgroundObject(
  object: FabricJsonObject,
  targetWidth: number,
  targetHeight: number
) {
  const baseWidth = Math.max(1, safeNumber(object.width, targetWidth));
  const baseHeight = Math.max(1, safeNumber(object.height, targetHeight));

  if (isImageObject(object)) {
    const scale = Math.max(targetWidth / baseWidth, targetHeight / baseHeight);
    object.scaleX = scale;
    object.scaleY = scale;
    object.left = (targetWidth - baseWidth * scale) / 2;
    object.top = (targetHeight - baseHeight * scale) / 2;
    return;
  }

  object.left = 0;
  object.top = 0;
  object.scaleX = targetWidth / baseWidth;
  object.scaleY = targetHeight / baseHeight;
}

function reflowContentObject(
  object: FabricJsonObject,
  sourceBounds: Bounds,
  targetLeft: number,
  targetTop: number,
  scale: number,
  warnings: ReflowWarning[],
  layerIndex: number,
  preserveTextHierarchy: boolean
) {
  const left = safeNumber(object.left, 0);
  const top = safeNumber(object.top, 0);
  object.left = targetLeft + (left - sourceBounds.left) * scale;
  object.top = targetTop + (top - sourceBounds.top) * scale;

  if (isTextObject(object) && preserveTextHierarchy) {
    const originalFontSize = safeNumber(object.fontSize, 16);
    const nextFontSize = Math.max(12, Math.round(originalFontSize * scale));
    object.fontSize = nextFontSize;

    if (typeof object.width === "number") {
      object.width = Math.max(24, object.width * scale);
    }

    if (originalFontSize * scale < 12) {
      warnings.push({
        id: createId("small-text"),
        severity: "warning",
        layerIndex,
        message: "Some text was kept at the minimum readable size.",
      });
    }
    return;
  }

  object.scaleX = safeNumber(object.scaleX, 1) * scale;
  object.scaleY = safeNumber(object.scaleY, 1) * scale;
}

function normalizeHex(value: string) {
  const trimmed = value.trim().toLowerCase();
  if (/^#[0-9a-f]{3}$/.test(trimmed)) {
    return `#${trimmed
      .slice(1)
      .split("")
      .map(char => `${char}${char}`)
      .join("")}`;
  }
  return /^#[0-9a-f]{6}$/.test(trimmed) ? trimmed : null;
}

function collectBrandWarnings(
  objects: FabricJsonObject[],
  brandProfile: BrandProfile | null | undefined,
  options: ReflowOptions
) {
  const warnings: ReflowWarning[] = [];
  if (!brandProfile) {
    return warnings;
  }

  const brandColors = new Set(
    brandProfile.colors
      .map(color => normalizeHex(color.hex))
      .filter((color): color is string => Boolean(color))
  );
  const brandFonts = new Set(
    brandProfile.fonts.map(font => font.trim().toLowerCase()).filter(Boolean)
  );
  let offBrandColorCount = 0;
  let offBrandFontCount = 0;

  const visit = (object: FabricJsonObject, layerIndex: number) => {
    if (options.brandRules.preserveColors && brandColors.size > 0) {
      const colors = [object.fill, object.stroke]
        .filter((value): value is string => typeof value === "string")
        .map(normalizeHex)
        .filter((color): color is string => Boolean(color));

      colors.forEach(color => {
        if (!brandColors.has(color)) {
          offBrandColorCount += 1;
          if (offBrandColorCount <= 3) {
            warnings.push({
              id: createId("brand-color"),
              severity: "info",
              layerIndex,
              message: "A layer uses a color outside the saved Brand Kit.",
            });
          }
        }
      });
    }

    if (
      options.brandRules.preserveFonts &&
      brandFonts.size > 0 &&
      isTextObject(object)
    ) {
      const font = object.fontFamily?.trim().toLowerCase();
      if (font && !brandFonts.has(font)) {
        offBrandFontCount += 1;
        if (offBrandFontCount <= 3) {
          warnings.push({
            id: createId("brand-font"),
            severity: "info",
            layerIndex,
            message: "A text layer uses a font outside the saved Brand Kit.",
          });
        }
      }
    }

    object.objects?.forEach(child => visit(child, layerIndex));
  };

  objects.forEach((object, index) => visit(object, index));

  return warnings;
}

function getTargetContentOrigin(
  sourceBounds: Bounds,
  sourceWidth: number,
  sourceHeight: number,
  targetWidth: number,
  targetHeight: number,
  targetContentWidth: number,
  targetContentHeight: number,
  mode: ReflowOptions["mode"],
  marginX: number,
  marginY: number
) {
  if (mode === "fit") {
    const normalizedCenterX = sourceBounds.centerX / sourceWidth;
    const normalizedCenterY = sourceBounds.centerY / sourceHeight;
    const centerX = clamp(
      targetWidth * normalizedCenterX,
      marginX + targetContentWidth / 2,
      targetWidth - marginX - targetContentWidth / 2
    );
    const centerY = clamp(
      targetHeight * normalizedCenterY,
      marginY + targetContentHeight / 2,
      targetHeight - marginY - targetContentHeight / 2
    );
    return {
      left: centerX - targetContentWidth / 2,
      top: centerY - targetContentHeight / 2,
    };
  }

  return {
    left: (targetWidth - targetContentWidth) / 2,
    top: (targetHeight - targetContentHeight) / 2,
  };
}

function buildDiff(
  sourceWidth: number,
  sourceHeight: number,
  preset: CanvasPreset,
  backgroundCount: number,
  contentCount: number,
  textCount: number,
  contentScale: number
): DesignDiff {
  return {
    canvas: {
      from: { width: sourceWidth, height: sourceHeight },
      to: { width: preset.width, height: preset.height },
    },
    layers: {
      total: backgroundCount + contentCount,
      backgrounds: backgroundCount,
      content: contentCount,
      text: textCount,
    },
    summary: [
      `Canvas resized from ${sourceWidth}x${sourceHeight} to ${preset.width}x${preset.height}.`,
      `${backgroundCount} background layer${backgroundCount === 1 ? "" : "s"} scaled to cover.`,
      `${contentCount} editable content layer${contentCount === 1 ? "" : "s"} reflowed at ${Math.round(
        contentScale * 100
      )}%.`,
      `${textCount} text layer${textCount === 1 ? "" : "s"} kept in hierarchy.`,
    ],
  };
}

export function createReflowPreview(
  sourceDesign: string | FabricJsonDesign,
  preset: CanvasPreset,
  options: ReflowOptions
): ReflowResult {
  const design = cloneDesign(sourceDesign);
  const sourceWidth =
    safeNumber(design.width, 0) || safeNumber(options.sourceCanvas.width, 1080);
  const sourceHeight =
    safeNumber(design.height, 0) ||
    safeNumber(options.sourceCanvas.height, 1080);
  const targetWidth = preset.width;
  const targetHeight = preset.height;
  const warnings: ReflowWarning[] = [];
  const objects = Array.isArray(design.objects) ? design.objects : [];

  design.width = targetWidth;
  design.height = targetHeight;

  if (design.backgroundImage) {
    scaleBackgroundObject(design.backgroundImage, targetWidth, targetHeight);
  }

  const indexedObjects = objects.map((object, index) => ({
    object,
    index,
    bounds: getObjectBounds(object),
  }));
  const backgroundItems = indexedObjects.filter(item =>
    isProbableBackground(item, sourceWidth, sourceHeight)
  );
  const backgroundSet = new Set(backgroundItems.map(item => item.object));
  const contentItems = indexedObjects.filter(
    item => !backgroundSet.has(item.object)
  );

  backgroundItems.forEach(item =>
    scaleBackgroundObject(item.object, targetWidth, targetHeight)
  );

  const sourceContentBounds = mergeBounds(
    contentItems.map(item => item.bounds)
  );
  let contentScale = 1;

  if (
    sourceContentBounds &&
    sourceContentBounds.width > 0 &&
    sourceContentBounds.height > 0
  ) {
    const marginX = targetWidth * 0.06;
    const marginY = targetHeight * 0.06;
    const availableWidth = targetWidth - marginX * 2;
    const availableHeight = targetHeight - marginY * 2;
    const fitScale = Math.min(
      availableWidth / sourceContentBounds.width,
      availableHeight / sourceContentBounds.height
    );
    const fillScale = Math.max(
      availableWidth / sourceContentBounds.width,
      availableHeight / sourceContentBounds.height
    );

    contentScale =
      options.mode === "fill"
        ? clamp(fillScale, 0.45, 2.4)
        : clamp(fitScale, 0.45, 2.1);

    const targetContentWidth = sourceContentBounds.width * contentScale;
    const targetContentHeight = sourceContentBounds.height * contentScale;
    const targetOrigin = getTargetContentOrigin(
      sourceContentBounds,
      sourceWidth,
      sourceHeight,
      targetWidth,
      targetHeight,
      targetContentWidth,
      targetContentHeight,
      options.mode,
      marginX,
      marginY
    );

    contentItems.forEach(item =>
      reflowContentObject(
        item.object,
        sourceContentBounds,
        targetOrigin.left,
        targetOrigin.top,
        contentScale,
        warnings,
        item.index,
        options.brandRules.preserveTextHierarchy
      )
    );
  } else if (objects.length > 0) {
    warnings.push({
      id: createId("content-bounds"),
      severity: "warning",
      message: "Content bounds could not be measured for reflow.",
    });
  }

  if (backgroundItems.length === 0 && !design.backgroundImage) {
    warnings.push({
      id: createId("background"),
      severity: "info",
      message: "No full-canvas background layer was detected.",
    });
  }

  const sourceRatio = sourceWidth / sourceHeight;
  const targetRatio = targetWidth / targetHeight;
  if (Math.abs(sourceRatio - targetRatio) > 0.45) {
    warnings.push({
      id: createId("aspect-ratio"),
      severity: "warning",
      message:
        "The target shape is very different, so review spacing before publishing.",
    });
  }

  if (contentScale < 0.72) {
    warnings.push({
      id: createId("scale-down"),
      severity: "warning",
      message: "Primary content was reduced to fit the new format.",
    });
  }

  if (options.mode === "fill") {
    warnings.push({
      id: createId("fill-mode"),
      severity: "info",
      message: "Fill mode can crop edge content on narrow formats.",
    });
  }

  warnings.push(
    ...collectBrandWarnings(objects, options.brandProfile, options)
  );

  const textCount = objects.reduce(
    (count, object) => count + countTextObjects(object),
    0
  );
  const diff = buildDiff(
    sourceWidth,
    sourceHeight,
    preset,
    backgroundItems.length + (design.backgroundImage ? 1 : 0),
    contentItems.length,
    textCount,
    contentScale
  );

  design.msReflow = {
    presetId: preset.id,
    presetLabel: preset.label,
    sourceCanvas: { width: sourceWidth, height: sourceHeight },
    targetCanvas: { width: targetWidth, height: targetHeight },
    createdAt: new Date().toISOString(),
  };

  return {
    id: createId("reflow"),
    preset,
    design,
    warnings,
    diff,
    createdAt: new Date().toISOString(),
  };
}
