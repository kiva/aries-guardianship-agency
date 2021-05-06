import { InjectConnection } from '@nestjs/typeorm';
import { Injectable } from '@nestjs/common';
import { Connection } from 'typeorm';
import { Logger } from 'protocol-common/logger';
import { AgentTransaction } from './agent.transaction';

/*
    This class is the public interface to retrieving and saving records into our persistence
    layer (which happens to be postgres for now)
*/
@Injectable()
export class DataService {
    constructor(@InjectConnection() private readonly connection: Connection) {
    }

    public async saveTransaction(record: AgentTransaction): Promise<any> {
        return await this.connection.getRepository(AgentTransaction).save(record);
    }

    public async getMaxMerkelOrder(): Promise<any> {
        let value: any = await this.connection.getRepository(AgentTransaction).query(`SELECT MAX(merkel_order) FROM agent_transactions`)[0];
        Logger.debug(`getMaxMerkelOrder select returns |${value}|`);
        if (value == null || value === undefined || value === NaN)
            value = 0;
        return value;
    }
}
