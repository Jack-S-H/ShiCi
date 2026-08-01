//数据库版本
const DBversion=1;
//数据库索引列表
const indexes = [
    ['name', 'name', true ],
    ['translate', 'translate', false ],
    ['date', 'date', false ],
    ['searchname', 'searchname', false],
    ['suggestion', 'suggestion', false],
];
const DBname="ShiCi";
/**
 * 
 */
// 打开数据库
// 数据库持久化打开标志
let dbInstance = null;
async function openDB() {
    if (dbInstance) return dbInstance;
    return new Promise((resolve, reject) => {
        const request = indexedDB.open(DBname, DBversion);

        request.onerror = (event) => {
            console.error("打开数据库失败", request.error);
            reject(request.error);
            // 使用 request.error 做些处理！
        };
        request.onsuccess = (event) => {
            const db = request.result;
            resolve(db);
        }
        request.onupgradeneeded = (event) => {
            const db = event.target.result;
            const objectStore = db.objectStoreNames.contains('words')
                ? event.target.transaction.objectStore('words')
                : db.createObjectStore('words', { keyPath: 'id', autoIncrement: true });

            for (const [indexName, keyPath, unique] of indexes) {
                if (!objectStore.indexNames.contains(indexName)) {
                    objectStore.createIndex(indexName, keyPath, { unique: unique });
                }
                else if (objectStore.index(indexName).keyPath !== keyPath) {
                    objectStore.deleteIndex(indexName);
                    objectStore.createIndex(indexName, keyPath, { unique: unique });
                }
                else if (objectStore.index(indexName).unique !== unique) {
                    objectStore.deleteIndex(indexName);
                    objectStore.createIndex(indexName, keyPath, { unique: unique });
                }
            }
            console.log("数据库已创建！");
        }
    });
}
//迁移数据库
export async function renameDB(oldName, newName, version) {
    const oldDB = await new Promise((resolve, reject) => {
        const request = indexedDB.open(oldName);
        request.onsuccess = () => resolve(request.result);
        request.onerror = () => resolve(null);
    });
    if (!oldDB) {
        return;
    }
    const storeNames = Array.from(oldDB.objectStoreNames);

    const allData = {};
    for (const name of storeNames) {
        const tx = oldDB.transaction(name, 'readonly');
        const store = tx.objectStore(name);
        allData[name] = await new Promise((resolve, reject) => {
            const request = store.getAll();
            request.onsuccess = () => resolve(request.result);
            request.onerror = () => reject(request.error);
        });
    }
    oldDB.close();

    const newDB = await new Promise((resolve, reject) => {
        const request = indexedDB.open(newName, version);
        request.onupgradeneeded = (event) => {
            const db = event.target.result;
            for (const name of storeNames) {
                if (!db.objectStoreNames.contains(name)) {
                    const objectStore = db.createObjectStore('words', { keyPath: 'id', autoIncrement: true });
                    for (const [indexName, keyPath, unique] of indexes) {
                        if (!objectStore.indexNames.contains(indexName)) {
                            objectStore.createIndex(indexName, keyPath, { unique: unique });
                        }
                        else if (objectStore.index(indexName).keyPath !== keyPath) {
                            objectStore.deleteIndex(indexName);
                            objectStore.createIndex(indexName, keyPath, { unique: unique });
                        }
                        else if (objectStore.index(indexName).unique !== unique) {
                            objectStore.deleteIndex(indexName);
                            objectStore.createIndex(indexName, keyPath, { unique: unique });
                        }
                    }
                }
            }
        };
        request.onsuccess = () => resolve(request.result);
        request.onerror = () => reject(request.error);
    });

    for (const [name, data] of Object.entries(allData)) {
        if (data.length === 0) continue;
        const tx = newDB.transaction(name, 'readwrite');
        const store = tx.objectStore(name);
        for (const item of data) {
            store.add(item);
        }
        await new Promise((resolve, reject) => {
            tx.oncomplete = resolve;
            tx.onerror = reject;
        });
    }
    newDB.close();
    
    indexedDB.deleteDatabase(oldName);

    console.log(`数据库已从 "${oldName}" 复制到 "${newName}"`);
}

