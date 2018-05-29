/* @flow */
// Utils
import { formatImageURL, normalizeZone, currentZoneIds, flattenZones, setZones, objToArray } from '../utils/data-utils';

const defaultState = {
  bad: null, // the raw bad object
  pageObjects: null,
  currentPage: {
    id: null,
    pageNo: 1,
  },
  currentZones: [],
  zones: [],
  zoneOptions: [],
  zoomToZones: false,
  showZoneROI: false,
  diplomaticMode: true,
}


export default function appReducer(state: Object = defaultState, action: Object): Object {
  switch (action.type) {
    case 'XML_LOADED':
    let root = action.xml2json.bad.objdesc.desc;
    if (root.constructor !== Array) {
      root = [root];
    }

    let pageObjects = root.map((pageObj, index) => {
      return({
        id: pageObj.attributes.dbi,
        imageURL: formatImageURL(pageObj.attributes.dbi),
        pageNo: index,
        pageDisplayNo: index + 1,
        layers: pageObj.phystext.layer.map((layer) => {
          return {
            type: layer.attributes.type,
            zones: layer.zone.map((zone) => {
              let attr = zone.attributes;
              let points = (attr !== undefined && attr.points !== undefined) ? attr.points : [];
              return {
                zone: normalizeZone(zone, layer.attributes.type),
                points: points,
              }
            }),
          }
        }),
      });
    });
    let currentPage = pageObjects[0];
    let ids = currentPage.layers.map((layer) => currentZoneIds(layer.zones));
    let zones = flattenZones(pageObjects);
    let currentPageZones = objToArray(flattenZones([currentPage]));
    console.log(currentPageZones);
    return {
        ...state,
        bad: action.xml2json,
        pageObjects: pageObjects,
        currentPage: currentPage,
        zones: zones,
        zoneOptions: currentPageZones.map((zone) => { return { text: zone.parent + zone.type, value: zone.id } })
    };

    case 'CURRENT_PAGE_SET':
      let { surface, ...pageInfo } = state.pageObjects[action.pageIndex];
      let test = surface.zone.map((zone) => zone.id );
      return {
        ...state,
        currentPage: pageInfo,
        zoneOptions: surface.zone.map((zone) => { return { text: zone.type, value: zone.id } }),
      };

    case 'CURRENT_ZONES_SET':
      return {
        ...state,
        currentZones: setZones(action.zoneIds, state.zones),
      }
    // These aren't handled via a saga because they're so simple
    case 'TOGGLE_ZOOM_TO_ZONE':
      return {
        ...state,
        zoomToZones: action.status,
      }

    case 'TOGGLE_ZONE_ROI':
      return {
        ...state,
        showZoneROI: action.status,
      }

    case 'TOGGLE_TRANSCRIPTION_MODE':
      return {
        ...state,
        diplomaticMode: action.status,
      }
    default:
      return state;
  }
}
