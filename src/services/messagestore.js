import {HDPublicKey, Address,Opcode, Script, PublicKey, Transaction, crypto} from 'bitcore-lib-cash';
import keystore from '../services/keystore';
import blockchain from '../services/blockchain';
import transactionEncoder from '../services/encoder';
import * as lodash from 'lodash';
import {Observable, ReplaySubject} from 'rxjs'
const Commands = {
  messages: 'messages',
  set_name: 'set_name',
	follow: 'follow'
}
function combineLatestOfAll(observables, projector, seed) {
			return observables.reduce((combined,observable)=>combined.combineLatest(observable,projector), Observable.of(seed));
}
class MessageStore {
	constructor() {
		this.addressPublicKeys = {}
		this.nameCache = {}
		this.address$ = new ReplaySubject(1);
		var followingMessages$ = this.address$.switchMap(address=>this.getFollowings$(address)).switchMap(followings=>{
			var observables = followings.map(following=>this.getMessages$(following));
			return combineLatestOfAll(observables, (all, messagesFromOneFollowing)=>all.concat(messagesFromOneFollowing), []);
			});
		this.messages$ = followingMessages$.combineLatest(this.address$.switchMap(address=>this.getMessages$(address)), (fromFollowings, addressMessages)=>fromFollowings.concat(addressMessages));
	}
	getPublicKeyOfAddress$(address) {
		if (this.addressPublicKeys[address]) return Observable.of(this.addressPublicKeys[address]);
		return this._getPublicKeyOfAddress$(address).do(publicKey=>this.addressPublicKeys[address]=publicKey);
	}
	_getPublicKeyOfAddress$(address) {
		if (keystore.getAddress()==address) return Observable.of(keystore.getPrivateKey().toPublicKey());
		return blockchain.getUtxos$(address).switchMap(utxos=>Observable.fromPromise(this.getPublicKeyOfUtxos(utxos, address)));
	}
	getMessages$(address) {
		return this.getPublicKeyOfAddress$(address).filter(pk=>!!pk).map(publicKey=>{
			return new Address(transactionEncoder.sendToTopicScriptHashOut(publicKey, Commands.messages)).toCashAddress(true)
		}).switchMap(address=>blockchain.getUtxoTxs$(address)).map(utxoTxs=>{
			var ret = utxoTxs.map(utxo=>transactionEncoder.extractMessagesFromTx(null, utxo.tx)).reduce((accum,array)=>accum.concat(array), []);
			return ret;
		}).merge(Observable.of([]));
	}

