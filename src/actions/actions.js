/* @flow */

// Constants
import * as ActionConstants from '../constants/actions';

export function loadXMLAction(xmlPath: string): Object {
  return {
    type: ActionConstants.LOAD_XML_FILE,
    xmlPath: xmlPath,
  }
}
