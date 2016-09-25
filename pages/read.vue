<template>
 read
</template>
<script>
import utils from '../src/utils.js'
import threadLoader from '../src/thread_loader.js'
import threadParser from '../src/thread_parse.js'

export default {
    data() {
        return {
            posts: [],
            bbs: '',
            key: '',
            selector: []
        }
    },
    methods: {
        loadThread() {
            this.bbs = this.$route.params.bbs;
            this.key = this.$route.params.key;
            this.selector = utils.parseSelector(this.$route.params.selector || '', 100);

            threadLoader.getThread(this.bbs, this.key).then(thread => {
                let parsedThread = threadParser.parseThread(thread.content);
                console.log(parsedThread);
            }).catch(error => {
                console.error(error);
            });
        }
    },
    watch: {
        '$route': 'loadThread'
    },
    created() {
        this.loadThread();
    }
}
</script>




<style scoped></style>
