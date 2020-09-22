import request from 'supertest';
import { Logger } from 'protocol-common/logger';
import { ProtocolUtility } from 'protocol-common/protocol.utility';



/*
    Integration test to show the gammit of the exchange of messages between
    agents for connection, credential and proof protocols

    Required: manually start aries agency prior to running tests
    run `docker-compose up` in the aries-guardianship-agency directory
 */
describe('Create Connections using policies (e2e)', () => {
    let issuerId;
    let issuerApiKey;
    let issuerUrl;
    let holderId;
    let holderApiKey;
    let holderUrl;
    let invitation;
    let issuerConnectionId;
    let holderConnectionId;
    const agentAdminPort = process.env.AGENT_ADMIN_PORT || 5001;
    const hostUrl = 'http://localhost:3010';
    const issuerDid = 'Th7MpTaRZVRYnPiabds81Y';
    const holderDid = 'XTv4YCzYj8jqZgL1wVMGGL';

    beforeAll(async () => {
        issuerApiKey = 'adminApiKey';
        holderApiKey = 'adminApiKey';
    });

    it('Spin up agent 1 (issuer)', async () => {
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
                issuerId = res.body.agentId;
                issuerUrl = `http://${issuerId}:${agentAdminPort}`;
            });
    }, 15000);
});
