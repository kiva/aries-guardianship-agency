import { Injectable } from '@nestjs/common';
import Dockerode from 'dockerode';
import { IAgentManager } from './agent.manager.interface';
import { AgentConfig } from './agent.config';
import { Logger } from 'protocol-common/logger';

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
     * Start an agent with the given params using the expose docker api
     * TODO I don't think this handles errors properly if the agent fails to spin up
     * TODO investigate how to do port bindings so that we can reuse the same port number internally within the docker network (ie not expose on mac)
     */
    public async startAgent(config: AgentConfig): Promise<string> {
        const inboundTransportSplit = config.inboundTransport.split(' ');
        const adminSplit = config.admin.split(' ');
        const containerOptions = {
            Image: process.env.AGENT_DOCKER_IMAGE,
            Tty: true,
            name: config.label,
            ExposedPorts: {
                [`${config.adminPort}/tcp`]: {},
                [`${config.httpPort}/tcp`]: {}
            },
            HostConfig: {
                AutoRemove: true,
                NetworkMode: process.env.NETWORK_NAME,
                PortBindings: {
                    [`${config.adminPort}/tcp`]: [{ 'HostPort': config.adminPort}],
                    [`${config.httpPort}/tcp`]: [{ 'HostPort': config.httpPort}]
                }
            },
            Cmd: [
                'start',
                '--inbound-transport', inboundTransportSplit[0],  inboundTransportSplit[1], inboundTransportSplit[2],
                '--outbound-transport', config.outboundTransport,
                '--ledger-pool-name', config.ledgerPoolName,
                '--genesis-transactions', config.genesisTransactions,
                '--wallet-type', config.walletType,
                '--wallet-storage-type', config.walletStorageType,
                '--endpoint', config.endpoint,
                '--wallet-name', config.walletName,
                '--wallet-key', config.walletKey,
                '--wallet-storage-config', config.walletStorageConfig,
                '--wallet-storage-creds', config.walletStorageCreds,
                '--admin', adminSplit[0], adminSplit[1],
                '--admin-api-key', config.adminApiKey,
                '--label', config.label,
                '--webhook-url', config.webhookUrl,
                // TODO For now we auto respond, eventually we will want more refined responses
                '--log-level', 'debug',
                '--auto-respond-messages',
                // status offer_sent
                '--auto-respond-credential-offer',
                // request_sent
                '--auto-respond-presentation-request',
                '--wallet-local-did', // TODO this could be an arg on the config
            ],
        };
        if (config.seed) {
            containerOptions.Cmd.push('--seed', config.seed);
        }
        const container = await this.dockerode.createContainer(containerOptions);
        await container.start();

        // Log the first few lines so we can see if there's an issue with the agent
        let logCount = 0;
        const agentLogLength = process.env.AGENT_LOG_LENGTH || 100;
        container.attach({stream: true, stdout: true, stderr: true}, (err, stream) => {
            Logger.log('Starting agent:');
            stream.on('data', (chunk: Buffer) => {
                if (logCount < agentLogLength) {
                    Logger.log('Agent: ' + chunk.toString());
                    logCount++;
                }
            });
        });
        return container.id;
    }

    /**
     * Stop agent by it's container id
     * TODO it doesn't look like we need to call container.remove - but we should investigate the consequences
     */
    public async stopAgent(id: string): Promise<void> {
        const container = this.dockerode.getContainer(id);
        await container.stop();
    }
}
