import { Logger } from '@nestjs/common';
import { inspect } from 'util';

const sleep = (ms) => new Promise(resolve => setTimeout(resolve, ms));

/**
 * Launches an agent in k8s with a given config
 */
export class Launcher {

    public static async launch(agentK8sConfig: any): Promise<void> {
        try {
            Logger.log(`Launching agent: ${agentK8sConfig.id}`);
            await this.launchInner(agentK8sConfig);
            Logger.log('-------Success-------');
        } catch (e) {
            if (e.response && e.response.data) {
                Logger.error(inspect(e.response.data));
            } else {
                Logger.error(inspect(e));
            }
            Logger.error('-------Fail-------');
            process.exit(1); // Fail to prevent further scripts
        }
    }

    private static async launchInner(agentK8sConfig): Promise<void> {
        sleep(500);
        return;
    }

}

