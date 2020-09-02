import request from 'supertest';

/**
 * Integration test for our app, this ensures that the production docker image was built correctly
 * This expects the docker containers to be running
 */
describe('Prod integration test', () => {
    const hostUrl = 'http://localhost:3010';

    it('/healthz (GET)', () => {
        return request(hostUrl)
        .get('/healthz')
        .expect(200);
    });
});