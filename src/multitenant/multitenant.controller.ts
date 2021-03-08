import { Get, Controller, Body, Post, Delete } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { ProtocolValidationPipe } from 'protocol-common/protocol.validation.pipe';
import { WalletCreateDto } from './dtos/wallet.create.dto';
import { WalletRemoveDto } from './dtos/wallet.remove.dto';
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
     * Create a multitenant wallet
     */
    @Post()
    public async createWallet(@Body(new ProtocolValidationPipe()) body: WalletCreateDto) {
        return await this.multitenantService.createWallet(body);
    }

    /**
     * Remove a wallet from multitenant memory (this doesn't delete the wallet DB record, just the easy access)
     */
    @Delete()
    public async removeWallet(@Body(new ProtocolValidationPipe()) body: WalletRemoveDto) {
        return await this.multitenantService.removeWallet(body);
    }
}
