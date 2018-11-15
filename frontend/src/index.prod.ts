
import {createStore, applyMiddleware} from 'redux';
import {default as createSagaMiddleware} from 'redux-saga';

import {reducer, initialState} from './wiring/store';
import {actionCreators} from './wiring/actions';

(function () {
  const sagaMiddleware = createSagaMiddleware();
  const store = createStore(reducer, initialState, applyMiddleware(sagaMiddleware));
  sagaMiddleware.run(module.require('./wiring/sagas')['default']);
  store.dispatch(actionCreators.init());
})();
