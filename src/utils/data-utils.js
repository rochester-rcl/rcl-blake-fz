/* @flow */

// constants
import { DEFAULT_PPI, DEFAULT_FORMAT } from "../constants/image-utils";

// shortid
import shortid from "shortid";

// OpenSeadragon
import OpenSeadragon from "openseadragon";

const CLASSES = {
  gap: "tei-gap",
  cancellation_wash: "tei-gap-cancellation",
  erasure: "tei-gap",
  default: ""
};

export const formatImageURL = (imageID: string): string => {
  return imageID.toUpperCase() + "." + DEFAULT_PPI + "." + DEFAULT_FORMAT;
};

const anchorSubst = (element: Object): Object => {
  let subst = {};
  subst.children = [];
  subst.children.push(element);
  subst.nodeType = "subst";
  return subst;
};

const forceArray = (arrayOrObj): Array<Object> => {
  if (arrayOrObj) {
    if (arrayOrObj.constructor === Array) return arrayOrObj;
    return [arrayOrObj];
  } else {
    return undefined;
  }
};

const formatLineGroup = (lg: Object, zone: Object) => {
  return forceArray(lg.l)
    ? forceArray(lg.l).map((line, index, lg) => {
        const lineInfo = {
          id: shortid.generate(),
          zoneId: zone.id,
          attributes: line.attributes
        };
        if (line.diplomatic) {
          return {
            ...lineInfo,
            diplomatic: line.diplomatic
              ? (() => {
                  return line.diplomatic.map((element, index, diplomatic) => {
                    // handle anchored substspans
                    if (diplomatic[index + 1]) {
                      if (diplomatic[index + 1].nodeType === "anchor") {
                        return anchorSubst(element);
                      }
                    }
                    if (diplomatic[index - 1]) {
                      if (diplomatic[index - 1].nodeType === "substSpan") {
                        return anchorSubst(element);
                      }
                    }
                    return element;
                  });
                })()
              : null,
            stage: {
              id: shortid.generate(),
              zoneId: zone.id,
              content:
                line.stage /*forceArray(line.stage) ? forceArray(line.stage).map((stage) => {
            let { attributes, text, ...rest } = stage;
            console.log(stage);
            return {
              id: shortid.generate(),
              zoneId: zone.id,
              type: stage.attributes ? stage.attributes.type : null,
              ...rest,
            }
          }) : null*/
            }
          };
        } else {
          return {
            ...lineInfo,
            content: line["#text"]
          };
        }
      })
    : null;
};

export const normalizeZone = (zone: Object): Object => {
  return {
    // Need to somehow put vspace into linegroups array
    id: shortid.generate(),
    points: zone.attributes ? zone.attributes.points : "",
    type: zone.attributes ? zone.attributes.type : null,
    columns: {
      cols:
        zone.columns !== undefined
          ? zone.columns.map(column => {
              return {
                column: {
                  orient: column.orient,
                  lineGroups: column.lineGroups.map(lg => {
                    return {
                      id: shortid.generate(),
                      zoneId: zone.id,
                      attributes: lg.attributes,
                      nodeType: lg.nodeType,
                      vspaceExtent: lg.vspaceExtent,
                      lines: formatLineGroup(lg, zone)
                    };
                  })
                }
              };
            })
          : null,
      orient: zone.columns !== undefined ? zone.columns.orient : undefined
    },
    lineGroups: forceArray(zone.lg)
      ? forceArray(zone.lg).map(lg => {
          return {
            id: shortid.generate(),
            zoneId: zone.id,
            attributes: lg.attributes,
            nodeType: lg.nodeType,
            vspaceExtent: lg.vspaceExtent,
            lines: formatLineGroup(lg, zone)
          };
        })
      : null
  };
};

export const flattenZones = (pageObjects: Array<Object>): Object => {
  let zones = [];
  pageObjects.forEach(page => {
    page.surface.zone.forEach(zone => {
      zones.push(zone);
    });
  });
  return flatten(zones);
};

const flatten = (dataArray: Array<Object>): Object => {
  let flattened = {};
  const arr = dataArray.filter(
    zone => zone.points !== undefined && zone.points !== ""
  );
  arr.forEach(data => {
    let { id, ...rest } = data;
    flattened[id] = rest;
  });
  // for now filter zones with points to avoid errors
  return flattened;
};

export const setZones = (
  zoneIds: Array<string>,
  zones: Object
): Array<Object> => {
  let currentZones = [];
  zoneIds.forEach(id => {
    if (zones[id]) {
      currentZones.push(zones[id]);
    }
  });
  return currentZones;
};

// TODO figure out how to work with polygons

export const pointsToNumbers = (points: string): Array<Number> => {
  let coords = points.split(" ");
  let usefulPoints = [coords[2], coords[0]]
    .map(pixel => {
      return pixel.split(",").map(pixel => Number(pixel));
    })
    .reduce((x, y) => x.concat(y));
  let x = usefulPoints[0];
  let y = usefulPoints[1];
  let w = usefulPoints[2] - x;
  let h = usefulPoints[3] - y;
  return [x, y, w, h];
};

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
    return min.width === max.width ? max.width : max.x + max.width - min.x;
  };

  const getHeight = (min: Object, max: Object): Number => {
    return min.height === max.height ? max.height : max.y + max.height - min.y;
  };

  return {
    x: minX.x,
    y: minY.y,
    w: getWidth(minX, maxX),
    h: getHeight(minY, maxY)
  };
};

export function pointsToViewportPercent(
  resolution: Array<Number>
): (points: Array<String>) => Array<Number> {
  const [_x, _y] = resolution;
  return points => {
    let [x, y, w, h] = pointsToNumbers(points);
    console.log(x, y, w, h);
    x /= _x;
    w /= _x;
    y /= _y;
    h /= _y;
    return [x, y, w, h].map(val => Math.floor(val * 100));
  };
}

// Pure function for processing stages
export const formatStage = (stage: Object): Object => {
  const handleKey = (stage, stageKey: string) => {
    switch (stageKey) {
      case "gap":
        let reason;
        if (stage[stageKey].constructor === Array) {
          reason = stage[stageKey][0].attributes.reason;
        } else {
          reason = stage[stageKey].attributes.reason;
        }
        return CLASSES[reason];

      default:
        return CLASSES.default;
    }
  };
  let className;
  Object.keys(stage).forEach(stageKey => {
    className = handleKey(stage, stageKey);
  });
  return className;
};
