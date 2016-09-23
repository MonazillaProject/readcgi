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

require('whatwg-fetch');
import config from './config.js'

module.exports = {
    DOWNLOAD_TYPE_FULL: 'full',
    DOWNLOAD_TYPE_PART: 'part',
    DOWNLOAD_TYPE_NOTMODIFIED: 'notmodified',
    openIndexedDB() {
        return new Promise((resolve, reject) => {
            if (typeof window.indexedDB == 'undefined') reject('Unavailable indexedDB');
            let openRequest = window.indexedDB.open(config.THREAD_DB_NAME, 1);
            openRequest.addEventListener('upgradeneeded', e => {
                openRequest.result.createObjectStore(config.THREAD_OBJECT_STORE, {
                    keyPath: ['bbs', 'key']
                });
            });
            openRequest.addEventListener('success', e => resolve(openRequest.result));
            openRequest.addEventListener('error', e => reject(e));
        });
    },
    findThreadInfo(db, bbs, key) {
        return new Promise((resolve, reject) => {
            let transaction = db.transaction([config.THREAD_OBJECT_STORE], IDBTransaction.READ_WRITE || 'readwrite');
            let store = transaction.objectStore(config.THREAD_OBJECT_STORE);
            let request = store.get([bbs, key]);
            request.addEventListener('success', e => request.result ? resolve(request.result) : reject(e));
            request.addEventListener('error', e => reject(e));
        });
    },
    updateThreadInfo(db, bbs, key, content, contentLength, modified) {
        return new Promise((resolve, reject) => {
            let transaction = db.transaction([config.THREAD_OBJECT_STORE], IDBTransaction.READ_WRITE || 'readwrite');
            let store = transaction.objectStore(config.THREAD_OBJECT_STORE);
            let data = {
                bbs: bbs,
                key: key,
                content: content,
                contentLength: contentLength,
                modified: modified
            };
            let request = store.put(data);
            request.addEventListener('success', e => request.result ? resolve(data) : reject(e));
            request.addEventListener('error', e => reject(e));
        });
    },
    downloadThread(bbs, key, options) {
        return new Promise((resolve, reject) => {
            let xhr = new XMLHttpRequest();
            xhr.open('GET', `/${bbs}/dat/${key}.dat`);
            xhr.overrideMimeType(config.THREAD_FILE_MIME);
            if (options.lastModified) {
                xhr.setRequestHeader('If-Modified-Since', options.lastModified);
            }
            if (options.currentFileSize > 0) {
                xhr.setRequestHeader('Range', `bytes=${options.currentFileSize - 1}-`);
            }
            xhr.onload = e => {
                if (xhr.status == 200) {
                    //通常
                    resolve({
                        type: this.DOWNLOAD_TYPE_FULL,
                        content: xhr.response,
                        length: e.loaded,
                        modified: xhr.getResponseHeader("Last-Modified")
                    });
                } else if (xhr.status == 206) {
                    if (xhr.response.length > 1) {
                        if (xhr.response.substr(0, 1) == "\n") {
                            //差分DL
                            resolve({
                                type: this.DOWNLOAD_TYPE_PART,
                                content: xhr.response.substr(1),
                                length: options.currentFileSize + e.loaded,
                                modified: xhr.getResponseHeader("Last-Modified")
                            });
                        } else {
                            //あぼーん
                            this.downloadThread(bbs, key, Object.assign(options, {
                                currentFileSize: -1
                            })).then(data => resolve(data));
                        }
                    } else {
                        //なんかおかしい
                        this.downloadThread(bbs, key, Object.assign(options, {
                            currentFileSize: -1
                        })).then(data => resolve(data));
                    }
                } else if (xhr.status == 304) {
                    //更新なし
                    resolve({
                        type: this.DOWNLOAD_TYPE_NOTMODIFIED,
                        length: options.currentFileSize,
                        modified: options.lastModified
                    });
                } else if (xhr.status == 416) {
                    //あぼーん
                    this.downloadThread(bbs, key, Object.assign(options, {
                        currentFileSize: -1
                    })).then(data => resolve(data));
                } else {
                    // その他エラー
                    console.error(xhr);
                    reject({
                        text: `Status: ${xhr.status}`,
                        object: xhr
                    });
                }
            };
            xhr.onerror = e => {
                console.error(e);
                reject({
                    text: `Status(onerror): ${xhr.status}`,
                    object: e
                });
            };
            xhr.onabort = e => {
                console.error(e);
                reject({
                    text: `Status(onabort): ${xhr.status}`,
                    object: e
                });
            };
            xhr.send();
        });
    },
    getThread(bbs, key) {
        return this.openIndexedDB().then(db => {
            return this.findThreadInfo(db, bbs, key).then(info => {
                console.log("Cache hit!");
                return this.downloadThread(bbs, key, {
                    lastModified: info.modified,
                    currentFileSize: info.contentLength
                }).then(data => {
                    console.log(data);
                    if (data.type == this.DOWNLOAD_TYPE_NOTMODIFIED) {
                        console.info("Not modified");
                        return {
                            bbs: bbs,
                            key: key,
                            content: data.content,
                            contentLength: data.length,
                            modified: data.modified
                        };
                    }
                    if (data.type == this.DOWNLOAD_TYPE_PART) {
                        console.info("Partial downloaded");
                        info.content = info.content + data.content;
                    } else {
                        console.warn("Re-downloaded");
                    }
                    return this.updateThreadInfo(db, bbs, key, info.content, data.length, data.modified);
                });
            }, error => {
                console.info("Cache not found");
                return this.downloadThread(bbs, key, {}).then(data => {
                    return this.updateThreadInfo(db, bbs, key, data.content, data.length, data.modified);
                });
            })
        }, error => {
            console.error("indexedDB init failed", error);
            return this.downloadThread(bbs, key, {}).then(data => {
                return {
                    bbs: bbs,
                    key: key,
                    content: data.content,
                    contentLength: data.length,
                    modified: data.modified
                };
            });
        });
    }
}
