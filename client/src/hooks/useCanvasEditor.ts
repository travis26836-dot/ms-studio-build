import { MutableRefObject, useCallback, useEffect, useRef, useState } from "react";
import { fabric } from "fabric";

type EditorState = {
  selectedObjects: fabric.Object[];
  zoom: number;
};

type ShapeType =
  | "rect"
  | "rounded-rect"
  | "circle"
  | "triangle"
  | "star"
  | "line"
  | "ellipse"
  | "polygon"
  | "heart"
  | "diamond"
  | "hexagon"
  | "arrow";

function clamp(value: number, min: number, max: number) {
  return Math.min(max, Math.max(min, value));
}

function createStarPoints(spikes = 5, outerRadius = 60, innerRadius = 28) {
  const points: Array<{ x: number; y: number }> = [];
  let angle = -Math.PI / 2;
  const step = Math.PI / spikes;

  for (let i = 0; i < spikes * 2; i += 1) {
    const radius = i % 2 === 0 ? outerRadius : innerRadius;
    points.push({
      x: Math.cos(angle) * radius + outerRadius,
      y: Math.sin(angle) * radius + outerRadius,
    });
    angle += step;
  }

  return points;
}

function createRegularPolygonPoints(sides = 5, radius = 60) {
  return Array.from({ length: sides }, (_, index) => {
    const angle = -Math.PI / 2 + (index * Math.PI * 2) / sides;
    return {
      x: Math.cos(angle) * radius + radius,
      y: Math.sin(angle) * radius + radius,
    };
  });
}

