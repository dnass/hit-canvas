interface HitCanvasOptions {
  rgbToId?: (rgb: [number, number, number]) => number;
  idToRgb?: (id: number) => [number, number, number];
}

export interface CreateHitCanvas {
  (
    canvas: HTMLCanvasElement,
    contextSettings?: CanvasRenderingContext2DSettings,
    hitCanvasOptions?: HitCanvasOptions,
  ): HitCanvasRenderingContext2D;
}

export interface HitCanvasRenderingContext2D
  extends Omit<CanvasRenderingContext2D, 'canvas'> {
  getLayerIdAt(x: number, y: number): number;
  setCurrentLayerId: (id: number) => void;
}
