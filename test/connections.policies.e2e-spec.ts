import request, {agent} from 'supertest';
import {INestApplication} from "@nestjs/common";
import {Test} from "@nestjs/testing";
import {AppService} from "../src/app/app.service";
import {AppController} from "../src/app/app.controller";
import { AppModule } from '../src/app/app.module';
import { AgentGovernance } from '../src/controller/agent.governance';
import {Logger} from "protocol-common/logger";


/*
    Integration test to show the gammit of the exchange of messages between
    agents for connection, credential and proof protocols

    Required: manually start aries agency prior to running tests
    run `docker-compose up` in the aries-guardianship-agency directory
 */
describe('Create Connections using policies (e2e)', () => {
    let app: INestApplication;
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
    let credentialExchangeId;
    let presentationExchangeId;
    const hostUrl = 'http://localhost:3010';
    const schemaName = 'sample_schema';
    const schemaVersion = '1.0';
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
            alias: 'issuerAgent',
            walletId: 'walletId11',
            walletKey: 'walletId11',
            adminApiKey: issuerApiKey,
            seed: '000000000000000000000000Steward1',
            did: issuerDid,
            adminApiPort: "1322"
        }
        return request(hostUrl)
            .post('/v1/manager')
            .send(data)
            .expect(201)
            .expect((res) => {
                expect(res.body.adminPort).toBeDefined();
                issuerAdminPort = res.body.adminPort;
                issuerId = res.body.agentId;
                Logger.warn(`Issuer agent ID ${issuerId}:${issuerAdminPort}`);
            });
    });

    it('Spin up agent 2 (holder)', async () => {
        const data = {
            alias: 'holderAgent',
            walletId: 'walletId22',
            walletKey: 'walletId22',
            adminApiKey: holderApiKey,
            seed: '000000000000000000000000000ncra1',
            did: holderDid,
            adminApiPort: "1323"
        }
        return request(hostUrl)
            .post('/v1/manager')
            .send(data)
            .expect(201)
            .expect((res) => {
                expect(res.body.adminPort).toBeDefined();
                holderAdminPort = res.body.adminPort;
                holderId = res.body.agentId;
                Logger.warn(`Holder agent ID ${holderId}:${holderAdminPort}`);
            });
    });

    it('Create connection invite to holder from issuer', async () => {
        await delayFunc(15000); // wait 15 sec
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
        //await delayFunc(1000);
        Logger.warn(`Holder will receive the invitation`);
        await delayFunc(10000);
        Logger.warn(`done waiting`);
        const agentUrl = `http://localhost:${holderAdminPort}`;
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
    // THIS IS REPLACED BY webhook connections handler
    it('Holder accepts to connection invite', async () => {
        //await delayFunc(1000);
        Logger.warn(`Holder will accept the invitation`);
        await delayFunc(10000);
        Logger.warn(`done waiting`);

        const agentUrl = `http://localhost:${holderAdminPort}`;
        return request(agentUrl)
            .post(`/connections/${holderConnectionId}/accept-invitation`)
            .set('x-api-key', holderApiKey)
            .expect((res) => {
                expect(res.status).toBe(200);
                expect(res.body.connection_id).toBeDefined();
            });
    }, 30000);

    // TODO: this is to be replaced by webhook connections handler
    it('Issuer completes to connection invite', async () => {
        Logger.warn(`Holder did the 'accept'.  Now gonna wait then issuer will complete invitation`);
        await delayFunc(10000);
        // await delayFunc(3000);
        Logger.warn(`done waiting`);
        const agentUrl = `http://localhost:${issuerAdminPort}`;
        return request(agentUrl)
            .post(`/connections/${issuerConnectionId}/accept-request`)
            .set('x-api-key', issuerApiKey)
            .expect((res) => {
                expect(res.status).toBe(200);
                expect(res.body.connection_id).toBeDefined();
            });
    }, 75000);
*/
    it('List Issuer connections', async () => {
        await delayFunc(1000);
        const agentUrl = `http://localhost:${issuerAdminPort}`;
        return request(agentUrl)
            .get(`/connections`)
            .set('x-api-key', issuerApiKey)
            .expect((res) => {
                expect(res.status).toBe(200);
                Logger.warn(`issuerAgent Connections:`, res.body);
            });
    });

    it('List Holder connections', async () => {
        await delayFunc(1000);
        const agentUrl = `http://localhost:${holderAdminPort}`;
        return request(agentUrl)
            .get(`/connections`)
            .set('x-api-key', holderApiKey)
            .expect((res) => {
                expect(res.status).toBe(200);
                Logger.warn(`holderAgent Connections:`, res.body);
            });
    });
});
