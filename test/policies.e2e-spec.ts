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
    let connectionId;
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
            seed: "000000000000000000000000Steward1",
            did: issuerDid
        }
        return request(hostUrl)
            .post('/v1/manager')
            .send(data)
            .expect(201)
            .expect((res) => {
                console.log(res.body);
                expect(res.body.adminPort).toBeDefined();
                issuerAdminPort = res.body.adminPort;
                issuerId = res.body.agentId;
            });
    });

    it('Spin up agent 2 (holder)', async () => {
        const data = {
            walletId: 'walletId22',
            walletKey: 'walletId22',
            adminApiKey: holderApiKey,
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
                console.log(res.body);
                expect(res.status).toBe(200);
                expect(res.body.invitation).toBeDefined();
                invitation = res.body.invitation;
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
                console.log(res.body);
                expect(res.status).toBe(200);
                expect(res.body.connection_id).toBeDefined();
                connectionId = res.body.connection_id;
            });
    });

    it('make issuer did public', async() => {
        await delayFunc(15000);
        const agentUrl = `http://localhost:${issuerAdminPort}`;
        return request(agentUrl)
            .post(`/wallet/did/public?did=${issuerDid}`)
            .set('x-api-key', issuerApiKey)
            .expect((res) => {
                Logger.warn('schema result', res.body);
                expect(res.status).toBe(200);
            });
    }, 30000);

    it('issuer creates schema', async () => {
        await delayFunc(15000);
        const data = {
            schema_version: "1.0",
            schema_name: "sample_schema",
            attributes: [
            "score"
            ]
        };
        const agentUrl = `http://localhost:${issuerAdminPort}`;
        return request(agentUrl)
            .post('/schemas')
            .send(data)
            .set('x-api-key', issuerApiKey)
            .expect((res) => {
                Logger.warn('schema result', res.body);
                expect(res.status).toBe(200);
            });
    }, 30000);

    it('Spin down agent 1', () => {
        const data = {
            agentId: issuerId
        }
        return request(hostUrl)
            .delete('/v1/manager')
            .send(data)
            .expect(200);
    });

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