/**
 * 在网页上显示单词卡片
 */

//创建全局弹窗元素
const card = document.createElement('div');
card.className = 'snatch-wordcard';
card.innerHTML = `
    <div class="word"></div>
    <div class="usphon"></div>
    <div class="translation"></div>
    <div class="suggestion"></div>
`;
document.body.appendChild(card);
document.addEventListener('keydown', function (event) {
    if (event.key === 'Delete' && event.ctrlKey) {
        chrome.runtime.sendMessage({
            action: "delWord",
            text: card.getAttribute("data-id")
        })
            .then(response => {
                console.log("删除成功：", response);
            })
            .catch(error => console.error('删除失败:', error));
    }
});
//主程序
async function showcard(event, element) {
    const keyword = element.textContent.trim().toLowerCase();
    let word;
    let translation;
    let usphon;
    let suggestion;
    const result = await searchWordwithRetry(keyword, 30, 1000);
    if (!result) return;


    word = result.name;
    translation = result.translate;
    usphon = result.usphone;
    suggestion = "记忆建议：" + result.suggestion;

    card.querySelector('.word').textContent = word;
    card.querySelector('.usphon').textContent = usphon;
    card.querySelector('.translation').textContent = translation;
    card.querySelector('.suggestion').textContent = suggestion;
    card.setAttribute("data-id", result.id);

    card.style.display = 'block';

    positioncard(element);
}

// 点击页面其他地方关闭card
document.addEventListener('click', (e) => {
    if (!e.target.closest('.snatch-wordcard')) {
        card.style.display = 'none';
    }
});

// 定位弹窗
function positioncard(element) {
    const rect = element.getBoundingClientRect();

    let left=rect.left;
    let top=rect.bottom;

    // 防止超出右边界
    if (left+card.offsetWidth > window.innerWidth) {
        left = window.innerWidth - card.offsetWidth - 10;
    }

    // 防止超出下边界
    if (top + card.offsetHeight > window.innerHeight) {
        top = mouseY - card.offsetHeight - 10;
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