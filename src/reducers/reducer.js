/* @flow */
// Utils
import {
  formatImageURL,
  normalizeZone,
  flattenZones,
  setZones
} from "../utils/data-utils";

const defaultState = {
  bad: null, // the raw bad object
  pageObjects: null,
  currentPage: {
    id: null,
    pageNo: 1
  },
  currentZones: [],
  zones: [],
  zoneOptions: [],
  zoomToZones: false,
  lockRotation: false,
  showZoneROI: true,
  diplomaticMode: true
};

function setZoneOptions(zones) {
  return zones
    .map(zone => {
      return { text: zone.type, value: zone.id };
    })
    .filter(opt => opt.text !== null)
    .sort((a, b) => {
      const levelsA = a.text.split("--").length;
      const levelsB = b.text.split("--").length;
      if (levelsA > levelsB) return 1;
      if (levelsA < levelsB) return -1;
      return 0;
    });
}

export default function appReducer(
  state: Object = defaultState,
  action: Object
): Object {
  switch (action.type) {
    case "XML_LOADED":
      let root = action.xml2json.bad.objdesc.desc;
      let pageObjects = root.map((pageObj, index) => {
        if (!pageObj.phystext.surface) {
          pageObj.phystext.surface = {
            zone: pageObj.phystext.zone,
            attributes: {
              points: pageObj.phystext.zone.attributes
                ? pageObj.phystext.zone.attributes.points
                : ""
            }
          };
        }

        return {
          id: pageObj.attributes.dbi,
          imageURL: formatImageURL(pageObj.attributes.dbi),
          pageNo: index,
          pageDisplayNo: index + 1,
          surface: {
            zone: pageObj.phystext.surface.zone
              .filter(zone => {
                if (zone.constructor === Array) {
                  return zone.some(z => z.attributes !== undefined);
                }
                return zone.attributes !== undefined;
              })
              .map(zone => normalizeZone(zone)),
            points: pageObj.phystext.surface.attributes.points
          }
        };
      });
      let currentPage = pageObjects[0];
      let zones = flattenZones(pageObjects);
      return {
        ...state,
        bad: action.xml2json,
        pageObjects: pageObjects,
        currentPage: currentPage,
        zones: zones,
        zoneOptions: setZoneOptions(Object.values(zones[0]))
      };

    case "CURRENT_PAGE_SET":
      let { surface, ...pageInfo } = state.pageObjects[action.pageIndex];
      return {
        ...state,
        currentPage: pageInfo,
        zoneOptions: setZoneOptions(
          Object.values(state.zones[action.pageIndex])
        )
      };

    case "CURRENT_ZONES_SET":
      return {
        ...state,
        currentZones: setZones(
          action.zoneIds,
          state.zones,
          state.currentPage.pageNo
        )
      };
    // These aren't handled via a saga because they're so simple
    case "TOGGLE_ZOOM_TO_ZONE":
      return {
        ...state,
        zoomToZones: action.status
      };

    case "TOGGLE_ZONE_ROI":
      return {
        ...state,
        showZoneROI: action.status
      };

    case "TOGGLE_LOCK_ROTATION":
      return {
        ...state,
        lockRotation: action.status
      };

    case "TOGGLE_TRANSCRIPTION_MODE":
      return {
        ...state,
        diplomaticMode: action.status
      };
    default:
      return state;
  }
}
