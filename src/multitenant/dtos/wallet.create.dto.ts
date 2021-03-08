import { IsString, IsNumber, IsBoolean, IsOptional } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class WalletCreateDto {

    @ApiProperty({
        description: 'Wallet name for the wallet instance. (Previously the was wallet id)',
    })
    @IsString() readonly walletName: string;

    @ApiProperty({
        description: 'Wallet key for the wallet instance.',
    })
    @IsString() readonly walletKey: string;

    @ApiPropertyOptional({
        description: 'Label for the wallet, visible when making connections. (Previously this was the agentId)',
    })
    @IsOptional() @IsString() readonly label?: string;

    @ApiPropertyOptional({
        description: '(Optional) Time-to-live in seconds for the wallet. Default: 3600 (1 hour)',
    })
    @IsOptional() @IsNumber() readonly ttl?: number;

    @ApiPropertyOptional({
        description: '(Optional) Controller URL for the agent to send it\'s webhooks. Default: null (which uses the agency\'s governance handler)',
    })
    @IsOptional() @IsString() readonly controllerUrl?: string;

    @ApiPropertyOptional({
        description: '(Optional) Auto return connection data on agent startup. Default: true',
    })
    @IsOptional() @IsBoolean() readonly autoConnect?: boolean = true;

}
