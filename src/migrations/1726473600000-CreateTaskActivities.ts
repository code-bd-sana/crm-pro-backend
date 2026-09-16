import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateTaskActivities1726473600000 implements MigrationInterface {
  name = 'CreateTaskActivities1726473600000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS task_activities (
        id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
        task_id uuid NOT NULL REFERENCES tasks(id) ON DELETE CASCADE,
        user_id uuid REFERENCES users(id) ON DELETE SET NULL,
        action_description text NOT NULL,
        created_at timestamp without time zone NOT NULL DEFAULT now()
      );
    `);

    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS idx_task_activities_created_at
        ON task_activities (created_at DESC);
    `);

    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS idx_task_activities_task_id
        ON task_activities (task_id);
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP INDEX IF EXISTS idx_task_activities_task_id;`);
    await queryRunner.query(`DROP INDEX IF EXISTS idx_task_activities_created_at;`);
    await queryRunner.query(`DROP TABLE IF EXISTS task_activities;`);
  }
}
