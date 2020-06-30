import { Injectable } from '@nestjs/common';
import { Constants } from '@kiva/protocol-common/constants';
import data from '../config/governence.json';
import { Logger } from '@kiva/protocol-common/logger';

/**
 * TODO validation, error cases, etc
 */
@Injectable()
export class AgentGovernance {
    // see GOVERANCE.md for documentation on policies data structure
    private static PERMISSION_DENY = 'deny';
    private static PERMISSION_ONCE = 'once';
    private static PERMISSION_ALWAYS = 'always';
    private static ALL_KEY = 'all';
    private static COMMENT_SECTION = 'comment';
    private readonly policies = { };

    constructor(policyName: string, source: any = data) {
        // flatten out the data between default and the named policy into a single policy
        this.policies = {...source.default, ...source[policyName]};
        this.validate();
    }

    // to ensure all data is valid, iterate through what has been loaded and
    // should a value not be understood, replace it with deny
    public validate() {
        delete this.policies[AgentGovernance.COMMENT_SECTION];
        for (const key of Object.keys(this.policies)) {
            if (false === this.isValidValue(this.policies[key])) {
                Logger.warn(`policy ${key} is not valid, resetting to 'deny'.`);
                this.policies[key] = AgentGovernance.PERMISSION_DENY;
            }
        }
        const all = AgentGovernance.ALL_KEY in this.policies;
        if (all === undefined) {
            Logger.warn(`default section may not be structured correctly.`);
            this.policies[AgentGovernance.ALL_KEY] = AgentGovernance.PERMISSION_DENY;
        }
    }

    public isValidValue(value: string): boolean {
        switch (value.toLowerCase()) {
            case AgentGovernance.PERMISSION_DENY:
            case AgentGovernance.PERMISSION_ONCE:
            case AgentGovernance.PERMISSION_ALWAYS:
                return true;
        }
        return false;
    }

    public getPermission(value: string): string {
        const key = value in this.policies;
        if (key === undefined) {
            return this.policies[AgentGovernance.ALL_KEY];
        }
        return this.policies[value];
    }
}
