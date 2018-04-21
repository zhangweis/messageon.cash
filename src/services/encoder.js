import {PrivateKey, Transaction, Script, PublicKey, Output, Opcode, crypto} from 'bitcore-lib-cash';
import * as forceArray from 'force-array';
import * as pad from 'pad';
import * as bitcore from 'bitcore-lib-cash';
import * as binstring from 'binstring';
import * as bchaddrjs from 'bchaddrjs';
class TransactionEncoder {
  addressEqual(a1, a2) {
    return bchaddrjs.toCashAddress(a1) == bchaddrjs.toCashAddress(a2);
  }
  toCashAddress(address) {
    return bchaddrjs.toCashAddress(address).split(':')[1];
  }
  toHex(str) {
			return binstring(str, {in:'utf8', out:'hex'});
  }
  encodeString(publicKey, string) {
    return this.sendToTopic(publicKey, this.toHex(string));
  }
  sendToTopicScripts(adminPublicKey, topic, hexString) {
    if (hexString.length>80*2*3) throw 'message is too long';
    var chunks = hexString.length==0?[]:hexString.match(/.{1,160}/g);
    var dataouts = chunks.map(chunk=>{
      return Script.buildDataOut(chunk, 'hex');
    });
    console.log('adminPublicKey:', adminPublicKey.toString());
    var hashOutScript = this.sendToTopicScriptHashOut(adminPublicKey, topic);

    return dataouts.concat([hashOutScript]);
  }
  _sendToTopicScript(adminPublicKey, topic) {
    var dataAndDrop = Script()
      .add(crypto.Hash.sha256ripemd160(Buffer.from(this.toHex(topic||'<empty>'), "hex")))
      .add(Opcode.OP_DROP)                 // add an opcode object
      .add(Script.buildPublicKeyHashOut(adminPublicKey));
    return dataAndDrop;
  }

  sendToTopicScriptHashOut(publicKey, topic) {
    return this._sendToTopicScript(publicKey, topic).toScriptHashOut();
  }
  sendToTopicOld(publicKey, hexString) {
    if (hexString.length>30*2*6) throw 'message is too long';
    var chunks = hexString.length==0?[]:hexString.match(/.{1,62}/g);
    var publicKeys = chunks.map(chunk=>{
      for (var i = 0; i<256; i++) {
    var encoded = '02'+(i<16?'0':'')+i.toString(16)+chunk;
    encoded = pad(encoded, 66, '0');
    console.log(encoded);
          try {
      return new PublicKey(encoded)//PublicKey.fromPoint(new PublicKey(encoded).point, false);
        }catch(e){}
      }
      throw 'cannot encode ' + hexString;
    });
    var publicKeys = publicKeys.concat(forceArray(publicKey)); 
    var script = Script.buildMultisigOut(publicKeys,1, {noSorting:true});
    console.log(script.toString())
    return script;
  }
}

export default new TransactionEncoder();
