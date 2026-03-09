export const up = (pgm) => {
    // 1. Create the notify function
    pgm.sql(`
      CREATE OR REPLACE FUNCTION notify_session_changes()
      RETURNS trigger AS $$
      BEGIN
        PERFORM pg_notify(
          'session_updates',
          json_build_object(
            'table', TG_TABLE_NAME,
            'action', TG_OP,
            'record', row_to_json(NEW)
          )::text
        );
        RETURN NEW;
      END;
      $$ LANGUAGE plpgsql;
    `);
  
    pgm.sql(`
      CREATE TRIGGER session_changes_trigger
      AFTER INSERT OR UPDATE OR DELETE ON sessions
      FOR EACH ROW EXECUTE FUNCTION notify_session_changes();
    `);
  };
  
  export const down = (pgm) => {
    pgm.sql(`DROP TRIGGER IF EXISTS session_changes_trigger ON sessions;`);
    pgm.sql(`DROP FUNCTION IF EXISTS notify_session_changes();`);
  };
