/* @flow */

const defaultState = {
  xml2json: null,
  currentStage: null,
}

export default function appReducer(state: Object = defaultState, action: Object): Object {
  switch (action.type) {
    case 'XML_LOADED':
      return {
        ...state,
        xml2json: action.xml2json,
      };

    default:
      return state;
  }
}
