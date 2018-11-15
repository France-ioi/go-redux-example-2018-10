
import {Moment} from 'moment';

export type AnyAction = {
  type: string,
  payload: object,
}

export interface Entity<T> {
  readonly isNull: boolean,
  readonly isLoading: boolean,
  readonly isLoaded: boolean,
  readonly id: string,
  readonly value: T,
}

export type User = {
  id: string,
  username: string,
  firstname: string,
  lastname: string,
}

export type Team = {
  id: string,
  name: string,
  deletedAt?: string,
  accessCode: string | undefined,
  isOpen: boolean /* can new users join the team? */,
  isLocked: boolean /* contest started, team cannot be changed */,
  members: Entity<TeamMember>[] | undefined,
  publicKey: string,
}

export type TeamMember = {
  user: Entity<User>,
  team: Entity<Team>,
  isCreator: boolean,
  joinedAt: Moment,
}

export type Contest = {
  id: string,
  title: string,
  teams: Entity<Team>[] | undefined,
}
