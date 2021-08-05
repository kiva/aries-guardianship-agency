import { IBasicMessageHandler } from './basic.message.handler';


export class ReportMessageHandler implements IBasicMessageHandler {
    public async respond(message: any): Promise<boolean> {
        return false;
    }

}
