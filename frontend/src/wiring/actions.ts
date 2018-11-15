
import {Collection, OptimisticChange} from '../Backend/types';

import {State} from './store';
import * as ActionTypes from './action_types';

export interface Action<T extends string, P> {
  type: T,
  payload: P,
}

export function createAction<T extends string, P>(type: T, payload: P) : Action<T, P> {
  return {type, payload};
}

export const actionCreators = {

  init: () => createAction(ActionTypes.INIT, {}),

  // dev
  load: (state: State) => createAction(ActionTypes.LOAD, {state}),

  // errors
  sagaError: (error: Error) => createAction(ActionTypes.SAGA_ERROR, {error}),
  clearError: () => createAction(ActionTypes.CLEAR_ERROR, {}),

  // authentication
  userLoggedOut: () => createAction(ActionTypes.USER_LOGGED_OUT, {}),
  userLoggedIn: (userId: string) => createAction(ActionTypes.USER_LOGGED_IN, {userId}),

  // backend
  backendTaskStarted: (task: object, optimisticChanges: OptimisticChange<Collection>[]) => createAction(ActionTypes.BACKEND_TASK_STARTED, {task, optimisticChanges}),
  backendTaskFailed: (task: object, error: string) => createAction(ActionTypes.BACKEND_TASK_FAILED, {task, error}),
  backendTaskDone: (task: object) => createAction(ActionTypes.BACKEND_TASK_DONE, {task}),
  backendEntitiesLoaded: (entities: {[key: string]: object}) => createAction(ActionTypes.BACKEND_ENTITIES_LOADED, {entities}),
  backendLoggedOut: () => createAction(ActionTypes.BACKEND_LOGGED_OUT, {}),

  // model
  contestListChanged: (contestIds: string[]) => createAction(ActionTypes.CONTEST_LIST_CHANGED, {contestIds}),
  contestChanged: (contestId: string) => createAction(ActionTypes.CONTEST_CHANGED, {contestId}),
  teamChanged: (teamId: string) => createAction(ActionTypes.TEAM_CHANGED, {teamId}),

  // team management
  createTeam: (contestId: string, teamName: string) => createAction(ActionTypes.CREATE_TEAM, {contestId, teamName}),
  joinTeam: (contestId: string, accessCode: string) => createAction(ActionTypes.JOIN_TEAM, {contestId, accessCode}),
  leaveTeam: (teamId: string) => createAction(ActionTypes.LEAVE_TEAM, {teamId}),
  changeTeamAccessCode: (teamId: string) => createAction(ActionTypes.CHANGE_TEAM_ACCESS_CODE, {teamId}),
  changeTeamIsOpen: (teamId: string, isOpen: boolean) => createAction(ActionTypes.CHANGE_TEAM_IS_OPEN, {teamId, isOpen}),
  changeTeamKey: (teamId: string, publicKey: string) => createAction(ActionTypes.CHANGE_TEAM_KEY, {teamId, publicKey}),

};

type FunctionType = (...args: any[]) => any;
type ActionCreatorMapObject = {[actionCreator: string]: FunctionType};
type ActionsUnion<A extends ActionCreatorMapObject> = ReturnType<A[keyof A]>;
export type Actions = ActionsUnion<typeof actionCreators>;
export type ActionsOfType<T extends string> = Extract<Actions, {type: T}>;
