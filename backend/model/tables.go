package model

import (
  "github.com/jmoiron/modl"
)

type Tables struct {
  contests *modl.TableMap
  teamMembers *modl.TableMap
  teams *modl.TableMap
  users *modl.TableMap
}

func (t *Tables) Map(m *modl.DbMap) {
  t.contests = m.AddTableWithName(Contest{}, "contests").SetKeys(true, "Id")
  t.teamMembers = m.AddTableWithName(TeamMember{}, "team_members").SetKeys(true, "Team_id", "User_id")
  t.teams = m.AddTableWithName(Team{}, "teams").SetKeys(true, "Id")
  t.users = m.AddTableWithName(User{}, "users").SetKeys(true, "Id")
}
