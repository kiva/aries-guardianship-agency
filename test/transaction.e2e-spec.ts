/*
// we cannot test these until 1 of 3 things happen:
//    1 create a mock for nextjs HttpService
//    2 change how ProtocolHttpService is constructed (maybe injected)
//    3 basic message send works in multitennant


import request from 'supertest';
import { CACHE_MANAGER, HttpService, INestApplication } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import cacheManager from 'cache-manager';
import { Logger } from 'protocol-common/logger';
import { AgentService } from 'aries-controller/agent/agent.service';
import { CALLER } from 'aries-controller/caller/caller.interface';
import { ProfileManager } from 'aries-controller/profile/profile.manager';
import { CreditTransaction } from 'aries-controller/agent/messaging/credit.transaction';
import { TransactionReportRequest } from 'aries-controller/agent/messaging/transaction.report.request';
import { CONTROLLER_HANDLER } from 'aries-controller/controller.handler/controller.handler.interface';
import { DataService } from '../src/transactions/persistence/data.service';
import { AgentTransaction } from '../src/transactions/persistence/agent.transaction';
import { TransactionMessageResponseFactory } from '../src/transactions/messaging/transaction.message.response.factory';
import { TransactionMessageTypesEnum } from '../src/transactions/messaging/transaction.message.types.enum';
import { TransactionMessageStatesEnum } from '../src/transactions/messaging/transaction.message.states.enum';
import { SimpleAgentTransactionMockRepository } from './mock/simple.agent.transaction.repository';
import { ConnectionsMockCaller } from './mock/connections.mock.caller';

describe('Transaction Messaging Unit Tests', () => {

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
    const mockRepository = new SimpleAgentTransactionMockRepository(record);

    const memoryCache = cacheManager.caching({store: 'memory', max: 100, ttl: 10});

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
                useValue: new ConnectionsMockCaller(agentId, connectionId)
            },
            {
                provide: CONTROLLER_HANDLER,
                useValue: new ConnectionsMockCaller('', '')
            },
            {
                // because we reverted the Basic Message sends to direct http calls
                // TransactionMessageResponseFactory needs a HttpService.  This "fixes" the injection
                // but not does not make the tests testable.  See below
                provide: HttpService,
                useValue: {  }
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
    const testCaller: ConnectionsMockCaller = app.get<ConnectionsMockCaller>(CALLER);
    // this is the actual test validation
    testCaller.callAgentCallback = (data?: any) => {
        expect(data).toBeDefined();
        expect(data.content).toBeDefined();
        Logger.debug(`TransactionMessageHandler callback data.content`, data.content);
        const record: CreditTransaction<any> = new CreditTransaction<any>(JSON.parse(data.content));
        expect(record.state).toBe(TransactionMessageStatesEnum.ACCEPTED);
        expect(record.messageTypeId).toBe('credit_transaction');
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
    const msg: CreditTransaction<any> = new CreditTransaction<any>({
        state: TransactionMessageStatesEnum.STARTED,
        id: '1234567890',
        credentialId: '1234567890',
        transaction: tx
    });
    await handler.respond(msg);
});

it('tests ReportMessageHandler succeeds with correct data structure', async ()=> {
    const factory: TransactionMessageResponseFactory = app.get<TransactionMessageResponseFactory>(TransactionMessageResponseFactory);
    const agentService: AgentService = app.get<AgentService>(AgentService);
    const testCaller: ConnectionsMockCaller = app.get<ConnectionsMockCaller>(CALLER);
    // this is the actual test validation
    testCaller.callAgentCallback = (data?: any) => {
        expect(data).toBeDefined();
        expect(data.content).toBeDefined();
        Logger.debug(`ReportMessageHandler callback data.content`, data.content);
        const record: TransactionReportRequest<any> = new TransactionReportRequest<any>(JSON.parse(data.content));
        expect(record.messageTypeId).toBe('transaction_request');
    };
    const handler = factory.getMessageHandler(agentService, agentId, '999', connectionId, TransactionMessageTypesEnum.TRANSACTION_REQUEST);
    expect(handler).toBeDefined();

    const msg: TransactionRequest<any> = new TransactionRequest<any>({
        id: 'transactionId',
        state: TransactionMessageStatesEnum.STARTED,
        tdcFspId: 'tdc_tro_id',
    });
    await handler.respond(msg);
});

});
*/
