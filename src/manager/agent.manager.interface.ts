import { AgentConfig } from './agent.config';

export interface IAgentManager {

    startAgent(agentConfig: AgentConfig): Promise<string>;

    stopAgent(id: string): Promise<void>;
}
