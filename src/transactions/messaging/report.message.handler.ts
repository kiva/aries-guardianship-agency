import { Logger } from 'protocol-common/logger';
import { ProtocolHttpService } from 'protocol-common/protocol.http.service';
import { TransactionReportRequest } from 'aries-controller/agent/messaging/transaction.report.request';
import { AgentService } from 'aries-controller/agent/agent.service';
import { DataService } from '../persistence/data.service';
import { AgentTransaction } from '../persistence/agent.transaction';
import { TxReportResponseDto } from '../dtos/tx.report.response.dto';
import { IBasicMessageHandler } from './basic.message.handler';
import { TransactionMessageStatesEnum } from './transaction.message.states.enum';




export class ReportMessageHandler implements IBasicMessageHandler {
    constructor(private readonly agentService: AgentService,
                private readonly agentId: string,
                private readonly adminApiKey: string,
                private readonly connectionId: string,
                private readonly dbAccessor: DataService,
                private readonly http: ProtocolHttpService) {
    }

    public async respond(message: any): Promise<boolean> {
        if (message.state === TransactionMessageStatesEnum.STARTED) {
            // TODO could do our own validation tsp id is allowed to request report
            // 1 let system know we acknowledge report request
            await this.sendTransactionReportMessage(this.agentId, this.adminApiKey, this.connectionId, TransactionMessageStatesEnum.ACCEPTED,
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
            await this.sendTransactionReportMessage(this.agentId, this.adminApiKey, this.connectionId,
                TransactionMessageStatesEnum.COMPLETED, message.id, message.tdcFspId, JSON.stringify(reportRecs));
        }
        return false;
    }

    private async sendTransactionReportMessage(agentId: string, adminApiKey: string, connectionId: string,
                                               state: string, id: string, tdcFspId: string, reportData: any): Promise<any> {
        /*
        const msg: TransactionRequest<any> = new TransactionRequest<any>({
            id,
            state,
            tdcFspId,
            transactions: reportData
        });
        return await this.agentService.sendBasicMessage(msg, connectionId);
        */
        const url = `http://${agentId}:${process.env.AGENT_ADMIN_PORT}/connections/${connectionId}/send-message`;
        const msg: TransactionReportRequest<any> = new TransactionReportRequest<any>({
            id,
            state,
            tdcFspId,
            transactions: reportData
        });
        const data = { content: JSON.stringify(msg) };
        const req: any = {
            method: 'POST',
            url,
            headers: {
                'x-api-key': adminApiKey,
            },
            data
        };

        Logger.debug(`sendTransactionMessage to ${connectionId}`, msg);
        const res = await this.http.requestWithRetry(req);
        Logger.debug(`${agentId} sendTransactionMessage results`, res.data);
        return res.data;
    }
}
