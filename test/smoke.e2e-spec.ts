import { Test } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import { AppService } from '../src/app/app.service';
import { AppController } from '../src/app/app.controller';
import { AgentGovernance } from '../src/controller/agent.governance';


describe('Smoke tests', () => {
    let app: INestApplication;

    beforeAll(async () => {
        const moduleFixture = await Test.createTestingModule({
            providers: [AppService],
            controllers: [AppController],
        }).compile();

        app = moduleFixture.createNestApplication();
        await app.init();
    });

    it('Governance installed data is valid', () => {
        const agentGovernance: AgentGovernance = new AgentGovernance('doesnt_matter');
    });

    it('Governance isValidValue detects invalid value', () => {
        const agentGovernance: AgentGovernance = new AgentGovernance('permissive');
        expect(false === agentGovernance.isValidValue('bob'));
    });

    it('Governance validates correctly adjusts invalid value', () => {
        const data = {
            default : {
                all: 'deny'
            },
            somethingWrong : {
                invalidTopic : {
                    invalidPermission: 'jibberish'
                }
            }
        };
        const agentGovernance: AgentGovernance = new AgentGovernance('somethingWrong', data);
        expect(agentGovernance.readPermission('invalidTopic', 'invalidPermission') === 'deny');
    });

    it('Governance validate correctly adds all', () => {
        const data = {
            somethingWrong : {
                invalidTopic : {
                    invalidPermission: 'jibberish'
                }
            }
        };
        const agentGovernance: AgentGovernance = new AgentGovernance('somethingWrong', data);
        // all, all doesnt exist so it should return default of deny
        expect(agentGovernance.readPermission('all','all') === 'deny');
    });

    it('Governance changes once permission to deny on use', () => {
        const agentGovernance: AgentGovernance = new AgentGovernance('permissive');
        expect(agentGovernance.readPermission('Permissive', 'invitation') === 'once');
        expect(agentGovernance.readPermission('Permissive', 'invitation') === 'deny');
    });
});
