import { Injectable } from '@nestjs/common';
import { Logger } from '@kiva/protocol-common/logger';
import { ProtocolException } from '@kiva/protocol-common/protocol.exception';
import Dockerode from 'dockerode';
import { IAgentManager } from './agent.manager.interface';

/**
 *
 */
@Injectable()
export class DockerService implements IAgentManager {

    private dockerode: Dockerode;

    /**
     * TODO inject via dependency injection with Dockerode so manually instantiating it
     */
    constructor() {
        this.dockerode = new Dockerode();
    }

    /**
     * Start an agent with the given params
     * TODO create an AgentConfig object will all these things specified, that way we don't have these crazy long signatures
     * TODO I don't think this handles errors properly if the agent fails to spin up
     */
    public async startAgent(
        walletId: string,
        walletKey: string,
        adminApiKey: string,
        agentName: string,
        agentEndpoint: string,
        webhookUrl: string,
        adminPort: string,
        httpPort: string
    ): Promise<string> {
        // Putting const values here for now for simplicity:
        // The ports shouldn't matter in production because they will only be localled to the container, but on our macs
        // we want agents to have different ports so we can access them easier
        const INDY_POOL_TRANSACTIONS_GENESIS_PATH = '/home/indy/resources/pool_transactions_genesis_local_dev';
        const walletStorageConfig = {
            url: process.env.WALLET_DB_HOST + ':' + process.env.WALLET_DB_PORT,
            wallet_scheme: 'MultiWalletSingleTable',
        };
        const walletStorageCreds = {
            account: process.env.WALLET_DB_USER,
            password: process.env.WALLET_DB_PASS,
            admin_account: process.env.WALLET_DB_ADMIN_USER,
            admin_password: process.env.WALLET_DB_ADMIN_PASS,
        };

        const container = await this.dockerode.createContainer({
            Image: 'bcgovimages/aries-cloudagent:py36-1.14-1_0.5.1', // TODO eventually we'll need a kiva image with our customizations
            Tty: true,
            name: agentName,
            ExposedPorts: {
                [`${adminPort}/tcp`]: {},
                [`${httpPort}/tcp`]: {}
            },
            HostConfig: {
                AutoRemove: true,
                NetworkMode: 'kiva-network',
                Binds: [ // TODO instead of passing in the genesis file via volumes, we can do it over http which will make this less complex
                    '/Users/jsaur/projects/protocol/experimental/agency/resources:/home/indy/resources/' // TODO how to do relative paths?
                ],
                PortBindings: {
                    [`${adminPort}/tcp`]: [{ 'HostPort': adminPort}],
                    [`${httpPort}/tcp`]: [{ 'HostPort': httpPort}]
                }
            },
            Cmd: [
                'start',
                // Constant values
                '--inbound-transport', 'http', '0.0.0.0', httpPort,
                '--outbound-transport', 'http',
                '--genesis-file', INDY_POOL_TRANSACTIONS_GENESIS_PATH,
                '--wallet-type', 'indy',
                '--wallet-storage-type', 'postgres_storage',
                // Agent specific values
                '--endpoint', agentEndpoint,
                '--wallet-name', walletId,
                '--wallet-key', walletKey,
                '--wallet-storage-config', JSON.stringify(walletStorageConfig),
                '--wallet-storage-creds', JSON.stringify(walletStorageCreds),
                '--admin', '0.0.0.0', adminPort,
                '--admin-api-key', adminApiKey,
                '--label', agentName,
                '--webhook-url', webhookUrl,
                // TODO For now we auto respond, eventually we will want more refined responses
                '--log-level', 'debug',
                '--auto-accept-invites',
                '--auto-accept-requests',
                '--auto-respond-messages',
                '--auto-respond-credential-offer',
                '--auto-store-credential',
                '--auto-respond-presentation-request',
            ],
        });
        await container.start();
        // Comment this in if we want to see docker logs here:
        // await container.attach({stream: true, stdout: true, stderr: true}, (err, stream) => {
        //     stream.pipe(process.stdout);
        // });
        return container.id
    }

    /**
     * Stop agent by it's container id
     */
    public async stopAgent(id: string): Promise<void> {
        const container = this.dockerode.getContainer(id);
        await container.stop();
        // await container.remove(); // Looks like maybe we don't need to remove?
    }
}