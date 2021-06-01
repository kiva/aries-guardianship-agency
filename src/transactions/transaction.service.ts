import { AxiosRequestConfig } from 'axios';
import { Injectable, Inject, HttpService, CACHE_MANAGER, CacheStore } from '@nestjs/common';
import { Logger } from 'protocol-common/logger';
import { ProtocolHttpService } from 'protocol-common/protocol.http.service';
import { ProtocolException } from 'protocol-common/protocol.exception';
import { ProtocolErrorCode } from 'protocol-common/protocol.errorcode';
import { SecurityUtility } from 'protocol-common/security.utility';
import { AgentGovernance, ControllerCallback } from 'aries-controller/controller/agent.governance';
import { Topics } from 'aries-controller/controller/handler/topics';
import { AgentService } from 'aries-controller/agent/agent.service';
import { CreditTransaction } from 'aries-controller/agent/messaging/credit.transaction';
import { RegisterTdcDto } from './dtos/register.tdc.dto';
import { RegisterOneTimeKeyDto } from './dtos/register.one.time.key.dto';
import { RegisterTdcResponseDto } from './dtos/register.tdc.response.dto';
import { DataService } from './persistence/data.service';
import { AgentTransaction } from './persistence/agent.transaction';
import { TransactionRequest } from 'aries-controller/agent/messaging/transaction.request';

@Injectable()
export class TransactionService {
    private readonly http: ProtocolHttpService;
    constructor(@Inject('AGENT_GOVERNANCE') private readonly agentGovernance: AgentGovernance,
                @Inject(CACHE_MANAGER) private readonly cache: CacheStore,
                private readonly agentService: AgentService,
                private readonly dbAccessor: DataService,
                httpService: HttpService,
    ) {
        this.http = new ProtocolHttpService(httpService);
        agentGovernance.registerHandler('AGA-TX-BASIC', Topics.BASIC_MESSAGES, this.basicMessageHandler);
    }

    /**
     * receives basicmessage notifications and will respond in kind to fsp basic messages received from the TDC
     * @param agentUrl
     * @param agentId
     * @param adminApiKey
     * @param route
     * @param topic
     * @param body
     * @param token
     */
    public basicMessageHandler: ControllerCallback =
        async (agentUrl: string, agentId: string, adminApiKey: string, route: string, topic: string, body: any, token?: string):
            Promise<any> => {
            Logger.debug(`Aries-Guardianship-Agency TransactionService received basic message for agent ${agentId}`, body);
            const data = JSON.parse(body.content);
            switch (data.messageTypeId) {
                case `grant`:
                    if (data.state === `completed`) {
                        Logger.info(`received completed grant information for agent ${agentId}.`);
                        // todo and send ack to TDC once the endpoints are setup and save connection information
                    }
                    break;
                case `credit_transaction`:
                    if (data.state === `started`) {
                        // TODO fix the credential ID problem.  Solution is to add more states and have this code in a later
                        // state handler
                        // TODO validation
                        // TODO: theres possible collision here if two transactions came in at the same time
                        const maxMerkleOrder = await this.dbAccessor.getMaxMerkelOrder();
                        const record: AgentTransaction = new AgentTransaction();
                        record.agent_id = agentId;
                        record.transaction_id = data.id;
                        record.transaction_date = data.transaction.eventDate;
                        record.issuer_hash = data.transaction.fspHash;
                        record.fsp_id = data.transaction.fspId;
                        record.merkel_order = maxMerkleOrder + 1;
                        record.merkel_hash = this.generateTransactionId(data.transaction.fspHash);
                        record.credential_id = data.credentialId;
                        record.transaction_details = data.transaction.eventJson;
                        await this.dbAccessor.saveTransaction(record);
                        Logger.debug(`replying 'accepted' to transaction start message`);
                        await this.sendTransactionMessage(agentId, adminApiKey, body.connection_id, 'accepted',
                            data.id, data.transaction);
                    } else if (data.state === `completed`) {
                        Logger.info(`transaction ${data.id} is complete`);
                        // TODO: do we need to note transaction state?
                    }
                    break;
                case `transaction_request`:
                    if (data.state === `started`) {
                        // TODO could do our own validation tsp id is allowed to request report
                        // 1 let system know we acknowledge report request
                        await this.sendTransactionReportMessage(agentId, adminApiKey, body.connection_id, 'accepted',
                            data.id, data.tdcFspId, '');
                        // 2 build the report
                        const transactions: AgentTransaction[] = await this.dbAccessor.getAllTransactions();
                        // TODO: this needs to be type
                        const reportRecs: {order: number, transactionId: string, credentialId: string, hash: string}[] = [];
                        Logger.debug(`found ${transactions.length} records`);
                        for (const record of transactions) {
                            Logger.debug(`processing ${record.transaction_id}`);
                            reportRecs.push({
                                order: record.merkel_order,
                                transactionId: record.transaction_id,
                                credentialId: record.credential_id,
                                hash: record.issuer_hash
                            });
                        }
                        // 3 send it out
                        await this.sendTransactionReportMessage(agentId, adminApiKey, body.connection_id, 'completed',
                            data.id, data.tdcFspId, JSON.stringify(reportRecs));
                    }
                    break;
            }

            return undefined;
        }

