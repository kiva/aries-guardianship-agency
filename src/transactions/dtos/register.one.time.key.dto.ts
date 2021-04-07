import { ApiProperty } from '@nestjs/swagger';
import { IsInt, IsNotEmpty, IsString, Max, Min } from 'class-validator';

export class RegisterOneTimeKeyDto {
    @ApiProperty({
        example: `4542e567-bce4-41db-92e6-b3918773f0da`,
        description: `fsp connection id for the tdc (this may go away and become a look up)`
    })
    @IsString() readonly connectionId: string;

    @ApiProperty({
        example: `http://localhost:3015`,
        description: `url for the TDC restful apis`
    })
    @IsString() readonly tdcEndpoint: string;

    @ApiProperty({
        example: `XTv4YCzYj8jqZgL1wVMGGL`,
        description: `unique id shared with TRO`
    })
    @IsString() readonly oneTimeKey: string;
}
