import { readFileSync } from 'fs';
import { ProtocolException } from 'protocol-common/protocol.exception';

/**
 * Centralizes the config setup for an agent so it can be used in docker or k8s
 * TODO some of these things may need to be moved to env.json or .env files
 */
export class AgentConfig {
    readonly admin: string; // Admin url

    readonly adminApiKey: string;

    readonly adminPort: string;

    readonly agentId: string; // Agent id used for remote interactions

    readonly dockerImage: string;

    readonly endpoint: string; // Agent endpoint

    readonly genesisTransactions: string;

    readonly httpPort: string;

    readonly label: string; // Agent name

    readonly ledgerPoolName: string;

    readonly logLevel: string;

    readonly inboundTransport: string;

    readonly networkName: string;

    readonly outboundTransport: string;

    readonly seed: string;

    readonly walletName: string;

    readonly walletKey: string;

    readonly walletStorageConfig: string;

    readonly walletStorageCreds: string;

    readonly walletStorageType: string;

    readonly walletType: string;

    readonly webhookUrl: string; // Controller endpoint

    /**
     * Sets up the agent config
     */
    constructor(
        walletId: string,
        walletKey: string,
        adminApiKey: string,
        agentId: string,
        label: string,
        agentEndpoint: string,
        webhookUrl: string,
        adminPort: string,
        httpPort: string,
        seed?: string,
    ) {
        this.inboundTransport = `http 0.0.0.0 ${httpPort}`;
        this.outboundTransport = 'http';
        this.dockerImage = process.env.AGENT_DOCKER_IMAGE;
        this.ledgerPoolName = process.env.INDY_POOL_NAME;
        this.networkName = process.env.NETWORK_NAME;
        this.logLevel = process.env.AGENT_LOG_LEVEL;
        this.genesisTransactions = AgentConfig.getGenesisFile();
        this.walletType = 'indy';
        this.walletStorageType = 'postgres_storage';
        this.walletName = walletId;
        this.walletKey = walletKey;
        this.walletStorageConfig = JSON.stringify(this.getWalletStorageConfig());
        this.walletStorageCreds = JSON.stringify(this.getWalletStorageCreds());
        this.admin = `0.0.0.0 ${adminPort}`;
        this.adminApiKey = adminApiKey;
        this.label = label;
        this.agentId = agentId;
        this.webhookUrl = webhookUrl;
        this.endpoint = agentEndpoint;
        this.httpPort = `${httpPort}`;
        this.adminPort = `${adminPort}`;
        this.seed = seed;
    }

    private getWalletStorageConfig() {
        return {
            url: process.env.WALLET_DB_HOST + ':' + process.env.WALLET_DB_PORT,
            wallet_scheme: 'MultiWalletSingleTable',
        };
    }

    private getWalletStorageCreds() {
        return {
            account: process.env.WALLET_DB_USER,
            password: process.env.WALLET_DB_PASS,
            admin_account: process.env.WALLET_DB_ADMIN_USER,
            admin_password: process.env.WALLET_DB_ADMIN_PASS,
        };
    }

    public static getGenesisFile(): string {
        return readFileSync(process.env.INDY_POOL_TRANSACTIONS_GENESIS_PATH).toString();
    }

    public getStartArgs(): any {
        throw new ProtocolException('TODO', 'TODO');
    }
}
