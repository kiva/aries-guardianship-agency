import { Controller, Post, Get, Param, Body } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { TransactionService } from './transaction.service';

/**
 * Exposing endpoints the FSP would call to interact with the TDC
 *
 * The FSP does not need to be in direct contact with the TDC.  These functions make it possible
 * for the FSP to contact the TDC indirectly
 */
@Controller('v2/transaction')
@ApiTags('transaction')
export class TransactionController {

    constructor(
        private readonly transactionService: TransactionService
    ) {}
}
