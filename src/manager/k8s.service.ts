import { Injectable } from '@nestjs/common';
import { IAgentManager } from './agent.manager.interface';
import { AgentConfig } from './agent.config';
import { KubeConfig, CoreV1Api, V1PodCondition } from '@kubernetes/client-node';
import { readFileSync } from 'fs';

/**
 * Starts and stops agents within a kubernetes environment
 */
@Injectable()
export class K8sService implements IAgentManager {

    private kapi : CoreV1Api = this.newKubeClient();
    private namespace : string = this.getNamespace();

    // newKubeClient
    // This configuration is only available if you run the server on a filesystem provisioned with a k8s client.
    // When running in k8s, this config will be available via the configured k8s service account of the pod.
    // Locally, this config is provided via ~/.kube/config.
    private newKubeClient(): CoreV1Api {
        const kc = new KubeConfig();
        kc.loadFromDefault();
        const k = kc.makeApiClient(CoreV1Api);
        return k;
    }

    // getNamespace
    // This will work in k8s when the service account is set up correctly.
    // Locally this will fail, unless you create this file at the correct path.
    private getNamespace(): string {
      const data = readFileSync('/var/run/secrets/kubernetes.io/serviceaccount/namespace','utf8');
      return data.toString();
    }

    private async createPod(config: AgentConfig): Promise<any> {
      const inboundTransportSplit = config.inboundTransport.split(' ');
      const adminSplit = config.admin.split(' ');
      const healthCheckPort : any = parseInt(config.adminPort, 10);
      const res = await this.kapi.createNamespacedPod(this.namespace, {
        apiVersion: 'v1',
        kind: 'Pod',
        metadata: {
          name: config.label,
          labels: {
            'app.kubernetes.io/instance': config.label,
            'app.kubernetes.io/name': config.label,
            'agent': 'true'
          }
        },
        spec: {
          containers: [{
            name: config.label,
            image: process.env.AGENT_DOCKER_IMAGE,
            ports: [{
              name: 'http',
              containerPort: parseInt(config.httpPort, 10)
              },
              {
                name: 'admin',
                containerPort: parseInt(config.adminPort, 10)
              }],
                args: [
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
                httpHeaders: [{
                  name: 'x-api-key',
                  value: config.adminApiKey
                }],
                path: '/status',
                port: healthCheckPort,
                scheme: 'HTTP'
              },
              timeoutSeconds: 10
            },
            readinessProbe: {
              httpGet: {
                httpHeaders: [{
                  name: 'x-api-key',
                  value: config.adminApiKey
                }],
                path: '/status',
                port: healthCheckPort,
                scheme: 'HTTP'
              }
            }
          }],
        }
      });
      return res.body;
    }

    private async createService(config: AgentConfig): Promise<any> {
      const res = await this.kapi.createNamespacedService(this.namespace, {
        apiVersion: 'v1',
        kind: 'Service',
        metadata: {
          name: config.label
        },
        spec: {
          ports: [{
            name: 'http',
            port: parseInt(config.httpPort, 10)
          },
          {
            name: 'admin',
            port: parseInt(config.adminPort, 10)
          }],
          selector: {
            'app.kubernetes.io/instance': config.label,
            'app.kubernetes.io/name': config.label,
          }
        }
      });
      return res.body;
    }

    // Check to see if pod is ready
    private async isReadyPod(name: string): Promise<boolean> {
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

    private async deleteService(id: string): Promise<void> {
      await this.kapi.deleteNamespacedService(id, this.namespace);
    }

    private async deletePod(id: string): Promise<void> {
      await this.kapi.deleteNamespacedPod(id, this.namespace);
    }

    /**
     * startAgent
     */
    public async startAgent(config: AgentConfig): Promise<string> {
        await this.createPod(config);
        await this.createService(config);
        // TODO: wait for pods to be ready and time out
        return config.label;
    }

    /**
     * stopAgent
     */
    public async stopAgent(id: string): Promise<void> {
        await this.deleteService(id);
        await this.deletePod(id);
    }
}
