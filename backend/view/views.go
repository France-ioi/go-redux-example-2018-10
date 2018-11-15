
package view

import (
  "github.com/go-errors/errors"
  j "github.com/epixode/jase"

  "github.com/France-ioi/go-redux-example-201810/model"
)

func (v *View) ViewUser(userId int64) error {
  v.userId = userId
  user, err := v.model.LoadUser(userId)
  if err != nil { return err }
  if user != nil {
    v.addUser(user)
    v.Set("userId", j.String(model.ExportId(user.Id)))
  } else {
    v.Set("userId", j.Null)
  }
  return nil
}

func (v *View) ViewUserContests(userId int64) error {
  v.userId = userId
  contests, err := v.model.LoadUserContests(userId)
  if err != nil { return err }
  contestIds := j.Array()
  for i := range contests {
    contest := &contests[i]
    contestIds.Item(j.String(v.addContest(contest)))
  }
  v.Set("contestIds", contestIds)
  return nil
}

func (v *View) ViewUserContest(userId int64, contestId int64) error {
  v.userId = userId
  v.contestId = contestId

  /* verify user has access to contest */
  ok, err := v.model.CanUserAccessContest(userId, contestId)
  if err != nil { return err }
  if !ok { return errors.Errorf("access denied") }

  contest, err := v.model.LoadContest(v.contestId)
  if err != nil { return err }

  v.addContest(contest)
  err = v.addContestTeams(contestId)
  if err != nil { return err }

  return nil
}

func (v *View) ViewUserContestTeam(userId int64, contestId int64) error {
  v.userId = userId
  v.contestId = contestId
  team, err := v.model.LoadUserContestTeam(userId, contestId)
  if err != nil { return err }
  if team == nil {
    v.Set("teamId", j.Null)
    return nil
  }
  v.teamId = team.Id
  v.Set("teamId", j.String(model.ExportId(team.Id)))
  err = v.addTeams([]int64{team.Id})
  if err != nil { return err }
  err = v.addTeamMembers([]int64{team.Id})
  if err != nil { return err }
  return nil
}