	nameKey() {
		var root = new HDPublicKey('xpub661MyMwAqRbcFqBHv8ewWjVkBtGKpbsWzVhmpyR536qK45jU1WDn7MyeFMNa8AfpzZmDAa6dnBMDa4uyRk5F9AKA7h24frodQe6P7PWy1iH');
		var publicKey = new PublicKey(root.derive(0).publicKey);
		return publicKey;
	}
	async setName(name) {
		var hexString = transactionEncoder.toHex(name);
		var myPublicKey = keystore.getPrivateKey().toPublicKey();
		var publicKey = this.nameKey();
		var address = new Address(transactionEncoder.sendToTopicScriptHashOut(publicKey,'names'));

		var transaction = await this.txFromScripts(transactionEncoder.sendToTopicScripts(publicKey, 'names', hexString).concat(transactionEncoder.sendToTopicScriptHashOut(myPublicKey, Commands.set_name)));
		var nameAddress = new Address(transaction.outputs[0].script.toScriptHashOut()).toCashAddress(true);
		var utxos = await blockchain.getUtxos(nameAddress);
		if (utxos.length>0) throw 'name is taken';
		return transaction;
	}
	getName$(addr) {
		if (this.nameCache[addr]) return Observable.of(this.nameCache[addr]);
		return this.getPublicKeyOfAddress$(addr).switchMap(publicKey=>{
			var address = new Address(transactionEncoder.sendToTopicScriptHashOut(publicKey, Commands.set_name)).toCashAddress(true);
			return blockchain.getUtxoTxs$(address);
	}).map(utxos=>{
		var messages = utxos.map(utxo=>transactionEncoder.extractMessagesFromTx(null, utxo.tx));	
		var names = lodash.flatten(messages);
		names.sort((n1,n2)=>n1.tx.time-n2.tx.time);
		var ret = {};
		ret[addr]=names.shift();
		return ret;
		}).do(obj=>this.nameCache[addr] = obj);
	}
	getFollowings$(address) {
		return this.getPublicKeyOfAddress$(address).switchMap(publicKey=>{
			var followingAddress = this.getFollowingAddress(publicKey);
			return blockchain.getUtxoTxs$(followingAddress);
		}).map(utxoTxs=>{
			return lodash.flatten(utxoTxs.map(utxo=>{
				var script = Script.fromHex(utxo.tx.vout[0].scriptPubKey.hex);
	      if (!script.isDataOut()) return [];
				var address = new Address(script.chunks[1].buf).toCashAddress(true);
				return [address];
			}));
		});
	}
	getFollowingAddress(publicKey) {
		var script = transactionEncoder.sendToTopicScriptHashOut(publicKey, Commands.follow);
		return new Address(script).toCashAddress(true);
	}
	async follow(address) {
		var publicKey = keystore.getPrivateKey().toPublicKey();
    var followings = await this.getFollowings$(keystore.getAddress()).toPromise();
    if (followings.indexOf(address)>=0) throw 'You are already a follower';
		return await this.txFromScripts([Script.buildDataOut(new Address(address).toBuffer()), transactionEncoder.sendToTopicScriptHashOut(await this.getPublicKeyOfAddress(address),'followers'), transactionEncoder.sendToTopicScriptHashOut(publicKey, Commands.follow)]);
	}
  async sendMessage(message) {
    return await this.txFromScripts(transactionEncoder.sendToTopicScripts(keystore.getPrivateKey().toPublicKey(), Commands.messages, transactionEncoder.toHex(message)));
  }
	async addComment(message, comment) {
    return await this.txFromScripts(transactionEncoder.sendToTopicScripts(await this.getPublicKeyOfAddress(message.tx.vin[0].addr), message.tx.txid, transactionEncoder.toHex(comment)));
	}
	async like(tx) {
		var publicKey = await this.getPublicKeyOfAddress(tx.vin[0].addr);
		return await this.txFromScripts([transactionEncoder.sendToTopicScriptHashOut(publicKey, tx.txid+'likes')]);
	}
	async unlike(tx) {
		return 
	}
	loadLikes$(tx) {
		return this.getPublicKeyOfAddress$(tx.vin[0].addr).switchMap(publicKey=>{
		var address = new Address(transactionEncoder.sendToTopicScriptHashOut(publicKey, tx.txid+'likes')).toCashAddress(true);
		return blockchain.getUtxoTxs$(address);
		}).map(utxoTxs=>lodash.keyBy(utxoTxs, utxoTx=>utxoTx.tx.vin[0].addr));
	}
	loadComments$(tx) {
		return this.getPublicKeyOfAddress$(tx.vin[0].addr).switchMap(publicKey=>{
		var address = new Address(transactionEncoder.sendToTopicScriptHashOut(publicKey, tx.txid)).toCashAddress(true);
		return blockchain.getUtxoTxs$(address);
		}).map(utxoTxs=>{
			var ret = utxoTxs.map(utxo=>transactionEncoder.extractMessagesFromTx(null, utxo.tx)).reduce((accum,array)=>accum.concat(array), []);
			return ret;
		});
	}
	async loadComments(tx) {
		var publicKey = await this.getPublicKeyOfAddress(tx.vin[0].addr);
		var address = new Address(transactionEncoder.sendToTopicScriptHashOut(publicKey, tx.txid)).toCashAddress(true);
		var utxos = await blockchain.getUtxoTxs(address);
		var messages = lodash.flatten(utxos.map(utxo=>transactionEncoder.extractMessagesFromTx(null, utxo.tx)));
		return messages;
	}
  async txFromScripts(outputScripts) {
    var address = keystore.getAddress();
    var utxos = await blockchain.getUtxos(address);
    const transaction = new Transaction()
    	.feePerKb(1024)
      .from(utxos);
			for (var script of outputScripts) {
console.log('script:', script.toString(), script.getAddressInfo()&&new Address(script).toCashAddress(true));
				var outValue = 546;
				if (script.isDataOut()) outValue = 0;
				if (script.chunks[script.chunks.length-1].opcodenum==Opcode.OP_CHECKMULTISIG) outValue=900;
				transaction.addOutput(Transaction.Output.fromObject({satoshis: outValue, script:script}));
			}
		transaction
    	.change(address)
      .sign(keystore.getPrivateKey());
    return transaction;
  }
	async getPublicKeyOfAddress(addr) {
		return this.getPublicKeyOfAddress$(addr).toPromise();
	}
	async getPublicKeyOfUtxos(utxos, address) {
		for (var utxo of utxos) {
			var tx = await blockchain.getTx(utxo.txid);
			for (var vin of tx.vin) {
				var script = Script.fromHex(vin.scriptSig.hex);
				if (script.chunks.length==2) {
					if (script.chunks[1].buf.length==33||script.chunks[1].buf.length==65) {
						try {
							var pk = new PublicKey(script.chunks[1].buf);
							if (pk.toAddress().toCashAddress(true)==address) return pk;
						} catch(e) {}
					}
				}
			}
		}
	}
  async getMessagesFromTx(address, tx, depth=1) {
    if (tx.vin[0].addr!=address||depth<=0) return [];
		var messages = transactionEncoder.extractMessagesFromTx(address, tx);
		return messages.concat(await this.getMessagesFromTx(address, await blockchain.getTx(tx.vin[0].txid), depth - 1));
  }
}

export default new MessageStore();
export {combineLatestOfAll};
