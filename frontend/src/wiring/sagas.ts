
import {all, call, put} from 'redux-saga/effects';

import {actionCreators} from '../app';

export default function* () {
  try {
    yield all([
      call(require('../Backend').saga),
    ]);
  } catch (ex) {
    yield put(actionCreators.sagaError(ex));
  }
}
