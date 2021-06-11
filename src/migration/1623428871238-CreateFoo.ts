import {MigrationInterface, QueryRunner} from 'typeorm';
import { Logger } from 'protocol-common/logger';

export class CreateFoo1623428871238 implements MigrationInterface {

    public async up(queryRunner: QueryRunner): Promise<void> {
        Logger.info(`CreateFoo1623428871238 Creating table`);
        await queryRunner.query(`
            CREATE TABLE IF NOT EXISTS foo (
                id serial PRIMARY KEY,
                bar varchar(64) NOT NULL
            );`
        );
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        Logger.info(`CreateFoo1623428871238 dropping table`);
        await queryRunner.query(
            `DROP TABLE IF EXISTS foo;`
        );
    }

}
