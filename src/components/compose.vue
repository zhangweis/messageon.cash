<template>
<q-list>
<q-input v-model="message" type="textarea" />
<q-item>
<q-btn right label='Post' @click='sendMessage'/>
</q-item>
</q-list>
</template>
<script>
import {PrivateKey, Transaction, Script, PublicKey, Output, Opcode, Address} from 'bitcore-lib-cash';
import keystore from '../services/keystore';
import blockchain from '../services/blockchain';
import transactionEncoder from '../services/encoder';
import messageStore from '../services/messagestore';
import { Notify } from 'quasar'

export default {
  data(){
    return {
      message: '' 
    }
  },
  methods: {
    async sendMessage() {
    try {
      var message = this.message;
      if (!message) return;
      var transaction = await messageStore.sendMessage(message);
      console.log(transaction.toString());
      var result = await blockchain.broadcast(transaction);
      console.log(result);
			setTimeout(async ()=>{
      this.messages = await messageStore.getMessages(keystore.getAddress()); 
			}, 10*1000);
      Notify.create({
        message:'Sent to blockchain',
        type:'positive'
      });
      this.message = '';
    } catch (e) {
      Notify.create({message:e,
        type: 'negative',
      });
    }
    }
  }
}
</script>

