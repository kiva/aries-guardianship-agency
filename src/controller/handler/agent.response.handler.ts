
export interface IAgentResponseHandler {
    // For passing on GET API calls into ACAPY
    handleGet(agentUrl: string, adminApiKey: string, route: string, topic: string): Promise<any>;
    handlePost(agentUrl: string, adminApiKey: string, route: string, topic: string, body: any): Promise<any>;
}
