import { IsString } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class WalletRemoveDto {

    @ApiProperty({
        description: 'Wallet name for the wallet instance. (Previously the was wallet id)',
    })
    @IsString() readonly walletName: string;

    @ApiProperty({
        description: 'Wallet key for the wallet instance.',
    })
    @IsString() readonly walletKey: string;

}
