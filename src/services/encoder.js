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
	dataScripts(publicKey, hexString) {
		return [this.sendToTopicOld(publicKey, hexString)];
	}
	opReturnScripts(publicKey, hexString) {
    if (hexString.length>80*2*3) throw 'message is too long';
    var chunks = hexString.length==0?[]:hexString.match(/.{1,140}/g);
    var dataouts = chunks.map(chunk=>{
      return Script.buildDataOut(chunk, 'hex');
    });
		return dataouts;
	}
	sendToTopicScripts(adminPublicKey, topic, hexString) {
try{
		var outs = this.dataScripts(adminPublicKey, hexString);
    console.log('adminPublicKey:', adminPublicKey.toString());
    var hashOutScript = this.sendToTopicScriptHashOut(adminPublicKey, topic);

    return outs.concat([hashOutScript]);
}catch(e) {
console.trace(e);
throw e;
}
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
	extractMessagesFromTxOpReturn(address, tx) {
    var messageScripts = tx.vout.map(o=>{return {tx:tx, script:Script.fromHex(o.scriptPubKey.hex)}})
      .filter(({script})=>script.isDataOut());
    var bufs = messageScripts.map((message)=> {
      return message.script.getData();
    });
		var buf = Buffer.concat(bufs);
    return [Object.assign({body:buf.toString('utf8')}, {tx:tx})];
	}
	extractMessagesFromTx(address, tx) {
    var messageScripts = tx.vout.map(o=>{return {tx:tx, script:Script.fromHex(o.scriptPubKey.hex)}})
      .filter(({script})=>{
				if (script.chunks.length<5) return;
        if (script.chunks[0].opcodenum!=Opcode.OP_1) return;
				if (script.chunks[1].buf.equals(script.chunks[2].buf)) return;
				if (address&&new Address(new PublicKey(script.chunks[script.chunks.length-3].buf)).toCashAddress(true)!=address) return;
        if (script.chunks[script.chunks.length-2].opcodenum!=Opcode.OP_1+script.chunks.length-4) return;
        if (script.chunks[script.chunks.length-1].opcodenum!=Opcode.OP_CHECKMULTISIG) return;
        return true;
      });
    var messages = messageScripts.map((message)=> {
      var bufs = message.script.chunks.slice(1,message.script.chunks.length-3).map(chunk=>{
				var buf = chunk.buf.slice(2);
      if (buf[buf.length-1]==0) {
        var index;
        for (index=buf.length-1;index>=0;index--) {
          if (buf[index]!=0) break;
        }
        buf = buf.slice(0, index+1);
      }
			return buf;
			});
			var buf = Buffer.concat(bufs);
      return Object.assign({body:buf.toString('utf8')}, message);
    });
		messages = messages.filter(message=>message.body.slice(0,2)!='//');
		return messages;
	}

}

export default new TransactionEncoder();
