/* @flow */

export default class Point {
  x: number;
  y: number;
  constructor(x: number, y: number) {
    this.x = x;
    this.y = y;
  }

  toArray(): Array<number> {
    return [this.x, this.y];
  }

  toString(): string {
    return this.x.toString() + ',' + this.y.toString();
  }

  toObj(): Object {
    return { x: this.x, y: this.y }
  }

  normalize(width: number, height: number): Point {
    return new Point(this.x / width, this.y / height);
  }
}
