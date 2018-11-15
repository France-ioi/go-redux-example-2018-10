
package routes

import (
  "github.com/gin-gonic/gin"
  "github.com/France-ioi/go-redux-example-201810/utils"
  "github.com/France-ioi/go-redux-example-201810/view"
)

func (svc *Service) RouteUsers(r gin.IRoutes) {

  r.GET("/User", func (c *gin.Context) {
    resp := utils.NewResponse(c)
    v := view.New(svc.model)
    userId, ok := svc.GetUserId(c)
    if ok {
      err := v.ViewUser(userId)
      if err != nil { resp.Error(err); return }
    }
    resp.Send(v.Flat())
  })

}
