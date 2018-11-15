
import {CANCEL} from 'redux-saga';
import {call, fork, put} from 'redux-saga/effects';
import update from 'immutability-helper';

import {Saga, actionCreators, Actions, ActionTypes, State} from '../app';
import {without} from '../utils';

import {BackendState, Collection, OptimisticChange, PreEntities} from './types';
import * as _selectors from './selectors';

export {BackendState} from './types';
export const selectors = _selectors;

export class LoggedOutError extends Error {}

const initialEntities = {
  users: {},
  contests: {},
  teams: {},
  teamMembers: {},
};

export const backendInit : BackendState = {
  backend: {
    loggedOut: false,
    generation: 0,
    lastError: undefined,
    tasks: [],
    pristineEntities: initialEntities,
    entities: initialEntities,
    optimisticChanges: [],
  },
};

export function reducer (state: State, action: Actions): State {
  switch (action.type) {

    /* XXX this is wrong, each task can have its set of optimistic changes;
       but for now this is good enough. */

    case ActionTypes.BACKEND_TASK_STARTED: {
      const {task, optimisticChanges} = action.payload;
      state = update(state, {backend: {
        tasks: {$push: [task]},
        lastError: {$set: undefined},
        optimisticChanges: {$set: optimisticChanges || []},
      }});
      return flushSelectorCache(state);
    }
    case ActionTypes.BACKEND_TASK_FAILED: {
      const {task, error} = action.payload;
      state = update(state, {backend: {
        tasks: {$apply: (tasks: object[]) => without(tasks, task)},
        lastError: {$set: error},
        optimisticChanges: {$set: []},
      }});
      return flushSelectorCache(state);
    }
    case ActionTypes.BACKEND_TASK_DONE: {
      const {task} = action.payload;
      state = update(state, {backend: {
        tasks: {$apply: (tasks: object[]) => without(tasks, task)},
        optimisticChanges: {$set: []}
      }});
      return flushSelectorCache(state);
    }
    case ActionTypes.BACKEND_ENTITIES_LOADED: {
      let entities: PreEntities = state.backend.pristineEntities;
      entities = updateEntities(entities, action.payload.entities);
      state = update(state, {backend: {
        pristineEntities: {$set: entities},
      }});
      return flushSelectorCache(state);
    }

    case ActionTypes.CONTEST_LIST_CHANGED: {
      const {contestIds} = action.payload;
      return {...state, contestIds};
    }
    case ActionTypes.CONTEST_CHANGED: {
      const {contestId} = action.payload;
      // Teams are per-contest? so when the contest changes, forget the current team.
      return {...state, contestId, teamId: 'unknown'};
    }
    case ActionTypes.TEAM_CHANGED: {
      let {teamId} = action.payload;
      return {...state, teamId};
    }

    case ActionTypes.BACKEND_LOGGED_OUT: {
      return update(state, {backend: {loggedOut: {$set: true}}});
    }

  }
  return state;
}

type ApiResponse<T> = {result?: T, entities?: PreEntities} | {error: string, details?: string}

function inc(n: number) { return n + 1; }
function flushSelectorCache(state: State): State {
  return update(state, {
    backend: {
      generation: {$apply: inc},
      entities: {$set: applyOptimisticChanges(state.backend.pristineEntities, state.backend.optimisticChanges)}
    },
  });
}

function updateEntities (entities: PreEntities, changes: {[key: string]: object}): PreEntities {
  let result : PreEntities = entities;
  for (let key of Object.keys(changes)) {
    const value = changes[key];
    const {collection, facet, id} = splitEntityKey(key);
    if (collection in result) {
      const col = <keyof PreEntities>collection;
      if (id in result[col]) {
        result = update(result, {[collection]: {[id]: {[facet]: {$set: value}}}});
      } else {
        result = update(result, {[collection]: {[id]: {$set: {[facet]: value}}}});
      }
    } else {
      console.log('update for unknown collection', collection, facet, id, value);
    }
  }
  return result;
}

export function optimisticChange<K extends Collection>(collection: K, id: string, change: OptimisticChange<K>['change']): OptimisticChange<K> {
  return {collection, id, change};
}

function applyOptimisticChanges (entities: PreEntities, items: OptimisticChange<Collection>[]) {
  for (let item of items) {
    const {collection, id, change} = item;
    entities = update(entities, {[collection]: {[id]: {'!': {$set: change}}}});
  }
  return entities;
}

function splitEntityKey(key: string) : {collection: string, facet: string, id: string} {
  const [cf, id] = key.split(' ');
  const [collection, facet] = cf.split('#');
  return {collection, facet: facet || '', id};
}

