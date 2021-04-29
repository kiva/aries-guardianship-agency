import request from 'supertest';
import { Logger } from 'protocol-common/logger';
import { ProtocolUtility } from 'protocol-common/protocol.utility';

/**
 * These tests require an issuer as a separate agent (since it needs a seed), but a holder in multitenancy.
 * The credentials are then issued as usual
 */
describe('Issue and Prove credentials using policies (e2e)', () => {
    let issuerUrl;
    let issuerId;
    let invitation;
    let holderConnectionId;
    let schemaId;
    let credentialDefinitionId;
    let presentationExchangeId;
    let holderInvitation;
    let holderToken;
    const issuerAdminPort = 5011;
    const hostUrl = 'http://localhost:3010';
    const schemaName = 'score_schema';
    const schemaVersion = '1.0';
    const issuerDid = 'Th7MpTaRZVRYnPiabds81Y';
    const walletNameHolder = 'walletNameHolder'
    const walletKeyHolder = 'walletKeyHolder'
    const issuerApiKey = 'adminApiKey';

    beforeAll(async () => {
        issuerUrl = `http://localhost:${issuerAdminPort}`;
        jest.setTimeout(60000);
    });

    it('Spin up agent 1 (issuer) as separate agent', async () => {
        const data = {
            agentId: 'issuer',
            walletId: 'walletId11',
            walletKey: 'walletId11',
            adminApiKey: issuerApiKey,
            seed: '000000000000000000000000Steward1',
            did: issuerDid,
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

    it('Create wallet for holder in multitenancy', async () => {
        const data = {
            label: 'holder',
            walletName: walletNameHolder,
            walletKey: walletKeyHolder
        };
        return request(hostUrl)
            .post('/v2/multitenant')
            .send(data)
            .expect(201)
            .expect((res) => {
                expect(res.body.invitation).toBeDefined();
                holderInvitation = res.body.invitation;
                holderToken = res.body.token;
            });
    });

    it('Issuer receives connection invite', async () => {
        await ProtocolUtility.delay(500);
        return request(issuerUrl)
            .post('/connections/receive-invitation')
            .set('x-api-key', issuerApiKey)
            .send(holderInvitation)
            .expect((res) => {
                expect(res.status).toBe(200);
                expect(res.body.connection_id).toBeDefined();
                holderConnectionId = res.body.connection_id;
            });
    });

    it('make issuer did public', async() => {
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
            attributes: [ 
                'score',
                'secret_score'
            ]
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
        const data = {
            schema_id: schemaId,
            support_revocation: false,
            tag: 'issued_1'
        };
        return request(issuerUrl)
            .post('/credential-definitions')
            .send(data)
            .set('x-api-key', issuerApiKey)
            .expect((res) => {
                expect(res.status).toBe(200);
                credentialDefinitionId = res.body.credential_definition_id;
            });
    });

    it('issuer sends credential using /send', async () => {
        await ProtocolUtility.delay(500);
        const data = {
            auto_remove: false,
            comment: 'pleading the 5th',
            connection_id: holderConnectionId,
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
                    },
                    {
                        name: 'secret_score',
                        value: '25'
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
                } catch (e) {
                    Logger.warn(`issue-credential/send errored result -> ${res.status}`, res.body);
                    throw e;
                }
            });
    });

    it('Affirm Issuer credential status', async () => {
        await ProtocolUtility.delay(10000);
        return request(issuerUrl)
            .get('/issue-credential/records')
            .set('x-api-key', issuerApiKey)
            .send(invitation)
            .expect((res) => {
                expect(res.status).toBe(200);
                expect(res.body.results.length).toBeGreaterThan(0);
                const i = res.body.results.length - 1;
                expect(res.body.results[i].state).toBe('credential_acked');
            });
    });

    it('prover proves holders credential', async () => {
        const data = {
            connection_id: holderConnectionId,
            comment: 'requesting score above 50',
            proof_request: {
                name: 'Proof of Score',
                version: '1.0',
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
                requested_predicates: {
                    'score_under_50': {
                        name: 'secret_score',
                        p_type: "<=",
                        p_value: 50,
                        restrictions: [
                            {
                                cred_def_id: credentialDefinitionId
                            }
                        ]
                    }
                }
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

    it('verify proof is proved', async () => {
        await ProtocolUtility.delay(1000);
        return request(issuerUrl)
            .get(`/present-proof/records/${presentationExchangeId}`)
            .set('x-api-key', issuerApiKey)
            .expect((res) => {
                try {
                    Logger.warn(`${issuerUrl}/present-proof/records/${presentationExchangeId} result -> ${res.status}`, res.body);
                    expect(res.status).toBe(200);
                    expect(res.body.state).toBe('verified');
                    expect(res.body.verified).toBe('true');
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

    it('Remove wallet for agent 2', () => {
        const data = {
            walletName: walletNameHolder,
            walletKey: walletKeyHolder
        };
        return request(hostUrl)
            .delete('/v2/multitenant')
            .send(data)
            .expect(200);
    });

});