export function useCanvasEditor(
  canvasRef: MutableRefObject<HTMLCanvasElement | null>,
  width: number,
  height: number,
) {
  const fabricRef = useRef<fabric.Canvas | null>(null);
  const [editorState, setEditorState] = useState<EditorState>({
    selectedObjects: [],
    zoom: 1,
  });
  const historyRef = useRef<string[]>([]);
  const historyIndexRef = useRef(-1);
  const isHistoryActionRef = useRef(false);

  const updateSelectionState = useCallback(() => {
    const canvas = fabricRef.current;
    if (!canvas) {
      return;
    }

    setEditorState((prev) => ({
      ...prev,
      selectedObjects: canvas.getActiveObjects(),
    }));
  }, []);

  const saveHistory = useCallback(() => {
    const canvas = fabricRef.current;
    if (!canvas || isHistoryActionRef.current) {
      return;
    }

    const snapshot = JSON.stringify(canvas.toJSON());
    if (historyRef.current[historyIndexRef.current] === snapshot) {
      return;
    }

    historyRef.current = historyRef.current.slice(0, historyIndexRef.current + 1);
    historyRef.current.push(snapshot);
    if (historyRef.current.length > 50) {
      historyRef.current.shift();
    }
    historyIndexRef.current = historyRef.current.length - 1;
  }, []);

  const loadHistorySnapshot = useCallback(async (snapshot: string) => {
    const canvas = fabricRef.current;
    if (!canvas) {
      return;
    }

    isHistoryActionRef.current = true;
    await new Promise<void>((resolve) => {
      canvas.loadFromJSON(snapshot, () => {
        canvas.renderAll();
        resolve();
      });
    });
    isHistoryActionRef.current = false;
    updateSelectionState();
  }, [updateSelectionState]);

  const initCanvas = useCallback(() => {
    if (fabricRef.current) {
      return fabricRef.current;
    }

    if (!canvasRef.current) {
      return null;
    }

    const canvas = new fabric.Canvas(canvasRef.current, {
      width,
      height,
      backgroundColor: "#ffffff",
      preserveObjectStacking: true,
      selection: true,
    });

    canvas.on("selection:created", updateSelectionState);
    canvas.on("selection:updated", updateSelectionState);
    canvas.on("selection:cleared", updateSelectionState);
    canvas.on("object:modified", () => {
      updateSelectionState();
      saveHistory();
    });
    canvas.on("object:added", () => {
      if (!isHistoryActionRef.current) {
        saveHistory();
      }
    });
    canvas.on("object:removed", () => {
      if (!isHistoryActionRef.current) {
        saveHistory();
      }
    });

    fabricRef.current = canvas;
    saveHistory();
    return canvas;
  }, [canvasRef, height, saveHistory, updateSelectionState, width]);

  const addObject = useCallback((object: fabric.Object) => {
    const canvas = fabricRef.current;
    if (!canvas) {
      return;
    }

    canvas.add(object);
    canvas.setActiveObject(object);
    object.setCoords();
    canvas.renderAll();
    updateSelectionState();
    saveHistory();
  }, [saveHistory, updateSelectionState]);

  const addText = useCallback((options: Record<string, unknown> = {}) => {
    const { text = "Add text", ...rest } = options as { text?: string };
    addObject(
      new fabric.Textbox(text, {
        left: 100,
        top: 100,
        width: 320,
        fontSize: 28,
        fontFamily: "Inter",
        fill: "#111827",
        ...rest,
      }),
    );
  }, [addObject]);

  const addHeading = useCallback(() => {
    addText({
      text: "Add a heading",
      fontSize: 56,
      width: 520,
      fontWeight: "700",
      fontFamily: "Montserrat",
    });
  }, [addText]);

  const addSubheading = useCallback(() => {
    addText({
      text: "Add a subheading",
      fontSize: 32,
      width: 420,
      fontWeight: "600",
      fontFamily: "Poppins",
    });
  }, [addText]);

  const addImage = useCallback(async (url: string) => {
    const canvas = fabricRef.current;
    if (!canvas) {
      return;
    }

    await new Promise<void>((resolve, reject) => {
      fabric.Image.fromURL(
        url,
        (image) => {
          if (!image) {
            reject(new Error("Image could not be created"));
            return;
          }

          const maxSize = Math.min(width, height) * 0.38;
          const scale = Math.min(
            maxSize / (image.width || maxSize),
            maxSize / (image.height || maxSize),
            1,
          );

          image.set({
            left: width / 2 - ((image.width || maxSize) * scale) / 2,
            top: height / 2 - ((image.height || maxSize) * scale) / 2,
            scaleX: scale,
            scaleY: scale,
          });

          addObject(image);
          resolve();
        },
        { crossOrigin: "anonymous" },
      );
    });
  }, [addObject, height, width]);

  const addShape = useCallback((shapeType: ShapeType, props: Record<string, unknown> = {}) => {
    const base = {
      left: width / 2 - 75,
      top: height / 2 - 75,
      fill: "#6366f1",
      stroke: undefined,
      strokeWidth: 0,
      ...props,
    };

    let object: fabric.Object;

    switch (shapeType) {
      case "rounded-rect":
        object = new fabric.Rect({ width: 160, height: 120, rx: 24, ry: 24, ...base });
        break;
      case "rect":
        object = new fabric.Rect({ width: 160, height: 120, ...base });
        break;
      case "circle":
        object = new fabric.Circle({ radius: 70, ...base });
        break;
      case "triangle":
        object = new fabric.Triangle({ width: 150, height: 140, ...base });
        break;
      case "ellipse":
        object = new fabric.Ellipse({ rx: 90, ry: 58, ...base });
        break;
      case "line":
        object = new fabric.Line([0, 0, 180, 0], {
          left: width / 2 - 90,
          top: height / 2,
          stroke: (base.stroke as unknown as string | undefined) || (base.fill as unknown as string | undefined) || "#111827",
          strokeWidth: Number(base.strokeWidth || 4),
        });
        break;
      case "polygon":
        object = new fabric.Polygon(createRegularPolygonPoints(5, 70), {
          ...base,
        });
        break;
      case "hexagon":
        object = new fabric.Polygon(createRegularPolygonPoints(6, 70), {
          ...base,
        });
        break;
      case "diamond":
        object = new fabric.Polygon(
          [
            { x: 80, y: 0 },
            { x: 160, y: 80 },
            { x: 80, y: 160 },
            { x: 0, y: 80 },
          ],
          { ...base },
        );
        break;
      case "star":
        object = new fabric.Polygon(createStarPoints(), {
          ...base,
        });
        break;
      case "heart":
        object = new fabric.Path(
          "M 272 128 C 272 74 228 32 176 32 C 140 32 108 51 88 80 C 68 51 36 32 0 32 C -52 32 -96 74 -96 128 C -96 228 88 320 88 320 C 88 320 272 228 272 128 z",
          {
            ...base,
            scaleX: 0.45,
            scaleY: 0.45,
          },
        );
        break;
      case "arrow":
        object = new fabric.Path("M0 55 L120 55 L120 15 L200 95 L120 175 L120 135 L0 135 z", {
          ...base,
          scaleX: 0.7,
          scaleY: 0.7,
        });
        break;
      default:
        object = new fabric.Rect({ width: 160, height: 120, ...base });
        break;
    }

    addObject(object);
  }, [addObject, height, width]);

  const deleteSelected = useCallback(() => {
    const canvas = fabricRef.current;
    if (!canvas) {
      return;
    }

    const activeObjects = canvas.getActiveObjects();
    if (activeObjects.length === 0) {
      return;
    }

    activeObjects.forEach((object) => canvas.remove(object));
    canvas.discardActiveObject();
    canvas.renderAll();
    updateSelectionState();
    saveHistory();
  }, [saveHistory, updateSelectionState]);

  const duplicateSelected = useCallback(() => {
    const canvas = fabricRef.current;
    if (!canvas) {
      return;
    }

    const active = canvas.getActiveObject();
    if (!active) {
      return;
    }

    active.clone((cloned: fabric.Object) => {
      cloned.set({
        left: (cloned.left || 0) + 24,
        top: (cloned.top || 0) + 24,
      });
      canvas.discardActiveObject();
      canvas.add(cloned);
      canvas.setActiveObject(cloned);
      canvas.renderAll();
      updateSelectionState();
      saveHistory();
    });
  }, [saveHistory, updateSelectionState]);

  const undo = useCallback(() => {
    if (historyIndexRef.current <= 0) {
      return;
    }

    historyIndexRef.current -= 1;
    void loadHistorySnapshot(historyRef.current[historyIndexRef.current]);
  }, [loadHistorySnapshot]);

  const redo = useCallback(() => {
    if (historyIndexRef.current >= historyRef.current.length - 1) {
      return;
    }

    historyIndexRef.current += 1;
    void loadHistorySnapshot(historyRef.current[historyIndexRef.current]);
  }, [loadHistorySnapshot]);

  const setZoom = useCallback((zoom: number) => {
    const canvas = fabricRef.current;
    if (!canvas) {
      return;
    }

    const clamped = clamp(zoom, 0.2, 3);
    canvas.setZoom(clamped);
    canvas.setDimensions({
      width: width * clamped,
      height: height * clamped,
    });
    canvas.renderAll();
    setEditorState((prev) => ({ ...prev, zoom: clamped }));
  }, [height, width]);

  const bringForward = useCallback(() => {
    const canvas = fabricRef.current;
    if (!canvas) return;
    const active = canvas.getActiveObject();
    if (active) {
      canvas.bringForward(active);
      canvas.renderAll();
      saveHistory();
    }
  }, [saveHistory]);

  const sendBackward = useCallback(() => {
    const canvas = fabricRef.current;
    if (!canvas) return;
    const active = canvas.getActiveObject();
    if (active) {
      canvas.sendBackwards(active);
      canvas.renderAll();
      saveHistory();
    }
  }, [saveHistory]);

  const bringToFront = useCallback(() => {
    const canvas = fabricRef.current;
    if (!canvas) return;
    const active = canvas.getActiveObject();
    if (active) {
      canvas.bringToFront(active);
      canvas.renderAll();
      saveHistory();
    }
  }, [saveHistory]);

  const sendToBack = useCallback(() => {
    const canvas = fabricRef.current;
    if (!canvas) return;
    const active = canvas.getActiveObject();
    if (active) {
      canvas.sendToBack(active);
      canvas.renderAll();
      saveHistory();
    }
  }, [saveHistory]);

  const groupSelected = useCallback(() => {
    const canvas = fabricRef.current;
    if (!canvas) return;
    const active = canvas.getActiveObject();
    if (active && active.type === "activeSelection") {
      const selection = active as fabric.ActiveSelection;
      const group = selection.toGroup();
      canvas.setActiveObject(group);
      canvas.renderAll();
      updateSelectionState();
      saveHistory();
    }
  }, [saveHistory, updateSelectionState]);

  const ungroupSelected = useCallback(() => {
    const canvas = fabricRef.current;
    if (!canvas) return;
    const active = canvas.getActiveObject();
    if (active && active.type === "group") {
      const group = active as fabric.Group;
      group.toActiveSelection();
      canvas.renderAll();
      updateSelectionState();
      saveHistory();
    }
  }, [saveHistory, updateSelectionState]);

  const toggleLock = useCallback(() => {
    const canvas = fabricRef.current;
    if (!canvas) return;
    const active = canvas.getActiveObject();
    if (active) {
      const shouldLock = !active.lockMovementX;
      active.set({
        lockMovementX: shouldLock,
        lockMovementY: shouldLock,
        lockRotation: shouldLock,
        lockScalingX: shouldLock,
        lockScalingY: shouldLock,
        editable: !shouldLock,
      } as Partial<fabric.Object>);
      canvas.renderAll();
      updateSelectionState();
      saveHistory();
    }
  }, [saveHistory, updateSelectionState]);

  const alignObjects = useCallback((alignment: string) => {
    const canvas = fabricRef.current;
    if (!canvas) return;
    const active = canvas.getActiveObject();
    if (!active) return;

    const objectWidth = (active.width || 0) * (active.scaleX || 1);
    const objectHeight = (active.height || 0) * (active.scaleY || 1);

    switch (alignment) {
      case "left":
        active.set({ left: 0 });
        break;
      case "center":
        active.set({ left: width / 2 - objectWidth / 2 });
        break;
      case "right":
        active.set({ left: width - objectWidth });
        break;
      case "top":
        active.set({ top: 0 });
        break;
      case "middle":
        active.set({ top: height / 2 - objectHeight / 2 });
        break;
      case "bottom":
        active.set({ top: height - objectHeight });
        break;
      default:
        break;
    }

    active.setCoords();
    canvas.renderAll();
    saveHistory();
  }, [height, saveHistory, width]);

  const updateActiveObject = useCallback((props: Record<string, unknown>) => {
    const canvas = fabricRef.current;
    if (!canvas) {
      return;
    }

    const active = canvas.getActiveObject();
    if (!active) {
      return;
    }

    active.set(props as Partial<fabric.Object>);
    active.setCoords();
    canvas.renderAll();
    updateSelectionState();
    saveHistory();
  }, [saveHistory, updateSelectionState]);

  const setBackground = useCallback((color: string) => {
    const canvas = fabricRef.current;
    if (!canvas) {
      return;
    }

    canvas.setBackgroundColor(color, () => {
      canvas.renderAll();
      saveHistory();
    });
  }, [saveHistory]);

  const exportCanvas = useCallback((format: "png" | "jpg" | "json", quality = 1) => {
    const canvas = fabricRef.current;
    if (!canvas) {
      return "";
    }

    if (format === "json") {
      return JSON.stringify(canvas.toJSON());
    }

    return canvas.toDataURL({
      format: format === "jpg" ? "jpeg" : "png",
      quality,
      multiplier: 1,
      enableRetinaScaling: true,
    });
  }, []);

  const loadFromJSON = useCallback(async (json: string) => {
    const canvas = fabricRef.current;
    if (!canvas) {
      return;
    }

    isHistoryActionRef.current = true;
    await new Promise<void>((resolve) => {
      canvas.loadFromJSON(JSON.parse(json), () => {
        canvas.renderAll();
        resolve();
      });
    });
    isHistoryActionRef.current = false;
    updateSelectionState();
    saveHistory();
  }, [saveHistory, updateSelectionState]);

  const getObjects = useCallback(() => {
    const canvas = fabricRef.current;
    if (!canvas) {
      return [];
    }
    return canvas.getObjects();
  }, []);

  const selectObject = useCallback((index: number) => {
    const canvas = fabricRef.current;
    if (!canvas) {
      return;
    }

    const objects = canvas.getObjects();
    const object = objects[index];
    if (!object) {
      return;
    }

    canvas.setActiveObject(object);
    canvas.renderAll();
    updateSelectionState();
  }, [updateSelectionState]);

  useEffect(() => {
    return () => {
      if (fabricRef.current) {
        fabricRef.current.dispose();
        fabricRef.current = null;
      }
    };
  }, []);

  return {
    fabricRef,
    editorState,
    initCanvas,
    addText,
    addHeading,
    addSubheading,
    addImage,
    addShape,
    deleteSelected,
    duplicateSelected,
    undo,
    redo,
    setZoom,
    bringForward,
    sendBackward,
    bringToFront,
    sendToBack,
    groupSelected,
    ungroupSelected,
    toggleLock,
    alignObjects,
    updateActiveObject,
    setBackground,
    exportCanvas,
    loadFromJSON,
    getObjects,
    selectObject,
    saveHistory,
  };
}
