import { IsArray, IsString } from 'class-validator';

/**
 * Please note: this structure is expected to be used across all services
 * which report statistics.  A future version of protocol-common will replace
 */
export class ServiceReportDto {
    @IsString() serviceName: string;
    @IsString() startedAt: string;
    @IsString() currentTime: string;
    @IsArray() versions: string[];
}
