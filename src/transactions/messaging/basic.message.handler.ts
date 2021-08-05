
export interface IBasicMessageHandler {
    respond(message: any):  Promise<boolean>;
}
