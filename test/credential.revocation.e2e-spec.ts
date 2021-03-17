import request from 'supertest';
import { INestApplication } from '@nestjs/common';
import { Logger } from 'protocol-common/logger';
import { ProtocolUtility } from 'protocol-common/protocol.utility';


/*
    Integration test to show the gammit of the exchange of messages between
    agents for connection, credential and proof protocols

    Required: manually start aries agency prior to running tests
    run `docker-compose up` in the aries-guardianship-agency directory
 */
describe('Issue and Prove credentials using policies (e2e)', () => {
    let issuerUrl;
    let issuerId;
    let issuerApiKey;
    let holderUrl;
    let holderId;
    let holderApiKey;
    let invitation;
    let issuerConnectionId;
    let schemaId;
    let credentialDefinitionId;
    let credentialExchangeId;
    let presentationExchangeId;
    const issuerAdminPort = 5011;
    const holderAdminPort = 5012;
    const hostUrl = 'http://localhost:3010';
    const schemaName = 'revocable_schema';
    const schemaVersion = '1.0';
    const issuerDid = 'Th7MpTaRZVRYnPiabds81Y';

    beforeAll(async () => {
        issuerApiKey = 'adminApiKey';
        holderApiKey = 'adminApiKey';
        jest.setTimeout(60000);
    });

    it('Spin up agent 1 (issuer)', async () => {
        const data = {
            agentId: 'issuer',
            walletId: 'walletId11',
            walletKey: 'walletId11',
            adminApiKey: issuerApiKey,
            seed: '000000000000000000000000Steward1',
            did: issuerDid,
            useTailsServer: true,
            adminApiPort: issuerAdminPort
        };
        return request(hostUrl)
            .post('/v1/manager')
            .send(data)
            .expect(201)
            .expect((res) => {
                issuerId = res.body.agentId;
                issuerUrl = `http://localhost:${issuerAdminPort}`;
            });
    });

    it('Spin up agent 2 (holder)', async () => {
        const data = {
            agentId: 'holder2',
            walletId: 'walletId222',
            walletKey: 'walletId222',
            adminApiKey: holderApiKey,
            adminApiPort: holderAdminPort
        };
        return request(hostUrl)
            .post('/v1/manager')
            .send(data)
            .expect(201)
            .expect((res) => {
                holderId = res.body.agentId;
                holderUrl = `http://localhost:${holderAdminPort}`;
            });
    });

    it('Create connection invite to holder from issuer', async () => {
        await ProtocolUtility.delay(15000); // wait 15 sec
        return request(issuerUrl)
            .post('/connections/create-invitation')
            .set('x-api-key', issuerApiKey)
            .expect((res) => {
                expect(res.status).toBe(200);
                expect(res.body.invitation).toBeDefined();
                invitation = res.body.invitation;
                issuerConnectionId = res.body.connection_id;
            });
    });

    it('Holder responds to connection invite', async () => {
        await ProtocolUtility.delay(1000);
        return request(holderUrl)
            .post('/connections/receive-invitation')
            .set('x-api-key', holderApiKey)
            .send(invitation)
            .expect((res) => {
                expect(res.status).toBe(200);
                expect(res.body.connection_id).toBeDefined();
            });
    });

    it('make issuer did public', async() => {
        await ProtocolUtility.delay(1000);
        return request(issuerUrl)
            .post(`/wallet/did/public?did=${issuerDid}`)
            .set('x-api-key', issuerApiKey)
            .expect((res) => {
                expect(res.status).toBe(200);
            });
    });

    it('issuer creates schema', async () => {
        const data = {
            schema_version: schemaVersion,
            schema_name: schemaName,
            attributes: [ 'score' ]
        };
        return request(issuerUrl)
            .post('/schemas')
            .send(data)
            .set('x-api-key', issuerApiKey)
            .expect((res) => {
                try {
                    expect(res.status).toBe(200);
                    schemaId = res.body.schema_id;
                } catch (e) {
                    Logger.warn(`schema errored result -> ${res.status}`, res.body);
                    throw e;
                }
            });
    });

    it ('issuer creates credential definition', async () => {
        await ProtocolUtility.delay(1000);
        const data = {
            schema_id: schemaId,
            support_revocation: true,
            tag: 'revokable'
        };
        return request(issuerUrl)
            .post('/credential-definitions')
            .send(data)
            .set('x-api-key', issuerApiKey)
            .expect((res) => {
                Logger.info(`cred def result -> ${res.status}`, res.body)
                expect(res.status).toBe(200);
                credentialDefinitionId = res.body.credential_definition_id;
            });
    });

    it('issuer sends credential using /send', async () => {
        await ProtocolUtility.delay(5000);
        const data = {
            auto_remove: false,
            comment: 'pleading the 5th',
            connection_id: issuerConnectionId,
            schema_name: schemaName,
            schema_version: schemaVersion,
            schema_id: schemaId,
            issuer_did: issuerDid,
            credential_proposal: {
            '@type': `did:sov:BzCbsNYhMrjHiqZDTUASHg;spec/issue-credential/1.0/credential-preview`,
                attributes: [
                    {
                        name: 'score',
                        value: '750'
                    }
                ]
            },
        };

        Logger.warn(`For issuer ${issuerId} issue-credential/send body request '${issuerUrl}' -> `, data);
        return request(issuerUrl)
            .post('/issue-credential/send')
            .send(data)
            .set('x-api-key', issuerApiKey)
            .expect((res) => {
                try {
                    Logger.warn(`issue-credential/send result -> ${res.status}`, res.body);
                    expect(res.status).toBe(200);
                    credentialExchangeId = res.body.credential_exchange_id;
                } catch (e) {
                    Logger.warn(`issue-credential/send errored result -> ${res.status}`, res.body);
                    throw e;
                }
            });
    });

    it('Affirm Issuer credential status', async () => {
        await ProtocolUtility.delay(1000);
        return request(issuerUrl)
            .get('/issue-credential/records')
            .set('x-api-key', holderApiKey)
            .send(invitation)
            .expect((res) => {
                expect(res.status).toBe(200);
                expect(res.body.results.length).toBeGreaterThan(0);
                const i = res.body.results.length - 1;
                expect(res.body.results[0].state).toBe('credential_acked');
            });
    });

    it('issuer revoke credential', async () => {
        await ProtocolUtility.delay(1000);
        const data = {
            cred_ex_id: credentialExchangeId,
            publish: true
        };
        return request(issuerUrl)
        .post(`/revocation/revoke`)
        .set('x-api-key', issuerApiKey)
        .send(data)
        .expect((res) => {
            try {
                Logger.warn(`revocation/revoke  result -> ${res.status}`, res.body);
                expect(res.status).toBe(200);
            } catch (e) {
                Logger.warn(`revocation/revoke errored result -> ${res.status}`, res.body);
                throw e;
            }
        });
    });

    it('prover proves holders credential', async () => {
        await ProtocolUtility.delay(5000);
        const timestamp = Math.floor(Date.now() / 1000);
        const data = {
            connection_id: issuerConnectionId,
            comment: 'requesting score above 50',
            proof_request: {
                name: 'Proof of Score',
                version: '1.0',
                non_revoked: {
                    to: 2147422440
                },
                requested_attributes: {
                    'score': {
                        name: 'score',
                        restrictions: [
                            {
                                cred_def_id: credentialDefinitionId
                            }
                        ]
                    }
                },
                requested_predicates: {}
            }
        };
        Logger.warn(`For issuer ${issuerId} /present-proof/send-request body request '${issuerUrl}' -> `, data);
        return request(issuerUrl)
            .post('/present-proof/send-request')
            .send(data)
            .set('x-api-key', issuerApiKey)
            .expect((res) => {
                try {
                    Logger.warn(`/present-proof/send-request result -> ${res.status}`, res.body);
                    expect(res.status).toBe(200);
                    presentationExchangeId = res.body.presentation_exchange_id;
                } catch (e) {
                    Logger.warn(`/present-proof/send-request errored result -> ${res.status}`, res.body);
                    throw e;
                }
            });
    });

    it('verify proof is failed because revoked', async () => {
        await ProtocolUtility.delay(6000);
        return request(issuerUrl)
            .get(`/present-proof/records/${presentationExchangeId}`)
            .set('x-api-key', issuerApiKey)
            .expect((res) => {
                try {
                    Logger.warn(`${issuerUrl}/present-proof/records/${presentationExchangeId} result -> ${res.status}`, res.body);
                    expect(res.status).toBe(200);
                    expect(res.body.state).toBe('verified');
                    expect(res.body.verified).toBe('false');
                    expect(res.body.presentation.requested_proof.revealed_attrs.score.raw).toBe('750');
                } catch (e) {
                    Logger.warn(`${issuerUrl}/present-proof/records/${presentationExchangeId} errored result -> ${res.status}`, res.body);
                    throw e;
                }
            });
    });

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
