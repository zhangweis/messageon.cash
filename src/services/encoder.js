import {PrivateKey, Transaction, Script, PublicKey, Output, Opcode} from 'bitcore-lib-cash';
import * as forceArray from 'force-array';
import * as pad from 'pad';
import * as bitcore from 'bitcore-lib-cash';
import * as binstring from 'binstring';
class TransactionEncoder {
  toHex(str) {
			return binstring(str, {in:'utf8', out:'hex'});
  }
  encodeString(publicKey, string) {
    return this.encodeHexString(publicKey, this.toHex(string));
  }
  encodeHexString(publicKey, hexString) {
    if (hexString.length>30*2*6) throw 'message is too long';
    var chunks = hexString.length==0?[]:hexString.match(/.{1,62}/g);
    var publicKeys = chunks.map(chunk=>{
      for (var i = 0; i<256; i++) {
    var encoded = '02'+(i<16?'0':'')+i.toString(16)+chunk;
    encoded = pad(encoded, 66, '0');
    console.log(encoded);
          try {
      return new PublicKey(encoded);
        }catch(e){}
      }
      throw 'cannot encode ' + hexString;
    });
    var publicKeys = publicKeys.concat(forceArray(publicKey)); 
    var script = Script.buildMultisigOut(publicKeys,1);
    console.log(script.toString())
    return script;
  }
}

export default new TransactionEncoder();
