import { IsString, IsNumber, Matches, IsBoolean, IsOptional } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class AgentCreateDto {
    @ApiProperty({
        description: 'Wallet id for the agent',
    })
    @IsString() readonly walletId: string;

    @ApiProperty({
        description: 'Wallet key for the agent',
    })
    @IsString() readonly walletKey: string;

    @ApiProperty({
        description: 'Admin API key to access agent',
    })
    @IsString() readonly adminApiKey: string;

    @ApiPropertyOptional({
        description: 'Id for the agent, must be a valid kubernetes pod name (only lower case alphanumeric and the first character must be a letter)',
    })
    @IsString() @Matches(/[a-z]([-a-z0-9]*[a-z0-9])?/) readonly agentId: string;

    @ApiProperty({
        description: '(Optional) Seed value for the agent\'s primary DID. Default: null (which creates a random DID)',
    })
    @IsOptional() @IsString() readonly seed?: string;

    @ApiProperty({
        description: '(Optional) Time-to-live in seconds for the agent. Default: 3600 (1 hour)',
    })
    @IsOptional() @IsNumber() readonly ttl?: number;

    @ApiProperty({
        description: '(Optional) Controller URL for the agent to send it\'s webhooks. Default: null (which uses the agency\'s governance handler)',
    })
    @IsOptional() @IsString() readonly controllerUrl?: string;

    @ApiProperty({
        description: '(Optional) Label for the agent, visible when making connections. Default: null (which uses the agentId)',
    })
    @IsOptional() @IsString() readonly label?: string;

    @ApiProperty({
        description: '(Optional) Auto return connection data on agent startup. Default: true',
    })
    @IsOptional() @IsBoolean() readonly autoConnect?: boolean = true;

    @ApiProperty({
        description: '(Optional) Custom admin API port for agent, useful for local testing. Default: 5001',
    })
    @IsOptional() @IsNumber() readonly adminApiPort?: number;

    @ApiProperty({
        description: '(Optional) Whether the agent should use a tails server for revocation. Default: false',
    })
    @IsOptional() @IsBoolean() readonly useTailsServer?: boolean = false;
}
