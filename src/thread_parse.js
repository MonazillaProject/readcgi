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

import moment from 'moment'
module.exports = {
    parseThread(content) {
        let lines = content.replace(/\r\n/, "\n").replace(/\n$/, '').split(/\n/);
        let posts = [];
        let subject = '';
        lines.forEach((line, index) => {
            line = line.replace(/&#(\d{1,5});/g, handler => String.fromCharCode(parseInt(RegExp.$1, 10))); //Unicode
            let parts = line.split(/<>/);
            if (parts.length != 5) {
                posts.push({
                    broken: true,
                    num: index + 1
                });
                return;
            }
            if (posts.length == 0 && parts[4].length > 0)
                subject = parts[4].replace(/[\t\s]*$/, ''); //スレタイ終わりのTab
            else if (posts.length == 0)
                throw new Error("Invalid format");
            let info = {
                num: index + 1,
                name: parts[0].replace(/\s+$/, ''),
                mail: parts[1],
                date: parts[2].replace(/\s+$/, ''),
                body: parts[3],
                name_items: []
            };
            let m;
            let body = info.body;
            //日時
            //2010/01/01 00:00:00.000
            //2010/01/01 00:00:00
            //2010/01/01 00:00
            //10/01/01 00:00:00
            //10/01/01 00:00
            if (parts[2].match(/(\d{4}\/\d{2}\/\d{2}).*?(\d{2}:\d{2}:\d{2}\.\d{2,3})/)) {
                info.timestamp = moment(`${RegExp.$1} ${RegExp.$2}`, 'YYYY/MM/DD HH:mm:ss.SSS');
            } else if (parts[2].match(/(\d{4}\/\d{2}\/\d{2}).*?(\d{2}:\d{2}:\d{2})/)) {
                info.timestamp = moment(`${RegExp.$1} ${RegExp.$2}`, 'YYYY/MM/DD HH:mm:ss');
            } else if (parts[2].match(/(\d{4}\/\d{2}\/\d{2}).*?(\d{2}:\d{2})/)) {
                info.timestamp = moment(`${RegExp.$1} ${RegExp.$2}`, 'YYYY/MM/DD HH:mm');
            } else if (parts[2].match(/(\d{2}\/\d{2}\/\d{2}).*?(\d{2}:\d{2}:\d{2})/)) {
                info.timestamp = moment(`${RegExp.$1} ${RegExp.$2}`, 'YY/MM/DD HH:mm:ss');
            } else if (parts[2].match(/(\d{2}\/\d{2}\/\d{2}).*?(\d{2}:\d{2})/)) {
                info.timestamp = moment(`${RegExp.$1} ${RegExp.$2}`, 'YY/MM/DD HH:mm');
            } else {
                console.error(`Unknown timestamp ${parts[2]}`);
            }
            //ID:*******
            if (parts[2].match(/ID:(\S+)/))
                info.id = RegExp.$1;

            //BE:249718815-S★(824724)
            if (parts[2].match(/BE:(\d+?)-(\S+?)\((\d+?)\)/))
                info.be = {
                    id: RegExp.$1,
                    rank: RegExp.$2,
                    point: parseInt(RegExp.$3, 10)
                };

            //</b>◆.{10,12}<b>
            if (parts[0].match(/<\/b>◆(\S{10,12})\s?<b>/))
                info.name_items.push({
                    type: 'trip',
                    value: RegExp.$1
                });

            //</b>(\S+ .{4}-.{4})<b> ワッチョイなど
            if (m = parts[0].match(/<\/b>\(.+?\)<b>/g))
                m.forEach(item => {
                    if (item.match(/<\/b>\((.+?)\)<b>/))
                        info.name_items.push({
                            type: 'slip_ken',
                            value: RegExp.$1
                        });
                });

            //sssp://.* BEアイコン
            if (parts[3].match(/^\s*sssp:\/\/([^\s<>]+?\.(gif|png))/)) {
                info.be = Object.assign(info.be, {
                    icon: `http://${RegExp.$1}`
                });
                body = body.replace(/^\s*sssp:\/\/([^\s<>]+?\.(gif|png))\s*<br>/, '');
            }

            //安価
            body = body.replace(/<a href="\.\..*?".*?>&gt;&gt;(\d+)<\/a>/, handler => `>>${RegExp.$1}`);
            //改行前後のスペース
            body = body.replace(/^\s/, '').replace(/\s<br>\s/g, '<br>');
            info.modified_body = body;
            posts.push(info);
        });

        return {
            subject: subject,
            posts: posts,
            count: posts.length
        };
    }
};
