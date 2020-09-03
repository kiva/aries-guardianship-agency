import { Logger } from '@nestjs/common';
import { Launcher } from './launcher';

/**
 * Launches an agent in k8s with default config
 * 
 */

Launcher.launch({id: 42})
