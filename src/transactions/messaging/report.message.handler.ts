import { Logger } from 'protocol-common/logger';
import { TransactionRequest } from 'aries-controller/agent/messaging/transaction.request';
import { IBasicMessageHandler } from './basic.message.handler';
import { DataService } from '../persistence/data.service';
import { AgentService } from 'aries-controller/agent/agent.service';
import { AgentTransaction } from '../persistence/agent.transaction';
import { TxReportResponseDto } from '../dtos/tx.report.response.dto';
import { TransactionMessageStatesEnum } from './transaction.message.states.enum';


export class ReportMessageHandler implements IBasicMessageHandler {
    constructor(private readonly agentService: AgentService,
                private readonly agentId: string, private readonly connectionId: string,
                private readonly dbAccessor: DataService) {
    }

    public async respond(message: any): Promise<boolean> {
        if (message.state === TransactionMessageStatesEnum.STARTED) {
            // TODO could do our own validation tsp id is allowed to request report
            // 1 let system know we acknowledge report request
            await this.sendTransactionReportMessage(this.connectionId, TransactionMessageStatesEnum.ACCEPTED,
                message.id, message.tdcFspId, '');
            // 2 build the report
            const transactions: AgentTransaction[] = await this.dbAccessor.getAllTransactions(this.agentId);
            const reportRecs: TxReportResponseDto[] = [];
            Logger.debug(`found ${transactions.length} records`);
            for (const record of transactions) {
                Logger.debug(`processing ${record.transaction_id}`);
                reportRecs.push({
                    order: record.merkel_order,
                    transactionId: record.transaction_id,
                    typeId: record.type_id,
                    subjectId: record.subject_id,
                    txDate: record.transaction_date,
                    amount: record.amount,
                    credentialId: record.credential_id,
                    hash: record.issuer_hash,
                    details: record.transaction_details
                });
            }
            // 3 send it out
            await this.sendTransactionReportMessage(this.connectionId, TransactionMessageStatesEnum.COMPLETED,
                message.id, message.tdcFspId, JSON.stringify(reportRecs));
        }
        return false;
    }

    private async sendTransactionReportMessage(connectionId: string,
                                               state: string, id: string, tdcFspId: string, reportData: any): Promise<any> {
        const msg: TransactionRequest<any> = new TransactionRequest<any>({
            id,
            state,
            tdcFspId,
            transactions: reportData
        });
        return await this.agentService.sendBasicMessage(msg, connectionId);
    }
}
