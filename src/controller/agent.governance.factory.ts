import { AgentGovernance } from './agent.governance';

export const AgentGovernanceFactory = {
    provide: 'AGENT_GOVERNANCE',
    useFactory: () => {
        return new AgentGovernance(process.env.POLICY_NAME);
    },
};
