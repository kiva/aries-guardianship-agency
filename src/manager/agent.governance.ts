import { Injectable } from '@nestjs/common';
import { Constants } from '@kiva/protocol-common/constants';
import data from '../config/governence.json';
import { Logger } from '@kiva/protocol-common/logger';

/**
 * TODO validation, error cases, etc
 */
@Injectable()
export class AgentGovernance {
    public policies = { };
    constructor() {
        switch (process.env.NODE_ENV) {
            case Constants.PROD:
                this.policies = {...data.default, ...data.prod};
                break;
            case Constants.SAND:
                this.policies = {...data.default, ...data.sand};
                break;
            case Constants.QA:
                this.policies = {...data.default, ...data.qa};
                break;
            case Constants.DEV:
                this.policies = {...data.default, ...data.dev};
                break;
            case Constants.LOCAL:
                this.policies = {...data.default, ...data.local};
                break;
            default:
                throw new Error(`NODE_ENV ${process.env.NODE_ENV} is not a valid value`);
        }

        this.validate();
    }

    // to ensure all data is valid, iterate through what has been loaded and
    // should a value not be understood, replace it with deny
    public validate() {
        for (const key of Object.keys(this.policies)) {
            if (false === this.isValidValue(this.policies[key])) {
                Logger.warn(`policy ${key} is not valid, resetting to 'deny'`);
                this.policies[key] = 'deny';
            }
        }
    }

    public isValidValue(value: string): boolean {
        switch (value.toLowerCase()) {
            case 'deny':
            case 'once':
            case 'always':
                return true;
        }
        return false;
    }
}
