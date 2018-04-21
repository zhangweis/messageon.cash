import {PrivateKey, Transaction, Script, PublicKey, Output, Opcode} from 'bitcore-lib-cash';
import * as pad from 'pad';
import * as bitcore from 'bitcore-lib-cash';
import * as bchaddrjs from 'bchaddrjs';
class Blockchain {
  getUrl(u) {
    return 'https://cashexplorer.bitcoin.com/api/'+u;
  }
  toHostAddress(address) {
return bchaddrjs.toLegacyAddress(address);
    return address;
  }
  async getAddress(addr) {
    var address = this.toHostAddress(addr);
    const res = await fetch(this.getUrl(`addr/${address}`));
    let addrObj = await res.json();
		return addrObj;
	}
  toCashAddress(address) {     
    return bchaddrjs.toCashAddress(address).split(':')[1];
  }
  async getUtxos(addr) {
    var address = this.toHostAddress(addr);
    const utxo_res = await fetch(this.getUrl(`addr/${address}/utxo`));
    let utxos = await utxo_res.json();
    var toRemove = [];
    for (var utxo of utxos) {
      utxo.address = this.toCashAddress(utxo.address);
    	let tx = await (await fetch(this.getUrl('tx/'+utxo.txid))).json();
    	toRemove = toRemove.concat(tx.vin);
    }
    utxos = utxos.filter(utxo=>!toRemove.find(remove=>utxo.txid==remove.txid&&utxo.vout==remove.vout));
    return utxos;
  }
  async getTx(txid) {
    return await (await fetch(this.getUrl(`tx/${txid}`))).json();
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
    return await res.json();
  }
}

export default new Blockchain();
