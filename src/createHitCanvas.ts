import {
  idToRgb as idToRgbDefault,
  rgbToId as rgbToIdDefault,
} from './util.js';

export interface HitCanvasRenderingContext2D
  extends Omit<CanvasRenderingContext2D, 'canvas'> {
  getLayerIdAt(x: number, y: number): number;
  setCurrentLayerId: (id: number) => void;
}

type HitCanvasOptions = {
  rgbToId?: (rgb: [number, number, number]) => number;
  idToRgb?: (id: number) => [number, number, number];
};

const EXCLUDED_GETTERS = ['drawImage'];
const EXCLUDED_SETTERS = [
  'filter',
  'shadowBlur',
  'globalCompositeOperation',
  'globalAlpha',
];
const COLOR_OVERRIDES = [
  'drawImage',
  'fill',
  'fillRect',
  'fillText',
  'stroke',
  'strokeRect',
  'strokeText',
];

const createHitCanvas = (
  canvas: HTMLCanvasElement,
  { rgbToId = rgbToIdDefault, idToRgb = idToRgbDefault }: HitCanvasOptions = {},
): HitCanvasRenderingContext2D => {
  let currentLayer: number;

  const context = canvas.getContext('2d');

  const proxyCanvas = new OffscreenCanvas(canvas.width, canvas.height);
  const proxyContext = proxyCanvas.getContext('2d', {
    willReadFrequently: true,
  }) as unknown as HitCanvasRenderingContext2D;

  const canvasObserver = new MutationObserver(() => {
    proxyCanvas.width = canvas.width;
    proxyCanvas.height = canvas.height;
  });
  canvasObserver.observe(canvas, { attributeFilter: ['width', 'height'] });

  return new Proxy(context as unknown as HitCanvasRenderingContext2D, {
    get(target, property: keyof HitCanvasRenderingContext2D) {
      if (property === 'getLayerIdAt') {
        return (x: number, y: number) => {
          const [r, g, b] = proxyContext.getImageData(x, y, 1, 1).data;
          return rgbToId([r, g, b]);
        };
      }

      if (property === 'setCurrentLayerId') {
        return (id: number) => {
          currentLayer = id;
        };
      }

      const val = target[property];
      if (typeof val !== 'function') {
        return val;
      }

      return (...args: any[]) => {
        if (COLOR_OVERRIDES.includes(property)) {
          const [r, g, b] = idToRgb(currentLayer);
          const layerColor = `rgb(${r},${g},${b})`;
          proxyContext.fillStyle = layerColor;
          proxyContext.strokeStyle = layerColor;
        }

        if (property === 'drawImage') {
          const rectArgs = args.slice(1) as Parameters<CanvasRect['fillRect']>;
          proxyContext.fillRect(...rectArgs);
        }

        if (!EXCLUDED_GETTERS.includes(property)) {
          (<Function>proxyContext[property])(...args);
        }

        return Reflect.apply(val, target, args);
      };
    },
    set(target, property: keyof HitCanvasRenderingContext2D, newValue) {
      (<HitCanvasRenderingContext2D>target[property]) = newValue;

      if (!EXCLUDED_SETTERS.includes(property)) {
        (<HitCanvasRenderingContext2D>proxyContext[property]) = newValue;
      }

      return true;
    },
  });
};

export { createHitCanvas };
