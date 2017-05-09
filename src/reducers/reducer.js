/* @flow */
// Utils
import { formatImageURL, normalizeZone, flattenZones, setZones } from '../utils/data-utils';

const defaultState = {
  bad: null, // the raw bad object
  pageObjects: null,
  currentPage: {
    id: null,
    pageNo: 1,
  },
  currentZones: [],
  zones: [],
}

export default function appReducer(state: Object = defaultState, action: Object): Object {
  switch (action.type) {
    case 'XML_LOADED':
    let root = action.xml2json.bad.objdesc.desc;
    let pageObjects = root.map((pageObj, index) => {
      return({
        id: pageObj.attributes.dbi,
        imageURL: formatImageURL(pageObj.attributes.dbi),
        pageNo: index,
        pageDisplayNo: index + 1,
        surface: { zone: pageObj.phystext.surface.zone.map((zone) => normalizeZone(zone)),
          points: pageObj.phystext.surface.attributes.points
        }
      });
    });
    let currentPage = pageObjects[0];
    let currentZoneIds = currentPage.surface.zone.map((zone) => zone.id );
    let zones = flattenZones(pageObjects);
    return {
        ...state,
        bad: action.xml2json,
        pageObjects: pageObjects,
        currentPage: currentPage,
        zones: zones,
        currentZones: setZones(currentZoneIds, zones),
    };

    case 'CURRENT_PAGE_SET':
      let { surface, ...pageInfo } = state.pageObjects[action.pageIndex];
      return {
        ...state,
        currentPage: pageInfo,
      };

    /*case 'CURRENT_ZONE_SET':
      let currentZone =
      return {
        ...state,
        currentPage: { ...state.c}
      }*/

    default:
      return state;
  }
}
