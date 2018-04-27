<template>
  <q-page padding row items-start>
<q-toolbar color="secondary">
  <q-toolbar-title>
   Messages 
  </q-toolbar-title>
  <q-btn label="Refresh" @click="loadMessages"/>
  <q-btn label="Follow" @click="follow" v-if='!isSelf'/>
</q-toolbar>
<q-card>
  <compose/>
</q-card>
<q-item v-if='loading'>
<q-card-title>
<q-spinner />
Loading...
</q-card-title>
</q-item>
<q-card v-if='messages.length==0'>
No messages.
</q-card>
<div  v-for='message of messages' :key="message.tx.txid">
<message :names='names' :message='message'>
</message>
</div>
    <br/>
  </q-page>
</template>

<style>
</style>

<script>
import {PrivateKey, Transaction, Script, PublicKey, Output, Opcode, Address} from 'bitcore-lib-cash';
import keystore from '../services/keystore';
import blockchain from '../services/blockchain';
import transactionEncoder from '../services/encoder';
import messageStore,{combineLatestOfAll} from '../services/messagestore';
import Compose from 'components/compose';
import Message from 'components/message';
import * as lodash from 'lodash';
import {Notify} from 'quasar';
import {Observable} from 'rxjs/Observable';
export default {
  name: 'PageMessages',
	subscriptions() {
    var messages$ = messageStore.messages$.share();
		return {
			messages: messages$.merge(Observable.of([])),
			loading: messageStore.messagesLoading$,
			isSelf: messageStore.address$.map(address=>keystore.getAddress()==address),
			names: messages$.switchMap(messages=>{
      var addresses = lodash.uniq(lodash.map(messages, mess=>mess.tx.vin[0].addr));
			return combineLatestOfAll(addresses.map(address=>messageStore.getName$(address)), (names, added)=>Object.assign(names,added), {});
			}).merge(Observable.of({}))
		};
	},
  components: {
    Compose,
		Message
  },
  filters:{
    isSetNameType(tx) {
      if (tx.vout.length<2) return false;
      return tx.vout[1].scriptPubKey.addresses.join(',')=='qz7k64lwfej7kyewp8d0gna8pdqq7vdgvcqvtdt55x';
    }
  },
  data(){
    return {
//      names: {},
//      messages: [],
//      isSelf: false
    }
  },
  watch: {
    $route(to, from) {
      this.loadMessages();
    }
  },
  async mounted() {
    this.loadMessages();
  },
  methods: {
		async loadMessages() {
    var address = this.$route.params.idOrName||keystore.getAddress();
		messageStore.address$.next(address);
    },
    async follow() {
      try {
      var transaction = await messageStore.follow(this.$route.params.idOrName);
      console.log(transaction.toString());
      var result = await blockchain.broadcast(transaction);

      Notify.create({message:'Followed', type:'positive'})
      }catch(e) {
console.trace(e);
      Notify.create({message:e, type:'negative'});
      }
    }
  }
}
</script>
<style>
</style>
