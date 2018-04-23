<template>
<q-card class="q-ma-sm">
		<message-summary :names='names' :message='message'/>
    <q-item>
      <q-card-title>
        <div v-html="message.body" v-linkified />
      </q-card-title>
      </q-item>
  <slot/>
</q-card>
</template>
<script>
import Person from './person'
import MessageSummary from './messagesummary';
export default {
  props: {
    names:Object,
    message: Object
  },
	components: {
		Person,
		MessageSummary
	},
  data() {
    return {};
  }
}
</script>
