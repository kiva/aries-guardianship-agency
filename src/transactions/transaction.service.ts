import { AxiosRequestConfig } from 'axios';
import { Injectable, Inject, HttpService, CACHE_MANAGER, CacheStore } from '@nestjs/common';
import { Logger } from 'protocol-common/logger';
import { ProtocolHttpService } from 'protocol-common/protocol.http.service';
import { AgentGovernance, ControllerCallback } from 'aries-controller/controller/agent.governance';
import { Topics } from 'aries-controller/controller/handler/topics';
import { RegisterTdcDto } from './dtos/register.tdc.dto';
import { RegisterOneTimeKeyDto } from './dtos/register.one.time.key.dto';
import { RegisterTdcResponseDto } from './dtos/register.tdc.response.dto';
import { ProtocolException } from 'protocol-common/protocol.exception';
import { ProtocolErrorCode } from 'protocol-common/protocol.errorcode';

@Injectable()
export class TransactionService {
    private readonly http: ProtocolHttpService;
    constructor(@Inject('AGENT_GOVERNANCE') private readonly agentGovernance: AgentGovernance,
                @Inject(CACHE_MANAGER) private readonly cache: CacheStore,
                httpService: HttpService,
    ) {
        this.http = new ProtocolHttpService(httpService);
        agentGovernance.registerHandler(Topics.BASIC_MESSAGES, this.basicMessageHandler);
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
            Logger.debug(`Fsp TransactionService received basic message`, body);
            switch (body.messageTypeId) {
                case `grant`:
                    if (body.state === `completed`) {
                        // todo we need to determine database schema for storing and logic for responding to basicmessages
                        Logger.info(`received completed grant information.`);
                        // todo and send ack to TDC once the endpoints are setup and save connection information
                    }
                    break;
            }

            return undefined;
        }

    private async createAgentConnection(agentId: string): Promise<any> {
        const agentData: any = await this.cache.get(agentId);
        if (agentData === undefined) {
            throw new ProtocolException(ProtocolErrorCode.INVALID_BACKEND_OPERATION, `agent expected but not found`);
        }
        const url = `http://${agentId}:${process.env.AGENT_ADMIN_PORT}/connections/create-invitation`;
        const req: any = {
            method: 'POST',
            url,
            headers: {
                'x-api-key': agentData.adminApiKey,
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
        const url = `${body.tdcEndpoint}/v2/fsp/register`;
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
        // 2 using body.tdcEndpoint, call: /fsp/register passing in a connection invite
        // todo: replace tdcEndpoint with lookup since we have connection id
        Logger.info(`TRO sending onetimekey data`, body);
        const url = `${body.tdcEndpoint}/v2/fsp/register/onetimekey`;
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
}
