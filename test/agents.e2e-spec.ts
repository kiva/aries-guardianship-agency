import request from 'supertest';
import { Test } from '@nestjs/testing';
import { INestApplication, Logger } from '@nestjs/common';
import { AppService } from '../src/app/app.service';
import { AppModule } from '../src/app/app.module';

/**
 * These tests probably won't stay around, I just wanted to get something going
 * Right now these are full integration tests because I couldn't get the agents deployed to docker from the test modules
 * TODO better tests
 */
describe('Agency Integration Tests', () => {
    let app: INestApplication;
    let hostUrl = 'http://localhost:3010'; // We probably won't keep this notion around, but if we do move to config
    let adminPort1;
    let agentId1;
    let adminApiKey1;
    let adminPort2;
    let agentId2;
    let adminApiKey2;
    let invitation;
    let connectionId;
    let delayFunc; // This is a hack

    beforeAll(async () => {
        adminApiKey1 = 'adminApiKey';
        adminApiKey2 = 'adminApiKey';
        delayFunc = (ms: number) => {
            return new Promise( resolve => setTimeout(resolve, ms) );
        }
    });

    it('Spin up agent 1', async () => {
        const data = {
            walletId: 'walletId11',
            walletKey: 'walletId11',
            adminApiKey: adminApiKey1,
        }
        return request(hostUrl)
            .post('/v1/manager')
            .send(data)
            .expect(201)
            .expect((res) => {
                console.log(res.body);
                expect(res.body.adminPort).toBeDefined();
                adminPort1 = res.body.adminPort;
                agentId1 = res.body.agentId;
            });
    });

    it('Spin up agent 2', async () => {
        const data = {
            walletId: 'walletId22',
            walletKey: 'walletId22',
            adminApiKey: adminApiKey2,
        }
        return request(hostUrl)
            .post('/v1/manager')
            .send(data)
            .expect(201)
            .expect((res) => {
                console.log(res.body);
                expect(res.body.adminPort).toBeDefined();
                adminPort2 = res.body.adminPort;
                agentId2 = res.body.agentId;
            });
    });

    it('Get connection data from agent 1', async () => {
        await delayFunc(15000); // wait 20 sec
        const agentUrl = `http://localhost:${adminPort1}`;
        return request(agentUrl)
            .post('/connections/create-invitation')
            .set('x-api-key', adminApiKey1)
            .expect((res) => {
                console.log(res.body);
                expect(res.status).toBe(200);
                expect(res.body.invitation).toBeDefined();
                invitation = res.body.invitation;
            });
    }, 30000);

    it('Connection agent 2 to agent 1', async () => {
        await delayFunc(1000);
        const agentUrl = `http://localhost:${adminPort2}`;
        return request(agentUrl)
            .post('/connections/receive-invitation')
            .set('x-api-key', adminApiKey2)
            .send(invitation)
            .expect((res) => {
                console.log(res.body);
                expect(res.status).toBe(200);
                expect(res.body.connection_id).toBeDefined();
                connectionId = res.body.connection_id;
            });
    });

    it('Send trust ping from agent 2 to agent 1', async () => {
        await delayFunc(3000);
        const agentUrl = `http://localhost:${adminPort2}`;
        const data = {
            comment: 'string'
        }
        return request(agentUrl)
            .post(`/connections/${connectionId}/send-ping`)
            .set('Content-Type', 'application/json')
            .set('x-api-key', adminApiKey2)
            .send(data)
            .expect((res) => {
                console.log(res.body);
                console.log(res.status);
                expect(res.status).toBe(200);
                expect(res.body.thread_id).toBeDefined();
            });
    }, 30000);

    it('Spin down agent 1', () => {
        const data = {
            agentId: agentId1
        }
        return request(hostUrl)
            .delete('/v1/manager')
            .send(data)
            .expect(200);
    });

    it('Spin down agent 2', () => {
        const data = {
            agentId: agentId2
        }
        return request(hostUrl)
            .delete('/v1/manager')
            .send(data)
            .expect(200);
    });

});
