import { Injectable } from '@nestjs/common';
import { IAgentManager } from './agent.manager.interface';
import { AgentConfig } from './agent.config';
import { KubeConfig, CoreV1Api, V1Secret, V1Deployment, V1Pod, V1Service, V1PodCondition } from '@kubernetes/client-node';
import { Logger } from 'protocol-common/logger';

/**
 * Starts and stops agents within a kubernetes environment
 */
@Injectable()
export class K8sService implements IAgentManager {

    // TODO: AWS user (secret key) and k8s config
    newKubeClient = (): CoreV1Api => {
        const kc = new KubeConfig();
        kc.loadFromDefault();
        const k = kc.makeApiClient(CoreV1Api);
        return k;
    }

    namespace = 'kiva-protocol'; // TODO: get this from config
    // TODO: make this crash the server if there is no k8s config or the k8s API connection fails
    kapi = this.newKubeClient();

    async createPod(config: AgentConfig, id: string): Promise<any> {
      const inboundTransportSplit = config.inboundTransport.split(' ');
      const adminSplit = config.admin.split(' ');
      const port: any = 3010;
      const res = await this.kapi.createNamespacedPod(this.namespace, {
        apiVersion: 'v1',
        kind: 'Pod',
        metadata: {
          name: `agent-${id}`,
          labels: {
            'app.kubernetes.io/instance': `agent-${id}`,
            'app.kubernetes.io/name': `agent-${id}`
          }
        },
        spec: {
          containers: [{
            name: `agent-${id}`,
            envFrom: [{ secretRef: {name: `agent-${id}`} }],
            image: 'bcgovimages/aries-cloudagent:py36-1.15-0_0.5.2', // TODO: get this from src/config/env.json
            ports: [{
              name: 'http',
              containerPort: 3010 // TODO: get this from src/config/env.json
            }],
            command: [
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
            // TODO: get the following from src/config/env.json? or other declarative source
            resources: {
              limits: {
                'cpu': '1100m',
                'memory': '607164212'
              },
              requests: {
                'cpu': '1100m',
                'memory': '607164212'
              }
            },
            livenessProbe: {
              httpGet: {
                path: '/healthz',
                port,
                scheme: 'HTTP'
              },
              timeoutSeconds: 10
            },
            readinessProbe: {
              httpGet: {
                path: '/healthz',
                port,
                scheme: 'HTTP'
              }
            }
          }],
        }
      });
      return res.body;
    }

    async createService(config: AgentConfig, id: string): Promise<any> {
      const res = await this.kapi.createNamespacedService(this.namespace, {
        apiVersion: 'v1',
        kind: 'Service',
        metadata: {
          name: `agent-${id}`
        },
        spec: {
          ports: [{
            name: 'http',
            port: 3010
          }],
          selector: {
            'app.kubernetes.io/instance': `agent-${id}`,
            'app.kubernetes.io/name': `agent-${id}`,
          }
        }
      });
      return res.body;
    }

    // Check to see if pod is ready
    async isReadyPod(name: string): Promise<boolean> {
      const res = await this.kapi.readNamespacedPodStatus(name, this.namespace);
      const isStatus = (item: V1PodCondition, index: number, array: V1PodCondition[]): boolean => {
        return item.status === 'True';
      };
      let max = new Date();
      res.body.status.conditions.forEach((item: V1PodCondition, index: number, array: V1PodCondition[]): void => {
        const t = item.lastTransitionTime;
        if (max < t) {
          max = t;
        }
      });
      const isLatest = (item: V1PodCondition, index: number, array: V1PodCondition[]): boolean => {
        return item.lastTransitionTime === max;
      };
      let ready = false;
      res.body.status.conditions.filter(isStatus).filter(isLatest).forEach((item: V1PodCondition, index: number, array: V1PodCondition[]): void => {
        if (item.type === 'Ready') {
          ready = true;
        }
      });
      return ready;
    }

    /**
     * TODO implement
     */
    public async startAgent(config: AgentConfig): Promise<string> {
        Logger.log(`====== starting k8s agent =======`);
        Logger.log(`====== NOTE: the service doesn't know whether the k8s config is correct at this point so if this call fails it may be because of that ======`);

        // TODO: id = random
        const id = `42`;
        await this.createPod(config, id);

        Logger.log(`====== created pod =======`);

        await this.createService(config, id);

        Logger.log(`====== created service =======`);

        // TODO: wait for pods to be ready and time out

        // TODO: Return service object including URL
        return `x`;
    }

    /**
     * TODO implement
     */
    public async stopAgent(id: string): Promise<void> {
        throw new Error('Not implemented');
    }
}
