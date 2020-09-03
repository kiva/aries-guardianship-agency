import { Launcher } from './launcher'
import { AgentConfig } from '../src/manager/agent.config'

/**
 * Launches an agent in k8s with default config
 * 
 */
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
