import {PrivateKey, Transaction, Script, PublicKey, Output, Opcode, Address} from 'bitcore-lib-cash';
import * as pad from 'pad';
import * as bitcore from 'bitcore-lib-cash';
class Keystore {
  _getPrivateKey() {
    return new PrivateKey(localStorage.privateKey);//'5KE6oYzqN79hVXYD8zAQZFMt8rMGrDF68TX2nSB5C6tGKb9oJQM');
  }
  getPrivateKey() {
    if (!this.privateKey) {
      this.privateKey = this._getPrivateKey();
    }
    return this.privateKey;
  }
  getAddress() {
    return new Address(this.getPrivateKey().toPublicKey()).toCashAddress(true);
  }
}

export default new Keystore();
