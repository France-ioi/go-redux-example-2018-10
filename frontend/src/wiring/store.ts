
import {Actions, ActionTypes} from '../app';
import {BackendState, reducer as backendReducer, backendInit} from '../Backend';
import {reducer as teamReducer} from '../Team';

export type State =
  BackendState &
  {
    userId: string /* id of user logged in or 'unknonw' */,
    contestIds: string[] | undefined /* list of available contests, if loaded */,
    contestId: string /* id of current contest or 'unknown' */,
    teamId: string | null /* id of user's team or null or 'unknown' */,
  }

export const initialState : State = {
  ...backendInit,
  userId: 'unknown',
  contestIds: undefined,
  contestId: 'unknown',
  teamId: 'unknown',
}

function devReducer(state: State, action: Actions): State {
  if (action.type === ActionTypes.LOAD) {
    return action.payload.state;
  }
  return state;
}

export function reducer (state: State | undefined, action: Actions) : State {
  let newState : State = state === undefined ? initialState : state;
  try {
    newState = devReducer(newState, action);
    newState = backendReducer(newState, action);
    newState = teamReducer(newState, action);
    return newState;
  } catch (ex) {
    console.error('exception caught in reducer', ex);
    return newState;
  }
}
