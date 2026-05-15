import { SmsService } from './sms.service';
export declare class SmsController {
    private readonly smsService;
    constructor(smsService: SmsService);
    notifyCandidate(body: {
        phone: string;
        message: string;
    }): Promise<{
        message: string;
        sid: string | undefined;
    }>;
}
