import { Buffer } from 'buffer';
import crypto from 'crypto';
import { SecretKey } from '@env'


export function decryption(encrypted) {
    //console.log('복호화')
    var newKey = Buffer([0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0]);
    var secretKey = Buffer(SecretKey);
    for (var i = 0; i < secretKey.length; i++) newKey[i % 16] ^= secretKey[i];
    //console.log(newKey)

    var dc = crypto.createDecipheriv("aes-128-ecb", newKey, "");
    var decrypted = dc.update(encrypted, 'hex', 'utf8') + dc.final('utf8');
    //console.log('복호화 전 : ', encrypted)
    //console.log('복호화 후 : ', decrypted);

    return decrypted
}


