<template>
<div class="mdl-layout mdl-js-layout mdl-layout--fixed-header">
    <header class="mdl-layout__header">
        <div class="mdl-layout__header-row">
            <span class="mdl-layout-title">{{ title || '2ch Viewer'}}</span>
            <div class="mdl-layout-spacer"></div>
            <nav class="mdl-navigation mdl-layout--large-screen-only">
                <a class="mdl-navigation__link" v-for="key in toolbar" v-link="{ path: toolbar_all[key].path || '#' }" @click.prevent="clickToolbar(key)">{{ toolbar_all[key].name }}</a>
            </nav>
        </div>
    </header>
    <div class="mdl-layout__drawer">
        <span class="mdl-layout-title">2ch Viewer</span>
        <nav class="mdl-navigation">
            <a class="mdl-navigation__link" v-for="key in toolbar" href="#" @click.prevent="clickToolbar(key)">{{ toolbar_all[key].name }}</a>
        </nav>
        <hr />
        <nav class="mdl-navigation">
            <a class="mdl-navigation__link" v-for="item in menu" href="#" @click.prevent="clickMenu(item.key)">{{ item.name }}</a>
        </nav>
    </div>
    <router-view></router-view>
    <div class="mdl-layout__floating">
        <span v-show="is_fab_open">
            <mdl-button mini-fab colored v-mdl-ripple-effect v-for="key in toolbar" v-if="toolbar_all[key].button" @click="clickFab(key)" :id="'fab-' + key" >
                <i class="material-icons">{{ toolbar_all[key].button }}</i>
            </mdl-button>
            <mdl-tooltip class="mdl-tooltip--left" v-for="key in toolbar" v-if="toolbar_all[key].button" :for="'fab-' + key">{{ toolbar_all[key].name }}</mdl-tooltip>
        </span>
        <mdl-button fab colored v-mdl-ripple-effect @click="is_fab_open=!is_fab_open">
            <i class="material-icons" :class="{ open: is_fab_open }">add</i>
        </mdl-button>
    </div>
</div>
</template>
<script>
export default {
    data() {
        let _this = this;
        return {
            menu_items: [{
                key: 'display-config',
                name: '表示設定'
            }, {
                key: 'ng-config',
                name: 'NG編集'
            }, {
                key: 'setting',
                name: '設定'
            }],
            toolbar_all: {
                'recent': {
                    path: '/history/recent',
                    button: 'history',
                    name: '履歴'
                },
                'unread': {
                    path: '/history/unread',
                    name: '未読'
                },
                'all': {
                    path: '/history/all',
                    name: 'スレ'
                },
                'bbsmenu': {
                    path: '/bbsmenu',
                    button: 'list',
                    name: '板'
                },
                'post': {
                    name: '書き込む',
                    button: 'edit',
                    condition() {
                        return _this.$route.path.startsWith('/read/');
                    },
                    event() {
                        alert('test');
                    }
                }
            },
            toolbar_items: ['recent', 'unread', 'all', 'bbsmenu', 'post'],
            is_fab_open: false
        };
    },
    computed: {
        toolbar() {
            return this.toolbar_items.filter(item => !('condition' in this.toolbar_all[item]) || this.toolbar_all[item].condition());
        },
        menu() {
            return this.menu_items.filter(item => !('condition' in item) || item.condition());
        }
    },
    methods: {
        clickToolbar(key) {
            if ('path' in this.toolbar_all[key])
                this.$router.go({
                    path: this.toolbar_all[key].path
                });
            else if ('event' in this.toolbar_all[key])
                this.toolbar_all[key].event();
        },
        clickFab(key) {
            this.clickToolbar(key);
            this.is_fab_open = false;
        },
        clickFabMenu(path) {
            this.$router.replace({
                path: path
            });
            this.is_fab_open = false;
        },
        clickMenu(key) {

        }
    }
}
</script>
<style scoped>
.mdl-layout__header-row .mdl-navigation__link.v-link-active {
    position: relative;
}

.mdl-layout__header-row .mdl-navigation__link.v-link-active::after {
    content: '';
    background: rgb(255, 64, 129);
    position: absolute;
    bottom: 0;
    left: 0;
    height: 4px;
    width: 100%;
}

.mdl-layout__floating {
    position: fixed;
    right: 24px;
    bottom: 24px;
    z-index: 3;
    display: flex;
    flex-direction: column;
}

.mdl-layout__floating span {
    display: flex;
    flex-direction: column;
    position: relative;
}

.mdl-layout__floating button.mdl-button--mini-fab {
    margin-top: 13px;
}

.mdl-layout__floating>button:last-child {
    margin-top: 24px;
}

.mdl-layout__floating>button:last-child i {
    transform-origin: center;
    transition: .2s ease-out;
}

.mdl-layout__floating>button:last-child i.open {
    transform: rotate(-45deg);
    margin: -12px -12px;
}
</style>
