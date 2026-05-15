export declare class SmsService {
    private client;
    constructor();
    sendCandidateSMS(phone: string, messageBody: string): Promise<{
        success: boolean;
        messageSid: string;
        error?: undefined;
    } | {
        success: boolean;
        error: any;
        messageSid?: undefined;
    }>;
}
