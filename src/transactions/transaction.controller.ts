import { Controller, Post, Get, Param, Body } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { ProtocolValidationPipe } from 'protocol-common/validation/protocol.validation.pipe';
import { TransactionService } from './transaction.service';
import { RegisterTdcDto } from './dtos/register.tdc.dto';
import { RegisterOneTimeKeyDto } from './dtos/register.one.time.key.dto';
import { RegisterTdcResponseDto } from './dtos/register.tdc.response.dto';

/**
 * Exposing endpoints the TRO would call to interact with the TDC
 *
 * The TRO does not need to be in direct contact with the TDC.  These functions make it possible
 * for the TRO to contact the TDC indirectly
 */
@Controller('v2/transaction')
@ApiTags('transaction')
export class TransactionController {

    constructor(
        private readonly transactionService: TransactionService
    ) {}

    /**
     * For the TRO to make an aries compatible connection to the TDC
     * @param body
     */
    @Post(':agentId/register')
    public async registerWithTDC(
        @Param('agentId') agentId: string,
        @Body(new ProtocolValidationPipe()) body: RegisterTdcDto
    ): Promise<RegisterTdcResponseDto> {
        return await this.transactionService.registerWithTDC(agentId, body);
    }

    @Post(':agentId/registerOnetimeKey')
    public async registerOnetimeKey(
        @Param('agentId') agentId: string,
        @Body(new ProtocolValidationPipe()) body: RegisterOneTimeKeyDto): Promise<any> {
        return await this.transactionService.registerOnetimeKey(agentId, body);
    }
}
