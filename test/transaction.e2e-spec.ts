import request from 'supertest';
import { InjectConnection } from '@nestjs/typeorm';
import { Connection } from 'typeorm';
import { CACHE_MANAGER, INestApplication } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import cacheManager from 'cache-manager';
import { Logger } from 'protocol-common/logger';
import { AgentService } from 'aries-controller/agent/agent.service';
import { CALLER, ICaller } from 'aries-controller/caller/caller.interface';
import { DataService } from '../src/transactions/persistence/data.service';
import { AgentTransaction } from '../src/transactions/persistence/agent.transaction';
import { TransactionMessageResponseFactory } from '../src/transactions/messaging/transaction.message.response.factory';
import { TransactionMessageTypesEnum } from '../src/transactions/messaging/transaction.message.types.enum';
import { ProfileManager } from '../../aries-controller/src/profile/profile.manager';
import { TransactionMessageStatesEnum } from '../dist/transactions/messaging/transaction.message.states.enum';
import { CreditTransaction } from 'aries-controller/agent/messaging/credit.transaction';

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
        return this.record.merkel_order;
    }
}

class TestCaller implements ICaller {

    constructor(private readonly agentId: string, private readonly connectionId: string) {
    }

    public callAgentCallback: any;
    public callAgent(method: any, route: string, params?: any, data?: any): Promise<any> {
        expect(method).toBe('POST');
        const expectedRoute: string = `connections/${this.connectionId}/send-message`;
        Logger.warn(`expect ${expectedRoute} toBe ${route} `);
        expect(expectedRoute).toBe(route);

        if (this.callAgentCallback)
            this.callAgentCallback(data);
        return Promise.resolve(undefined);
    }

    public spinDownAgent(): Promise<any> {
        return Promise.resolve(undefined);
    }

    public spinUpAgent(): Promise<any> {
        return Promise.resolve(undefined);
    }

}

describe('Transaction unit tests', () => {
    let app: INestApplication;
    const agentId: string = 'agentId';
    const connectionId: string = 'connectionId';
    const transactionId: string = '1234567890';

    beforeAll(async () => {
        const record: AgentTransaction = new AgentTransaction();
        record.agent_id = agentId;
        record.transaction_id = transactionId;
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
        const factory = new TransactionMessageResponseFactory(mockRepository as unknown as DataService);

        const memoryCache = cacheManager.caching({store: 'memory', max: 100, ttl: 10/*seconds*/});

        const moduleFixture = await Test.createTestingModule({
            imports: [],
            controllers: [],
            providers: [
                ProfileManager,
                AgentService,
                TransactionMessageResponseFactory,
                {
                    provide: CACHE_MANAGER,
                    useValue: memoryCache
                },
                {
                    provide: DataService,
                    useValue: mockRepository
                },
                {
                    provide: CALLER,
                    useValue: new TestCaller(agentId, connectionId)
                }
            ]
        }).compile();
        app = await moduleFixture.createNestApplication();
        await app.init();
    });

    it('factory returns null when messageTypeId is not understood', () => {
        const factory: TransactionMessageResponseFactory = app.get<TransactionMessageResponseFactory>(TransactionMessageResponseFactory);
        const handler = factory.getMessageHandler(undefined, agentId, '', '','UNKNOWN');
        expect(handler).toBeUndefined();
    });

    it('tests TransactionMessageHandler succeeds with correct data structure', async ()=> {
        const factory: TransactionMessageResponseFactory = app.get<TransactionMessageResponseFactory>(TransactionMessageResponseFactory);
        const agentService: AgentService = app.get<AgentService>(AgentService);
        const testCaller: TestCaller = app.get<TestCaller>(CALLER);
        // this is the actual test validation
        testCaller.callAgentCallback = (data?: any) => {
            Logger.debug(`TransactionMessageHandler callback data`, data);
            expect(data).toBeDefined();
            expect(data.messageTypeId).toBe('credit_transaction');
            expect(data.state).toBe(TransactionMessageStatesEnum.ACCEPTED);
        };
        const handler = factory.getMessageHandler(agentService, agentId, '999', connectionId, TransactionMessageTypesEnum.CREDIT_TRANSACTION);
        expect(handler).toBeDefined();

        const tx = {
            tdcTroId: 'tdc_tro_id',
            tdcFspId: 'tdc_fsp_id',
            id: 'transactionId',
            typeId: 'typeId',
            subjectId: 'subjectId',
            amount: 'amount',
            date: Date.now(),
            eventData: JSON.stringify('{data}')
        };
        const msg: CreditTransaction<any> =new CreditTransaction<any>({
            state: TransactionMessageStatesEnum.STARTED,
            id: '1234567890',
            credentialId: '1234567890',
            transaction: tx
        });
        await handler.respond(msg);
    });
});
