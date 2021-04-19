import request from 'supertest';
import { Logger } from 'protocol-common/logger';
import { ProtocolUtility } from 'protocol-common/protocol.utility';

/**
 * Ensures our system works correctly when attempting to create wallets multiple times regardless of cache state
 */
describe('Check cache behaviors (e2e)', () => {
    const hostUrl = 'http://localhost:3010';
    const label1 = 'label1';
    const wallet1Name = 'wallet1Name';
    const wallet1Key = 'wallet1Key';
    const label2 = 'label2'
    const wallet2Name = 'wallet2Name'
    const wallet2Key = 'wallet2Key'

    beforeAll(async () => {
        jest.setTimeout(60000);
    });

    it('Create wallet for agent 1', async () => {
        const data = {
            label: label1,
            walletName: wallet1Name,
            walletKey: wallet1Key
        };
        return request(hostUrl)
            .post('/v2/multitenant')
            .send(data)
            .expect(201)
            .expect((res) => {
                expect(res.body.invitation).toBeDefined();
            });
    });

    it('Call create wallet a second time to ensure theres no error', async () => {
        await ProtocolUtility.delay(500);
        const data = {
            label: label1,
            walletName: wallet1Name,
            walletKey: wallet1Key
        };
        return request(hostUrl)
            .post('/v2/multitenant')
            .send(data)
            .expect(201)
            .expect((res) => {
                expect(res.body.invitation).toBeDefined();
            });
    });

    it('Create wallet for agent 2 with no cache', async () => {
        const data = {
            label: label2,
            walletName: wallet2Name,
            walletKey: wallet2Key,
            ttl: 0 // Note: cache 0 has a slightly odd behavior which is useful here, it doesn't unregister the agent, but doesn't keep it in cache either
        };
        return request(hostUrl)
            .post('/v2/multitenant')
            .send(data)
            .expect(201)
            .expect((res) => {
                expect(res.body.invitation).toBeDefined();
            });
    });

    it('Call create wallet a second time to ensure theres no error with expired cache', async () => {
        await ProtocolUtility.delay(500);
        const data = {
            label: label2,
            walletName: wallet2Name,
            walletKey: wallet2Key,
            ttl: 0
        };
        return request(hostUrl)
            .post('/v2/multitenant')
            .send(data)
            .expect(201)
            .expect((res) => {
                expect(res.body.invitation).toBeDefined();
            });
    });

    it('Remove wallet for agent 1', () => {
        const data = {
            walletName: wallet1Name,
            walletKey: wallet1Key
        };
        return request(hostUrl)
            .delete('/v2/multitenant')
            .send(data)
            .expect(200);
    });

    // no need to remove agent 2 wallet as it's not in cache
});
