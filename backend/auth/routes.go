
package auth

import (

  "encoding/json"
  "io/ioutil"
  "net/http"

  "github.com/gin-gonic/gin"
  "golang.org/x/oauth2"

  "github.com/France-ioi/go-redux-example-201810/config"
  "github.com/France-ioi/go-redux-example-201810/model"

)

type Service struct {
  config *config.Config
  oauth *oauth2.Config
  model *model.Model
}

func NewService(config *config.Config, m *model.Model) *Service {
  oauthConf := &oauth2.Config{
      ClientID: config.Auth.ClientID,
      ClientSecret: config.Auth.ClientSecret,
      RedirectURL: config.Auth.RedirectURL,
      Endpoint: oauth2.Endpoint{
        AuthURL: config.Auth.AuthURL,
        TokenURL: config.Auth.TokenURL,
      },
      Scopes: []string{"account"},
  }
  return &Service{config, oauthConf, m}
}

func (svc *Service) Route(r gin.IRoutes) {

  r.GET("/Login", func (c *gin.Context) {
    /* Open this route in a new window to redirect the user to the identity
       provider (IdP) for authentication.  The IdP will eventually redirect
       the user to the /LoginComplete route.
       Do not open this route in an iframe, as it may prevent the IdP from
       getting/ting the user's cookies (see Block Third-party cookies). */
    state, err := newSessionState(c)
    if err != nil { c.AbortWithError(500, err); return }
    c.Redirect(http.StatusSeeOther, svc.oauth.AuthCodeURL(state))
  })

  r.GET("/LoginComplete", func (c *gin.Context) {

    errStr := c.Query("error")
    if errStr != "" {
      c.HTML(http.StatusOK, "loginError", loginErrorData{Error: errStr, Message: ""})
    }

    state, err := getSessionState(c)
    if err != nil || state != c.Query("state") {
      c.String(400, "bad state")
      return
    }

    token, err := svc.oauth.Exchange(c, c.Query("code"))
    if err != nil { c.AbortWithError(500, err); return }

    client := svc.oauth.Client(c, token)
    resp, err := client.Get(svc.config.Auth.ProfileURL)
    if err != nil { c.AbortWithError(500, err); return }
    defer resp.Body.Close()

    body, err := ioutil.ReadAll(resp.Body)
    if err != nil { c.AbortWithError(500, err); return }

    profile := LoadUserProfile(body)
    userId, err := svc.model.ImportUserProfile(profile)
    if err != nil { c.AbortWithError(500, err); return }

    setUserId(c, userId)

    type Message struct {
      Type string `json:"type"`
      UserId string `json:"userId"`
    }
    var msgBytes []byte
    msgBytes, err = json.Marshal(Message{
      Type: "login",
      UserId: model.ExportId(userId),
    })
    if err != nil { c.AbortWithError(500, err) }
    data := loginCompleteData{
      Message: string(msgBytes),
      Target: svc.config.FrontendOrigin,
    }
    c.HTML(http.StatusOK, "loginComplete", data)
  })

  r.GET("/Logout", func (c *gin.Context) {
    /* Open this route in a new window to clear the user's session, and
       redirect to the IdP's logout page.
       Do not open this route in an iframe, as it may prevent the IdP from
       getting/setting the user's cookies (see Block Third-party cookies). */

    clearSession(c)

    type Message struct {
      Type string `json:"type"`
    }
    msgBytes, err := json.Marshal(Message{
      Type: "logout",
    })
    if err != nil { c.AbortWithError(500, err) }
    data := logoutCompleteData{
      Message: string(msgBytes),
      Target: svc.config.FrontendOrigin,
      LogoutUrl: svc.config.Auth.LogoutURL,
    }

    c.HTML(http.StatusOK, "logoutComplete", data)
  })

}
