// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-nocheck

import { AppName } from "@/App/config";
import { decodeJsonBtoa, encodeJsonBtoa } from "..";

export { simpleSecretKey } from './keys'

export const CryptoJs = () => window?.WindowCrypto?.__CryptoJS__;

export const SIMPLE_KEY = AppName;

export function getDeviceId(num:number) {
  const o = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  const t = [] as string[];
  for (var r = 0; r < num; r++){
    t.push(o.charAt(Math.floor(62 * Math.random())));
  }
  return t.join('');
}

export function convertFromHex(hex) {
  var hex = hex.toString();//force conversion
  var str = '';
  for (var i = 0; i < hex.length; i += 2)
      str += String.fromCharCode(parseInt(hex.substr(i, 2), 16));
  return str;
}

export function convertToHex(str) {
  var hex = '';
  for(var i=0;i<str.length;i++) {
      hex += ''+str.charCodeAt(i).toString(16);
  }
  return hex;
}


export function cryptoEncrypt(obj: object, key?: string) {
  const message = JSON.stringify(obj);
  const cipherText = CryptoJs().DES.encrypt(message, key || SIMPLE_KEY).toString(
    CryptoJs().format.OpenSSL
  );
  const cipherTextEncode = encodeJsonBtoa({ text: cipherText });
  return cipherTextEncode;
}

export function cryptoDecrypt(cipherTextEncode: string, key?: string) {
  var cipherText = decodeJsonBtoa(cipherTextEncode)?.text;
  var plaintext = CryptoJs().DES.decrypt(cipherText, key || SIMPLE_KEY);
  return JSON.parse(plaintext.toString(CryptoJs().enc.Utf8));
}

export function generateHash(){
  const CryptoJS = CryptoJs();
  return CryptoJS.enc.Hex.stringify(CryptoJS.lib.WordArray.random(16));
}

/**
 * Encryption class for encrypt/decrypt that works between programming languages.
 *
 * @author Vee Winch.
 */
class Encryption {
  get __CryptoJS__() {
    return CryptoJs()
  }
  /**
   * @var integer Return encrypt method or Cipher method number. (128, 192, 256)
   */
  get encryptMethodLength() {
    var encryptMethod = this.encryptMethod
    // get only number from string.
    var aesNumber = encryptMethod.match(/\d+/)?.[0]
    return parseInt(aesNumber)
  }

  /**
   * @var integer Return cipher method divide by 8. example: AES number 256 will be 256/8 = 32.
   */
  get encryptKeySize() {
    var aesNumber = this.encryptMethodLength
    return parseInt(`${aesNumber / 8}`)
  }

  /**
   * @var string Cipher method.
   *              Recommended AES-128-CBC, AES-192-CBC, AES-256-CBC
   *              due to there is no `openssl_cipher_iv_length()` function in JavaScript
   *              and all of these methods are known as 16 in iv_length.
   */
  get encryptMethod() {
    return "AES-256-CBC"
  }

  /**
   * Decrypt string.
   *
   * @param string encryptedString The encrypted string to be decrypt.
   * @param string key The key.
   * @return string Return decrypted string.
   */
  decrypt(encryptedString, key) {
    const CryptoJS = this.__CryptoJS__
    var json = JSON.parse(
      CryptoJS.enc.Utf8.stringify(CryptoJS.enc.Base64.parse(encryptedString))
    )

    var salt = CryptoJS.enc.Hex.parse(json.salt)
    var iv = CryptoJS.enc.Hex.parse(json.iv)

    var encrypted = json.ciphertext // no need to base64 decode.

    var iterations = parseInt(json.iterations)
    if (iterations <= 0) {
      iterations = 999
    }
    var encryptMethodLength = this.encryptMethodLength / 4 // example: AES number is 256 / 4 = 64
    var hashKey = CryptoJS.PBKDF2(key, salt, {
      hasher: CryptoJS.algo.SHA512,
      keySize: encryptMethodLength / 8,
      iterations: iterations
    })

    var decrypted = CryptoJS.AES.decrypt(encrypted, hashKey, {
      mode: CryptoJS.mode.CBC,
      iv: iv
    })

    return decrypted.toString(CryptoJS.enc.Utf8)
  }

  /**
   * Encrypt string.
   *
   * @param string string The original string to be encrypt.
   * @param string key The key.
   * @return string Return encrypted string.
   */
  encrypt(string, key) {
    const CryptoJS = this.__CryptoJS__
    var iv = CryptoJS.lib.WordArray.random(16) // the reason to be 16, please read on `encryptMethod` property.

    var salt = CryptoJS.lib.WordArray.random(256)
    var iterations = 999
    var encryptMethodLength = this.encryptMethodLength / 4 // example: AES number is 256 / 4 = 64
    var hashKey = CryptoJS.PBKDF2(key, salt, {
      hasher: CryptoJS.algo.SHA512,
      keySize: encryptMethodLength / 8,
      iterations: iterations
    })

    var encrypted = CryptoJS.AES.encrypt(string, hashKey, {
      mode: CryptoJS.mode.CBC,
      iv: iv
    })
    var encryptedString = CryptoJS.enc.Base64.stringify(encrypted.ciphertext)

    var output = {
      ciphertext: encryptedString,
      iv: CryptoJS.enc.Hex.stringify(iv),
      salt: CryptoJS.enc.Hex.stringify(salt),
      iterations: iterations
    }

    return CryptoJS.enc.Base64.stringify(
      CryptoJS.enc.Utf8.parse(JSON.stringify(output))
    )
  }
}



export function encryptionCryptoJs(json, key?:string) {
  const encryption = new Encryption()
  const secretKey = key || simpleSecretKey()
  return encryption.encrypt(JSON.stringify(json), secretKey)
}

export function decryptionCryptoJs(encryptedString, key?:string) {
  const encryption = new Encryption()
  const secretKey = key || simpleSecretKey()
  return JSON.parse(encryption.decrypt(encryptedString, secretKey))
}
