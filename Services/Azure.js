"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    Object.defineProperty(o, k2, { enumerable: true, get: function() { return m[k]; } });
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.Validator = exports.Azure = void 0;
const keyvault_secrets_1 = require("@azure/keyvault-secrets");
const identity_1 = require("@azure/identity");
const Crypto = __importStar(require("crypto"));
const credential = new identity_1.DefaultAzureCredential();
const client = new keyvault_secrets_1.SecretClient('https://Creeper-Bot-KeyVault.vault.azure.net', credential);
class Azure {
    static SetPrivateSecret() {
        return __awaiter(this, void 0, void 0, function* () {
            this.PrivateKey = (yield client.getSecret("GitHub-PrivateKey")).value;
            console.log('Private key was set.');
        });
    }
}
exports.Azure = Azure;
class Validator {
    /**
     * Validades signed webhooks from GitHub.
     * @param payload The data to be validaded.
     * @param sig The GitHub signature provided as header 'x-hub-signature'.
     */
    static ValidateSecretAsync(payload, sig) {
        return __awaiter(this, void 0, void 0, function* () {
            let secret = yield client.getSecret("GitHub-Secret");
            if (payload) {
                let secretValue = secret['value'];
                const hmac = Crypto.createHmac('sha1', secretValue);
                const digest = Buffer.from('sha1=' + hmac.update(payload).digest('hex'), 'utf8');
                const checksum = Buffer.from(sig, 'utf8');
                if (checksum.length !== digest.length || !Crypto.timingSafeEqual(digest, checksum))
                    return false;
                return true;
            }
        });
    }
}
exports.Validator = Validator;
//# sourceMappingURL=Azure.js.map