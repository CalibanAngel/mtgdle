import { MigrationInterface, QueryRunner } from 'typeorm';

export class SchemaUpdate1744021855409 implements MigrationInterface {
  name = 'SchemaUpdate1744021855409';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `CREATE TYPE "public"."sets_settype_enum" AS ENUM('core', 'expansion', 'masters', 'alchemy', 'masterpiece', 'arsenal', 'from_the_vault', 'spellbook', 'premium_deck', 'duel_deck', 'draft_innovation', 'treasure_chest', 'commander', 'planechase', 'archenemy', 'vanguard', 'funny', 'starter', 'box', 'promo', 'token', 'memorabilia', 'minigame')`,
    );
    await queryRunner.query(
      `CREATE TABLE "sets" ("id" uuid NOT NULL, "name" text NOT NULL, "code" text NOT NULL, "releasedAt" text, "cardCount" integer NOT NULL, "setType" "public"."sets_settype_enum" NOT NULL, "scryfallUri" text NOT NULL, "createdAt" TIMESTAMP NOT NULL DEFAULT now(), "updatedAt" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "PK_5d15ed8b3e2a5cb6e9c9921d056" PRIMARY KEY ("id"))`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE "sets"`);
    await queryRunner.query(`DROP TYPE "public"."sets_settype_enum"`);
  }
}
