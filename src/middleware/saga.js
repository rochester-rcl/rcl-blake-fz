/* @flow */

// Redux Saga
import { put, takeEvery } from 'redux-saga/effects';

import { fetchXML } from './file-loader';

export function* loadXMLSaga(loadXMLAction: Object): Generator<Promise<Object>, any, any> {
  try {
    // Do fetching here
    // i.e const data = yield fetchData();
    const xml2json = yield fetchXML(loadXMLAction.xmlPath);
    yield put({type: 'XML_LOADED', xml2json });
  } catch(error) {
    console.log(error);
  }
}

export function* goToPageSaga(goToPageAction: Object): Generator<Promise<Object>, any, any> {
  try {
    yield put({ type: 'CURRENT_PAGE_SET', pageIndex: goToPageAction.pageIndex });
  } catch(error) {
    console.log(error);
  }
}

export function* watchForLoadXML(): Generator<any, any, any> {
  yield takeEvery('LOAD_XML_FILE', loadXMLSaga);
}

export function* watchForGoToPage(): Generator<any, any, any> {
  yield takeEvery('SET_CURRENT_PAGE', goToPageSaga);
}


export default function* rootSaga(): Generator<any, any, any> {
  yield[
    watchForLoadXML(),
    watchForGoToPage(),
  ]
}
