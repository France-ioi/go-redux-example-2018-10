
package view

import (
  "fmt"
  j "github.com/epixode/jase"
  "github.com/France-ioi/go-redux-example-201810/model"
)

func (v *View) addUsers(ids []int64) error {
  users, err := v.model.LoadUsersById(ids)
  if err != nil { return err }
  for i := range users {
    user := &users[i]
    v.addUser(user)
  }
  return nil
}

func (v *View) addTeams(ids []int64) error {
  teams, err := v.model.LoadTeamsById(ids)
  if err != nil { return err }
  for i := range teams {
    team := &teams[i]
    v.addTeam(team)
  }
  return nil
}

func (v *View) addContestTeams(contestId int64) error {
  teams, err := v.model.LoadContestTeams(contestId)
  if err != nil { return err }
  ids := j.Array()
  for i := range teams {
    team := &teams[i]
    ids.Item(j.String(ExportId(team.Id)))
    v.addTeam(team)
  }
  obj := j.Object()
  obj.Prop("teamIds", ids)
  v.Add(fmt.Sprintf("contests#teams %s", ExportId(contestId)), obj)
  return nil
}

func (v *View) addTeamMembers(ids []int64) error {
  allMembers, err := v.model.LoadTeamMembersByTeamId(ids)
  if err != nil { return err }
  byTeamId := make(map[int64][]*model.TeamMember)
  for i := range allMembers {
    m := &allMembers[i]
    byTeamId[m.Team_id] = append(byTeamId[m.Team_id], m)
  }
  for teamId, members := range byTeamId {
    ids := j.Array()
    for _, member := range members {
      ids.Item(j.String(v.addTeamMember(member)))
      v.users.Need(member.User_id)
    }
    v.users.Load(v.addUsers)
    obj := j.Object()
    obj.Prop("memberIds", ids)
    v.Add(fmt.Sprintf("teams#members %s", ExportId(teamId)), obj)
  }
  return nil
}
