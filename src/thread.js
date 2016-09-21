require('whatwg-fetch');
const moment = require('moment');
const config = require('./config.js');
const DOWNLOAD_FULL = 0;
const DOWNLOAD_PART = 1;
const DOWNLOAD_NOTMODIFIED = 2;

class Thread {
    constructor() {

    }

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
    }

    findThreadInfo(db, bbs, key) {
        return new Promise((resolve, reject) => {
            let transaction = db.transaction([config.THREAD_OBJECT_STORE], IDBTransaction.READ_WRITE || 'readwrite');
            let store = transaction.objectStore(config.THREAD_OBJECT_STORE);
            let request = store.get([bbs, key]);
            request.addEventListener('success', e => request.result ? resolve(request.result) : reject(e));
            request.addEventListener('error', e => reject(e));
        });
    }

    updateThreadInfo(db, server, bbs, key, content, contentLength, modified) {
        return new Promise((resolve, reject) => {
            let transaction = db.transaction([config.THREAD_OBJECT_STORE], IDBTransaction.READ_WRITE || 'readwrite');
            let store = transaction.objectStore(config.THREAD_OBJECT_STORE);
            let data = {
                bbs: bbs,
                key: key,
                server: server,
                content: content,
                contentLength: contentLength,
                modified: modified
            };
            let request = store.put(data);
            request.addEventListener('success', e => request.result ? resolve(data) : reject(e));
            request.addEventListener('error', e => reject(e));
        });
    }

    downloadThread(server, bbs, key, options) {
        return new Promise((resolve, reject) => {
            let xhr = new XMLHttpRequest();
            xhr.open('GET', `http://${server}/${bbs}/dat/${key}.dat`);
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
                        type: DOWNLOAD_FULL,
                        content: xhr.response,
                        length: e.loaded,
                        modified: xhr.getResponseHeader("Last-Modified")
                    });
                } else if (xhr.status == 206) {
                    if (xhr.response.length > 1) {
                        if (xhr.response.substr(0, 1) == "\n") {
                            //差分DL
                            resolve({
                                type: DOWNLOAD_PART,
                                content: xhr.response.substr(1),
                                length: options.currentFileSize + e.loaded,
                                modified: xhr.getResponseHeader("Last-Modified")
                            });
                        } else {
                            //あぼーん
                            this.downloadThread(server, bbs, key, Object.assign(options, {
                                currentFileSize: -1
                            })).then(data => resolve(data));
                        }
                    } else {
                        //なんかおかしい
                        this.downloadThread(server, bbs, key, Object.assign(options, {
                            currentFileSize: -1
                        })).then(data => resolve(data));
                    }
                } else if (xhr.status == 304) {
                    //更新なし
                    resolve({
                        type: DOWNLOAD_NOTMODIFIED,
                        length: options.currentFileSize,
                        modified: options.lastModified
                    });
                } else if (xhr.status == 416) {
                    //あぼーん
                    this.downloadThread(server, bbs, key, Object.assign(options, {
                        currentFileSize: -1
                    })).then(data => resolve(data));
                } else {
                    reject(xhr);
                }
            };
            xhr.onerror = e => console.log(e) || reject(e);
            xhr.onabort = e => console.log(e) || reject(e);
            xhr.send();
        });
    }

    getThread(server, bbs, key) {
        return this.openIndexedDB().then(db => {
            return this.findThreadInfo(db, bbs, key).then(info => {
                console.log("thread cache available");
                return this.downloadThread(server, bbs, key, {
                    lastModified: info.modified,
                    currentFileSize: info.contentLength
                }).then(data => {
                    console.log(data);
                    if (data.type == DOWNLOAD_NOTMODIFIED) {
                        return {
                            server: server,
                            bbs: bbs,
                            key: key,
                            content: data.content,
                            contentLength: data.length,
                            modified: data.modified
                        };
                    }
                    if (data.type == DOWNLOAD_PART)
                        info.content = info.content + data.content;
                    return this.updateThreadInfo(db, server, bbs, key, info.content, data.length, data.modified);
                });
            }, error => {
                console.info("thread information not found");
                return this.downloadThread(server, bbs, key, {}).then(data => {
                    return this.updateThreadInfo(db, server, bbs, key, data.content, data.length, data.modified);
                });
            })
        }).catch(error => {
            console.error("indexedDB open error", error);
            return this.downloadThread(server, bbs, key, {}).then(data => {
                return {
                    server: server,
                    bbs: bbs,
                    key: key,
                    content: data.content,
                    contentLength: data.length,
                    modified: data.modified
                };
            });
        })
    }
}
