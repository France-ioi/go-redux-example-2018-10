
import * as moment from 'moment';

import {Entity, User, Contest, Team, TeamMember} from '../types';

import {BackendState as State, Collection, PreEntities} from './types';

export const selectors = {
  users: getUser,
  contests: getContest,
  teams: getTeam,
  teamMembers: getTeamMember,
}

type Selector<K extends Collection> = (typeof selectors)[K]
type CollectionEntity<K extends Collection> = ReturnType<Selector<K>>
type CollectionFacets<K extends Collection> = PreEntities[K][string]
type CollectionEntityType<K extends Collection> = CollectionEntity<K> extends Entity<infer T> ? T : any;

function nullEntity<K extends Collection>(): EntityImpl<K> {
  return new EntityImpl<K>(null);
}
function thunkEntity<K extends Collection>(id: string): EntityImpl<K> {
  return new EntityImpl<K>(id);
}

var cache : Map<string, any> = new Map();
var cacheGeneration : number = -1;
function maybeClearCache(state: State) {
  if (cacheGeneration !== state.backend.generation) {
    cache = new Map();
    cacheGeneration = state.backend.generation;
  }
}

function visitEntity<K extends Collection>(
  state: State,
  collection: K,
  id: string | null,
  load: (entity: EntityImpl<K>, facets: CollectionFacets<K>) => void
): CollectionEntity<K> {
  maybeClearCache(state);
  const cacheKey = `${collection}_${id}`;
  if (cache.has(cacheKey)) {
    return cache.get(cacheKey);
  }
  const entity: EntityImpl<K> = id === null ? nullEntity() : thunkEntity(id);
  // (<any>entity)._k = collection;
  cache.set(cacheKey, entity);
  if (id !== null) {
    const facets = state.backend.entities[collection][id];
    if (facets !== undefined) {
      entity.facets = facets;
      entity.isLoading = true;
      entity._value = undefined;
      load(entity, facets);
      entity.isLoading = false;
      if (entity._value !== undefined) {
        entity.isLoaded = true;
      } else {
        entity.isFailed = true;
      }
    }
  }
  return <CollectionEntity<K>>entity;
}

class EntityImpl<K extends Collection> {
  constructor(id: string | null) {
    this._id = id;
    this.isNull = id === null;
    this.isLoading = false;
    this.isLoaded = false;
    this.isFailed = false;
  }
  _id: string | null;
  _value: CollectionEntityType<K> | undefined;
  facets: CollectionFacets<K> | undefined;
  get id(): string {
    if (this._id === null) {
      throw new Error("entity has no id");
    }
    return this._id;
  }
  get value(): CollectionEntityType<K> {
    if (this._value === undefined) {
      throw new Error("entity has no value");
    }
    return this._value;
  }
  isNull: boolean;
  isLoading: boolean;
  isLoaded: boolean;
  isFailed: boolean;
}

export function getUser (state: State, id: string | null): Entity<User> {
  return visitEntity(state, 'users', id, (entity, facets) => {
    const user = facets[''];
    entity._value = <User>user;
  });
}

export function getContest (state: State, id: string | null): Entity<Contest> {
  return visitEntity(state, 'contests', id, (entity, facets) => {
    const contest = facets[''];
    const teams = facets.teams ? facets.teams.teamIds.map(teamId => getTeam(state, teamId)) : undefined;
    entity._value = <Contest>{...contest, teams};
  });
}

export function getTeam (state: State, id: string | null): Entity<Team> {
  return visitEntity(state, 'teams', id, (entity, facets) => {
    const team = facets[''];
    const members = facets.members
      ? facets.members.memberIds.map(memberId => getTeamMember(state, memberId))
      : undefined;
    let accessCode : string | undefined;
    if (facets.member) {
      accessCode = facets.member.accessCode;
    }
    entity._value = <Team>{...team, members, accessCode, ...facets['!']};
  });
}

export function getTeamMember (state: State, id: string | null): Entity<TeamMember> {
  return visitEntity(state, 'teamMembers', id, (entity, facets) => {
    const member = facets[''];
    const team = getTeam(state, member.teamId);
    const user = getUser(state,  member.userId);
    const joinedAt = moment(member.joinedAt);
    entity._value = <TeamMember>{...member, team, user, joinedAt};
  });
}
