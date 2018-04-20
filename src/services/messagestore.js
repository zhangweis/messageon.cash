import {HDPublicKey, Address,Opcode, Script, PublicKey, Transaction, crypto} from 'bitcore-lib-cash';
import keystore from '../services/keystore';
import blockchain from '../services/blockchain';
import transactionEncoder from '../services/encoder';
const Commands = {
	set_name: transactionEncoder.toHex('//set_name'),
	follow: transactionEncoder.toHex('//follow')
}
class MessageStore {
	nameKey() {
		var root = new HDPublicKey('xpub661MyMwAqRbcFqBHv8ewWjVkBtGKpbsWzVhmpyR536qK45jU1WDn7MyeFMNa8AfpzZmDAa6dnBMDa4uyRk5F9AKA7h24frodQe6P7PWy1iH');
		var publicKey = new PublicKey(root.derive(0).publicKey);
		return publicKey;
	}
	async setName(name) {
		var hexString = transactionEncoder.toHex(name);
		var myPublicKey = keystore.getPrivateKey().toPublicKey();
		var hashed = crypto.Hash.sha256ripemd160(Buffer.from(hexString,'hex'));
		var slot = hashed.readUIntLE(0, 4) && 0x7fffffff;
		console.log(slot);
		var publicKey = this.nameKey();
		console.log(publicKey.toAddress().toCashAddress(true));
		//todo check whether name taken
		var transaction = await this.generateMessageTransaction({hexString, publicKey, additionsScripts:[Script.buildPublicKeyHashOut(publicKey), transactionEncoder.encodeHexString([myPublicKey], Commands.set_name).toScriptHashOut()]});
		var address = new Address(transaction.outputs[0].script.toScriptHashOut());
console.log(address.toCashAddress(true));

console.log(new Address(transaction.outputs[2].script.toScriptHashOut()).toCashAddress(true));

		var utxos = await blockchain.getUtxos(address.toCashAddress(true));
		if (utxos.length>0) throw 'name is taken';
		return transaction;
	}
	async getName(addr) {
		var publicKey = await this.getPublicKeyOfAddress(addr);
		var address = new Address(transactionEncoder.encodeHexString([publicKey], Commands.set_name).toScriptHashOut()).toCashAddress(true);
		var utxos = await blockchain.getUtxos(address);
		var names = [];
		for (var utxo of utxos) {
			var tx = await blockchain.getTx(utxo.txid);
			var messages = this.extractMessagesFromTx(null, tx);
			names = names.concat(messages);
		}
		names.sort((n1,n2)=>n1.tx.time-n2.tx.time);
		console.log(names);
		return names.shift();
	}
	async getFollowings(address) {
		var publicKey = await this.getPublicKeyOfAddress(address);
		var followingAddress = this.getFollowingAddress(publicKey);
		var utxos = await blockchain.getUtxos(followingAddress);
		var addresses = [];
		for (var utxo of utxos) {
			var tx = await blockchain.getTx(utxo.txid);
			var script = Script.fromHex(tx.vout[0].scriptPubKey.hex);
			var publicKey = new PublicKey(script.chunks[1].buf);
			var address = new Address(publicKey).toCashAddress(true);
			addresses.push(address);
		}
		return addresses;
	}
	getFollowingAddress(publicKey) {
		var script = transactionEncoder.encodeHexString([publicKey], Commands.follow);
		return Address.fromScriptHash(crypto.Hash.sha256ripemd160(script.toBuffer())).toCashAddress(true);
	}
	async follow(address) {
		var publicKey = keystore.getPrivateKey().toPublicKey();
    var followings = this.getFollowings(keystore.getAddress());
    if (followings.indexOf(address)>=0) throw 'You are already a follower';
		console.log(this.getFollowingAddress(publicKey))
		return this.generateMessageTransaction({hexString:'',publicKey:await this.getPublicKeyOfAddress(address), additionsScripts:[transactionEncoder.encodeHexString(publicKey, Commands.follow)]});
	}
	async generateMessageTransaction({hexString, publicKey, additionsScripts}) {
    const privateKey = keystore.getPrivateKey()
    var address = keystore.getAddress();
    var utxos = await blockchain.getUtxos(address);
    var script1 = transactionEncoder.encodeHexString(publicKey, hexString);
		var outputScripts = [script1].concat(additionsScripts||[]);
    const transaction = new Transaction()
    	.feePerKb(1024)
      .from(utxos);
			for (var script of outputScripts) {
				transaction.addOutput(Transaction.Output.fromObject({satoshis: 900, script:script}));
			}
		transaction
    	.change(address)
      .sign(privateKey);
    return transaction;
  }
  async getMessages(address) {
    var utxos = await blockchain.getUtxos(address);
		//todo check which utxo to use when multiple utxos exist.
		if (utxos.length==0) return [];
    var tx = await blockchain.getTx(utxos[0].txid);
    return await this.getMessagesFromTx(address, tx, 10);
  }
	async getPublicKeyOfAddress(address) {
		if (keystore.getAddress()==address) return keystore.getPrivateKey().toPublicKey();
		var utxos = await blockchain.getUtxos(address);
		for (var utxo of utxos) {
			var tx = await blockchain.getTx(utxo.txid);
			for (var vin of tx.vin) {
				var script = Script.fromHex(vin.scriptSig.hex);
				if (script.chunks.length==2) {
					if (script.chunks[1].buf.length==33||script.chunks[1].buf.length==65) {
						try {
							var pk = new PublicKey(script.chunks[1].buf);
							console.log(pk.toAddress().toCashAddress(true));
							if (pk.toAddress().toCashAddress(true)==address) return pk;
						} catch(e) {}
					}
				}
			}
		}
	}
  async getMessagesFromTx(address, tx, depth=1) {
    if (tx.vin[0].addr!=address||depth<=0) return [];
		var messages = this.extractMessagesFromTx(address, tx);
		return messages.concat(await this.getMessagesFromTx(address, await blockchain.getTx(tx.vin[0].txid), depth - 1));
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

export default new MessageStore();
