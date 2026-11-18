import { MigrationInterface, QueryRunner } from "typeorm";

export class CreatePlayer1795012864197 implements MigrationInterface {
    name = 'CreatePlayer1795012864197'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE TABLE "player" ("id" SERIAL NOT NULL, "name" character varying(20) NOT NULL, "gold" integer NOT NULL, "xp" integer NOT NULL, "kills" integer NOT NULL DEFAULT '0', "monsterHp" integer, CONSTRAINT "PK_65edadc946a7faf4b638d5e8885" PRIMARY KEY ("id"))`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`DROP TABLE "player"`);
    }

}
