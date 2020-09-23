import request from 'supertest';
import { Logger } from 'protocol-common/logger';
import { ProtocolUtility } from 'protocol-common/protocol.utility';
import { DockerService } from "../src/manager/docker.service";



/*
    Integration test to show the gammit of the exchange of messages between
    agents for connection, credential and proof protocols

    Required: manually start aries agency prior to running tests
    run `docker-compose up` in the aries-guardianship-agency directory
 */
describe('Cache behaviors (e2e)', () => {
    let firstAgentId;
    const issuerApiKey = 'adminApiKey';
    let issuerUrl;
    let secondAgentId;
    const holderApiKey = 'adminApiKey';
    let holderUrl;
    let invitation;
    let issuerConnectionId;
    let holderConnectionId;
    const agentAdminPort = process.env.AGENT_ADMIN_PORT || 5001;
    const hostUrl = 'http://localhost:3010';
    const issuerDid = 'Th7MpTaRZVRYnPiabds81Y';
    const holderDid = 'XTv4YCzYj8jqZgL1wVMGGL';

    beforeAll(async () => {
        jest.setTimeout(60000);
    });


    // Test condition: Cache shouldn't contain the agent, nor should the agent already be running
    it('Start agent not already started successfully', async () => {
        const data = {
            alias: 'issuer',
            walletId: 'walletId11',
            walletKey: 'walletId11',
            adminApiKey: issuerApiKey,
            seed: '000000000000000000000000Steward1',
            did: issuerDid
        };
        return request(hostUrl)
            .post('/v1/manager')
            .send(data)
            .expect(201)
            .expect((res) => {
                firstAgentId = res.body.agentId;
                issuerUrl = `http://${firstAgentId}:${agentAdminPort}`;
            });
    });

    // Test condition: Cache contain the agent, and the agent is running
    it('Request agent previously started', async () => {
        const data = {
            alias: 'issuer',
            walletId: 'walletId11',
            walletKey: 'walletId11',
            adminApiKey: issuerApiKey,
            seed: '000000000000000000000000Steward1',
            did: issuerDid
        };
        return request(hostUrl)
            .post('/v1/manager')
            .send(data)
            .expect(201)
            .expect((res) => {
                firstAgentId = res.body.agentId;
                issuerUrl = `http://${firstAgentId}:${agentAdminPort}`;
            });
    });

    // Test condition: Agent is not running. but agent manager cache thinks it is
    it('Successfully request Agent not running but is in cache', async () => {
        const data = {
            alias: 'runningAgent',
            walletId: 'walletId11',
            walletKey: 'walletId11',
            adminApiKey: issuerApiKey,
            seed: '000000000000000000000000Steward1',
            did: issuerDid
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
        return request(hostUrl)
            .post('/v1/manager')
            .send(data)
            .expect(201);
    });

    afterAll(async () => {
        // make sure this test ends as clean as it started
        const shutdownAgent = async (agentId) => {
            try {
                const data = {
                    agentId
                };
                await request(hostUrl)
                    .delete('/v1/manager')
                    .send(data)
                    .expect(200);
            } catch(e) { }
        };
        await shutdownAgent(firstAgentId);
        await shutdownAgent(secondAgentId);
        return;
    });
});
