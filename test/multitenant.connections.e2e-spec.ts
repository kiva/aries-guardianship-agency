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
    let issuerConnectionId;
    let holderConnectionId;
    let issuerToken;
    let holderInvitation;
    let holderToken;
    const multitenantApiKey = 'adminApiKey';
    const multitenantUrl = 'http://localhost:3021'
    const hostUrl = 'http://localhost:3010';

    beforeAll(async () => {
        jest.setTimeout(60000);
    });

    it('Create wallet for issuer', async () => {
        const data = {
            label: 'issuer',
            walletName: 'walletId11',
            walletKey: 'walletKey1',
            autoConnect: false
        };
        return request(hostUrl)
            .post('/v2/multitenant')
            .send(data)
            .expect(201)
            .expect((res) => {
                issuerToken = res.body.token;
                Logger.log(res.body);
            });
    });

    it('Create wallet for holder', async () => {
        const data = {
            label: 'holder',
            walletName: 'walletId21',
            walletKey: 'walletKey2'
        };
        return request(hostUrl)
            .post('/v2/multitenant')
            .send(data)
            .expect(201)
            .expect((res) => {
                holderInvitation = res.body.invitation;
                holderToken = res.body.token;
                Logger.log(res.body);
            });
    });

    it('Issuer receives holder connection invite', async () => {
        await ProtocolUtility.delay(5000);
        return request(multitenantUrl)
            .post('/connections/receive-invitation')
            .set('x-api-key', multitenantApiKey)
            .set('Authorization', 'Bearer ' + issuerToken)
            .send(holderInvitation)
            .expect((res) => {
                expect(res.status).toBe(200);
                expect(res.body.connection_id).toBeDefined();
                issuerConnectionId = res.body.connection_id;
                Logger.warn(`issuer created connection_id ${issuerConnectionId}`);
            });
    });

    it('Confirm Issuer connections is ready', async () => {
        await ProtocolUtility.delay(5000);
        return request(multitenantUrl)
            .get(`/connections`)
            .set('x-api-key', multitenantApiKey)
            .set('Authorization', 'Bearer ' + issuerToken)
            .expect((res) => {
                expect(res.status).toBe(200);

                let found: boolean = false;
                res.body.results.forEach(conn => {
                    if (conn.connection_id === issuerConnectionId) {
                        found = true;
                        expect(conn.state).toBe('response');
                    }
                });

                expect(found).toBe(true);
            });
    });

    it('send basic message from issuer to holder', async () => {
        await ProtocolUtility.delay(2000);
        const data = {
            content: 'hello holder, are you ready to receive your credentials?'
        };
        return request(multitenantUrl)
            .post(`/connections/${issuerConnectionId}/send-message`)
            .send(data)
            .set('x-api-key', multitenantApiKey)
            .set('Authorization', 'Bearer ' + issuerToken)
            .expect((res) => {
                try {
                    expect(res.status).toBe(200);
                } catch (e) {
                    Logger.warn(`connections/send-message errored result -> ${res.status}`, res.body);
                    throw e;
                }
            });
    });

    it('Spin down agent 1', () => {
        const data = {
            walletName: 'walletId1',
            walletKey: 'walletKey1'
        };
        return request(hostUrl)
            .delete('/v2/multitenant')
            .send(data)
            .expect(200);
    });

    it('Spin down agent 2', () => {
        const data = {
            walletName: 'walletId2',
            walletKey: 'walletKey2'
        };
        return request(hostUrl)
            .delete('/v2/multitenant')
            .send(data)
            .expect(200);
    });
});
