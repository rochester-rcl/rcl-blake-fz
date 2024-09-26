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

export function toggleLockRotationAction(status: bool): Object {
  return {
    type: ActionConstants.TOGGLE_LOCK_ROTATION,
    status: status,
  }
}

export function toggleTranscriptionModeAction(status: boolean): Object {
  return {
    type: ActionConstants.TOGGLE_TRANSCRIPTION_MODE,
    status: status,
  }
}

export function setXmlUrl(xmlUrl) {
  return {
    type: ActionConstants.SET_CURRENT_PAGE,
    xmlUrl
  }
}

export function setImageData(imageData) {
  return {
    type: ActionConstants.SET_IMAGE_DATA,
    imageData
  }
}
