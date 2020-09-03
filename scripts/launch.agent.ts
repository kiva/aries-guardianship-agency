import { Launcher } from './launcher'
import { AgentK8sConfig } from './agent.k8s.config'

/**
 * Launches an agent in k8s with default config
 * 
 */
Launcher.launch(new AgentK8sConfig())
