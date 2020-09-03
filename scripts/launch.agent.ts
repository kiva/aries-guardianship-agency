import { Logger } from '@nestjs/common';
import { Launcher } from './launcher';
import { AgentConfig } from '../src/manager/agent.config';

/**
 * Launches an agent in k8s with default config
 * 
 */

let envs: string[] = ['INDY_POOL_TRANSACTIONS_GENESIS_PATH'];
try {
    Logger.log(`Reading environment`);
    for (var v of envs) {
        if (!(v in process.env)) { throw new Error(`${v} undefined`) };
    }
} catch (e) {
    Logger.log('-------Fail-------');
    Logger.log('Environment variables required:');
    for (var v of envs) {
        Logger.log(v);
    }
    Logger.error(e.name + ': ' + e.message);
    process.exit(1); // Fail to prevent further scripts
}

Launcher.launch(new AgentConfig(
    'walletId',                                 // walletId
    'walletKey',                                // walletKey
    'adminApiKey',                              // adminApiKey
    'agentName',                                // agentName
    'agentEndpoint',                            // agentEndpoint
    'http://localhost:3001/webhookURL',         // webhookUrl
    '3001',                                     // adminPort
    '3001',                                     // httpPort
    'seed'                                      // seed
))
