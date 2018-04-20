<template>
  <q-page class="flex flex-center">
<q-list>
    <q-item v-for='message of messages' :key="message.tx.txid">
     {{message.tx.vin[0].addr}} | {{message.tx.time|datetime}}<br/>
     {{message.body}} 
    </q-item>
</q-list>
    <br/>
    <button @click='test'>Test</button>
    <button @click='sendMessage'>Post</button>
  </q-page>
</template>

<style>
</style>

<script>
import {PrivateKey, Transaction, Script, PublicKey, Output, Opcode, Address} from 'bitcore-lib-cash';
import keystore from '../services/keystore';
import blockchain from '../services/blockchain';
import transactionEncoder from '../services/encoder';
import messageStore from '../services/messagestore';
export default {
  name: 'PageIndex',
  data(){
    return {
      messages: []
    }
  },
  methods: {
    async sendMessage() {
      var message = prompt('Message', '');
      if (message==undefined) return;
console.log(keystore.getPrivateKey().toPublicKey())
      var transaction = await messageStore.generateMessageTransaction({hexString:transactionEncoder.toHex(message), publickKey:keystore.getPrivateKey().toPublicKey()});
      console.log(transaction.toString());
/*
      var result = await blockchain.broadcast(transaction);
      console.log(result);
			setTimeout(()=>{
      this.messages = await messageStore.getMessages(keystore.getAddress()); 
			}, 5*1000);
*/
    },
		async test() {
      this.messages = await messageStore.getMessages(keystore.getAddress());
      console.log(this.messages);
      
    }
  }
}
</script>
