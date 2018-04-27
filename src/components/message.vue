<template>
  <single-message :message='message' :names='names||{}'>
      <q-card-actions align="around">
				<div>
        <q-btn flat :color="(likes||{})[address]?'primary':'faded'" icon="fa-thumbs-up" label="Like" @click="toggleLike">
</q-btn><span>{{likes|size}}
<q-tooltip>Click to show names</q-tooltip>
<q-popover @show='loadLikeNames'>
        <div v-for='(name, address) of likeNames'>
	<message-summary :names='likeNames' :message='name'/> 
</div>
</q-popover>
</span>
				</div>
				<div>
        <q-btn flat :color="(comments||[]).length>0?'primary':'faded'" icon="comment" label="Comment" @click='toggleComments'></q-btn>{{(comments||[]).length||''}}
				</div>
        <q-btn flat color="primary" icon="share" />
      </q-card-actions>
      <q-list v-if='commentOpen'>
<q-input v-model="commentMessage" type="textarea" />
<q-item>
<q-btn right label='Post Comment' @click='sendCommentMessage'/>
</q-item>
        <div  v-for='comment of comments' :key="comment.tx.txid">
        <single-message :message='comment' :names = 'commentNames'>
        </single-message>
        </div>
      </q-list>

</single-message>
</template>
<script>
import SingleMessage from './singlemessage';
import messageStore, {combineLatestOfAll} from '../services/messagestore';
import keyStore from '../services/keystore';
import blockchain from '../services/blockchain';
import { Notify } from 'quasar'
import notifyWith from '../services/notifywith'; 
import {Subject} from 'rxjs/Subject';
import * as lodash from 'lodash';
import Person from 'components/person';
import MessageSummary from './messagesummary';
export default {
  components: {
    SingleMessage,
		Person,
		MessageSummary
  },
	filters: {
		size(object) {
			return object?(Object.keys(object).length||''):'';
		}
	},
  props: {
    names:Object,
    message: Object
  },
	subscriptions() {
		this.loadLikes$ = new Subject();
		this.loadLikeNames$ = new Subject();
		this.loadCommentNames$ = new Subject();
		var likes$ = this.$watchAsObservable('message').merge(this.loadLikes$).switchMap(({newValue})=>{
				return messageStore.loadLikes$(this.message.tx);
			});
		var comments$ = this.$watchAsObservable('message').switchMap(({newValue})=>{
				return messageStore.loadComments$(newValue.tx);
			});
		var loadNames = ([likes])=>{
				return combineLatestOfAll(lodash.values(likes).map(like=>messageStore.getName$(like.tx.vin[0].addr)), (acc,name)=>Object.assign(acc, name), {});
			};
		return {
			comments: comments$,
			likes: likes$,
			commentNames: comments$.combineLatest(this.loadCommentNames$).switchMap(loadNames),
			likeNames: likes$.combineLatest(this.loadLikeNames$).switchMap(loadNames)
		};
	},
  data() {
    return {
			address: keyStore.getAddress(),
      commentOpen: false,
//      comments: undefined,
      commentMessage: '',
      comment: {}
    };
  },
  methods: {
		loadLikeNames() {
			this.loadLikeNames$.next(1);
		},
		async toggleLike() {
			notifyWith(async ()=>{
console.log(this.likes, this.likes[this.address]);
			if (this.likes[this.address]) throw 'Sorry, unlike is not implemented';
			var transaction;
			if (this.likes&&this.likes[this.address]) {
//				transaction = messageStore.unlike(this.likes[this.address].tx);
			} else {
				transaction = await messageStore.like(this.message.tx);
			}
console.log(transaction);
      var result = await blockchain.broadcast(transaction);
			this.loadLikes$.next(1);
			});
		},
    async toggleComments() {
      this.commentOpen = !this.commentOpen;
			if (this.commentOpen) this.loadCommentNames$.next();
//      if (this.commentOpen/* && !this.comments*/) {
//        this.comments = await messageStore.loadComments(this.message.tx);
//console.log(this.comments);
//        //load comments
//      }
    },
    async sendCommentMessage() {
    try {
      var message = this.commentMessage;
      if (!message) return;
      var transaction = await messageStore.addComment(this.message, message);
      console.log(transaction.toString());
      var result = await blockchain.broadcast(transaction);
      console.log(result);
      Notify.create({
        message:'Sent to blockchain',
        type:'positive'
      });
      this.commentMessage = '';
    } catch (e) {
console.trace(e)
      Notify.create({message:e,
        type: 'negative',
      });
    }
    }
  }
}
</script>
