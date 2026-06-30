/**
 * 在网页上显示单词卡片
 */
const trashsvg = `
<svg id='shici-delBtn' viewBox="0 0 640 640" xmlns="http://www.w3.org/2000/svg" xmlns:svg="http://www.w3.org/2000/svg">
  <!--!Font Awesome Free v7.2.0 by @fontawesome - https://fontawesome.com License - https://fontawesome.com/license/free Copyright 2026 Fonticons, Inc.-->
  <g class="layer">
    <title>删除</title>
    <path
      d="m262.2,48c-13.3,0 -25.3,8.3 -30,20.8l-16.2,43.2l-96,0c-13.3,0 -24,10.7 -24,24c0,13.3 10.7,24 24,24l400,0c13.3,0 24,-10.7 24,-24c0,-13.3 -10.7,-24 -24,-24l-96,0l-16.2,-43.2c-4.7,-12.5 -16.6,-20.8 -30,-20.8l-115.6,0z"
      id="svg_1"></path>
    <path
      d="m128,198l0,304c0,35.3 28.7,64 64,64l256,0c35.3,0 64,-28.7 64,-64l0,-304l-48,0l0,304c0,8.8 -7.2,16 -16,16l-256,0c-8.8,0 -16,-7.2 -16,-16l0,-304l-48,0zm160,72c0,-13.3 -10.7,-24 -24,-24c-13.3,0 -24,10.7 -24,24l0,176c0,13.3 10.7,24 24,24c13.3,0 24,-10.7 24,-24l0,-176zm112,0c0,-13.3 -10.7,-24 -24,-24c-13.3,0 -24,10.7 -24,24l0,176c0,13.3 10.7,24 24,24c13.3,0 24,-10.7 24,-24l0,-176z"
      id="svg_2"></path>
  </g>
</svg>
`;
//创建全局弹窗元素
const card = document.createElement('div');
card.className = 'shici-wordcard';
card.innerHTML = `
    <div class="head">
        <div class="word"></div>
        ${trashsvg}
    </div>
    <div class="usphon"></div>
    <div class="translation"></div>
    <div class="suggestion"></div>
`;
card.addEventListener('mouseenter',(e)=>{
    isincard=true;
});
card.addEventListener('mouseleave',(e)=>{
    isincard=false;
    const timer = setTimeout(() => {
        if(!isinword){
        card.style.display='none';
    }
    }, 1);
});
document.body.appendChild(card);

let delBtn=document.getElementById("shici-delBtn");
delBtn.addEventListener('click',(e)=>{
    chrome.runtime.sendMessage({
        action: "delWord",
        text: card.getAttribute("data-id")
    })
        .then(response=>{
            if(response){
                card.style.display="none";
            }
        })
});
//主程序
async function showcard(element) {
    delBtn.style.display='inline-block';
    // console.log("选择的元素：", element);
    // const keyword = element.firstChild?.textContent?.trim().toLowerCase() ||
    //     element.textContent.trim().toLowerCase();
    
    const keyword=element.textContent.trim().toLowerCase();

    const result = await searchWordwithRetry(keyword, 30, 1000);
    if (!result) return;

    let word = result.name;
    let translation = result.translate;
    let usphon = result.usphone;
    let suggestion = "记忆建议：" + result.suggestion;

    card.querySelector('.word').textContent = word;
    card.querySelector('.usphon').textContent = usphon;
    card.querySelector('.translation').textContent = translation;
    card.querySelector('.suggestion').textContent = suggestion;
    card.setAttribute("data-id", result.id);

    card.style.display = 'block';

    positioncard(element);
}
async function show_translation_card(content){

    delBtn.style.display='none';

    card.querySelector('.word').textContent = '';
    card.querySelector('.usphon').textContent = '';
    card.querySelector('.translation').textContent = content;
    card.querySelector('.suggestion').textContent = '';
    card.setAttribute("data-id", '');
    card.style.display='block';
    positioncard();
}

// 定位弹窗
function positioncard(element=null) {
    if(!element){
        card.style.left = '10px';
        card.style.top = '10px';
        return;
    }
    const rect = element.getBoundingClientRect();

    let left=rect.left;
    let top=rect.bottom;

    // 防止超出右边界
    if (left+card.offsetWidth > window.innerWidth) {
        left = window.innerWidth - card.offsetWidth - 30;
    }

    // 防止超出下边界
    if (top + card.offsetHeight > window.innerHeight) {
        top = window.innerHeight - card.offsetHeight - 30;
    }

    card.style.left = left + 'px';
    card.style.top = top + '2px';
}
// 搜索数据库
async function searchWordwithRetry(keyword, times, Ms) {
    try {
        const response = await chrome.runtime.sendMessage(
            {
                action: 'searchByName',
                text: keyword
            }
        );
        if (!response) throw new error();
        return response;
    } catch (error) {
        if (times <= 1) {
            return null;
        }
        // 等待指定时间 毫秒，可以暂停async函数
        await new Promise(resolve => setTimeout(resolve, Ms));
        return searchWordwithRetry(keyword, times - 1, Ms);
    }
}
//删除单词快捷键的定义
// document.addEventListener('keydown', function (event) {
//     if (event.key === 'Delete' && event.ctrlKey) {
//         chrome.runtime.sendMessage({
//             action: "delWord",
//             text: card.getAttribute("data-id")
//         })
//             .then(response => {
//                 console.log("删除成功：", response);
//             })
//             .catch(error => console.error('删除失败:', error));
//     }
// });
// 点击页面其他地方关闭card
// document.addEventListener('click', (e) => {
//     if (!e.target.closest('.snatch-wordcard')) {
//         card.style.display = 'none';
//     }
// });