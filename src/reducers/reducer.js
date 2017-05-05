/* @flow */

// constants
import { IMAGE_DIR, DEFAULT_PPI, DEFAULT_FORMAT } from '../constants/image-utils';

// shortid
import shortid from 'shortid';

const formatImageURL = (imageID: string): string => {
  return IMAGE_DIR + '/' + imageID.toUpperCase() + '.' + DEFAULT_PPI + '.' + DEFAULT_FORMAT;
}

const normalizeZone = (zone: Object): Object => {
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
      lines: forceArray(lg.l) ? forceArray(lg.l).map((line) => {
        return {
          id: shortid.generate(),
          diplomatic: line.diplomatic ? line.diplomatic : null,
          stage: {
            id: shortid.generate(),
            content: forceArray(line.stage) ? forceArray(line.stage).map((stage) => {
              let { attributes, text, ...rest } = stage;
              return {
                id: shortid.generate(),
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

const defaultState = {
  bad: null, // the raw bad object
  pageObjects: null,
  currentPageObject: {
    id: null,
    currentZone: {
      id: null,
      currentLineGroup: {
        id: null,
        currentLine: {
          id: null,
          currentStage: {
            id: null,
            type: null,
            text: null,
          }
        }
      }
    }
  }
}

export default function appReducer(state: Object = defaultState, action: Object): Object {
  switch (action.type) {
    case 'XML_LOADED':
      return {
        ...state,
        bad: action.xml2json,
        pageObjects: action.xml2json.bad.objdesc.desc.map((pageObj, index) => {
          return({
            id: pageObj.attributes.dbi,
            imageURL: formatImageURL(pageObj.attributes.dbi),
            pageNo: index + 1,
            surface: { zone: pageObj.phystext.surface.zone.map((zone) => normalizeZone(zone)),
              points: pageObj.phystext.surface.attributes.points
            }
          });
        })
      };

    default:
      return state;
  }
}