// 插入数据
export async function insertDB(data) {
    const db=await openDB();

    const transaction = db.transaction(["words"], "readwrite");
    transaction.oncomplete = (event) => {
        console.log("已经处理完了！");
    };
    //事务级错误处理
    // transaction.onerror = (event) => {
    //     console.error("打开事务失败", event.target.error);
    //     // 别忘了处理错误！
    // };
    // 单条失败不会中止整个事务
    const objectStore = transaction.objectStore("words");
    const request = objectStore.add(data);
    request.onsuccess = (event) => {
        console.log("写入数据成功！")
    };
    request.onerror = (event) => {
        console.error("插入失败，数据：",data,"原因", event.target.error);
    };
};
// 通过名称搜索数据库
export async function searchName(name) {
    const db=await openDB();
    const request=db
        .transaction("words")
        .objectStore("words");

    const index = request.index("searchname");
    const result = await new Promise((resolve) => {
        index.get(name).onsuccess=(e)=>{
            resolve(e.target.result);
        }
    });
    request.onerror = (event)=>{
        console.error("search 发生了错误！数据：",request.error);
    };
    return result;
}
// 首字母模糊搜索
export async function searchKeyword(keyword) {
    if (!keyword) return;
    const db = await openDB();
    const index = db.transaction('words', 'readonly')
        .objectStore('words')
        .index('searchname');

    const lowerBound = keyword;
    const upperBound = keyword + '\uffff';
    const range = IDBKeyRange.bound(lowerBound, upperBound, false, true);

    const results = await new Promise((resolve) => {
        const items = [];
        index.openCursor(range, 'nextunique').onsuccess = (event) => {
            const cursor = event.target.result;
            if (cursor && items.length < 10) {
                items.push(cursor.value);
                cursor.continue();
            } else {
                resolve(items);
            }
        };
    });
    return results;
}
// 获取所有的key列
// async function getallkeys(key,items) {
//     const db=await openDB();
//     const index=db.transaction('words').objectStore('words').index(key);
//     const result=await new Promise((resolve)=>{
//         index.openCursor('nextunique').onsuccess=(e)=>{
//             const cursor =e.target.result;
//             if(cursor){
//                 items.push(cursor.key);
//                 cursor.continue();
//             }
//             else{
//                 resolve(items);
//             }
//         };
//     });
// }

// 获取所有数据
export async function getall() {
    const db=await openDB()
    const index=db.transaction('words')
        .objectStore('words').index('date');
    const results = await new Promise((resolve) => {
        const items = [];
        index.openCursor(null,'prev').onsuccess = (event) => {
            const cursor = event.target.result;
            if (cursor) {
                items.push(cursor.value);
                cursor.continue();
            } else {
                resolve(items);
            }
        };
    });
    return results;
}
//废弃！
// async function hasInserted(keyword) {
//     const result=await searchKeyword(keyword);
//     console.log(result);
//     if (result.length>0){
//         return true;
//     }
//     else{
//         return false;
//     }
// }

// 使用id号删除
export async function deletename(key) {
    const db=await openDB();
    const transaction=db.transaction('words',"readwrite");
    const ostore=transaction.objectStore('words');

    const getresult=ostore.get(key);
    const delresult=ostore.delete(key);

    return new Promise((resolve,reject) => {
        transaction.oncomplete = (e) => {
            console.log('删除事务完成');
            resolve(key);
        };
        transaction.onerror = (e) => {
            console.log(e.target.error);
            reject(false);
        };
    });
}
// 使用名称删除
async function deletebykey(key) {
    const db = await openDB();
    const ostore = db.transaction('words', "readwrite").objectStore('words').index('name');

}