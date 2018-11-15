
package model

import (
  "context"
  "database/sql"
  "strconv"
  "github.com/jmoiron/sqlx"
  "github.com/jmoiron/modl"
  "github.com/go-errors/errors"
  _ "github.com/go-sql-driver/mysql"
)

type Model struct {
  db *sqlx.DB
  dbMap *modl.DbMap
  tables Tables
}

func New (db *sql.DB) *Model {
  model := new(Model)
  if err := db.Ping(); err != nil {
    panic("database is unreachable")
  }
  model.db = sqlx.NewDb(db, "mysql")
  model.dbMap = modl.NewDbMap(db, modl.MySQLDialect{"InnoDB", "UTF8"})
  model.tables.Map(model.dbMap)
  return model
}

func (m *Model) Transaction(ctx context.Context, cb func () error) error {
  tx, err := m.db.BeginTx(ctx, &sql.TxOptions{Isolation: sql.LevelSerializable})
  if err != nil { return errors.Wrap(err, 0) }
  err = cb()
  if err != nil {
    tx.Rollback()
    return err
  }
  err = tx.Commit()
  if err != nil {
    return errors.Wrap(err, 0)
  }
  return nil
}

func ImportId(id string) int64 {
  n, err := strconv.ParseInt(id, 10, 64)
  if err != nil { return 0 }
  return n
}

func ExportId(id int64) string {
  return strconv.FormatInt(id, 10)
}
