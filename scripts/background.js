import { requestAI } from "./requestAI.js";
import { deletename, getall, searchName, 
    insertDB,searchKeyword,renameDB} 
    from "./indexedBD.js";
import { en2zh ,t_en2zh} from "./prompt.js";


//初始化
chrome.runtime.onInstalled.addListener(async (details) => {
    // console.log(details);
    if (details.reason==='install') chrome.runtime.openOptionsPage();
    if (details.reason === 'update') {
        await renameDB("snatchwords", "ShiCi", 1);
        chrome.tabs.create({
            url: 'https://my-awesome.blog/posts/changelog-shici/'
        });
        // 图标上显示 "NEW"
        // chrome.action.setBadgeText({ text: 'NEW' });
        // chrome.action.setBadgeBackgroundColor({ color: '#FD5353' });  // 红色背景
    }
});

//定义行为
const actions={
    // 保存单词，使用大模型获取信息
    saveWord:async (message,sendResponse)=>{

        if (await searchName(message.text)) return sendResponse({ ok: false, error: "单词重复！" });

        console.log('收到翻译请求:', message.text);
        
        const { deepseekapikey: DSkey } = await chrome.storage.local.get("deepseekapikey");
        try{
            const response = await requestAI(en2zh(), message.text, DSkey);
            const data = JSON.parse(response.choices[0].message.content);
        
            const dataToSave = {
                name: data.name,
                translate: data.translate,
                usphone: data.usphone || "",
                suggestion: data.suggestion,
                searchname: data.name.toLowerCase(),
                date: new Date().toLocaleString()
            };
            await insertDB(dataToSave);
            sendResponse({ ok: true, data: dataToSave });
        }
        catch (err) {
            console.error('失败:', err);
            sendResponse({ ok: false, error: err.message });
        }
        
    },
    // 已有数据，直接导入单词
    insertWord: async (message, sendResponse) => {
        if (await searchName(message.text[0])) return sendResponse({ ok: false, error: "单词重复！" });
        try {
            // const data = JSON.parse(message.text);
            const dataToSave = {
                name: message.text[0],
                translate: message.text[1],
                usphone: message.text[2] || "",
                suggestion: message.text[3] || "",
                searchname: message.text[0].toLowerCase() || "",
                date: new Date().toLocaleString()
            };
            await insertDB(dataToSave);
            sendResponse({ ok: true, data: dataToSave });
        }
        catch (err) {
            console.error('失败:', err);
            sendResponse({ ok: false, error: err.message });
        }
    },
    // 删除单词
    delWord:async(message,sendResponse)=>{
        const result=await deletename(Number(message.text));
        console.log("background返回：",result);
        sendResponse(result);
    },
    // 模糊查找单词
    searchWord:async(message,sendResponse)=>{
        const text=await searchKeyword(message.text);
        sendResponse(text);
    },
    // 使用单词名查找单词
    searchByName:async(message,sendResponse)=>{
        const text=await searchName(message.text);
        sendResponse(text);
    },
    // 获取所有数据
    getallWord:async(message,sendResponse)=>{
        const text=await getall();
        sendResponse(text);
    },
    // 翻译
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
