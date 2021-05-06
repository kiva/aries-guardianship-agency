import {MigrationInterface, QueryRunner} from 'typeorm';
import { Logger } from 'protocol-common/logger';

export class AgentTransactions1620304611265 implements MigrationInterface {

    public async up(queryRunner: QueryRunner): Promise<void> {
        Logger.info(`AgentTransactions1620304611265 Creating table`);
        await queryRunner.query(`
            CREATE TABLE IF NOT EXISTS agent_transactions (
                id serial PRIMARY KEY,
                agent_id varchar(64) NOT NULL,
                fsp_id varchar(64) NOT NULL,
                transaction_id varchar(64) NOT NULL,
                transaction_date TIMESTAMP DEFAULT now(),
                issuer_hash varchar(64) NOT NULL,
                merkel_order int,
                merkel_hash varchar(64) NOT NULL,
                credential_id varchar(64) NULL,
                transaction_details text NULL
            );`
        );
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        Logger.info(`AgentTransactions1620304611265 dropping table`);
        await queryRunner.query(
            `DROP TABLE IF EXISTS agent_transactions;`
        );
    }


}
