import { Module, NestModule, MiddlewareConsumer } from '@nestjs/common';
import { createProxyMiddleware } from 'http-proxy-middleware';
import { AgentRouterService } from './agent.router.service.js';
import { AgentRouterController } from './agent.router.controller.js';
import { GlobalCacheModule } from '../app/global.cache.module.js';

/**
 * TODO rename AgentRouterModule
 */
@Module({
    imports: [
        GlobalCacheModule,
    ],
    controllers: [AgentRouterController],
    providers: [AgentRouterService],
})
export class AgentRouterModule implements NestModule {

    constructor(private readonly routerService: AgentRouterService) {}

    /**
     * Apply http-proxy-middleware for to proxy requests to the right agent
     * TODO figure out how to handle case where there is no agent - queue their messages?
     */
    configure(consumer: MiddlewareConsumer) {
        const middleware: any = createProxyMiddleware('/v1/router',
            {
                target: 'target', // Note createProxyMiddleware complains if there's no target, this gets overridden by router
                router: this.routerService.getRouter(),
                pathRewrite: {
                    '^/v1/router/[^/]+/?': '' // Remove the /v1/router and agentId parts and pass the rest onto the agent
                }
            },
        );
        consumer.apply(middleware).forRoutes('*');
    }
}
