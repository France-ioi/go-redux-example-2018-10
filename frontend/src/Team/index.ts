
import {delay} from 'redux-saga';
import {call, put, select, takeEvery, takeLatest} from 'redux-saga/effects';

import {State, Actions, ActionTypes, actionCreators, Saga} from '../app';
import {monitorBackendTask, loadContestTeam, createTeam, joinTeam, leaveTeam, updateTeam, changeTeamAccessCode, optimisticChange, loadContest} from '../Backend';

export {TeamState} from './types';

export function reducer (state: State, action: Actions): State {
  switch (action.type) {
    case ActionTypes.TEAM_CHANGED: {
      const {teamId} = action.payload;
      state = {...state, teamId};
      break;
    }
    case ActionTypes.LEAVE_TEAM: {
      /* XXX optimistic update is too early, should be done under the control
         of monitorBackendTask so we can revert the state? */
      state = {...state, teamId: null};
      break;
    }
    case ActionTypes.CHANGE_TEAM_ACCESS_CODE: {
      // XXX backend optimistic update
      break;
    }
    case ActionTypes.CHANGE_TEAM_IS_OPEN: {
      // XXX backend optimistic update
      break;
    }
  }
  return state;
}

export function* saga () : Saga {
  yield call(monitorBackendTask, function* () {
    const contestId = yield select((state: State) => state.contestId);
    const {teamId} = yield call(loadContestTeam, contestId);
    yield put(actionCreators.teamChanged(teamId));
    yield call(loadContest, contestId);
  });
  yield takeEvery(ActionTypes.CREATE_TEAM, function* (action: Actions) {
    if (action.type !== ActionTypes.CREATE_TEAM) return; //@ts
    yield call(monitorBackendTask, function* () {
      const {contestId, teamName} = action.payload;
      const result : {teamId: string | null} = yield call(createTeam, contestId, teamName);
      if (result.teamId) {
        yield put(actionCreators.teamChanged(result.teamId));
      }
    })
  });
  yield takeEvery(ActionTypes.JOIN_TEAM, function* (action: Actions) {
    if (action.type !== ActionTypes.JOIN_TEAM) return; //@ts
    yield call(monitorBackendTask, function* () {
      const {contestId, accessCode} = action.payload;
      const result : {teamId: string | null} = yield call(joinTeam, contestId, accessCode);
      if (result.teamId) {
        yield put(actionCreators.teamChanged(result.teamId));
      }
    });
  })
  yield takeEvery(ActionTypes.LEAVE_TEAM, function* (action: Actions) {
    if (action.type !== ActionTypes.LEAVE_TEAM) return; //@ts
    yield call(monitorBackendTask, function* () {
      yield call(leaveTeam, action.payload.teamId);
    });
  })
  yield takeEvery(ActionTypes.CHANGE_TEAM_ACCESS_CODE, function* (action: Actions) {
    if (action.type !== ActionTypes.CHANGE_TEAM_ACCESS_CODE) return; //@ts
    yield call(monitorBackendTask, function* () {
      yield call(changeTeamAccessCode, action.payload.teamId);
    });
  });
  yield takeEvery(ActionTypes.CHANGE_TEAM_IS_OPEN, function* (action: Actions) {
    if (action.type !== ActionTypes.CHANGE_TEAM_IS_OPEN) return; //@ts
    const {teamId, isOpen} = action.payload;
    yield call(monitorBackendTask, function* () {
      yield call(updateTeam, teamId, {isOpen: isOpen});
    }, [optimisticChange('teams', teamId, {isOpen: isOpen})]);
  });
  yield takeLatest(ActionTypes.CHANGE_TEAM_KEY, function* (action: Actions) {
    if (action.type !== ActionTypes.CHANGE_TEAM_KEY) return; //@ts
    const {teamId, publicKey} = action.payload;
    yield call(monitorBackendTask, function* () {
      yield call(delay, 250);
      yield call(updateTeam, teamId, {publicKey});
      console.log("Team key updated");
    }, [optimisticChange('teams', teamId, {publicKey: publicKey})]);
  });
}
