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

export function toggleZoneROIAction(status: boolean): Object {
  console.log(status);
  return {
    type: ActionConstants.TOGGLE_ZONE_ROI,
    status: status,
  }
}

export function toggleZoomToZoneAction(status: boolean): Object {
  return {
    type: ActionConstants.TOGGLE_ZOOM_TO_ZONE,
    status: status,
  }
}

export function setZonesAction(zoneIds: Array<string>): Object {
  return {
    type: ActionConstants.SET_CURRENT_ZONES,
    zoneIds: zoneIds,
  }
}

export function toggleTranscriptionModeAction(status: boolean): Object {
  return {
    type: ActionConstants.TOGGLE_TRANSCRIPTION_MODE,
    status: status,
  }
}
