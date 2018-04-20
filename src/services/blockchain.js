import {PrivateKey, Transaction, Script, PublicKey, Output, Opcode} from 'bitcore-lib-cash';
import * as pad from 'pad';
import * as bitcore from 'bitcore-lib-cash';
class Blockchain {
	async getAddress(address) {
    const res = await fetch(`https://bch-insight.bitpay.com/api/addr/${address}`);
    let addrObj = await res.json();
		return addrObj;
	}
  async getUtxos(address) {
    const utxo_res = await fetch(`https://bch-insight.bitpay.com/api/addr/${address}/utxo`);
    let utxos = await utxo_res.json();
    var toRemove = [];
    for (var utxo of utxos) {
    	let tx = await (await fetch('https://bch-insight.bitpay.com/api/tx/'+utxo.txid)).json();
    	toRemove = toRemove.concat(tx.vin);
    }
    utxos = utxos.filter(utxo=>!toRemove.find(remove=>utxo.txid==remove.txid&&utxo.vout==remove.vout));
    return utxos;
  }
  async getTx(txid) {
    return await (await fetch(`https://bch-insight.bitpay.com/api/tx/${txid}`)).json();
  }
  async broadcast(transaction) {
//		console.log('broadcasting ', transaction.toString());
//		return {};
    var res = await fetch(`https://bch-insight.bitpay.com/api/tx/send`, {
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
