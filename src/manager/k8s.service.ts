import { Injectable } from '@nestjs/common';
import { IAgentManager } from './agent.manager.interface';
import { AgentConfig } from './agent.config';
import { KubeConfig, CoreV1Api, V1Secret, V1Deployment, V1Pod, V1Service, V1PodCondition } from '@kubernetes/client-node';
import { Logger } from 'protocol-common/logger';
import { readFile } from 'fs';
import cryptoRandomString from 'crypto-random-string';

/**
 * Starts and stops agents within a kubernetes environment
 */
@Injectable()
export class K8sService implements IAgentManager {

    // newKubeClient
    // This configuration is only available if you run the server on a filesystem provisioned with a k8s client.
    // When running in k8s, this config will be available via the configured k8s service account of the pod.
    // Locally, this config is provided via ~/.kube/config.
    newKubeClient = (): CoreV1Api => {
        const kc = new KubeConfig();
        kc.loadFromDefault();
        const k = kc.makeApiClient(CoreV1Api);
        return k;
    }
    kapi = this.newKubeClient();

    // getNamespace
    // This will work in k8s when the service account is set up correctly.
    // Locally this will fail, unless you create this file at the correct path.
    getNamespace = (): string => {
      let namespace = 'default';
      readFile('/var/run/secrets/kubernetes.io/serviceaccount/namespace','utf8', (err,data) => {
        if (err) throw err;
        namespace = data;
      });
      return namespace;
    }
    namespace = this.getNamespace();

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
            image: 'bcgovimages/aries-cloudagent:py36-1.15-0_0.5.4', // TODO: get this from src/config/env.json
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
     * startAgent
     */
    public async startAgent(config: AgentConfig): Promise<string> {
        const id = cryptoRandomString({length: 10, type: 'alphanumeric'});
        await this.createPod(config, id);
        await this.createService(config, id);
        // TODO: wait for pods to be ready and time out
        return id;
    }

    /**
     * TODO implement
     */
    public async stopAgent(id: string): Promise<void> {
        throw new Error('Not implemented');
        // TODO: await this.deletePod(id)
    }
}
