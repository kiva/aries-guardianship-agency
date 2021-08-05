import { IBasicMessageHandler } from './basic.message.handler';


export class ReportMessageHandler implements IBasicMessageHandler {
    respond(message: any): boolean {
        return false;
    }

}
