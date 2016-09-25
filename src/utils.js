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

module.exports = {
    parseSelector(selector, count) {
        let selectorArray = new Array(count).fill(false);
        if (selector == '' || selector.match(/^all$/i))
            selectorArray.fill(true);
        else if (selector.match(/^(\d+)$/))
            if (parseInt(RegExp.$1, 10) <= count)
                selectorArray[Math.min(parseInt(RegExp.$1, 10) - 1, count - 1)] = true;
            else
                selectorArray.fill(true);
        else if (selector.match(/^(\d+n?)-(\d+n?)$/i)) {
            selectorArray.fill(true, Math.max(parseInt(RegExp.$1.replace(/n/, ''), 10) - 1, 0), Math.min(parseInt(RegExp.$2.replace(/n/, ''), 10), count));
            if (!selectorArray[0]) selectorArray[0] = !selector.match(/n/);
        } else if (selector.match(/^l(\d+)$/i))
            selectorArray.fill(true, count - 1 - Math.min(parseInt(RegExp.$1, 10) - 1, count - 1), count);
        return selectorArray;
    },
    zen2Han(text) {
        return text
            .replace(/１/g, '1')
            .replace(/２/g, '2')
            .replace(/３/g, '3')
            .replace(/４/g, '4')
            .replace(/５/g, '5')
            .replace(/６/g, '6')
            .replace(/７/g, '7')
            .replace(/８/g, '8')
            .replace(/９/g, '9')
            .replace(/０/g, '9')
            .replace(/[＞〉》]/g, '>');
    }
};
