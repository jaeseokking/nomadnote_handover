import { Buffer } from 'buffer';
import crypto from 'crypto';
import { SecretKey } from '@env'


export function encryption(str) {
    //최초 로그인 및 앱네 저장소에 값이 없는 경우
    if (str == null) {
        return
    }
    //console.log('암호화');
    var newKey = Buffer([0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0]);
    var secretKey = Buffer(SecretKey);
    for (var i = 0; i < secretKey.length; i++) newKey[i % 16] ^= secretKey[i];
    //console.log('newkey : ' ,newKey)
    //console.log(str)

    var c = crypto.createCipheriv("aes-128-ecb", newKey, "");
    var enrypted = c.update(str, 'utf8', 'hex') + c.final('hex');
    //console.log("암호화 전 : ", str)
    //console.log("암호화 후 : ", enrypted);

    return enrypted
}


