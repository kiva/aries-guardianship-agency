import { Injectable } from '@nestjs/common';
import Dockerode, { ContainerCreateOptions } from 'dockerode';
import { Logger } from 'protocol-common/logger';
import { Constants } from 'protocol-common/constants';
import { IAgentManager } from './agent.manager.interface';
import { AgentConfig } from './agent.config';

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
     */
    public async startAgent(config: AgentConfig): Promise<string> {

        const containerOptions: ContainerCreateOptions = {
            Image: config.dockerImage,
            Tty: true,
            name: config.agentId,
            HostConfig: {
                AutoRemove: true,
                NetworkMode: config.networkName,
                PortBindings: {
                    [`${config.adminPort}/tcp`]: [{ 'HostPort': `${config.adminPort}`}],
                    [`${config.httpPort}/tcp`]: [{ 'HostPort': `${config.httpPort}`}]
                }
            },
            Cmd: config.getStartArgs(),
        };

        // allow for exposing admin ports when set as this might be needed during development.
        // to make the ports available to localhost, they need to be set to values other than
        // the defaults
        if (config.adminPort !== parseInt(process.env.AGENT_ADMIN_PORT, 10) && Constants.LOCAL === process.env.NODE_ENV) {
            Logger.info(`setting up ports to be exposed`);
            containerOptions.ExposedPorts = {
                [`${config.adminPort}/tcp`]: {},
                [`${config.httpPort}/tcp`]: {}
            };
        }

        const container = await this.dockerode.createContainer(containerOptions);
        await container.start();

        // Log the first few lines so we can see if there's an issue with the agent
        let logCount = 0;

        container.attach({stream: true, stdout: true, stderr: true}, (err, stream) => {
            Logger.log('Starting agent:');
            stream.on('data', (chunk: Buffer) => {
                if (logCount < config.agentLogLength) {
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
