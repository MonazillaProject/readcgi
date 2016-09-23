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
        let lines = content.split(/(\r\n|\n|\r)/);
        let posts = [];
        let subject = '';
        lines.forEach((line, index) => {
            let parts = line.split(/<>/);
            if (parts.length != 5) {
                posts.push({
                    broken: true,
                    num: index + 1
                });
                return;
            }
            if (posts.length == 0 && parts[4].length > 0)
                subject = parts[4];
            else if (posts.length == 0)
                throw new Error("Invalid format");
            let info = {
                num: index + 1,
                name: parts[0],
                mail: parts[1],
                date: parts[2],
                body: parts[3],
                name_items: []
            };
            //2010/01/01 00:00:00.000
            //2010/01/01 00:00:00
            //2010/01/01 00:00
            //10/01/01 00:00:00
            //10/01/01 00:00
            if (parts[2].match(/(\d{4})\/\d{2}\/\d{2}).*?(\d{2}:\d{2}:\d{2}\.\d{2,3})/)) {
                info.timestamp = moment(`${RegExp.$1} ${RegExp.$2}`, 'YYYY/MM/DD HH:mm:ss.SSS');
            } else if (parts[2].match(/(\d{4})\/\d{2}\/\d{2}).*?(\d{2}:\d{2}:\d{2})/)) {
                info.timestamp = moment(`${RegExp.$1} ${RegExp.$2}`, 'YYYY/MM/DD HH:mm:ss');
            } else if (parts[2].match(/(\d{4})\/\d{2}\/\d{2}).*?(\d{2}:\d{2})/)) {
                info.timestamp = moment(`${RegExp.$1} ${RegExp.$2}`, 'YYYY/MM/DD HH:mm');
            } else if (parts[2].match(/(\d{2})\/\d{2}\/\d{2}).*?(\d{2}:\d{2}:\d{2})/)) {
                info.timestamp = moment(`${RegExp.$1} ${RegExp.$2}`, 'YY/MM/DD HH:mm:ss');
            } else if (parts[2].match(/(\d{2})\/\d{2}\/\d{2}).*?(\d{2}:\d{2})/)) {
                info.timestamp = moment(`${RegExp.$1} ${RegExp.$2}`, 'YY/MM/DD HH:mm');
            } else {
                console.error(`Unknown timestamp ${parts[2]}`);
            }
            //ID:SOMETHING
            if (parts[2].match(/ID:(\S+?)/))
                info.id = RegExp.$1;
            //249718815-S★(824724)
            if (parts[2].match(/BE:(\d+?)-(.+?)\((\d+?)\)/))
                info.be = {
                    id: RegExp.$1,
                    rank: RegExp.$2,
                    point: parseInt(RegExp.$3, 10)
                };

            //</b>◆.{10,12}<b>
            if (parts[0].match(/<\/b>◆.{10,12}<b>/))
                info.name_items.push({
                    type: 'trip',
                    value: RegExp.$1
                });

            //</b>(\S+ .{4}-.{4})<b>
            if (parts[0].match(/<\/b>\(\S+?\)<b>/))
                info.name_items.push({
                    type: 'slip_ken',
                    value: RegExp.$1
                });
            posts.push(info);
        });
    }
};
