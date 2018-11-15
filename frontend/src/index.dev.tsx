
// Shims
import 'core-js/es6/map';
import 'core-js/es6/set';

import {createStore, applyMiddleware, compose, StoreEnhancer} from 'redux';
import {default as createSagaMiddleware} from 'redux-saga';
import {createLogger} from 'redux-logger';

import {actionCreators} from './app';
import {reducer, initialState} from './wiring/store';

const hot = (module as any).hot;
const app : any = (window as any).app = {};

function start () {

  // Redux Configuration
  const middleware = [];
  const enhancers = [];

  // Saga Middleware
  const sagaMiddleware = createSagaMiddleware();
  middleware.push(sagaMiddleware);

  // Logging Middleware
  const logger = createLogger({
    level: 'info',
    collapsed: true
  });

  // Skip redux logs in console during the tests
  if (process.env.NODE_ENV !== 'test') {
    middleware.push(logger);
  }

  // Redux DevTools Configuration
  // If Redux DevTools Extension is installed use it, otherwise use Redux compose
  /* eslint-disable no-underscore-dangle */
  let composeEnhancers : ((...enhancers: StoreEnhancer[]) => StoreEnhancer) = compose;
  if ('__REDUX_DEVTOOLS_EXTENSION_COMPOSE__' in window as any) {
    composeEnhancers = (window as any).__REDUX_DEVTOOLS_EXTENSION_COMPOSE__({
      // Options: https://github.com/zalmoxisus/redux-devtools-extension/blob/master/docs/API/Arguments.md#windowdevtoolsextensionconfig
      actionCreators
    });
  }
  /* eslint-enable no-underscore-dangle */

  // Rootly Middleware & Compose Enhancers
  enhancers.push(applyMiddleware(...middleware));
  const enhancer = composeEnhancers(...enhancers);

  // Create Store
  const store = createStore(reducer, initialState, enhancer);
  const rootTask = sagaMiddleware.run(module.require('./wiring/sagas')['default']);

  if (hot) {
    hot.accept('./src/wiring/actions.ts', function () {
      console.log("HOT actions");
      app.actionCreators = module.require('./wiring/actions')['actionCreators'];
    });
    hot.accept('./src/wiring/store.ts', function () {
      console.log("HOT store");
      const reducer = module.require('./wiring/store')['reducer'];
      store.replaceReducer(reducer);
      store.dispatch(actionCreators.clearError());
    });
    hot.accept('./src/wiring/sagas.js', function () {
      console.log("HOT sagas");
      const rootSaga = module.require('./wiring/sagas')['default'];
      app.rootTask.cancel();
      store.dispatch(actionCreators.clearError());
      app.rootTask = sagaMiddleware.run(rootSaga);
    });
  }

  store.dispatch(actionCreators.init());

  Object.assign(app, {actionCreators, store, rootTask});
}

start();
