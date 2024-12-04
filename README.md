# hit-canvas

Easy hit detection for your `<canvas>`.

## Installation

`npm install hit-canvas`

## Usage

```
import { createHitCanvas } from 'hit-canvas';

const canvas = document.querySelector('#my-canvas');
const context = createHitCanvas(canvas);

context.setCurrentLayerId(1);
context.fillRect(0, 0, 10, 10);

context.setCurrentLayerId(2);
context.drawImage(new Image(), 10, 10, 10, 10);

context.getLayerIdAt(5, 5);   // 1
context.getLayerIdAt(15, 15); // 2
```
