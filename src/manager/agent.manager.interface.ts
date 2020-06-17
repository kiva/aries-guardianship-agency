
export interface IAgentManager {

    startAgent(
        walletId: string,
        walletKey: string,
        adminApiKey: string,
        agentName: string,
        agentEndpoint: string,
        webhookUrl: string,
        adminPort: string,
        httpPort: string
    ): Promise<string>;

    stopAgent(id: string): Promise<void>;
}
