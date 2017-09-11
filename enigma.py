import base64
import hashlib
from Crypto import Random
from Crypto.Cipher import AES

class Enigma(object):

    @staticmethod
    def encrypt(raw, key = '</m0nkfr0m3@rth></m0nkfr0m3@rth>'):
        key = hashlib.sha256(key.encode()).digest()
        raw = Enigma._pad(32, raw)
        iv = Random.new().read(AES.block_size)
        cipher = AES.new(key, AES.MODE_CBC, iv)
        return base64.b64encode(iv + cipher.encrypt(raw))

    @staticmethod
    def decrypt(enc, key = '</m0nkfr0m3@rth></m0nkfr0m3@rth>'):
        key = hashlib.sha256(key.encode()).digest()
        enc = base64.b64decode(enc)
        iv = enc[:AES.block_size]
        cipher = AES.new(key, AES.MODE_CBC, iv)
        return Enigma._unpad(cipher.decrypt(enc[AES.block_size:])).decode('utf-8')

    @staticmethod
    def _pad(bs, s):
        return s + (bs - len(s) % bs) * chr(bs - len(s) % bs)

    @staticmethod
    def _unpad(s):
        return s[:-ord(s[len(s)-1:])]