    private async getAgentAdminApiKey(agentId: string): Promise<string> {
        const agentData: any = await this.cache.get(agentId);
        if (agentData === undefined) {
            throw new ProtocolException(ProtocolErrorCode.INVALID_BACKEND_OPERATION, `agent expected but not found`);
        }
        return agentData.adminApiKey;
    }

    private async createAgentConnection(agentId: string): Promise<any> {
        const adminApiKey = await this.getAgentAdminApiKey(agentId);

        const url = `http://${agentId}:${process.env.AGENT_ADMIN_PORT}/connections/create-invitation`;
        const req: any = {
            method: 'POST',
            url,
            headers: {
                'x-api-key': adminApiKey,
            },
        };
        Logger.debug(`${agentId} createAgentConnection ${url}`);
        const res = await this.http.requestWithRetry(req);
        Logger.debug(`${agentId} createAgentConnection results`, res.data);
        return res.data;
    }

    /**
     * @param body: RegisterTdcDto
     */
    public async registerWithTDC(agentId: string, body: RegisterTdcDto): Promise<RegisterTdcResponseDto> {
        // 1 generate a connection invite from fsp agent
        const connection = await this.createAgentConnection(agentId);
        const url = `${body.tdcEndpoint}/v2/register`;
        Logger.debug(`TRO created this connection ${connection.connection_id} invitation`, connection.invitation);

        // 2 using body.tdcEndpoint, call: /fsp/register passing in a connection invite
        const data = {
            alias: connection.invitation.label,
            identityProfileId: `citizen.identity`,
            invitation: connection.invitation
        };
        Logger.info(`connecting to TDC ${url} with data`, data);
        const request: AxiosRequestConfig = {
            method: 'POST',
            url,
            data,
        };
        const result = await this.http.requestWithRetry(request);
        Logger.debug(`TRO registering with TDC ${request.url}, results data`, result.data);
        // TODO do we need to save this information some where
        // TODO will we need to return this information to the caller:  thinking no
        return { connectionData: result.data.connectionData};
    }

    /**
     * @param body: RegisterOneTimeKeyDto
     */
    public async registerOnetimeKey(agentId: string, body: RegisterOneTimeKeyDto): Promise<any> {
        // 2 using body.tdcEndpoint, call: /register passing in a connection invite
        // todo: replace tdcEndpoint with lookup since we have connection id
        Logger.info(`TRO sending onetimekey data`, body);
        const url = `${body.tdcEndpoint}/v2/register/onetimekey`;
        const data = {
            connectionId: body.connectionId,
            oneTimeKey: body.oneTimeKey
        };
        Logger.debug(`connecting to TDC ${url} with data`, data);
        const request: AxiosRequestConfig = {
            method: 'POST',
            url,
            data,
        };
        const result = await this.http.requestWithRetry(request);
        Logger.debug(`TRO onetimekey with TDC ${request.url}, results data`);
        return result.data;
    }

    private async sendTransactionMessage(agentId: string, adminApiKey: string, connectionId: string,
                                         state: string, id: string, eventJson: any): Promise<any> {
        const url = `http://${agentId}:${process.env.AGENT_ADMIN_PORT}/connections/${connectionId}/send-message`;
        const msg: CreditTransaction<any> = Object.assign(
            new CreditTransaction<any>(), {
                state,
                id,
                transaction: eventJson
            }
        );
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

    private async sendTransactionReportMessage(agentId: string, adminApiKey: string, connectionId: string,
                                               state: string, id: string, tdcFspId: string, reportData: any): Promise<any> {
        const url = `http://${agentId}:${process.env.AGENT_ADMIN_PORT}/connections/${connectionId}/send-message`;
        const msg: TransactionRequest<any> = Object.assign(
            new TransactionRequest<any>(), {
                id,
                state,
                tdcFspId,
                transactions: reportData
            }
        );
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

    // this is temporary
    private generateTransactionId(hashableValue: string) : string {
        return SecurityUtility.hash32(hashableValue);
    }
}
