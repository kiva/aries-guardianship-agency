import { Get, Controller, Body, Post, Delete } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { ProtocolValidationPipe } from 'protocol-common/protocol.validation.pipe';
import { WalletCreateDto } from './dtos/wallet.create.dto';
import { MultitenantService } from './mulittenant.service';

/**
 * Base route is just for various health check endpoints
 */
@Controller('v2/multitenant')
@ApiTags('multitenant')
@Controller()
export class MultitenantController {

    constructor(private readonly multitenantService: MultitenantService) {}

    /**
     * Spin up an agent with the passed in params
     */
    @Post()
    public async createWallet(@Body(new ProtocolValidationPipe()) body: WalletCreateDto) {
        return await this.multitenantService.createWallet(body);
    }

    /**
     * TODO DTOs
     */
    @Delete()
    public async removeWallet(@Body() body: any) {
        return await this.multitenantService.removeWallet(body.agentId);
    }

    /**
     * Make a separate call to connect with the agent
     */
    @Post('connect')
    public async connectAgent(@Body() body: any) {
        return await this.multitenantService.connectAgent(body.agentId, body.adminApiKey);
    }
    
}
