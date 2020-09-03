import { Injectable } from '@nestjs/common';
import { IAgentManager } from './agent.manager.interface';
import { AgentConfig } from './agent.config';
import { KubeConfig, CoreV1Api, V1Secret, V1Deployment, V1Pod, V1Service, V1PodCondition } from '@kubernetes/client-node';

/**
 * Starts and stops agents within a kubernetes environment
 */
@Injectable()
export class K8sService implements IAgentManager {

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

    async createSecret(): Promise<any> {
      // TODO: build secret
      const secret = new V1Secret();
      const res = await this.kapi.createNamespacedSecret(this.namespace, secret);
      return res.body;
    }

    async createPod(): Promise<any> {
      // TODO: build pod
      const pod = new V1Pod();
      const res = await this.kapi.createNamespacedPod(this.namespace, pod);
      return res.body;
    }

    async createService(): Promise<any> {
      // TODO: build service
      const service = new V1Service();
      const res = await this.kapi.createNamespacedService(this.namespace, service);
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
     * /
    public async launchAgent(config: any): Promise<string> {
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
