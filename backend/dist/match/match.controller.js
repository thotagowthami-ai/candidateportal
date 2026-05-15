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
exports.MatchController = void 0;
const common_1 = require("@nestjs/common");
const passport_1 = require("@nestjs/passport");
const match_jd_dto_1 = require("./dto/match-jd.dto");
const match_service_1 = require("./match.service");
let MatchController = class MatchController {
    matchService;
    constructor(matchService) {
        this.matchService = matchService;
    }
    matchJd(body) {
        return this.matchService.matchByJd(body);
    }
    matchJdForMe(body, req) {
        return this.matchService.matchByJdForEmail(body, req.user.email);
    }
    matchJdForUser(body, userId) {
        return this.matchService.matchByJdForUserId(body, userId);
    }
    async saveMatchesForJob(jobDescriptionId, body) {
        return this.matchService.saveMatchesForJob(jobDescriptionId, body);
    }
};
exports.MatchController = MatchController;
__decorate([
    (0, common_1.Post)('jd'),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [match_jd_dto_1.MatchJdDto]),
    __metadata("design:returntype", void 0)
], MatchController.prototype, "matchJd", null);
__decorate([
    (0, common_1.Post)('jd/me'),
    (0, common_1.UseGuards)((0, passport_1.AuthGuard)('jwt')),
    __param(0, (0, common_1.Body)()),
    __param(1, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [match_jd_dto_1.MatchJdDto, Object]),
    __metadata("design:returntype", void 0)
], MatchController.prototype, "matchJdForMe", null);
__decorate([
    (0, common_1.Post)('jd/user/:userId'),
    (0, common_1.UseGuards)((0, passport_1.AuthGuard)('jwt')),
    __param(0, (0, common_1.Body)()),
    __param(1, (0, common_1.Param)('userId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [match_jd_dto_1.MatchJdDto, String]),
    __metadata("design:returntype", void 0)
], MatchController.prototype, "matchJdForUser", null);
__decorate([
    (0, common_1.Post)('jd/save'),
    __param(0, (0, common_1.Query)('jobDescriptionId')),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, match_jd_dto_1.MatchJdDto]),
    __metadata("design:returntype", Promise)
], MatchController.prototype, "saveMatchesForJob", null);
exports.MatchController = MatchController = __decorate([
    (0, common_1.Controller)('match'),
    __metadata("design:paramtypes", [match_service_1.MatchService])
], MatchController);
//# sourceMappingURL=match.controller.js.map