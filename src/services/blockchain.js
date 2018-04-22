import {PrivateKey, Transaction, Script, PublicKey, Output, Opcode} from 'bitcore-lib-cash';
import * as pad from 'pad';
import * as bitcore from 'bitcore-lib-cash';
import * as bchaddrjs from 'bchaddrjs';
const backends = [
{host:'https://blockdozer.com/insight-api/',
address:bchaddrjs.toLegacyAddress},
{host:'https://cashexplorer.bitcoin.com/api/',
address:bchaddrjs.toLegacyAddress
},
//{host:'https://bch-insight.bitpay.com/api/', address:toCashAddress}
]
  function toCashAddress(address) {     
    return bchaddrjs.toCashAddress(address).split(':')[1];
  }
class Blockchain {
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
		if (res.status >= 400) {
			throw await res.text();
		}
    return await res.json();
  }
}

export default new Blockchain();
