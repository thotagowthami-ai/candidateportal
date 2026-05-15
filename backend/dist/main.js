"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
const core_1 = require("@nestjs/core");
const common_1 = require("@nestjs/common");
const app_module_1 = require("./app.module");
const express = __importStar(require("express"));
async function bootstrap() {
    const app = await core_1.NestFactory.create(app_module_1.AppModule);
    const configuredOrigins = (process.env.CORS_ORIGINS || '')
        .split(',')
        .map((origin) => origin.trim())
        .filter(Boolean);
    const defaultOrigins = [
        'http://localhost:5173',
        'http://localhost:3000',
        'https://candidateportal-dmx4.vercel.app',
    ];
    const allowedOrigins = new Set([...defaultOrigins, ...configuredOrigins]);
    const allowVercelPreviews = (process.env.CORS_ALLOW_VERCEL_PREVIEWS || 'true').toLowerCase() === 'true';
    app.use(express.json({ limit: '15mb' }));
    app.use(express.urlencoded({ limit: '15mb', extended: true }));
    app.setGlobalPrefix('api', {
        exclude: ['/'],
    });
    app.enableCors({
        origin: (origin, callback) => {
            if (!origin || allowedOrigins.has(origin)) {
                callback(null, true);
                return;
            }
            if (allowVercelPreviews) {
                try {
                    const host = new URL(origin).hostname;
                    if (host.endsWith('.vercel.app')) {
                        callback(null, true);
                        return;
                    }
                }
                catch {
                }
            }
            if (origin === 'null') {
                callback(null, true);
                return;
            }
            callback(new Error(`Origin not allowed by CORS: ${origin}`), false);
        },
        credentials: true,
        methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
        allowedHeaders: ['Content-Type', 'Authorization'],
    });
    app.useGlobalPipes(new common_1.ValidationPipe({
        whitelist: true,
        forbidNonWhitelisted: false,
        transform: true,
    }));
    const PORT = process.env.PORT || 3000;
    await app.listen(PORT, '0.0.0.0');
    console.log(`Resume Portal Backend running on port ${PORT}`);
    console.log(`Environment: ${process.env.NODE_ENV}`);
}
bootstrap().catch((err) => console.error(err));
//# sourceMappingURL=main.js.map