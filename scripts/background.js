import { requestAI } from "./requestAI.js";
import { deletename, getall, searchName } from "./indexedBD.js";
import { insertDB } from "./indexedBD.js";
import { searchKeyword } from "./indexedBD.js";
import { en2zh ,t_en2zh} from "./prompt.js";

//初始化
chrome.runtime.onInstalled.addListener(async (details) => {
    if (details.reason==='install') chrome.runtime.openOptionsPage();
    // if (details.reason === 'update') {
    //     chrome.tabs.create({
    //         // url: chrome.runtime.getURL('https://my-awesome.blog')  // 扩展内置页面
    //         url: 'https://my-awesome.blog/posts/guide-shici/'
    //     });
    // }
});

//定义行为
const actions={
    saveWord:async (message,sendResponse)=>{

        if (await searchName(message.text)) return sendResponse("单词重复！");

        console.log('收到翻译请求:', message.text);
        
        const { deepseekapikey: DSkey } = await chrome.storage.local.get("deepseekapikey");
        let response=requestAI(en2zh(),message.text, DSkey)
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
        console.log("background返回：",result);
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
    },
    translate:async(message,sendResponse)=>{
        const { deepseekapikey: DSkey } = await chrome.storage.local.get("deepseekapikey");
        let response = await requestAI(t_en2zh(), message.text, DSkey)
            .then(response => response.choices[0].message.content)
            .then(JSON.parse);
        sendResponse(response['translation']);
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
//自定义快捷键的测试代码
// chrome.commands.onCommand.addListener((command)=>{
//     switch(command){
//         case 'saveWord':
//             // console.log("save");
//             const [tab]=await chrome.tabs.query({ active: true, currentWindow: true })
//             const response = await chrome.tabs.sendMessage(tab.id,{
//                 action:"saveWord"
//             });
//             break;
//         case 'traslate':


//     }
//     const handler = actions[command];
//     if (!handler) {
//         console.log({ error: 'unknown action' });
//         return;
//     }
//     try {
//         handler(message, sendResponse);
//     } catch (err) {
//         sendResponse({ error: err.message });
//     }
//     return true;
// });
