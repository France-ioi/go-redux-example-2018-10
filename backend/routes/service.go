
package routes

import (
  "github.com/gin-gonic/gin"
  "github.com/go-redis/redis"
  "github.com/France-ioi/go-redux-example-201810/config"
  "github.com/France-ioi/go-redux-example-201810/model"
  "github.com/France-ioi/go-redux-example-201810/auth"
)

type Service struct {
  config *config.Config
  rc *redis.Client
  model *model.Model
  auth *auth.Service
  // events *events.Service
}

func NewService(config *config.Config, rc *redis.Client, model *model.Model, auth *auth.Service/*, events *events.Service*/) *Service {
  return &Service{
    config: config,
    rc: rc,
    model: model,
    auth: auth,
    // events: events,
  }
}

func (svc *Service) RouteAll(r gin.IRoutes) {
  svc.RouteContests(r)
  svc.RouteLanding(r)
  svc.RouteTeams(r)
  svc.RouteUsers(r)
}

func (svc *Service) GetUserId(c *gin.Context) (int64, bool) {
  return auth.GetUserId(c)
}
