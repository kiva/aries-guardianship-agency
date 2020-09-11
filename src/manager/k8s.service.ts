import { Injectable } from '@nestjs/common';
import { IAgentManager } from './agent.manager.interface';
import { AgentConfig } from './agent.config';
import { KubeConfig, CoreV1Api, V1Secret, V1Deployment, V1Pod, V1Service, V1PodCondition } from '@kubernetes/client-node';

/**
 * Starts and stops agents within a kubernetes environment
 */
@Injectable()
export class K8sService implements IAgentManager {

    // TODO: AWS user (secret key) and k8s config
    newKubeClient = (): CoreV1Api => {
        const kc = new KubeConfig();
        kc.loadFromDefault();
        return kc.makeApiClient(CoreV1Api);
    }

    kapi = this.newKubeClient();

    namespace = 'kiva-protocol'; // TODO: get this from config
    async listPods(): Promise<any> {
      const res = await this.kapi.listNamespacedPod(this.namespace);
      return res.body;
    }

    // async createSecret(id: string): Promise<any> {
    //   // TODO: get specific secret data requirements
    //   // TODO: make this idempotent (right now if the secret exists this throws an error)
    //   const res = await this.kapi.createNamespacedSecret(this.namespace, {
    //     apiVersion: 'v1',
    //     kind: 'Secret',
    //     metadata: {name: `agent-${id}`},
    //     stringData: {
    //       'test': 'secretval',
    //     }
    //   });
    //   return res.body;
    // }

    async createPod(id: string): Promise<any> {
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
            command: ['start'], // <-- Secrets go here
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

    async createService(id: string): Promise<any> {
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
     * launchAgent will be used to test the k8s API functionality because the
     * AgentConfig type requires more dependencies than I can point a stick
     * at and it's just too complex and complicated to actually use.
     */
    public async launchAgent(config: any): Promise<string> {
        // await this.createSecret(config.id);
        await this.createPod(config.id);
        await this.createService(config.id);
        return config.id;
        // throw new Error('Not implemented');
        // Optional: wait for pods to be ready
        // Return service object including URL
    }

    /**
     * TODO implement
     */
    public async startAgent(config: AgentConfig): Promise<string> {
        throw new Error('Not implemented');
        // Create secret
        // Create pod using secret
        // Create service pointing to deployment
        // Optional: wait for pods to be ready
        // Return service object including URL
    }

    /**
     * TODO implement
     */
    public async stopAgent(id: string): Promise<void> {
        throw new Error('Not implemented');
    }
}
