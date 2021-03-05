import { IsString, IsNumber, IsBoolean, IsOptional } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class WalletCreateDto {
    @ApiProperty({
        description: 'Wallet id/name for the agent',
    })
    @IsString() readonly walletId: string;

    @ApiProperty({
        description: 'Wallet key for the agent',
    })
    @IsString() readonly walletKey: string;

    @ApiPropertyOptional({
        description: '(Optional) Time-to-live in seconds for the agent. Default: 3600 (1 hour)',
    })
    @IsOptional() @IsNumber() readonly ttl?: number;

    @ApiPropertyOptional({
        description: '(Optional) Controller URL for the agent to send it\'s webhooks. Default: null (which uses the agency\'s governance handler)',
    })
    @IsOptional() @IsString() readonly controllerUrl?: string;

    @ApiPropertyOptional({
        description: '(Optional) Label for the agent, visible when making connections. Default: null (which uses the agentId)',
    })
    @IsOptional() @IsString() readonly label?: string;

    @ApiPropertyOptional({
        description: '(Optional) Auto return connection data on agent startup. Default: true',
    })
    @IsOptional() @IsBoolean() readonly autoConnect?: boolean = true;

}
