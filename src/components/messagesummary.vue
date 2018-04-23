<template>
    <q-item multiline>
      <q-item-side avatar="statics/boy-avatar.png">
      </q-item-side>
        <q-item-main>
          <q-item-tile label>
<person :names='names' :address='message.tx.vin[0].addr'/>
</q-item-tile>
          <q-item-tile sublabel lines="2">
 <a :href="'https://bch-insight.bitpay.com/#/tx/'+message.tx.txid">
    {{message.tx.time|datetime}}
</a>

</q-item-tile>
        </q-item-main>
    </q-item>
</template>
<script>
import Person from './person';
export default {
  components:{
    Person
  },
  props: {
    names: Object,
    message: Object
  }
}
</script>
