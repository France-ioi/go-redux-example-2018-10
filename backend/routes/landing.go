
package routes

import (
  "github.com/gin-gonic/gin"
  "github.com/France-ioi/go-redux-example-201810/utils"
  "github.com/France-ioi/go-redux-example-201810/view"
)

func (svc *Service) RouteLanding(r gin.IRoutes) {

  r.GET("/AuthenticatedUserLanding", func(c *gin.Context) {
    r := utils.NewResponse(c)
    v := view.New(svc.model)
    var err error
    userId, ok := svc.GetUserId(c)
    if !ok { r.BadUser(); return }
    err = v.ViewUser(userId)
    if err != nil { r.Error(err); return }
    err = v.ViewUserContests(userId)
    if err != nil { r.Error(err); return }
    r.Send(v.Flat())
  })

}
