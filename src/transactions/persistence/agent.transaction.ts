import { Entity, Column, PrimaryGeneratedColumn, Index } from 'typeorm';

/**
 * TODO: rename this class and the table when all of the services have their own db
 */
@Entity({ name: 'agent_transactions' })
export class AgentTransaction {
    @PrimaryGeneratedColumn()
    id: number;

    @Index()
    @Column({ type: 'varchar', length: 64, nullable: false })
    agent_id: string;

    @Index()
    @Column({ type: 'varchar', length: 64, nullable: false })
    fsp_id: string;

    @Index()
    @Column({ type: 'varchar', length: 64, nullable: false })
    transaction_id: string;

    @Column( { type: 'int' })
    merkel_order: number;

    @Column({ type: 'varchar', length: 64, nullable: false })
    merkel_hash: string;

    @Column({ type: 'timestamp' })
    transaction_date: Date;

    @Column({ type: 'varchar', length: 64, nullable: false })
    issuer_hash: string;

    @Column({ type: 'varchar', length: 64, nullable: true })
    credential_id: string;

    @Column({ type: 'varchar', nullable: false })
    transaction_details: string;
}
