import request from 'supertest';
import {INestApplication} from "@nestjs/common";
import {Test} from "@nestjs/testing";
import {AppService} from "../src/app/app.service";
import {AppController} from "../src/app/app.controller";
import { AppModule } from '../src/app/app.module';
import { AgentGovernance } from '../src/controller/agent.governance';
import {Logger} from "protocol-common/logger";


/*
    manually start aries agency
 */
describe('Policies (e2e)', () => {
    let app: INestApplication;
    let hostUrl = 'http://localhost:3010'; // We probably won't keep this notion around, but if we do move to config
    let issuerAdminPort;
    let issuerId;
    let issuerApiKey;
    let holderAdminPort;
    let holderId;
    let holderApiKey;
    let invitation;
    let issuerConnectionId;
    let holderConnectionId;
    let schemaId;
    let credentialDefinitionId;
    const schemaName = "sample_schema";
    const schemaVersion = "1.0";
    const issuerDid = "Th7MpTaRZVRYnPiabds81Y";
    const delayFunc = (ms: number) => {
        return new Promise( resolve => setTimeout(resolve, ms) );
    };

    beforeAll(async () => {
        issuerApiKey = 'adminApiKey';
        holderApiKey = 'adminApiKey';
    });

    it('Spin up agent 1 (issuer)', async () => {
        const data = {
            walletId: 'walletId11',
            walletKey: 'walletId11',
            adminApiKey: issuerApiKey,
            seed: '000000000000000000000000Steward1',
            did: issuerDid
        }
        return request(hostUrl)
            .post('/v1/manager')
            .send(data)
            .expect(201)
            .expect((res) => {
                expect(res.body.adminPort).toBeDefined();
                issuerAdminPort = res.body.adminPort;
                issuerId = res.body.agentId;
                Logger.warn(`issuer agentId -> ${issuerId}:${issuerAdminPort}`);
            });
    });

    it('Spin up agent 2 (holder)', async () => {
        const data = {
            walletId: 'walletId22',
            walletKey: 'walletId22',
            adminApiKey: holderApiKey,
            seed: '000000000000000000000000000ncra1',
            did: 'XTv4YCzYj8jqZgL1wVMGGL'
        }
        return request(hostUrl)
            .post('/v1/manager')
            .send(data)
            .expect(201)
            .expect((res) => {
                console.log(res.body);
                expect(res.body.adminPort).toBeDefined();
                holderAdminPort = res.body.adminPort;
                holderId = res.body.agentId;
            });
    });

    it('Get connection data from agent 1', async () => {
        await delayFunc(15000); // wait 15 sec
        const agentUrl = `http://localhost:${issuerAdminPort}`;
        return request(agentUrl)
            .post('/connections/create-invitation')
            .set('x-api-key', issuerApiKey)
            .expect((res) => {
                console.log('create-invitation body:', res.body);
                expect(res.status).toBe(200);
                expect(res.body.invitation).toBeDefined();
                invitation = res.body.invitation;
                issuerConnectionId = res.body.connection_id;
            });
    }, 30000);

    it('Connection agent 2 to agent 1', async () => {
        await delayFunc(1000);
        const agentUrl = `http://localhost:${holderAdminPort}`;
        return request(agentUrl)
            .post('/connections/receive-invitation')
            .set('x-api-key', holderApiKey)
            .send(invitation)
            .expect((res) => {
                console.log('receive-invitation body:', res.body);
                expect(res.status).toBe(200);
                expect(res.body.connection_id).toBeDefined();
                holderConnectionId = res.body.connection_id;
            });
    });

    it('make issuer did public', async() => {
        await delayFunc(15000);
        const agentUrl = `http://localhost:${issuerAdminPort}`;
        return request(agentUrl)
            .post(`/wallet/did/public?did=${issuerDid}`)
            .set('x-api-key', issuerApiKey)
            .expect((res) => {
                Logger.warn('make public did body:', res.body);
                expect(res.status).toBe(200);
            });
    }, 30000);

    it('issuer creates schema', async () => {
        const data = {
            schema_version: schemaVersion,
            schema_name: schemaName,
            attributes: [ 'score' ]
        };
        const agentUrl = `http://localhost:${issuerAdminPort}`;
        return request(agentUrl)
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
    }, 30000);

    it ('issuer creates credential definition', async () => {
        await delayFunc(1000);
        const data = {
            schema_id: schemaId,
            support_revocation: true,
            tag: 'issued_1'
        };
        const agentUrl = `http://localhost:${issuerAdminPort}`;
        return request(agentUrl)
            .post('/credential-definitions')
            .send(data)
            .set('x-api-key', issuerApiKey)
            .expect((res) => {
                Logger.warn('cred definition result', res.body);
                expect(res.status).toBe(200);
                credentialDefinitionId = res.body.credential_definition_id;
            });
    }, 30000);

    it('send basic message from issuer to holder', async () => {
        await delayFunc(2000);
        const data = {
            content: 'hello holder, are you ready to receive your credentials?'
        };
        const agentUrl = `http://localhost:${issuerAdminPort}`;
        return request(agentUrl)
            .post(`/connections/${issuerConnectionId}/send-message`)
            .send(data)
            .set('x-api-key', issuerApiKey)
            .expect((res) => {
                try {
                    Logger.warn(`connections/send-message result -> ${res.status}`, res.body);
                    expect(res.status).toBe(200);
                } catch (e) {
                    Logger.warn(`connections/send-message errored result -> ${res.status}`, res.body);
                    throw e;
                }
            });
    }, 30000);

    it('issuer creates credential', async () => {
        await delayFunc(5000);
        const data = {
            cred_def_id: credentialDefinitionId,
            credential_proposal: {
            "@type": `did:sov:BzCbsNYhMrjHiqZDTUASHg;spec/issue-credential/1.0/credential-preview`,
                attributes: [
                    {
                        name: "score",
                        value: "750"
                    }
                ]
            },
            schema_name: schemaName,
            schema_version: schemaVersion,
            schema_id: schemaId,
            auto_remove: true,
            issuer_did: issuerDid,
            schema_issuer_did: issuerDid,
            comment: 'pleading the 5th',
            connection_id: issuerConnectionId
        };

        Logger.warn(`issue-credential/send body request -> `, data);
        const agentUrl = `http://localhost:${issuerAdminPort}`;
        return request(agentUrl)
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
    }, 30000);

    /*
    it('Spin down agent 1', () => {
        const data = {
            agentId: issuerId
        }
        return request(hostUrl)
            .delete('/v1/manager')
            .send(data)
            .expect(200);
    });
    */
    it('Spin down agent 2', () => {
        const data = {
            agentId: holderId
        }
        return request(hostUrl)
            .delete('/v1/manager')
            .send(data)
            .expect(200);
    });

});
