import { InjectConnection } from '@nestjs/typeorm';
import { Injectable } from '@nestjs/common';
import { Connection } from 'typeorm';
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
}
