
package config


type Config struct {

  /* If Production is true, disable gin colors and debugging. */
  Production bool `yaml:"production"`

  /* Set to the listen address of the backend, such as ":8000" */
  Listen string `yaml:"listen"`

  /* If LogFile is non-empty, name of file to which gin logs are written. */
  LogFile string `yaml:"log_file"`

  /* Set MountPath to the path where the backend is to be mounted.
     A reverse proxy is expected to pass requests with no rewriting. */
  MountPath string `yaml:"mount_path"`

  /* Set to the same value as the Origin header sent to the frontend */
  FrontendOrigin string

  /* Set Host to the public host name of the backend.  Host is set on cookies. */
  Host string

  /* Configuration for cookie-based session. */
  SessionName string
  SessionSecret string
  SessionMaxAge int // seconds

  /* Database connection string */
  DataSource string `yaml:"datasource"`

  /* Address of the redis server */
  RedisAddr string `yaml:"redis_addr"`

  Auth AuthConfig `yaml:"auth"`
}

type AuthConfig struct {
  ClientID string `yaml:"client_id"`
  ClientSecret string `yaml:"client_secret"`
  RedirectURL string `yaml:"redirect_url"`
  AuthURL string `yaml:"auth_url"`
  TokenURL string `yaml:"token_url"`
  ProfileURL string `yaml:"profile_url"`
  LogoutURL string `yaml:"logout_url"`
}
