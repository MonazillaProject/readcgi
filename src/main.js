/*
 *  readcgi
 *  Copyright (C) 2016 2chOpenSource <webmaster@n2ch.ml>
 *
 *  This program is free software: you can redistribute it and/or modify
 *  it under the terms of the GNU General Public License as published by
 *  the Free Software Foundation, either version 3 of the License, or
 *  (at your option) any later version.
 *
 *  This program is distributed in the hope that it will be useful,
 *  but WITHOUT ANY WARRANTY; without even the implied warranty of
 *  MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 *  GNU General Public License for more details.
 *
 *  You should have received a copy of the GNU General Public License
 *  along with this program.  If not, see <http://www.gnu.org/licenses/>.
 */

const vue = require('vue');
const vueRouter = require('vue-router');
const vueMdl = require('vue-mdl').default;

require('material-design-lite/material.js');
require('material-design-lite/material.css');
require('moment/locale/ja');

vue.use(vueRouter);
vue.use(vueMdl);

const router = new vueRouter({
    history: false,
    saveScrollPosition: true
});
router.redirect({
    '/': '/history/recent'
});
router.map({
    '/read/:bbs/:key': {
        component: require('../pages/read.vue')
    },
    '/read/:bbs/:key/:selector': {
        component: require('../pages/read.vue')
    }
})

const app = vue.extend(require('../app.vue'));
router.start(app, '#app');
