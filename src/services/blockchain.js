import {PrivateKey, Transaction, Script, PublicKey, Output, Opcode} from 'bitcore-lib-cash';
import * as pad from 'pad';
import * as bitcore from 'bitcore-lib-cash';
import * as bchaddrjs from 'bchaddrjs';
import {Observable} from 'rxjs/Observable';
import * as lodash from 'lodash';
//import PouchDB from 'pouchdb';
const backends = [
{host:'https://blockdozer.com/insight-api/',address:bchaddrjs.toLegacyAddress},
{host:'https://cashexplorer.bitcoin.com/api/',address:bchaddrjs.toLegacyAddress},
{host:'https://bitcoincash.blockexplorer.com/api/',address:bchaddrjs.toLegacyAddress},
{host:'https://bch-bitcore2.trezor.io/api/',address:bchaddrjs.toLegacyAddress},
  //{host:'https://bch-insight.bitpay.com/api/', address:toCashAddress}
]
  function toCashAddress(address) {     
    return bchaddrjs.toCashAddress(address).split(':')[1];
  }
class Blockchain {
	constructor() {
		this.utxoThrottles = {};
//console.log(PouchDB);
//this.pouchdb = new PouchDB('txs');
	}

	getBackend() {
		var backend = backends[Math.floor(Math.random()*backends.length)];
		return {
			getUrl(u) {return backend.host+u},
			toHostAddress(address) {
				return backend.address(address);
			}
		}
	}
  async getAddress(addr) {
		var backend = this.getBackend();
    var address = backend.toHostAddress(addr);
    const res = await fetch(backend.getUrl(`addr/${address}`));
    let addrObj = await res.json();
		return addrObj;
	}
	getUtxoTxs$(addr) {
		return this.getUtxos$(addr).switchMap(utxos=>Observable.fromPromise(this._loadUtxoTxs(utxos)));
	}
	getUtxos$(addr) {
		if (!this.utxoThrottles[addr]) 
		this.utxoThrottles[addr]=
		lodash.throttle((addr)=>{
		var localStorageUtxos$ = Observable.empty();
		try {
			localStorageUtxos$ = Observable.of(JSON.parse(localStorage['utxos_'+addr]));
		} catch(e) {}
		return Observable.fromPromise(this.getUtxos(addr)).do(utxos=>localStorage['utxos_'+addr]=JSON.stringify(utxos)).merge(localStorageUtxos$);}, 10*1000, {trailing:false});
		return this.utxoThrottles[addr](addr);
	}
	async getUtxoTxs(addr) {
		var utxos = await this.getUtxos(addr);
		return await this._loadUtxoTxs(utxos);
	}
	async _loadUtxoTxs(utxos) {
		for (var utxo of utxos) {
			utxo.tx = await this.getTx(utxo.txid);
		}
		return utxos;
	}
	getUrl(u) {
		return this.getBackend().getUrl(u);
	}
  async getUtxos(addr) {
		var backend = this.getBackend();
    var address = backend.toHostAddress(addr);
    const utxo_res = await fetch(backend.getUrl(`addr/${address}/utxo`));
    let utxos = await utxo_res.json();
    var toRemove = [];
    for (var utxo of utxos) {
      utxo.address = toCashAddress(utxo.address);
    	let tx = await this.getTx(utxo.txid);
    	toRemove = toRemove.concat(tx.vin);
    }
    utxos = utxos.filter(utxo=>!toRemove.find(remove=>utxo.txid==remove.txid&&utxo.vout==remove.vout));
    return utxos;
  }
	transformTxAddress(tx) {
		tx.vin.forEach(vin=>vin.addr = toCashAddress(vin.addr));
		return tx;
	}
  async getTx(txid) {
		try{
		  return JSON.parse(localStorage['tx_'+txid]); //await this.pouchdb.get(txid);
		}catch(e) {
    var tx = await (await fetch(this.getUrl(`tx/${txid}`))).json();
		var ret = this.transformTxAddress(tx);
//		ret._id = ret.txid;
//		await this.pouchdb.put(ret);
		localStorage['tx_'+txid]=JSON.stringify(ret);
		return ret;
		}
  }
  async broadcast(transaction) {
    if (localStorage.debug) {
    		console.log('broadcasting ', transaction.toString());
    		return {};
    }
    var res = await fetch(this.getUrl(`tx/send`), {
      body: JSON.stringify({rawtx:transaction.toString()}),
      method: 'POST',
      headers: {
        'content-type': 'application/json'
      }
    });
		if (res.status >= 400) {
			throw await res.text();
		}
    return await res.json();
  }
}

export default new Blockchain();
