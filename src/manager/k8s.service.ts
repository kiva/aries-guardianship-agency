import { Injectable } from '@nestjs/common';
import { IAgentManager } from './agent.manager.interface';
import { AgentConfig } from './agent.config';
import { KubeConfig, CoreV1Api, V1PodCondition, V1Pod } from '@kubernetes/client-node';
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
        const healthCheckPort : any = parseInt(config.httpPort, 10);
        const podOptions : V1Pod = {
            apiVersion: 'v1',
            kind: 'Pod',
            metadata: {
                name: config.agentId,
                labels: {
                    'app.kubernetes.io/instance': config.agentId,
                    'app.kubernetes.io/name': config.agentId,
                    'agent': 'true'
                }
            },
            spec: {
                containers: [{
                    name: config.agentId,
                    image: config.dockerImage,
                    ports: [
                        {
                            name: 'http',
                            containerPort: parseInt(config.httpPort, 10)
                        },
                        {
                            name: 'admin',
                            containerPort: parseInt(config.adminPort, 10)
                        }
                    ],
                    args: config.getStartArgs(),
                    env: [
                        {
                            name: 'DD_ENV',
                            value: process.env.DD_ENV,
                        },
                        {
                            name: 'DD_TAGS',
                            value: process.env.DD_TAGS,
                        }
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
                            path: '/',
                            port: healthCheckPort,
                            scheme: 'HTTP'
                        },
                        timeoutSeconds: 10
                    },
                    readinessProbe: {
                        httpGet: {
                            path: '/',
                            port: healthCheckPort,
                            scheme: 'HTTP'
                        }
                    }
                }],
                // Only launch the agents on the dedicated agent node pool if it exists:
                tolerations: [{
                    key: 'agent',
                    operator: 'Equal',
                    value: 'true',
                    effect: 'NoSchedule'
                }],
                affinity: {
                    nodeAffinity: {
                        preferredDuringSchedulingIgnoredDuringExecution: [{
                            weight: 100,
                            preference: {
                                matchExpressions: [{
                                    key: 'dedicated',
                                    operator: 'In',
                                    values: ['agent']
                                }]
                            }
                        }],
                    }
                }
            }
        };
        const res = await this.kapi.createNamespacedPod(this.namespace, podOptions);
        return res.body;
    }

    private async createService(config: AgentConfig): Promise<any> {
      const res = await this.kapi.createNamespacedService(this.namespace, {
        apiVersion: 'v1',
        kind: 'Service',
        metadata: {
          name: config.agentId,
          labels: {
            'agent': 'true'
          }
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
            'app.kubernetes.io/instance': config.agentId,
            'app.kubernetes.io/name': config.agentId,
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
        return config.agentId;
    }

    /**
     * stopAgent
     */
    public async stopAgent(id: string): Promise<void> {
        await this.deleteService(id);
        await this.deletePod(id);
    }
}
