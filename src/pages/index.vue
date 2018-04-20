<template>
  <q-page class="flex flex-center">
    Redirecting...
  </q-page>
</template>

<style>
</style>

<script>
import keyStore from '../services/keystore';
export default {
  name: 'PageIndex',
  data(){
    return {
      messages: []
    }
  },
  mounted() {
    this.$router.push({ name: 'messages', params: { idOrName: keyStore.getAddress() }});
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
