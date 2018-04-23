// import something here
import * as moment from 'moment'
// leave the export, even if you don't use it
import VueRx from 'vue-rx'
import { Observable } from 'rxjs/Observable'
import { Subscription } from 'rxjs/Subscription' // Disposable if using RxJS4
import { Subject } from 'rxjs/Subject' // required for domStreams option
import linkify from 'vue-linkify'

export default ({ app, router, Vue }) => {
  // something to do
  Vue.filter('datetime', function(datetime) {
    return moment(datetime*1000).format('MM-DD HH:mm');
  });
	Vue.use(VueRx, {
	  Observable,
	  Subscription,
	  Subject
	});
	Vue.directive('linkified', linkify)
}
