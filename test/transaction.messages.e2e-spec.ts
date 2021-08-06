import request from 'supertest';
import cacheManager from 'cache-manager';
import { Test } from '@nestjs/testing';
import { CACHE_MANAGER, INestApplication } from '@nestjs/common';
import { TransactionMessageResponseFactory } from '../src/transactions/messaging/transaction.message.response.factory';
import { DataService } from '../src/transactions/persistence/data.service';
import { InjectConnection } from '@nestjs/typeorm';
import { Connection } from 'typeorm';
import { AgentTransaction } from '../src/transactions/persistence/agent.transaction';
import { Logger } from 'protocol-common/logger';

class MockRepository {
    constructor(private readonly record: AgentTransaction) {
    }
    public async saveTransaction(record: AgentTransaction): Promise<any> {
        return record;
    }

    public async getAllTransactions(agentId: string): Promise<AgentTransaction[]> {
        return [this.record];
    }

    public async getMaxMerkelOrder(): Promise<any> {
        return 1;
    }
}

describe('Transaction Basic Message handler tests', () => {
    let factory: TransactionMessageResponseFactory;

    beforeAll(async () => {
        jest.setTimeout(10000);
        const record: AgentTransaction = new AgentTransaction();
        record.agent_id = 'agentId';
        record.transaction_id = '1234567890';
        record.transaction_date = new Date();
        record.event_date = new Date();
        record.issuer_hash = 'message.transaction.fspHash';
        record.fsp_id = 'message.transaction.fspId';
        record.merkel_order = 1;
        record.merkel_hash = 'this.generateTransactionId(message.transaction.fspHash)';
        record.credential_id = 'message.credentialId';
        record.type_id = 'message.transaction.typeId';
        record.subject_id = 'message.transaction.subjectId';
        record.amount = '500';
        record.transaction_details = 'message.transaction.eventJson';
        const mockRepository = new MockRepository(record);

        factory = new TransactionMessageResponseFactory(mockRepository as unknown as DataService, undefined);
    });

    it('factory returns null when messageTypeId is not understood', () => {
        const handler = factory.getMessageHandler('', '', '','UNKNOWN');
        expect(handler).toBeUndefined();
    });
});
