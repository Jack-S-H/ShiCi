const trashsvg = `
    <svg viewBox="0 0 640 640" xmlns="http://www.w3.org/2000/svg" xmlns:svg="http://www.w3.org/2000/svg">
    <!--!Font Awesome Free v7.2.0 by @fontawesome - https://fontawesome.com License - https://fontawesome.com/license/free Copyright 2026 Fonticons, Inc.-->
    <g class="layer">
        <title>Layer 1</title>
        <path
        d="m262.2,48c-13.3,0 -25.3,8.3 -30,20.8l-16.2,43.2l-96,0c-13.3,0 -24,10.7 -24,24c0,13.3 10.7,24 24,24l400,0c13.3,0 24,-10.7 24,-24c0,-13.3 -10.7,-24 -24,-24l-96,0l-16.2,-43.2c-4.7,-12.5 -16.6,-20.8 -30,-20.8l-115.6,0z"
        id="svg_1"></path>
        <path
        d="m128,198l0,304c0,35.3 28.7,64 64,64l256,0c35.3,0 64,-28.7 64,-64l0,-304l-48,0l0,304c0,8.8 -7.2,16 -16,16l-256,0c-8.8,0 -16,-7.2 -16,-16l0,-304l-48,0zm160,72c0,-13.3 -10.7,-24 -24,-24c-13.3,0 -24,10.7 -24,24l0,176c0,13.3 10.7,24 24,24c13.3,0 24,-10.7 24,-24l0,-176zm112,0c0,-13.3 -10.7,-24 -24,-24c-13.3,0 -24,10.7 -24,24l0,176c0,13.3 10.7,24 24,24c13.3,0 24,-10.7 24,-24l0,-176z"
        id="svg_2"></path>
    </g>
    </svg>
`;
//打开设置
document.getElementById('openOptions').addEventListener('click',()=>{
    chrome.runtime.openOptionsPage();
})

//搜索单词
let searchTimer = null;

const searchInput = document.getElementById('searchinput');
const suggestions = document.getElementById('suggestions');

searchInput.addEventListener('input', () => {
    clearTimeout(searchTimer);
    searchTimer = setTimeout(() => doSearch(searchInput.value.trim()), 150);
});

async function doSearch(keyword) {
    suggestions.innerHTML = '';
    suggestions.style.display = 'none';
    if (!keyword) return;

    const results = [];
    await chrome.runtime.sendMessage(
        {
            action: 'searchWord',
            text: keyword
        }
    )
        .then(response => {
            results.push(...response);
        })
        .catch(error => console.error('搜索请求失败:', error));
    
    if (results.length > 0) {
        results.forEach(word => {
            const div = document.createElement('div');
            div.className = 'item';
            div.innerHTML = `
            <div>
                <span class="word">${escapeHTML(word.name)}</span>
                <span class="usphone">${escapeHTML(word.usphone)}</span>
                <span class="translation">${escapeHTML(word.translate)}</span>
            </div>
            `;
            const delBtn=document.createElement('div');
            delBtn.className="delBtn";
            delBtn.innerHTML=trashsvg;
            delBtn.addEventListener('click', async (e)=>{
                delBtn.style.display="none";
                await chrome.runtime.sendMessage(
                    {
                        action:"delWord",
                        text:word.id
                    }
                ).then(response=>{
                    console.log(response);
                    if (response){
                        div.style.display='none';
                    }
                    else{
                        delBtn.style.display ="inline-block";
                    }
                });
            });
            //点击单词后显示新页面
            // div.addEventListener('click', () => {
            //     showWordDetail(word);
            //     suggestions.style.display = 'none';
            // });
            div.appendChild(delBtn);
            suggestions.appendChild(div);
            // suggestions.appendChild(delBtn);
        });
        suggestions.style.display = 'block';
    }
}

// 防 XSS
function escapeHTML(str) {
    const div = document.createElement('div');
    div.textContent = str;
    return div.innerHTML;
}

// 点击页面其他地方关闭候补
document.addEventListener('click', (e) => {
    if (!e.target.closest('.searchbox')) {
        suggestions.style.display = 'none';
    }
});
//手动录入单词
document.getElementById("savewordBtn").addEventListener("click", () => {
    const key = document.getElementById("saveword").value;
    doSave(key);
});
async function doSave(key) {
    const response = await chrome.runtime.sendMessage({
        action: "saveWord",
        text: key
    });
}
// 翻译功能
// document.getElementById('translateBtn').addEventListener("click",()=>{
//     const key=document.getElementById("translate").value;
//     translate(key);
// });
// async function translate(key){
//     const response = await chrome.runtime.sendMessage({
//         action:"translate",
//         text:key
//     });
//     const translation=document.getElementById('translation');
//     translation.innerHTML = `
//                 <span class="item">${escapeHTML(response)}</span>
//             `;
//     //点击单词后显示新页面
//     div.addEventListener('click', () => {
//         showWordDetail(word);
//         suggestions.style.display = 'none';
//     });

// }

// 定义导入进度的弹窗
const dialog = document.getElementById('importDialog');
const curImport = document.createElement('p');
const result = document.createElement('p');
dialog.appendChild(curImport);
dialog.appendChild(result);

// 定义成功和失败
let oknum = '';
let errnum = '';

// 导入函数
async function importWord(action, text, name) {
    curImport.textContent = '正在导入：' + name;

    const response = await chrome.runtime.sendMessage({ action, text });

    if (response.ok) {
        oknum += name + ',';
    } else {
        errnum += name + '<br>' + response.error + '<br>';
    }
    result.innerHTML = '成功：' + oknum + '<br>失败：' + errnum;
}

//单词导入
//根据导入的文件格式，选择处理方式
// name;translate;usphone;suggestion
// 英文；翻译；读音；记忆建议
document.getElementById('importBtn').addEventListener('click', (event) => {
    const inputFile = document.getElementById('importFile');
    const file = inputFile.files[0];
    if (!file) return;
    const reader = new FileReader();

    reader.onload = async (e) => {
        // 获取文件数据
        const content = e.target.result;
        dialog.showModal();

        switch (file.type) {
            case 'application/json':
                // 显示弹窗
                
                for (const item of JSON.parse(content)) {
                    await importWord('saveWord', item.name, item.name);
                }
                break;
            case 'text/plain':
                for (const data of content.split('\n')) {
                    const word = data.split(/[;；]/);
                    const name = word[0];
                    // 判断翻译存在与否插入或保存单词
                    const action = word[1].trim() ? 'insertWord' : 'saveWord';
                    const text = word[1].trim() ? word : name;

                    await importWord(action, text, name);
                }
                break;
        }
        curImport.textContent = '导入完成';
    };
    reader.readAsText(file);
});

// 创建下载
function download(content, filename = 'words.txt') {
    const blob = new Blob([content], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    a.click();
    URL.revokeObjectURL(url);  // 释放内存
}
// 单词导出
document.getElementById('exportBtn').addEventListener('click', async (e)=>{
    const response = await chrome.runtime.sendMessage({
        action: "getallWord",
        text:""
    });
    //构建字段
    let words = Object.keys(response[0]).join(';')+'\n';
    // console.log(response);
    for (const word of response) {
        // console.log(word.name);
        const row = Object.values(word).join(';');
        words += row + '\n';
    }
    download(words);
});
