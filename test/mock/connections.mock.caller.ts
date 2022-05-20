import { ICaller } from 'aries-controller';

export class ConnectionsMockCaller  implements ICaller {

    constructor(private readonly agentId: string, private readonly connectionId: string) {
    }

    public callAgentCallback: any;
    public async callAgent(method: any, route: string, params?: any, data?: any): Promise<any> {
        expect(method).toBe('POST');
        const expectedRoute = `connections/${this.connectionId}/send-message`;
        expect(expectedRoute).toBe(route);

        if (this.callAgentCallback)
            return await this.callAgentCallback(data);

        return Promise.resolve(undefined);
    }

    public spinDownAgent(): Promise<any> {
        return Promise.resolve(undefined);
    }

    public spinUpAgent(): Promise<any> {
        return Promise.resolve(undefined);
    }

}
