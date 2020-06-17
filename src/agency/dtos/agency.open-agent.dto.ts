import { IsString, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty } from '@nestjs/swagger';

export class AgencyOpenAgentDto {
    @ApiProperty({
        description: 'citizen wallet id'
    })
    readonly walletId: any;

    @ApiProperty({
        description: 'citizen wallet key (password)'
    })
    readonly walletkKey: any;

    @ApiProperty({
        description: 'OAuth authorization'
    })
    readonly adminApiKey: any;

    @ApiProperty({
        description: 'time when OAuth expires'
    })
    readonly expires: any;
}
