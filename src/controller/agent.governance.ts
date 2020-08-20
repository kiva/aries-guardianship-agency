import { Injectable } from '@nestjs/common';
import { Logger } from 'protocol-common/logger';
import data from '../config/governence.json';

/**
 * TODO validation, error cases, etc
 */
@Injectable()
export class AgentGovernance {
    // see GOVERANCE.md for documentation on policies data structure
    public static PERMISSION_DENY = 'deny';
    public static PERMISSION_ONCE = 'once';
    public static PERMISSION_ALWAYS = 'always';
    private static ALL_KEY = 'all';
    private static COMMENT_SECTION = 'comment';
    private readonly policies = { };
    public policyName: string = '';

    constructor(policyName: string, source: any = data) {
        // flatten out the data between default and the named policy into a single policy
        this.policyName = policyName;
        this.policies = {...source.default, ...source[policyName]};
        this.validate();
    }

    // to ensure all data is valid, iterate through what has been loaded and
    // should a value not be understood, replace it with deny
    public validate() {
        // remove comments sections so that we dont have to worry about it below
        delete this.policies[AgentGovernance.COMMENT_SECTION];

        // for each item in policies, evaluate that the values are meaningful and
        // set invalid values to AgentGovernance.PERMISSION_DENY
        for (const topic of Object.keys(this.policies)) {
            // AgentGovernance.ALL_KEY is a special in that it itself is not an object but a permission
            // so we will evaluate it as permission and move to the next
            if (topic === AgentGovernance.ALL_KEY) {
                if (false === this.isValidValue( this.policies[topic])) {
                    Logger.warn(`policy ${topic} is not valid, resetting to 'deny'.`);
                    this.policies[topic] = AgentGovernance.PERMISSION_DENY;
                }
                continue;
            }
            for (const key of Object.keys(this.policies[topic])) {
                try {
                    if (false === this.isValidValue(this.policies[topic][key])) {
                        Logger.warn(`policy ${key} is not valid, resetting to 'deny'.`);
                        this.policies[topic][key] = AgentGovernance.PERMISSION_DENY;
                    }
                } catch {
                    Logger.warn(`Improperly specified key found ${key}...deleting`);
                }
            }
        }
        const all = AgentGovernance.ALL_KEY in this.policies;
        if (all === undefined) {
            Logger.warn(`default section may not be structured correctly.`);
            this.policies[AgentGovernance.ALL_KEY] = AgentGovernance.PERMISSION_DENY;
        }
    }

    public isValidValue(value: string): boolean {
        if (!value) {
            return false;
        }
        switch (value.toLowerCase()) {
            case AgentGovernance.PERMISSION_DENY:
            case AgentGovernance.PERMISSION_ONCE:
            case AgentGovernance.PERMISSION_ALWAYS:
                return true;
        }
        return false;
    }

    // allows looking at a permission without making changes
    public peekPermission(topic: string, value: string): string {
        try {
            const permission = this.policies[topic][value];
            if (permission === undefined) {
                return this.policies[AgentGovernance.ALL_KEY];
            }
            return permission;
        } catch (e) {
            return this.policies[AgentGovernance.ALL_KEY];
        }
    }

    // once a permission is read, rules are applied to the permission
    // (like in the case of 'once')
    public readPermission(topic: string, value: string): string {
        try {
            const permission = this.policies[topic][value];
            if (permission === undefined) {
                return this.policies[AgentGovernance.ALL_KEY];
            }
            // Here's how we enforce "once", change it to deny once its been read
            // @tothink: this might create some problems because permissions are
            // per agent, not global
            if (permission === AgentGovernance.PERMISSION_ONCE) {
                this.policies[topic][value] = AgentGovernance.PERMISSION_DENY;
            }

            return permission;
        } catch (e) {
            return this.policies[AgentGovernance.ALL_KEY];
        }
    }
}
