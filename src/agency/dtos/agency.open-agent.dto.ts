import { IsString, ValidateNested, IsNumber } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Optional } from '@nestjs/common';

export class AgencyOpenAgentDto {
    @ApiProperty({
        description: 'citizen wallet id',
    })
    @IsString() readonly walletId: string;

    @ApiProperty({
        description: 'citizen wallet key (password)',
    })
    @IsString() readonly walletkKey: string;

    @ApiProperty({
        description: 'OAuth authorization',
    })
    @IsString() readonly adminApiKey: string;

    @ApiPropertyOptional({
        description: 'time when OAuth expires',
    })
    @Optional() @IsNumber() readonly expires: number;
}
