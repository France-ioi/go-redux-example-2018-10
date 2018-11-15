
# Backend

The backend is packaged as a go 1.11+ module.
See https://github.com/golang/go/wiki/Modules

Build with:
```sh
go build
```

# Local store in browser

- state: simple store of collection / id / facet / object
  - a collection generally corresponds to a DB table
  - ids are always opaque strings (from the frontend's perspective) to
    remove the risk of being mangled; this also enables composite ids
    for join tables.
  - a main facet holds most properties, other facets hold properties
    that benefit from being decoupled from the main facet (either
    because they are not always needed, or because it is desirable to
    transfer them separately)
  - the server returns collections as lists of ids
- the frontend is responsible for maintaining any indexes it needs,
  if it needs to do relational queries on its view of the model

- selectors: state + id -> entity {isLoaded, value}
  - each entity is allocated before its value is constructed,
    allowing a graph to be assembled
  - cache mechanism to so object identities change when the state has changed
    - could be done with observables (should defer so update is atomic)

- benefits
  - server-received state is simple, easy to serialize
  - facets enable partial loading
  - views have direct access to a graph of entities
  - collections are immediately available
  - the facet mechanism can be used to apply optimistic changes
    - when the user performs an action, a facet is added to one or more
      entities, simulating changes expected in the server's response
      (the facets corresponding to optimistic are kept separately from
       the data received from the server)
    - selectors make the change immediately visible to the user
    - when the server response arrives, the extra facet is removed

API design

- routes return a result (possibly containing ids) and a list of
  (collection, id, facet, object)
- http caching can be used for any subset of facets
 - either requested by multiple user
 - or requested multiple times by a single user

