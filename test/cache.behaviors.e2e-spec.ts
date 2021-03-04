import request from 'supertest';
import { ProtocolUtility } from 'protocol-common/protocol.utility';
import { ConfigModule } from 'protocol-common/config.module';
import { DockerService } from '../src/manager/docker.service';
import { AgentConfig } from '../src/manager/agent.config';
import { Logger } from 'protocol-common/logger';
import { AgentCreateDto } from '../src/manager/dtos/agent.create.dto';

/*
    Integration test to show the gammit of the exchange of messages between
    agents for connection, credential and proof protocols

    Required: manually start aries agency prior to running tests
    run `docker-compose up` in the aries-guardianship-agency directory
 */
describe('Cache behaviors (e2e)', () => {
    let firstAgentId;
    const adminApiKey = 'adminApiKey';
    let firstAgentUrl;
    let secondAgentId;
    let thirdAgentId;
    const agentAdminPort = process.env.AGENT_ADMIN_PORT || 5001;
    const hostUrl = 'http://localhost:3010';
    const agentDid = 'Th7MpTaRZVRYnPiabds81Y';

    // make sure this test ends as clean as it started
    const shutdownAgent = async (agentId) => {
        try {
            if (agentId === undefined) {
                return;
            }
            const data = {
                agentId
            };
            await request(hostUrl)
                .delete('/v1/manager')
                .send(data)
                .expect(200);
        } catch(e) { }
    };

    beforeAll(async () => {
        // setup environment so we can create an agent without using agent manager
        ConfigModule.init('../src/config/env.json');
        process.env.AGENT_DOCKER_IMAGE = 'bcgovimages/aries-cloudagent:py36-1.15-1_0.6.0';
        process.env.AGENT_LOG_LENGTH = '0';
        process.env.INDY_POOL_TRANSACTIONS_GENESIS_PATH = './resources/pool_transactions_genesis_local_dev';
        process.env.INTERNAL_URL = 'http://aries-guardianship-agency:3010';
        process.env.INDY_POOL_NAME = 'pool1';
        process.env.NETWORK_NAME = 'agency-network';
        process.env.AGENT_ADMIN_PORT = '5001';
        process.env.AGENT_HTTP_PORT = '5000';
        jest.setTimeout(60000);
    });

    // Test condition: Cache shouldn't contain the agent, nor should the agent already be running
    // Cache: down; Reality: down
    it('Start agent not already started successfully', async () => {
        const data = {
            agentId: 'issuer',
            walletId: 'walletId11',
            walletKey: 'walletId11',
            adminApiKey,
            seed: '000000000000000000000000Steward1',
            did: agentDid
        };
        return request(hostUrl)
            .post('/v1/manager')
            .send(data)
            .expect(201)
            .expect((res) => {
                firstAgentId = res.body.agentId;
                firstAgentUrl = `http://${firstAgentId}:${agentAdminPort}`;
            });
    });

    // Test condition: Cache contain the agent, and the agent is running
    // Cache: up; Reality: up
    it('Request agent previously started', async () => {
        const data = {
            agentId: 'issuer',
            walletId: 'walletId11',
            walletKey: 'walletId11',
            adminApiKey,
            seed: '000000000000000000000000Steward1',
            did: agentDid
        };
        return request(hostUrl)
            .post('/v1/manager')
            .send(data)
            .expect(201)
            .expect((res) => {
                firstAgentId = res.body.agentId;
                firstAgentUrl = `http://${firstAgentId}:${agentAdminPort}`;
            });
    });

    // Test condition: Agent is not running. but agent manager cache thinks it is
    // Cache: up; Reality: down
    it('Successfully request Agent not running but is in cache', async () => {
        const data = {
            agentId: 'runningAgent',
            walletId: 'walletId11',
            walletKey: 'walletId11',
            adminApiKey,
            seed: '000000000000000000000000Steward1',
            did: agentDid,
            autoConnect: false
        };
        await request(hostUrl)
            .post('/v1/manager')
            .send(data)
            .expect(201)
            .expect((res) => {
                secondAgentId = res.body.agentId;
            });
        const manager = new DockerService();
        await manager.stopAgent(secondAgentId);
        // Agent is not running but cache does not reflect this state, so we can
        // now test that state
        return await request(hostUrl)
            .post('/v1/manager')
            .send(data)
            .expect(201);
/*
        // TODO: at some point we would like to be able to test actual agent status,
        // but it seems to causing problems in CI
        await ProtocolUtility.delay(15000);
        const agentUrl = `http://${secondAgentId}:${agentAdminPort}`;
        Logger.warn(`agentURL ${agentUrl}`);
        return request(agentUrl)
            .get('/status')
            .set('x-api-key', adminApiKey)
            .expect((res) => {
                expect(res.status).toBe(200);
            });
 */
    });

    // Test condition: Agent is running but the cache doesn't contain a reference to Agent
    // Cache down: Reality: up
    it('Successfully request agent running not in cache', async () => {
        // spin up the agent not using AgentMananger so that is cache is out of sync
        thirdAgentId = 'thirdAgent';
        const agentDto: AgentCreateDto = {
            walletId: 'walletId11',
            walletKey: 'walletId11',
            adminApiKey,
            agentId: thirdAgentId,
            seed: '000000000000000000000000Steward1'
        };
        const agentConfig = new AgentConfig(agentDto);
        const manager = new DockerService();
        await manager.startAgent(agentConfig);

        await ProtocolUtility.delay(5000);

        // attempt request for starting the same agent
        const data = {
            agentId: thirdAgentId,
            walletId: 'walletId11',
            walletKey: 'walletId11',
            adminApiKey,
            seed: '000000000000000000000000Steward1',
            did: agentDid,
            autoConnect: false
        };
        return await request(hostUrl)
            .post('/v1/manager')
            .send(data)
            .expect(201);
/*
        // TODO: at some point we would like to be able to test actual agent status,
        // but it seems to causing problems in CI
        const agentUrl = `http://${thirdAgentId}:${agentAdminPort}`;
        return request(agentUrl)
            .get('/status')
            .set('x-api-key', adminApiKey)
            .expect((res) => {
                expect(res.status).toBe(200);
            });
 */
    });

    // Test condition: Agent is running but the cache doesn't contain a reference to Agent
    // Cache down: Reality: up
    it('Cannot start agent already running using invalid adminApiKey', async () => {
        await shutdownAgent(thirdAgentId);
        await ProtocolUtility.delay(5000);

        // spin up the agent not using AgentManager so that is cache is out of sync
        thirdAgentId = 'thirdAgent';
        const agentDto: AgentCreateDto = {
            walletId: 'walletId11',
            walletKey: 'walletId11',
            adminApiKey,
            agentId: thirdAgentId,
            seed: '000000000000000000000000Steward1'
        };
        const agentConfig = new AgentConfig(agentDto);
        const manager = new DockerService();
        await manager.startAgent(agentConfig);

        await ProtocolUtility.delay(5000);

        // attempt request for starting the same agent
        const data = {
            agentId: thirdAgentId,
            walletId: 'walletId11',
            walletKey: 'walletId11',
            adminApiKey: 'BillyBobLikesCars',
            seed: '000000000000000000000000Steward1',
            did: agentDid,
            autoConnect: false
        };
        return await request(hostUrl)
            .post('/v1/manager')
            .send(data)
            .expect(201);
/*
        // TODO: at some point we would like to be able to test actual agent status,
        // but it seems to causing problems in CI
        const agentUrl = `http://${thirdAgentId}:${agentAdminPort}`;
        return request(agentUrl)
            .get('/status')
            .set('x-api-key', 'BillyBobLikesCars')
            .expect((res) => {
                expect(res.status).toBe(401);
            });
 */
    });

    afterAll(async () => {
        await shutdownAgent(firstAgentId);
        await shutdownAgent(secondAgentId);
        await shutdownAgent(thirdAgentId);
        return;
    });
});
