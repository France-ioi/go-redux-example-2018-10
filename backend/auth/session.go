
package auth

import (
  "errors"
  "github.com/gin-gonic/gin"
  "github.com/gin-contrib/sessions"
  "github.com/France-ioi/go-redux-example-201810/utils"
  "github.com/France-ioi/go-redux-example-201810/model"
)

func clearSession(c *gin.Context) {
  session := sessions.Default(c)
  session.Clear()
  session.Save()
}

func newSessionState(c *gin.Context) (string, error) {
  state, err := utils.NewState()
  if err != nil { return "", err }
  session := sessions.Default(c)
  session.Set("state", state)
  session.Save()
  return state, nil
}

func getSessionState(c *gin.Context) (string, error) {
  session := sessions.Default(c)
  state := session.Get("state")
  if state == nil { return "", errors.New("no state") }
  return state.(string), nil
}

func setUserId(c *gin.Context, userId int64) {
  session := sessions.Default(c)
  session.Set("userId", model.ExportId(userId))
  session.Save()
}

func GetUserId(c *gin.Context) (userId int64, ok bool) {
  session := sessions.Default(c)
  val := session.Get("userId")
  if val == nil {
    return 0, false
  }
  return model.ImportId(val.(string)), true
}
