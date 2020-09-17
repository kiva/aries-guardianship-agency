import request from 'supertest';
import { Logger } from 'protocol-common/logger';


/*
    Integration test to show the gammit of the exchange of messages between
    agents for connection, credential and proof protocols
    Required: manually start aries agency prior to running tests
    run `docker-compose up` in the aries-guardianship-agency directory
 */
describe('Create Connections using policies (e2e)', () => {
    let issuerAdminPort;
    let issuerId;
    let issuerApiKey;
    let holderAdminPort;
    let holderId;
    let holderApiKey;
    let invitation;
    let issuerConnectionId;
    let holderConnectionId;
    const hostUrl = 'http://localhost:3010';
    const routeUrlPath = '/v1/router/admin';
    const issuerDid = 'Th7MpTaRZVRYnPiabds81Y';
    const holderDid = 'XTv4YCzYj8jqZgL1wVMGGL';
    const delayFunc = (ms: number) => {
        return new Promise(resolve => setTimeout(resolve, ms));
    };

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
            did: issuerDid,
            adminApiPort: '5001'
        };
        return request(hostUrl)
            .post('/v1/manager')
            .send(data)
            .expect(201)
            .expect((res) => {
                expect(res.body.adminPort).toBeDefined();
                issuerAdminPort = res.body.adminPort;
                issuerId = res.body.agentId;
            });
    }, 15000);

    it('Spin up agent 2 (holder)', async () => {
        const data = {
            alias: 'holder',
            walletId: 'walletId22',
            walletKey: 'walletId22',
            adminApiKey: holderApiKey,
            seed: '000000000000000000000000000ncra1',
            did: holderDid,
            adminApiPort: '5002'
        };
        return request(hostUrl)
            .post('/v1/manager')
            .send(data)
            .expect(201)
            .expect((res) => {
                expect(res.body.adminPort).toBeDefined();
                holderAdminPort = res.body.adminPort;
                holderId = res.body.agentId;
            });
    }, 15000);

    it('Create connection invite to holder from issuer', async () => {
        // gonna wait here to let the system catch up since since spawning agents
        // also creates connections
        await delayFunc(5000); // wait 15 sec
        const agentUrl = `http://localhost:${issuerAdminPort}`;
        return request(agentUrl)
            .post('/connections/create-invitation')
            .set('x-api-key', issuerApiKey)
            .expect((res) => {
                expect(res.status).toBe(200);
                expect(res.body.invitation).toBeDefined();
                invitation = res.body.invitation;
                issuerConnectionId = res.body.connection_id;
                Logger.warn(`issuer created connection_id ${issuerConnectionId}`);
            });
    }, 30000);

    it('Holder receives to connection invite', async () => {
        await delayFunc(5000);
        // const agentUrl = `http://localhost:${holderAdminPort}`;
        const agentUrl = `${hostUrl}${routeUrlPath}/${issuerId}`;
        return request(agentUrl)
            .post('/connections/receive-invitation')
            .set('x-api-key', holderApiKey)
            .send(invitation)
            .expect((res) => {
                expect(res.status).toBe(200);
                expect(res.body.connection_id).toBeDefined();
                holderConnectionId = res.body.connection_id;
                Logger.warn(`holder created connection_id ${holderConnectionId}`);
            });
    }, 60000);
/*
    it('send basic message from issuer to holder', async () => {
        await delayFunc(2000);
        const data = {
            content: 'hello holder, are you ready to receive your credentials?'
        };
        const agentUrl = `${hostUrl}${routeUrlPath}/${issuerId}`;
        return request(agentUrl)
            .post(`/connections/${issuerConnectionId}/send-message`)
            .send(data)
            .set('x-api-key', issuerApiKey)
            .expect((res) => {
                try {
                    expect(res.status).toBe(200);
                } catch (e) {
                    Logger.warn(`connections/send-message errored result -> ${res.status}`, res.body);
                    throw e;
                }
            });
    }, 60000);

    it('List Issuer connections', async () => {
        await delayFunc(5000);
        const agentUrl = `${hostUrl}${routeUrlPath}/${issuerId}`;
        return request(agentUrl)
            .get(`/connections`)
            .set('x-api-key', issuerApiKey)
            .expect((res) => {
                expect(res.status).toBe(200);

                let found: boolean = false;
                res.body.results.forEach(conn => {
                    if (conn.connection_id === issuerConnectionId) {
                        found = true;
                        expect(conn.state).toBe('active');
                    }
                });

                expect(found).toBe(true);
            });
    }, 30000);

    it('List Holder connections', async () => {
        const agentUrl = `${hostUrl}${routeUrlPath}/${holderId}`;
        return request(agentUrl)
            .get(`/connections`)
            .set('x-api-key', holderApiKey)
            .expect((res) => {
                expect(res.status).toBe(200);
                let found: boolean = false;
                res.body.results.forEach(conn => {
                    if (conn.connection_id === holderConnectionId) {
                        found = true;
                        expect(conn.state).toBe('active');
                    }
                });

                expect(found).toBe(true);
            });
    });
*/
    it('Spin down agent 1', () => {
        const data = {
            agentId: issuerId
        };
        return request(hostUrl)
            .delete('/v1/manager')
            .send(data)
            .expect(200);
    });

    it('Spin down agent 2', () => {
        const data = {
            agentId: holderId
        };
        return request(hostUrl)
            .delete('/v1/manager')
            .send(data)
            .expect(200);
    });
});
