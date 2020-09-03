import { Logger } from '@nestjs/common';
import { inspect } from 'util';
import { K8sService } from '../src/manager/k8s.service';

/**
 * Launches an agent in k8s with a given config
 */
export class Launcher {

    public static async launch(agentK8sConfig: any): Promise<void> {
        try {
            Logger.log(`Launching agent: ${agentK8sConfig.id}`);
            var launchResult = await this.launchInner(agentK8sConfig);
            Logger.log('returned: ${launchResult}');
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

    private static async launchInner(agentK8sConfig): Promise<string> {
        var k = new K8sService();
        return k.launchAgent(agentK8sConfig);
    }

}

