/* @flow */

// constants
import { DEFAULT_PPI, DEFAULT_FORMAT } from '../constants/image-utils';

// shortid
import shortid from 'shortid';

const CLASSES = {
  gap: 'tei-gap',
  cancellation_wash: 'tei-gap-cancellation',
  erasure: 'tei-gap',
  default: ''
}

export const formatImageURL = (imageID: string): string => {
  return imageID.toUpperCase() + '.' + DEFAULT_PPI + '.' + DEFAULT_FORMAT;
}

const anchorSubst = (element: Object): Object => {
  let subst = {};
  if (element.nodeType === 'del') {
    subst.del = element;
  }
  if (element.nodeType === 'add') {
    subst.add = element;
  }
  if (element.nodeType === 'gap') {
    subst.gap = element;
  }
  subst.nodeType = 'subst';
  return subst;
}

const forceArray = (arrayOrObj): Array<Object>  => {
  if (arrayOrObj) {
    if (arrayOrObj.constructor === Array) return arrayOrObj;
    return [arrayOrObj];
  } else {
    return undefined;
  }
}

const formatLineGroup = (lg: Object, zone: Object) => {
  return forceArray(lg.l) ? forceArray(lg.l).map((line, index, lg) => {
    return {
      id: shortid.generate(),
      zoneId: zone.id,
      attributes: line.attributes,
      diplomatic: line.diplomatic ? (() => {
        return line.diplomatic.map((element, index, diplomatic) => {
          // handle anchored substspans
          if (diplomatic[index+1]) {
            if (diplomatic[index+1].nodeType === 'anchor') {
              return anchorSubst(element);
            }
          }
          if (diplomatic[index-1]) {
            if (diplomatic[index-1].nodeType === 'substSpan') {
              return anchorSubst(element);
            }
          }
          return element;
        });
      })() : null,
      stage: {
        id: shortid.generate(),
        zoneId: zone.id,
        content: line.stage/*forceArray(line.stage) ? forceArray(line.stage).map((stage) => {
          let { attributes, text, ...rest } = stage;
          console.log(stage);
          return {
            id: shortid.generate(),
            zoneId: zone.id,
            type: stage.attributes ? stage.attributes.type : null,
            ...rest,
          }
        }) : null*/,
      }
    }
  }) : null;
}

export const currentZoneIds = (zones: Array<Object>) => {
  return zones.map((zone) => {
    if (zone.zones !== undefined) {
      return currentZoneIds(zone.zones);
    } else {
      return zone.zone.id;
    }
  });
}

export const normalizeZone = (zone: Object, name: string | typeof undefined): Object => {
  let zoneName;
  if (name !== undefined) {
    zoneName = name + '--';
  } else {
    zoneName = (zone.attributes !== undefined) ? zone.attributes.type + '--' : null;
  }
  if (zone.zone !== undefined) {
    if (zone.zone.constructor === Array) {
      zoneName += (zone.attributes !== undefined) ? zone.attributes.type : null;
      return {
        zones: zone.zone.map((_zone) => normalizeZone(_zone, zoneName)),
      }
    } else {
      zoneName += (zone.attributes !== undefined) ? zone.attributes.type + '--' : null;
      return normalizeZone(zone.zone, zoneName);
    }
  } else {
    return formatZone(zone, zoneName);
  }
}

const formatZone = (zone: Object, parent: string | null): Object => {
  return {
    // Need to somehow put vspace into linegroups array
    id: shortid.generate(),
    points: zone.attributes.points,
    type: zone.attributes.type,
    parent: (parent !== undefined && parent !== zone.attributes.type) ? parent : null,
    columns: (zone.columns !== undefined) ? zone.columns.column.map((column) => {
      return {
        column: {
          lineGroups: forceArray(column.lg) ? forceArray(column.lg).map((lg) => { return {
            id: shortid.generate(),
            zoneId: zone.id,
            attributes: lg.attributes,
            nodeType: lg.nodeType,
            vspaceExtent: lg.vspaceExtent,
            lines: formatLineGroup(lg, zone),
          }}) : null,
        }
      }
    }) : null,
    lineGroups: forceArray(zone.lg) ? forceArray(zone.lg).map((lg) => { return {
      id: shortid.generate(),
      zoneId: zone.id,
      attributes: lg.attributes,
      nodeType: lg.nodeType,
      vspaceExtent: lg.vspaceExtent,
      lines: formatLineGroup(lg, zone),
    }}) : null,
  }
}

const flattenZone = (zone: Object): Array<Object> => {
  const _zone = (zone.zone !== undefined) ? zone.zone : zone;
  if (_zone.zones !== undefined) {
    return _zone.zones.map(flattenZone);
  }
  return [_zone];
}



export const flattenZones = (pageObjects: Array<Object>): Object => {
  let zones = [];
  pageObjects.forEach((page) => {
    page.layers.forEach((layer) => {
      zones.push(layer.zones.map(flattenZone));
    });
  });
  return flatten(zones);
}

export const objToArray = (obj: Object): Array<Object> => {
  return Object.keys(obj).map((key) => obj[key]);
}

const flatten = (dataArray: Array<Object>): Object => {
  let flattened = {};
  const _flatten = (arr: Array<Object> | Object): Array<Object> => {
    let flat = [];
    arr.forEach((element) => {
      if (element.constructor === Array) {
        flat = flat.concat(_flatten(element));
      } else {
        flat.push(element);
      }
    });
    return flat;
  }

  _flatten(dataArray).forEach((data) => {
    flattened[data.id] = data;
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
  w = (w < 0) ? -w : w;
  h = (h < 0) ? -h : h;
  return [x, y, w, h];
}

export const getBounds = (bounds: Array<Number>): Object => {
  let minX = bounds.sort((bound1, bound2) => bound1.x - bound2.x)[0];
  let minY = bounds.sort((bound1, bound2) => bound1.y - bound2.y)[0];
  let maxX = bounds.sort((bound1, bound2) => {
    if (bound1.x < bound2.x) return 1;
    if (bound1.x > bound2.x) return -1;
    return 0;
  })[0];
  let maxY = bounds.sort((bound1, bound2) => {
    if (bound1.y < bound2.y) return 1;
    if (bound1.y > bound2.y) return -1;
    return 0;
  })[0];

  const getWidth = (min: Object, max: Object): Number => {
    return min.width === max.width ? max.width : (max.x + max.width) - min.x;
  }

  const getHeight = (min: Object, max: Object): Number => {
    return min.height === max.height ? max.height : (max.y + max.height) - min.y;
  }

  return { x: minX.x, y: minY.y, w: getWidth(minX, maxX), h: getHeight(minY, maxY) };
}

// Pure function for processing stages
export const formatStage = (stage: Object): Object => {
  const handleKey = (stage, stageKey: string) => {
    switch(stageKey) {
      case 'gap':
        let reason;
        if (stage[stageKey].constructor === Array) {
          reason = stage[stageKey][0].attributes.reason
        } else {
          reason = stage[stageKey].attributes.reason;
        }
        return CLASSES[reason];

      default:
        return CLASSES.default;
    };
  }
  let className;
  Object.keys(stage).forEach((stageKey) => {
    className = handleKey(stage, stageKey);
  });
  return className;
}
