import { idToRgb as idToRgbDefault, rgbToId as rgbToIdDefault } from './util';
import type { CreateHitCanvas, HitCanvasRenderingContext2D } from './types';

const EXCLUDED_SETTERS = [
  'filter',
  'shadowBlur',
  'globalCompositeOperation',
  'globalAlpha',
  'fillStyle',
  'strokeStyle',
];

const createHitCanvas: CreateHitCanvas = (
  canvas,
  contextSettings,
  { rgbToId = rgbToIdDefault, idToRgb = idToRgbDefault } = {},
) => {
  const context = canvas.getContext('2d', contextSettings);

  const proxyCanvas = new OffscreenCanvas(canvas.width, canvas.height);
  const proxyContext = proxyCanvas.getContext('2d', {
    willReadFrequently: true,
    alpha: contextSettings?.alpha ?? true,
  }) as unknown as HitCanvasRenderingContext2D;

  let currentWidth = canvas.width,
    currentHeight = canvas.height;

  return new Proxy(context as unknown as HitCanvasRenderingContext2D, {
    get(target, property: keyof HitCanvasRenderingContext2D) {
      if (canvas.width !== currentWidth || canvas.height !== currentHeight) {
        currentWidth = proxyCanvas.width = canvas.width;
        currentHeight = proxyCanvas.height = canvas.height;
      }

      if (property === 'getLayerIdAt') {
        return (x: number, y: number) => {
          const [r, g, b] = proxyContext.getImageData(x, y, 1, 1).data;
          return rgbToId([r, g, b]);
        };
      }

      if (property === 'setCurrentLayerId') {
        return (id: number) => {
          const [r, g, b] = idToRgb(id);
          const layerColor = `rgb(${r},${g},${b})`;
          proxyContext.fillStyle = layerColor;
          proxyContext.strokeStyle = layerColor;
        };
      }

      const val = target[property];
      if (typeof val !== 'function') {
        return val;
      }

      return (...args: any[]) => {
        let proxyProp = property;
        let proxyArgs = args;

        if (property === 'drawImage') {
          proxyProp = 'fillRect';
          proxyArgs = args.slice(-4);
        }

        (<Function>proxyContext[proxyProp])(...proxyArgs);

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
