import { AgentConfig } from './agent.config.js';

export interface IAgentManager {

    startAgent(agentConfig: AgentConfig): Promise<string>;

    stopAgent(id: string): Promise<void>;
}
