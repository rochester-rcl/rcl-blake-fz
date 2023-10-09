/* @flow */
const imageSize = [515, 650];
export default function createBackground(color: string, dimensions: ?Array<Number>): string {
  const _imageSize = (dimensions === undefined) ? imageSize : dimensions;
  const canvas = document.createElement('canvas');
  canvas.width = _imageSize[0];
  canvas.height = _imageSize[1];
  const ctx = canvas.getContext('2d');
  ctx.fillStyle = color;
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  return canvas.toDataURL();
}
