import { Injectable } from '@nestjs/common';
import { IAgentManager } from './agent.manager.interface';
import { AgentConfig } from './agent.config';

/**
 * Starts and stops agents within a kubernetes environment
 */
@Injectable()
export class K8sService implements IAgentManager {

    /**
     * TODO implement
     */
    public async startAgent(config: AgentConfig): Promise<string> {
        throw new Error('Not implemented');
    }

    /**
     * TODO implement
     */
    public async stopAgent(id: string): Promise<void> {
        throw new Error('Not implemented');
    }
}