function fetchJson (url: string, options: {cache?: boolean}) {
  const controller = new AbortController();
  const promise = new Promise(function (resolve, reject) {
    const init : RequestInit = {
      credentials: 'include',
      signal: controller.signal,
    };
    if (!options.cache) {
      init.cache = 'no-cache';
    }
    fetch(url, init).then(function (req) {
      const ct = req.headers.get('Content-Type') || '';
      if (!/^application\/json/.test(ct)) {
        req.text().then(function (body) {
          reject(new Error('unexpected response from server: ' + body));
        }).catch(function (err) {
          reject(new Error('failed to read server response: ' + err));
        });
        return;
      }
      req.json().then(resolve).catch(function (err) {
        reject(new Error('bad response from server: ' + err));
      });
    }).catch(reject);
  });
  (promise as any)[CANCEL] = function () {
    controller.abort();
  };
  return promise;
}

function postJson (url: string, body: any) {
  const controller = new AbortController();
  const promise = new Promise(function (resolve, reject) {
    const init : RequestInit = {
      method: 'POST',
      mode: 'cors',
      cache: 'no-cache',
      credentials: 'include',
      signal: controller.signal,
      headers: {
        'X-Csrf-Token': (<any>window).csrfToken,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(body),
    };
    fetch(url, init).then(function (req) {
      const ct = req.headers.get('Content-Type') || '';
      if (!/^application\/json/.test(ct)) {
        req.text().then(function (body) {
          reject(new Error('unexpected response from server: ' + body));
        }).catch(function (err) {
          reject(new Error('failed to read server response: ' + err));
        });
        return;
      }
      req.json().then(resolve).catch(function (err) {
        reject(new Error('bad response from server: ' + err));
      });
    }).catch(reject);
  });
  (promise as any)[CANCEL] = function () {
    controller.abort();
  };
  return promise;
}

/* Saga argument to call effect is invariant, type of monitorBackendTask should
   be (saga: Saga, optimisticChanges?: OptimisticChange<Collection>[]) */
export function* monitorBackendTask (saga: any, optimisticChanges?: any): Saga {
  const taskRef = {
    task: undefined,
  };
  yield put(actionCreators.clearError());
  yield put(actionCreators.backendTaskStarted(taskRef, optimisticChanges || []));
  taskRef.task = yield fork(function* () {
    try {
      return yield call(saga);
    } catch (ex) {
      if (ex instanceof LoggedOutError) {
        console.log('Your session has expired, please reload the page.');
      } else {
        console.log(ex);
      }
      yield put(actionCreators.backendTaskFailed(taskRef, ex.toString()));
    } finally {
      yield put(actionCreators.backendTaskDone(taskRef));
    }
  });
}

function* backendGet<T> (path: string, options?: {cache: boolean}): Saga {
  const response: ApiResponse<T> = yield call(fetchJson, `${process.env.BACKEND_URL}/${path}`, options || {});
  if ('error' in response) {
    if (response.error === "you don't exist") {
      throw new LoggedOutError();
    }
    throw new Error(response.error);
  }
  if (response.entities !== undefined) {
    yield put(actionCreators.backendEntitiesLoaded(response.entities));
  }
  return response.result;
}

function* backendPost<T> (path: string, body: object | null): Saga {
  const response: ApiResponse<T> = yield call(postJson, `${process.env.BACKEND_URL}/${path}`, body);
  if ('error' in response) {
    if (response.error === "you don't exist") {
      throw new LoggedOutError();
    }
    throw new Error(response.error);
  }
  if (response.entities !== undefined) {
    yield put(actionCreators.backendEntitiesLoaded(response.entities));
  }
  return response.result;
}

export function* getUser (): Saga {
  // result: {userId: string}
  return yield call(backendGet, 'User');
}

export function* loadAuthenticatedUserLanding (): Saga {
  // result: {userId: string, contestIds: string[]}
  return yield call(backendGet, `AuthenticatedUserLanding`);
}

export function* loadContest (contestId: string): Saga {
  // result: {}
  return yield call(backendGet, `Contests/${contestId}`);
}

export function* loadContestTeam (contestId: string): Saga {
  // result: {teamId: string | null}
  return yield call(backendGet, `Contests/${contestId}/Team`);
}

export function* createTeam (contestId: string, teamName: string): Saga {
  // result: {teamId: string | null}
  return yield call(backendPost, `Contests/${contestId}/CreateTeam`, {teamName});
}

export function* joinTeam (contestId: string, accessCode: string): Saga {
  // result: {teamId: string | null}
  return yield call(backendPost, `Contests/${contestId}/JoinTeam`, {accessCode});
}

export function* leaveTeam (teamId: string): Saga {
  // result: {}
  return yield call(backendPost, `Teams/${teamId}/Leave`, {});
}

export function* updateTeam (teamId: string, arg: {isOpen?: boolean, publicKey?: string}): Saga {
  return yield call(backendPost, `Teams/${teamId}/Update`, arg);
}

export function* changeTeamAccessCode (teamId: string): Saga {
  // result: {}
  return yield call(backendPost, `Teams/${teamId}/AccessCode`, null);
}
