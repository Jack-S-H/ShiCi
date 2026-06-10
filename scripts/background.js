import { requestAI } from "./requestAI.js";
import { deletename, getall, searchName } from "./indexedBD.js";
import { insertDB } from "./indexedBD.js";
import { searchKeyword } from "./indexedBD.js";

//初始化
chrome.runtime.onInstalled.addListener(async () => {
    chrome.runtime.openOptionsPage();
});
//定义行为
const actions={
    saveWord:async (message,sendResponse)=>{

        if (await searchName(message.text)) return sendResponse("单词重复！");

        console.log('收到翻译请求:', message.text);
        const {"deepseekapikey":DSkey} = await chrome.storage.local.get("deepseekapikey");

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
        const result=await deletename(Number(message.text));
        sendResponse(result);
    },
    
    searchWord:async(message,sendResponse)=>{
        const text=await searchKeyword(message.text);
        sendResponse(text);
    },
    searchByName:async(message,sendResponse)=>{
        const text=await searchName(message.text);
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
