import { Controller, Body, Post, Delete } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { ProtocolService } from './protocol.service';

/**
 * TODO: URI needs to match public spec'ed API
 */
@Controller('v1/protocol')
@ApiTags('protocol')
export class ProtocolController {

}
