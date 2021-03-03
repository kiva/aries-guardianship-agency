import { readFileSync } from 'fs';
import { AgentCreateDto } from './dtos/agent.create.dto';

/**
 * Centralizes the config setup for an agent so it can be used in docker or k8s
 * TODO some of these things may need to be moved to env.json or .env files
 */
export class AgentConfig {
    private readonly DEFAULT_TTL_SECONDS: number = 3600;

    readonly admin: string; // Admin url

    readonly adminApiKey: string;

    readonly agentLogLength: number;

    readonly adminPort: number;

    readonly agentId: string; // Agent id used for remote interactions

    readonly dockerImage: string;

    readonly endpoint: string; // Agent endpoint

    readonly genesisTransactions: string;

    readonly httpPort: number;

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

    readonly useTailsServer: boolean;

    readonly ttl: number;

    /**
     * Sets up the agent config, using smart defaults from the AgentCreateDto
     */
    constructor(agentDto: AgentCreateDto) {
        const httpPort = parseInt(process.env.AGENT_HTTP_PORT, 10);
        const adminPort = agentDto.adminApiPort || parseInt(process.env.AGENT_ADMIN_PORT, 10);
        this.inboundTransport = `http 0.0.0.0 ${httpPort}`;
        this.outboundTransport = 'http';
        this.dockerImage = process.env.AGENT_DOCKER_IMAGE;
        this.ledgerPoolName = process.env.INDY_POOL_NAME;
        this.networkName = process.env.NETWORK_NAME;
        this.logLevel = process.env.AGENT_LOG_LEVEL;
        this.agentLogLength = parseInt(process.env.AGENT_LOG_LENGTH || `100`, 10);
        this.genesisTransactions = AgentConfig.getGenesisFile();
        this.walletType = 'indy';
        this.walletStorageType = 'postgres_storage';
        this.walletName = agentDto.walletId;
        this.walletKey = agentDto.walletKey;
        this.walletStorageConfig = JSON.stringify(this.getWalletStorageConfig());
        this.walletStorageCreds = JSON.stringify(this.getWalletStorageCreds());
        this.admin = `0.0.0.0 ${adminPort}`;
        this.adminApiKey = agentDto.adminApiKey;
        this.label = agentDto.label;
        this.agentId = agentDto.agentId;
        this.httpPort = httpPort;
        this.adminPort = adminPort;
        this.seed = agentDto.seed;
        this.useTailsServer = (agentDto.useTailsServer === true); // defaults to false
        this.ttl = agentDto.ttl || this.DEFAULT_TTL_SECONDS;
        // The webhook url should be private on the network between the agent and the controller, since we don't want the admin api exposed publicly.
        // It's either the passed in controller URL, or the internal URL of the agency for this specific agent ID.
        this.webhookUrl = agentDto.controllerUrl || `${process.env.INTERNAL_URL}/v1/controller/${agentDto.agentId}`;
        // The agent's endpoint is the one that is exposed publicly via the agency
        this.endpoint = `${process.env.PUBLIC_URL}/v1/router/${agentDto.agentId}`;
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

    public getStartArgs(): any[] {
        const inboundTransportSplit = this.inboundTransport.split(' ');
        const adminSplit = this.admin.split(' ');

        const args = [ 'start',
            '--inbound-transport', inboundTransportSplit[0], inboundTransportSplit[1], inboundTransportSplit[2],
            '--outbound-transport', this.outboundTransport,
            '--ledger-pool-name', this.ledgerPoolName,
            '--genesis-transactions', this.genesisTransactions,
            '--wallet-type', this.walletType,
            '--wallet-storage-type', this.walletStorageType,
            '--endpoint', this.endpoint,
            '--wallet-name', this.walletName,
            '--wallet-key', this.walletKey,
            '--wallet-storage-config', this.walletStorageConfig,
            '--wallet-storage-creds', this.walletStorageCreds,
            '--admin', adminSplit[0], adminSplit[1],
            '--admin-api-key', this.adminApiKey,
            '--label', this.label,
            '--webhook-url', this.webhookUrl,
            '--log-level', this.logLevel,
            '--wallet-local-did', // TODO this could be an arg on the config
            '--auto-provision'

        ];

        if(this.useTailsServer) {
            args.push('--tails-server-base-url', process.env.TAILS_URL);
        }

        if (this.seed) {
            args.push('--seed', this.seed);
        }
        return args;
    }
}
