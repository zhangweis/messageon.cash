import {HDPublicKey, Address,Opcode, Script, PublicKey, Transaction, crypto} from 'bitcore-lib-cash';
import keystore from '../services/keystore';
import blockchain from '../services/blockchain';
import transactionEncoder from '../services/encoder';
import * as lodash from 'lodash';
const Commands = {
  messages: 'messages',
  set_name: 'set_name',
	follow: 'follow'
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
		var publicKey = this.nameKey();
		console.log(publicKey.toAddress().toCashAddress(true));
		//todo check whether name is taken
		var address = new Address(transactionEncoder.sendToTopicScriptHashOut(publicKey,'names'));
console.log(address.toCashAddress(true));

		var utxos = await blockchain.getUtxos(address.toCashAddress(true));
		if (utxos.length>0) throw 'name is taken';
		var transaction = await this.txFromScripts(transactionEncoder.sendToTopicScripts(publicKey, 'names', hexString).concat(transactionEncoder.sendToTopicScriptHashOut(myPublicKey, Commands.set_name)));
		return transaction;
	}
	async getName(addr) {
console.log('getName:',addr);
    var publicKey = await this.getPublicKeyOfAddress(addr);
		var address = new Address(transactionEncoder.sendToTopicScriptHashOut(publicKey, Commands.set_name)).toCashAddress(true);
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
      if (!script.isDataOut()) continue;
			var address = new Address(script.chunks[1].buf).toCashAddress(true);
			addresses.push(address);
		}
		return addresses;
	}
	getFollowingAddress(publicKey) {
		var script = transactionEncoder.sendToTopicScriptHashOut(publicKey, Commands.follow);
		return new Address(script).toCashAddress(true);
	}
	async follow(address) {
		var publicKey = keystore.getPrivateKey().toPublicKey();
    var followings = await this.getFollowings(keystore.getAddress());
    if (followings.indexOf(address)>=0) throw 'You are already a follower';
		console.log(this.getFollowingAddress(publicKey))
		return await this.txFromScripts([Script.buildDataOut(new Address(address).toBuffer()), transactionEncoder.sendToTopicScriptHashOut(await this.getPublicKeyOfAddress(address),'followers'), transactionEncoder.sendToTopicScriptHashOut(publicKey, Commands.follow)]);
	}
  async sendMessage(message) {
    console.log('sendMessage');
console.log(1, transactionEncoder.sendToTopicScripts(keystore.getPrivateKey().toPublicKey(), Commands.messages, transactionEncoder.toHex(message)));
console.log(2, transactionEncoder.toHex(message));
    return await this.txFromScripts(transactionEncoder.sendToTopicScripts(keystore.getPrivateKey().toPublicKey(), Commands.messages, transactionEncoder.toHex(message)));
  }
  async txFromScripts(outputScripts) {
    var address = keystore.getAddress();
    var utxos = await blockchain.getUtxos(address);
    const transaction = new Transaction()
    	.feePerKb(1024)
      .from(utxos);
			for (var script of outputScripts) {
console.log('script:', script.toString(), script.getAddressInfo()&&new Address(script).toCashAddress(true));

				transaction.addOutput(Transaction.Output.fromObject({satoshis: script.isDataOut()?0:546, script:script}));
			}
		transaction
    	.change(address)
      .sign(keystore.getPrivateKey());
    return transaction;
  }
  async getMessages(address) {
    var publicKey = await this.getPublicKeyOfAddress(address);
    if (!publicKey) return [];
    console.log(publicKey.toString());
    var messageAddress = new Address(transactionEncoder.sendToTopicScriptHashOut(publicKey, Commands.messages)).toCashAddress(true);
    console.log('messageAddress:',messageAddress);
    var utxos = await blockchain.getUtxos(messageAddress);
		//todo check which utxo to use when multiple utxos exist.
    var ret = [];
    for (var utxo of utxos) {
      var tx = await blockchain.getTx(utxo.txid);
      ret = ret.concat(await this.extractMessagesFromTx(null, tx));
    }
    return ret;
  }
	async getPublicKeyOfAddress(addr) {
    var address = transactionEncoder.toCashAddress(addr);
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
      .filter(({script})=>script.isDataOut());
    var bufs = messageScripts.map((message)=> {
      return message.script.getData();
    });
		var buf = Buffer.concat(bufs);
    return [Object.assign({body:buf.toString('utf8')}, {tx:tx})];
	}
}

export default new MessageStore();
