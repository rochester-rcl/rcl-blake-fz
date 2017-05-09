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

  let pixelCoords = points.split(' ').map((pixelTuple) => {
    return pixelTuple.split(',');
  }).reduce((x,y) => x.concat(y)).map((pixel) => parseInt(pixel, 10));
  console.log(pixelCoords);
  let x = pixelCoords[0];
  let y = pixelCoords[3];
  let w = x - pixelCoords[5];
  let h = y - pixelCoords[6];
  console.log(x, y, w, h);
  return [x, y, w, h].map((point) => parseInt(point, 10));
}
