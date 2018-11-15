
package view

import (
  "fmt"
  j "github.com/epixode/jase"

  "github.com/France-ioi/go-redux-example-201810/model"
)

func (v *View) addUser(user *model.User) string {
  id := ExportId(user.Id)
  obj := j.Object()
  obj.Prop("id", j.String(ExportId(user.Id)))
  obj.Prop("username", j.String(user.Username))
  obj.Prop("firstname", j.String(user.Firstname))
  obj.Prop("lastname", j.String(user.Lastname))
  if v.isAdmin {
    obj.Prop("foreignId", j.String(user.Foreign_id))
    obj.Prop("createdAt", j.String(user.Created_at))
    obj.Prop("updatedAt", j.String(user.Updated_at))
    obj.Prop("isAdmin", j.Boolean(user.Is_admin))
  }
  v.Add(fmt.Sprintf("users %s", id), obj)
  return id
}

func (v *View) addTeam(team *model.Team) string {
  id := ExportId(team.Id)
  obj := j.Object()
  obj.Prop("id", j.String(ExportId(team.Id)))
  obj.Prop("createdAt", j.String(team.Created_at))
  obj.Prop("updatedAt", j.Time(team.Updated_at))
  if team.Deleted_at.Valid {
    obj.Prop("deletedAt", j.String(team.Deleted_at.String))
  }
  obj.Prop("contestId", j.String(ExportId(team.Contest_id)))
  obj.Prop("isOpen", j.Boolean(team.Is_open))
  obj.Prop("isLocked", j.Boolean(team.Is_locked))
  obj.Prop("name", j.String(team.Name))
  v.Add(fmt.Sprintf("teams %s", id), obj)
  if v.teamId == team.Id {
    obj := j.Object()
    obj.Prop("accessCode", j.String(team.Access_code))
    v.teamMembers.Need(team.Id)
    v.Add(fmt.Sprintf("teams#member %s", id), obj)
  }
  return id
}

func (v *View) addTeamMember(member *model.TeamMember) string {
  id := fmt.Sprintf("%d_%d", member.Team_id, member.User_id)
  obj := j.Object()
  obj.Prop("teamId", j.String(ExportId(member.Team_id)))
  obj.Prop("userId", j.String(ExportId(member.User_id)))
  obj.Prop("joinedAt", j.String(member.Joined_at))
  obj.Prop("isCreator", j.Boolean(member.Is_creator))
  v.Add(fmt.Sprintf("teamMembers %s", id), obj)
  return id
}

func (v *View) addContest(contest *model.Contest) string {
  id := ExportId(contest.Id)
  obj := j.Object()
  obj.Prop("id", j.String(ExportId(contest.Id)))
  obj.Prop("title", j.String(contest.Title))
  v.Add(fmt.Sprintf("contests %s", id), obj)
  return id
}
