-- Postgres Function to notify on row changes
CREATE OR REPLACE FUNCTION notify_session_change()
RETURNS trigger AS $$
BEGIN
  PERFORM pg_notify('session_change', json_build_object(
    'eventType', TG_OP,
    'new', row_to_json(NEW)
  )::text);
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to call the function on INSERT or UPDATE
DROP TRIGGER IF EXISTS trg_session_change ON sessions;
CREATE TRIGGER trg_session_change
AFTER INSERT OR UPDATE ON sessions
FOR EACH ROW EXECUTE FUNCTION notify_session_change();
