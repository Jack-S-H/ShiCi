import { requestAI } from "./requestAI.js";
import { createDB, deletename, getall, searchName } from "./indexedBD.js";
import { insertDB } from "./indexedBD.js";
import { searchKeyword } from "./indexedBD.js";

//初始化
chrome.runtime.onInstalled.addListener(async () => {
    await createDB();
    chrome.runtime.openOptionsPage();
    const result = await chrome.storage.local.get('deletedWords');
    // const deletedWords=result.
});
//定义行为
const actions={
    saveWord:async (message,sendResponse)=>{

        if (await searchName(message.text)) return sendResponse("单词重复！");

        // 翻译并保存单词
        console.log('收到翻译请求:', message.text);
        const {"deepseekapikey":DSkey} = await chrome.storage.local.get("deepseekapikey");
        // console.log("接收方：",message.extradata);
        let response=requestAI(message.text, DSkey)
            .then(response=>response.choices[0].message.content)
            .then(JSON.parse);
        response.then(sendResponse);
        response.then((data)=>{
            const dataToSave = {
                name: data.name,
                translate: data.translate,
                usphone: data.usphone || "",
                suggestion:data.suggestion,
                searchname: data.name.toLowerCase(),
                date: new Date().toLocaleString()
            };
            insertDB(dataToSave);
        });
    },
    delWord:async(message,sendResponse)=>{
        // 删除单词
        // console.log('删除单词:', message.text);
        const result=await deletename(Number(message.text));
        sendResponse(result);
    },
    searchWord:async(message,sendResponse)=>{
        //搜索单词
        const text=await searchKeyword(message.text);
        sendResponse(text);
    },
    searchByName:async(message,sendResponse)=>{
        const text=await searchName(message.text);
        // console.log("搜索结果：",text);
        sendResponse(text);
    },
    getallWord:async(message,sendResponse)=>{
        const text=await getall();
        sendResponse(text);
    }

};

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    const handler = actions[message.action];
    if (!handler) {
        sendResponse({ error: 'unknown action' });
        return;
    }
    try {
        handler(message, sendResponse);
    } catch (err) {
        sendResponse({ error: err.message });
    }
    return true;
});

// 3. 点击扩展图标
// chrome.action.onClicked.addListener((tab) => {
    // 可以注入脚本到当前标签页...
// });

// ===== 其他辅助函数可以写在下面 =====
// async function saveWordToStorage(word, translation) {
    // 存储逻辑...
// }
//返回json数据

