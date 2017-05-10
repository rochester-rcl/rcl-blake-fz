/* @flow */

// Constants
import * as ActionConstants from '../constants/actions';

export function loadXMLAction(xmlPath: string): Object {
  return {
    type: ActionConstants.LOAD_XML_FILE,
    xmlPath: xmlPath,
  }
}

export function goToPageAction(pageIndex: Number): Object {
  return {
    type: ActionConstants.SET_CURRENT_PAGE,
    pageIndex: pageIndex,
  }
}

export function toggleZoneROIAction(): Object {
  return {
    type: ActionConstants.TOGGLE_ZONE_ROI,
  }
}

export function toggleZoomToZoneAction(): Object {
  return {
    type: ActionConstants.TOGGLE_ZOOM_TO_ZONE,
  }
}

export function setZonesAction(zoneIds: Array<string>): Object {
  console.log(zoneIds);
  return {
    type: ActionConstants.SET_CURRENT_ZONES,
    zoneIds: zoneIds,
  }
}
