import { AgentTransaction } from '../../dist/transactions/persistence/agent.transaction.js';

export class SimpleAgentTransactionMockRepository {
    constructor(private readonly record: AgentTransaction) {
    }
    public async saveTransaction(record: AgentTransaction): Promise<any> {
        return record;
    }

    public async getAllTransactions(agentId: string): Promise<AgentTransaction[]> {
        return [this.record];
    }

    public async getMaxMerkelOrder(): Promise<any> {
        return this.record.merkel_order;
    }
}
