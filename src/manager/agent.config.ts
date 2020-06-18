import {readFileSync} from 'fs';

/**
 * Centralizes the config setup for an agent so it can be used in docker or k8s
 * TODO some of these things may need to be moved to env.json or .env files
 */
export class AgentConfig {

    readonly inboundTransport: string;

    readonly outboundTransport: string;

    readonly ledgerPoolName: string;

    readonly genesisTransactions: string;

    readonly walletType: string;

    readonly walletStorageType: string;

    readonly walletName: string;

    readonly walletKey: string;

    readonly walletStorageConfig: string;

    readonly walletStorageCreds: string;

    readonly admin: string; // Admin url

    readonly adminApiKey :string;

    readonly label :string; // Agent name

    readonly webhookUrl :string; // Controller endpoint

    readonly endpoint: string; // Agent endpoint

    readonly httpPort: string;

    readonly adminPort: string;

    /**
     * Sets up the agent config
     */
    constructor(
        walletId: string,
        walletKey: string,
        adminApiKey: string,
        agentName: string,
        agentEndpoint: string,
        controllerEndpoint: string,
        adminPort: string,
        httpPort: string,
    ) {
        this.inboundTransport = `http 0.0.0.0 ${httpPort}`;
        this.outboundTransport = 'http';
        this.ledgerPoolName = process.env.INDY_POOL_NAME;
        this.genesisTransactions = AgentConfig.getGenesisFile();
        this.walletType = 'indy';
        this.walletStorageType = 'postgres_storage';
        this.walletName = walletId;
        this.walletKey = walletKey;
        this.walletStorageConfig = JSON.stringify(this.getWalletStorageConfig());
        this.walletStorageCreds = JSON.stringify(this.getWalletStorageCreds());
        this.admin = `0.0.0.0 ${adminPort}`;
        this.adminApiKey = adminApiKey;
        this.label = agentName;
        this.webhookUrl = controllerEndpoint;
        this.endpoint = agentEndpoint;
        this.httpPort = httpPort;
        this.adminPort = adminPort;
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
}