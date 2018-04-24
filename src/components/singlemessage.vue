<template>
<q-card class="q-ma-sm">
		<message-summary :names='names' :message='message'/>
    <q-item>
      <q-card-title>
        <div v-html="$options.filters.linkify(message.body)" />
      </q-card-title>
      </q-item>
  <slot/>
</q-card>
</template>
<script>
import Person from './person'
import MessageSummary from './messagesummary';
import linkifyStr from 'linkifyjs/string';

export default {
	filters: {
		linkify(str) {
			return linkifyStr(str);
		}
	},
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
