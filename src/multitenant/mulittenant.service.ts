import { Injectable, CacheStore, CACHE_MANAGER, Inject, HttpService } from '@nestjs/common';
import { Logger } from 'protocol-common/logger';
import { ProtocolHttpService } from 'protocol-common/protocol.http.service';
import { WalletCreateDto } from './dtos/wallet.create.dto';
import { WalletRemoveDto } from './dtos/wallet.remove.dto';

/**
 * TODO auto remove wallet from multitenant after ttl
 * TODO edge cases
 * TODO method to look up wallet data from wallet id (in case cache isn't available)
 */
@Injectable()
export class MultitenantService {

    private http: ProtocolHttpService;

    constructor(
        private readonly httpService: HttpService,
        @Inject(CACHE_MANAGER) private readonly cache: CacheStore
    ) {
        this.http = new ProtocolHttpService(httpService);
    }

    public async createWallet(body: WalletCreateDto): Promise<any> {
        let result;
        try {
            result = await this.callCreateWallet(body);
        } catch (e) {
            Logger.log('error', e);
            if (e.details && e.details.match(/Wallet with name \w+ already exists/g)) {
                // TODO handle already exists case by fetching token
                Logger.log('Handle duplicate wallet');
            }
        }

        Logger.log(result);
        await this.setAgentCache(body.walletName, body.ttl, result.wallet_id, result.token);
        if (body.autoConnect) {
            const invitation = await this.createConnection(result.token);
            Logger.log(invitation);
            return {
                invitation,
                token: result.token,
            };
        }
        return result;
    }

    private async callCreateWallet(body: WalletCreateDto): Promise<any> {
        const url = `http://multitenant:3021/multitenancy/wallet`;
        const data = {
            key_management_mode: 'managed',
            wallet_dispatch_type: 'default',
            wallet_type: 'indy',
            label: body.label ?? 'multitenant',
            wallet_name: body.walletName,
            wallet_key: body.walletKey,
            wallet_webhook_urls: [
                body.controllerUrl || `${process.env.INTERNAL_URL}/v1/controller/${body.walletName}`
            ]
        };
        const req: any = {
            method: 'POST',
            url,
            data,
            headers: {
                'x-api-key': process.env.MULTITENANT_API_KEY
            },
        };
        const res = await this.http.requestWithRetry(req);
        return res.data;
    }

    private async createConnection(token: string): Promise<any> {
        const url = `http://multitenant:3021/connections/create-invitation`;
        const req: any = {
            method: 'POST',
            url,
            headers: {
                'x-api-key': process.env.MULTITENANT_API_KEY,
                'Authorization': 'Bearer ' + token
            },
        };

        const res = await this.http.requestWithRetry(req);
        return res.data.invitation;
    }

    private async setAgentCache(walletName: string, ttl: number, walletId: string, token: string): Promise<void> {
        // Generally we want the cache to last 1 second longer than the agent, except when set to an "infinite" value like 0 or -1
        const cacheTtl = (ttl < 0) ? ttl : ttl + 1;
        Logger.info(`record cache limit set to: ${cacheTtl}`);
        await this.cache.set(
            walletName,
            {
                adminApiKey: process.env.MULTITENANT_API_KEY,
                token,
                walletId,
                ttl,
                multitenant: true
            },
            {
                ttl: cacheTtl
            }
        );
    }

    public async removeWallet(body: WalletRemoveDto): Promise<any> {
        // Look up wallet id from wallet label
        const agent: any = await this.cache.get(body.walletName);
        // TODO edge cases
        return await this.remoteMultitenantWallet(agent.walletId, body.walletKey);
    }

    private async remoteMultitenantWallet(walletId: string, walletKey: string): Promise<any> {
        const url = `http://multitenant:3021/multitenancy/wallet/${walletId}/remove`;
        const data = {
            wallet_key: walletKey,
        };
        const req: any = {
            method: 'POST',
            url,
            data,
            headers: {
                'x-api-key': process.env.MULTITENANT_API_KEY
            },
        };
        const res = await this.http.requestWithRetry(req);
        return res.data;
    }
}
