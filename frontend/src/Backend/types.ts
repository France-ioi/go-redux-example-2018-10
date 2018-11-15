
/* Types of entities as they are received from the backend. */

export type Collection = keyof PreEntities;

export type OptimisticChange<K extends Collection> = {
  collection: K,
  id: string,
  change: PreEntities[K][string] extends {"!": infer T} ? T : never
};

export type UserFacets = {
  "": {
    id: string,
    username: string,
    firstname: string,
    lastname: string,
  }
}

export type ContestFacets = {
  "": {
    id: string,
    title: string,
    description: string,
    logoUrl: string,
    registrationOpen: boolean,
    registrationClosesAt: string,
    startsAt: string,
    endsAt: string,
    taskId: string,
    currentPeriodId: string,
  },
  "teams": {
    teamIds: string[],
  }
}

export type TeamFacets = {
  "": {
    id: string,
    createdAt: string,
    updatedAt: string,
    deletedAt?: string,
    contestId: string,
    isOpen: boolean,
    isLocked: boolean,
    name: string,
    publicKey: string,
  },
  "member": {
    accessCode: string,
  },
  "members": {
    memberIds: string[],
  },
  "!": {
    isOpen?: boolean,
    publicKey?: string,
  }
}

export type TeamMemberFacets = {
  "": {
    teamId: string,
    userId: string,
    joinedAt: string,
    isCreator: boolean,
  }
}

export type PreEntityMap<Facets> = {
  [id: string]: Facets
}

export type PreEntities = {
  users: PreEntityMap<UserFacets>,
  contests: PreEntityMap<ContestFacets>,
  teams: PreEntityMap<TeamFacets>,
  teamMembers: PreEntityMap<TeamMemberFacets>,
}

export type BackendState = {
  backend: {
    loggedOut: boolean,
    generation: number,
    lastError: string | undefined,
    tasks: object[],
    entities: PreEntities,
    pristineEntities: PreEntities,
    optimisticChanges: OptimisticChange<Collection>[],
  }
}
