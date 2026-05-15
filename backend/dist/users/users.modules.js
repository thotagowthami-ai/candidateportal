"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.UsersModule = void 0;
const common_1 = require("@nestjs/common");
const config_1 = require("@nestjs/config");
const jwt_1 = require("@nestjs/jwt");
const passport_1 = require("@nestjs/passport");
const users_controller_1 = require("./users.controller");
const users_service_1 = require("./users.service");
const uploads_module_1 = require("../uploads/uploads.module");
const jwt_strategy_1 = require("./jwt.strategy");
const resume_parser_service_1 = require("./resume-parser.service");
let UsersModule = class UsersModule {
};
exports.UsersModule = UsersModule;
exports.UsersModule = UsersModule = __decorate([
    (0, common_1.Module)({
        imports: [
            uploads_module_1.UploadsModule,
            passport_1.PassportModule.register({ defaultStrategy: 'jwt' }),
            jwt_1.JwtModule.registerAsync({
                inject: [config_1.ConfigService],
                useFactory: (configService) => ({
                    secret: configService.get('JWT_SECRET') || 'dev_jwt_secret',
                    signOptions: { expiresIn: '1d' },
                }),
            }),
        ],
        controllers: [users_controller_1.UsersController],
        providers: [users_service_1.UsersService, jwt_strategy_1.JwtStrategy, resume_parser_service_1.ResumeParserService],
        exports: [users_service_1.UsersService],
    })
], UsersModule);
//# sourceMappingURL=users.modules.js.map