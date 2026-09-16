CREATE TABLE IF NOT EXISTS task_activities (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  task_id uuid NOT NULL REFERENCES tasks(id) ON DELETE CASCADE,
  user_id uuid REFERENCES users(id) ON DELETE SET NULL,
  action_description text NOT NULL,
  created_at timestamp without time zone NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_task_activities_created_at
  ON task_activities (created_at DESC);

CREATE INDEX IF NOT EXISTS idx_task_activities_task_id
  ON task_activities (task_id);
