-- prisma/migrations/0001_init/migration.sql
-- Full-text search index on tasks (Dutch language analyzer)
-- This must run AFTER prisma migrate creates the tasks table.

-- Full-text search vector column update trigger
CREATE OR REPLACE FUNCTION tasks_search_vector_update()
RETURNS TRIGGER AS $$
BEGIN
  NEW."searchVector" :=
    setweight(to_tsvector('dutch', coalesce(NEW.title, '')), 'A') ||
    setweight(to_tsvector('dutch', coalesce(NEW.description, '')), 'B') ||
    setweight(to_tsvector('dutch', coalesce(array_to_string(NEW."skillsRequired", ' '), '')), 'C');
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply trigger on insert and update
DROP TRIGGER IF EXISTS tasks_search_vector_trigger ON tasks;
CREATE TRIGGER tasks_search_vector_trigger
  BEFORE INSERT OR UPDATE ON tasks
  FOR EACH ROW EXECUTE FUNCTION tasks_search_vector_update();

-- GIN index for fast full-text search
CREATE INDEX IF NOT EXISTS tasks_search_vector_idx ON tasks USING GIN("searchVector");

-- Composite index for common dashboard queries
CREATE INDEX IF NOT EXISTS tasks_status_deadline_idx ON tasks (status, deadline);
CREATE INDEX IF NOT EXISTS applications_task_status_idx ON applications ("taskId", status);
CREATE INDEX IF NOT EXISTS payments_status_idx ON payments (status);
CREATE INDEX IF NOT EXISTS audit_logs_created_idx ON audit_logs ("createdAt" DESC);
