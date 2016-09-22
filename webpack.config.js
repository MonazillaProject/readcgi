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
    entry: './src/main.js',
    output: {
        path: "./build",
        filename: 'build.js'
    },
    module: {
        loaders: [{
            test: /\.vue$/,
            exclude: /node_modules/,
            loader: 'vue'
        }, {
            test: /\.css$/,
            loader: 'style!css'
        }, {
            test: /\.js$/,
            exclude: /node_modules/,
            loader: 'babel-loader',
            query: {
                cacheDirectory: true,
                presets: ['es2015'],
                plugins: ['transform-runtime']
            }
        }]
    },
    vue: {
        autoprefixer: {
            browsers: ['last 2 versions']
        }
    }
};
