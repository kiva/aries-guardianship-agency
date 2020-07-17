
/*
   Defines required contract for classes implementing webhook handlers
 */
export interface IAgentResponseHandler {
    handlePost(agentUrl: string, adminApiKey: string, route: string, topic: string, body: any): Promise<any>;
}
