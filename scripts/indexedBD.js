//数据库版本
const DBversion=2;
//数据库索引列表
const indexes = [
    ['name', 'name', true ],
    ['translate', 'translate', false ],
    ['date', 'date', false ],
    ['searchname', 'searchname', false],
    ['suggestion', 'suggestion', false],
];

/**
 * 
 */
function createDB(){
    let db;
    const request = indexedDB.open("snatchwords", DBversion);
    request.onerror = (event) => {
        console.error("为什么不让我们的 Web 应用使用 IndexedDB！？");
        // 使用 request.error 做些处理！
    };
    request.onupgradeneeded = (event) => {
        db = event.target.result;
        const objectStore = db.objectStoreNames.contains('words')
            ? event.target.transaction.objectStore('words')
            : db.createObjectStore('words', { keyPath: 'id', autoIncrement: true });

        for (const [indexName, keyPath, unique] of indexes) {
            if (!objectStore.indexNames.contains(indexName)) {
                objectStore.createIndex(indexName, keyPath, {unique:unique});
            }
            else if(objectStore.index(indexName).keyPath !== keyPath){
                objectStore.deleteIndex(indexName);
                objectStore.createIndex(indexName, keyPath, { unique: unique });
            }
            else if (objectStore.index(indexName).unique !== unique) {
                objectStore.deleteIndex(indexName);
                objectStore.createIndex(indexName, keyPath, { unique: unique });
            }
        }
        console.log("数据库已创建！")
    }
    request.onsuccess=(event)=>{

        console.log("数据库已存在，请勿重复创建！");
    }
}

let dbInstance = null;
async function openDB() {
    if (dbInstance) return dbInstance;
    return new Promise((resolve, reject) => {
        const request = indexedDB.open("snatchwords", DBversion);

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
            // console.warn("数据库不存在，请先调用 createDB");
            createDB();
        }
    });
}
export async function insertDB(data) {
    const db=await openDB();

    const transaction = db.transaction(["words"], "readwrite");
    transaction.oncomplete = (event) => {
        console.log("已经处理完了！");
    };
    //事务级错误处理
    transaction.onerror = (event) => {
        console.error("打开事务失败", event.target.error);
        // 别忘了处理错误！
    };
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
export async function searchKeyword(keyword) {
    if (!keyword) return;
    const db=await openDB();
    const index = db.transaction('words', 'readonly')
        .objectStore('words')
        .index('searchname');

    const lowerBound = keyword;
    const upperBound = keyword + '\uffff';
    const range = IDBKeyRange.bound(lowerBound, upperBound, false, true);

    const results=await new Promise((resolve)=>{
        const items = [];
        index.openCursor(range, 'nextunique').onsuccess = (event) => {
            const cursor = event.target.result;
            if (cursor && items.length < 10) {
                items.push(cursor.value);
                cursor.continue();
            } else{
                resolve(items);
            }
        };
    });
    return results;
}
export async function deletename(key) {
    const db=await openDB();
    const transaction=db.transaction('words',"readwrite");
    const ostore=transaction.objectStore('words');

    const getresult=ostore.get(key);
    const delresult=ostore.delete(key);

    return new Promise((resolve,reject) => {
        transaction.oncomplete = (e) => {
            console.log('删除事务完成');
            resolve(true);
        };
        transaction.onerror = (e) => {
            console.log(e.target.error);
            reject(false);
        };
    });
}
async function deletebykey(key) {
    const db = await openDB();
    const ostore = db.transaction('words', "readwrite").objectStore('words').index('name');

}