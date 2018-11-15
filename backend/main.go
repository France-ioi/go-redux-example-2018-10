
package main

import (

  "database/sql"
  "html/template"
  "io"
  "io/ioutil"
  "log"
  "os"

  "github.com/gin-gonic/gin"
  "github.com/gin-contrib/sessions"
  "github.com/gin-contrib/sessions/cookie"
  "github.com/go-redis/redis"
  _ "github.com/go-sql-driver/mysql"
  "gopkg.in/yaml.v2"

  "github.com/France-ioi/go-redux-example-201810/config"
  "github.com/France-ioi/go-redux-example-201810/model"
  "github.com/France-ioi/go-redux-example-201810/auth"
  "github.com/France-ioi/go-redux-example-201810/routes"

)

func main() {

  var err error
  var configFile []byte
  configFile, err = ioutil.ReadFile("config.yaml")
  if err != nil { panic(err) }
  var config config.Config
  err = yaml.Unmarshal(configFile, &config)
  if err != nil { panic(err) }

  var db *sql.DB
  db, err = sql.Open("mysql", config.DataSource)
  if err != nil {
    log.Panicf("Failed to open database: %s\n", err)
  }
  err = db.Ping()
  if err != nil {
    log.Panicf("Failed to ping database: %s\n", err)
  }

  rc := redis.NewClient(&redis.Options{
    Addr:     config.RedisAddr,
    Password: "", // no password set
    DB:       0,  // use default DB
  })
  err = rc.Ping().Err()
  if err != nil {
    log.Panicf("Failed to ping redis: %s\n", err)
  }

  sessionStore := cookie.NewStore([]byte(config.SessionSecret))
  sessionStore.Options(sessions.Options{
    Path:     config.MountPath,
    Domain:   config.Host,
    MaxAge:   config.SessionMaxAge,
    Secure:   true,
    HttpOnly: false,
  })

  if config.Production {
    gin.DisableConsoleColor()
    gin.SetMode(gin.ReleaseMode)
  }

  if config.LogFile != "" {
    f, _ := os.Create(config.LogFile)
    gin.DefaultWriter = io.MultiWriter(f)
  }

  var engine = gin.Default()
  engine.SetHTMLTemplate(buildRootTemplate())
  engine.Use(sessions.Sessions(config.SessionName, sessionStore))

  var router gin.IRoutes = engine
  if config.MountPath != "" {
    router = engine.Group(config.MountPath)
  }

  model := model.New(db)

  authService := auth.NewService(&config, model)
  authService.Route(router)

  /*
  eventService, err := events.NewService(&config, rc, model, authService)
  if err != nil {
    log.Panicf("Failed to create event service: %s\n", err)
  }
  go eventService.Run()
  eventService.Route(router)
  */

  routes.NewService(&config, rc, model, authService/*, eventService*/).RouteAll(router)

  engine.Run(config.Listen)
}

func buildRootTemplate() *template.Template {
  t := template.New("")
  auth.SetupTemplates(t)
  template.Must(t.New("notImplemented").Parse(`<!DOCTYPE html>
<head lang="en"><meta charset="utf-8"><title>Not Implemented</title></head>
<body><p>Not Implemented</p></body>`))
  return t
}
