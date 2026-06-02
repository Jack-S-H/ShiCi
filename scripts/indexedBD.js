//数据库版本
const DBversion=2;
const indexes = [
    ['name', 'name', true ],
    ['translate', 'translate', false ],
    ['date', 'date', false ],
    ['searchname', 'searchname', false],
    ['suggestion', 'suggestion', false],
];

export function createDB(){
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
        // objectStore.createIndex("name", "name", { unique: true });
        // objectStore.createIndex("translate", "translate", { unique: false });
        // objectStore.createIndex("date", "date", { unique: false });
        // objectStore.createIndex("url", "url", { unique: false });
        // objectStore.createIndex("context", "context", { unique: false });
        // objectStore.createIndex("searchname", "searchname", { unique: false });
        // objectStore.createIndex("ukphone", "ukphone", { unique: false });
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
            console.warn("数据库不存在，请先调用 createDB");
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
    const objectStore = transaction.objectStore("words");
    const request = objectStore.add(data);
    request.onsuccess = (event) => {
        console.log("写入数据成功！")
    };
    request.onerror = (event) => {
        // 单条失败不会中止整个事务，但最好记录日志
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
async function hasInserted(keyword) {
    const result=await searchKeyword(keyword);
    console.log(result);
    if (result.length>0){
        return true;
    }
    else{
        return false;
    }
}
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

    transaction.oncomplete=(e)=>{
        console.log('事务完成');
    };
    transaction.onerror=(e)=>{
        console.log(e.target.error);
    };
    return new Promise((resolve) => {
        getresult.onsuccess = (e) => {
            resolve(e.target.result);
        }
    });
}
async function deletebykey(key) {
    const db = await openDB();
    const ostore = db.transaction('words', "readwrite").objectStore('words').index('name');

}