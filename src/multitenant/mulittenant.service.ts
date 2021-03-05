import { Injectable, CacheStore, CACHE_MANAGER, Inject, HttpService } from '@nestjs/common';
import { Logger } from 'protocol-common/logger';
import { ProtocolHttpService } from 'protocol-common/protocol.http.service';
import { WalletCreateDto } from './dtos/wallet.create.dto';

/**
 * 
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

    /*
    Send
        {
        "image_url": "https://aries.ca/images/sample.png",
        "key_management_mode": "managed",
        "label": "Alice",
        "wallet_dispatch_type": "default",
        "wallet_key": "MySecretKey123",
        "wallet_name": "MyNewWallet",
        "wallet_type": "indy",
        "wallet_webhook_urls": [
            "http://localhost:8022/webhooks"
        ]
        }
    Returns
        {   
        "wallet_id": "20863d38-c661-46b7-9b7a-94b90984b7a0",
        "settings": {
            "wallet.type": "indy",
            "wallet.name": "MyNewWallet",
            "wallet.webhook_urls": [
            "http://localhost:8022/webhooks"
            ],
            "wallet.dispatch_type": "default",
            "default_label": "Alice",
            "image_url": "https://aries.ca/images/sample.png",
            "wallet.id": "20863d38-c661-46b7-9b7a-94b90984b7a0"
        },
        "key_management_mode": "managed",
        "created_at": "2021-03-05 10:43:45.063521Z",
        "updated_at": "2021-03-05 10:43:45.063521Z",
        "token": "eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9.eyJ3YWxsZXRfaWQiOiIyMDg2M2QzOC1jNjYxLTQ2YjctOWI3YS05NGI5MDk4NGI3YTAifQ.xLQ-bsuqlXpsac81hFKgC2Hvjwt3hqO8FxpncqMmLb0"
        }
    */
    public async createWallet(body: WalletCreateDto): Promise<any> {
        let result;
        try {
            result = await this.createMultitenantWallet(body);
        } catch (e) {
            Logger.log('error', e);
            if (e.details && e.details.includes('Wallet with name') && e.details.include('already exists')) {
                // TODO handle already exists case
            }
        }
        
        Logger.log(result);
        await this.setAgentCache(body.walletId, body.ttl, result.token);
        if (body.autoConnect) {
            const res = await this.createConnection(result.token);
            Logger.log(res);
            return res;
        }
        return result;
    }

    private async createMultitenantWallet(body: WalletCreateDto): Promise<any> {
        const url = `http://multitenant:3021/multitenancy/wallet`;
        const data = {
            key_management_mode: 'managed',
            wallet_dispatch_type: 'default',
            wallet_type: 'indy',
            label: body.label,
            wallet_name: body.walletId,
            wallet_key: body.walletKey,
            wallet_webhook_urls: [
                body.controllerUrl || `${process.env.INTERNAL_URL}/v1/controller/${body.walletId}`
            ]
        }
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

    private async setAgentCache(walletId, ttl, token): Promise<void> {
        // Generally we want the cache to last 1 second longer than the agent, except when set to an "infinite" value like 0 or -1
        const cacheTtl = (ttl < 0) ? ttl : ttl + 1;
        Logger.info(`record cache limit set to: ${cacheTtl}`);
        await this.cache.set(
            walletId,
            {
                adminApiKey: process.env.MULTITENANT_API_KEY,
                token: token,
                ttl: ttl,
                multitenant: true
            },
            {
                ttl: cacheTtl
            }
        );

        const test = await this.cache.get(walletId);
        Logger.log('test' + walletId, test);
    }

    /**
     * {
        "wallet_key": "MySecretKey123"
        }
     */
    public async removeWallet(walletKey: string): Promise<any> {

    }

    public async connectAgent(agentId: string, adminApiKey: string): Promise<any> {

    }


}
