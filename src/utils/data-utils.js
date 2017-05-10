/* @flow */

// constants
import { DEFAULT_PPI, DEFAULT_FORMAT } from '../constants/image-utils';

// shortid
import shortid from 'shortid';

export const formatImageURL = (imageID: string): string => {
  return imageID.toUpperCase() + '.' + DEFAULT_PPI + '.' + DEFAULT_FORMAT;
}

export const normalizeZone = (zone: Object): Object => {
  const forceArray = (arrayOrObj): Array<Object> => {
    if (arrayOrObj) {
      if (arrayOrObj.constructor === Array) return arrayOrObj;
      return [arrayOrObj];
    } else {
      return undefined;
    }
  }

  return {
    id: shortid.generate(),
    points: zone.attributes.points,
    type: zone.attributes.type,
    lineGroups: forceArray(zone.lg) ? forceArray(zone.lg).map((lg) => { return {
      id: shortid.generate(),
      zoneId: zone.id,
      lines: forceArray(lg.l) ? forceArray(lg.l).map((line) => {
        return {
          id: shortid.generate(),
          zoneId: zone.id,
          diplomatic: line.diplomatic ? line.diplomatic : null,
          stage: {
            id: shortid.generate(),
            zoneId: zone.id,
            content: forceArray(line.stage) ? forceArray(line.stage).map((stage) => {
              let { attributes, text, ...rest } = stage;
              return {
                id: shortid.generate(),
                zoneId: zone.id,
                type: stage.attributes ? stage.attributes.type : null,
                ...rest,
              }
            }) : null,
          }
        }
      }) : null,
    }}) : null,
  }
}

export const flattenZones = (pageObjects: Array<Object>): Object => {
  let zones = [];
  pageObjects.forEach((page) => {
    page.surface.zone.forEach((zone) => {
      zones.push(zone);
    });
  });
  return flatten(zones);
}

const flatten = (dataArray: Array<Object>): Object => {
  let flattened = {};
  dataArray.forEach((data) => {
    let { id, ...rest } = data;
    flattened[id] = rest;
  });
  return flattened;
}

export const setZones = (zoneIds: Array<string>, zones: Object): Array<Object> => {
  let currentZones = [];
  zoneIds.forEach((id) => {
    currentZones.push(zones[id]);
  });
  return currentZones;
}

export const pointsToNumbers = (points: string): Array<Number> => {
  let coords = points.split(' ');
  let usefulPoints = [coords[2], coords[0]].map((pixel) => {
    return pixel.split(',').map((pixel) => Number(pixel))}).reduce((x,y) => x.concat(y));
  let x = usefulPoints[0];
  let y = usefulPoints[1];
  let w = usefulPoints[2] - x;
  let h = usefulPoints[3] - y;
  return [x, y, w, h];
}

export const getBounds = (bounds: Array<Number>): Object => {
  let minX = bounds.sort((bound1, bound2) => bound1.x - bound2.x)[0].x;
  let minY = bounds.sort((bound1, bound2) => bound1.y - bound2.y)[0].y;
  let maxX = bounds.sort((bound1, bound2) => {
    if (bound1.x < bound2.x) return 1;
    if (bound1.x > bound2.x) return -1;
    return 0;
  })[0].x;
  let maxY = bounds.sort((bound1, bound2) => {
    if (bound1.y < bound2.y) return 1;
    if (bound1.y > bound2.y) return -1;
    return 0;
  })[0].y;
  return { x: minX, y: minY, w: maxX, h: maxY };
}
