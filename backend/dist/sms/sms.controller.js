"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.SmsController = void 0;
const common_1 = require("@nestjs/common");
const sms_service_1 = require("./sms.service");
let SmsController = class SmsController {
    smsService;
    constructor(smsService) {
        this.smsService = smsService;
    }
    async notifyCandidate(body) {
        if (!body.phone || !body.message) {
            throw new common_1.HttpException('Phone number and message are required', common_1.HttpStatus.BAD_REQUEST);
        }
        const result = await this.smsService.sendCandidateSMS(body.phone, body.message);
        if (result.success) {
            return { message: 'SMS sent successfully!', sid: result.messageSid };
        }
        else {
            throw new common_1.HttpException({ error: 'Failed to send SMS', details: result.error }, common_1.HttpStatus.INTERNAL_SERVER_ERROR);
        }
    }
};
exports.SmsController = SmsController;
__decorate([
    (0, common_1.Post)(),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], SmsController.prototype, "notifyCandidate", null);
exports.SmsController = SmsController = __decorate([
    (0, common_1.Controller)('notify-candidate'),
    __metadata("design:paramtypes", [sms_service_1.SmsService])
], SmsController);
//# sourceMappingURL=sms.controller.js.map