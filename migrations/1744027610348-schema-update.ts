import { MigrationInterface, QueryRunner } from 'typeorm';

export class SchemaUpdate1744027610348 implements MigrationInterface {
  name = 'SchemaUpdate1744027610348';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "sets" DROP COLUMN "code"`);
    await queryRunner.query(
      `ALTER TABLE "sets" ADD "code" character varying(8) NOT NULL`,
    );
    await queryRunner.query(
      `ALTER TABLE "sets" ADD CONSTRAINT "UQ_c08b4999f129be8ed34d4a45b34" UNIQUE ("code")`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "sets" DROP CONSTRAINT "UQ_c08b4999f129be8ed34d4a45b34"`,
    );
    await queryRunner.query(`ALTER TABLE "sets" DROP COLUMN "code"`);
    await queryRunner.query(`ALTER TABLE "sets" ADD "code" text NOT NULL`);
  }
}
