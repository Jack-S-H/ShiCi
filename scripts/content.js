function saveWord() {
    const selection=window.getSelection();
    //Selection {anchorNode: text, anchorOffset: 9, focusNode: text, focusOffset: 11, isCollapsed: false, …}
    const selectedText=selection.toString().trim();
    //'响应'
    if (!selectedText) return;
    if (!/[a-zA-Z]/.test(selectedText)) return;
    //选取文字所在的网址
    const baseUrl=selection.anchorNode.baseURI;
    //选取范围内的文字
    const textContent = selection.anchorNode.textContent;
    //获取元素的range对象
    const range=selection.getRangeAt(0);

    const parentText=range.commonAncestorContainer.textContent.trim();
    const parentElement=range.commonAncestorContainer.parentElement;
    //更大范围内的文字
    // const parentText=parentElement.innerText.trim();

    if (parentElement.classList.contains('wavy-underline')) {
        return;
    }
    console.log("发送方：",range);
    chrome.runtime.sendMessage(
        {
            action: 'saveWord',
            text: selectedText
        }
    )
        .then(response => {
            console.log(response);
            
        })
        .catch(error => console.error('翻译请求失败:', error));
    markWord(range);

}
//考虑使用以下新技术重构
// 创建 Highlight 对象，设置 priority
// 循环查找所有目标文本节点，为每个匹配项创建 Range
// 将所有 Range 添加到 Highlight 对象
// 注册：CSS.highlights.set("my-highlight", highlight)
// CSS: :: highlight(my - highlight) { text - decoration: underline; }

function markWord(range){
    //创建包裹元素
    const span = document.createElement('span');
    span.style.textDecoration = 'underline wavy';
    span.style.textUnderlineOffset = '4px';
    span.style.textDecorationColor = '#e74c3c';
    span.classList.add('underline-wavy');
    span.addEventListener('mouseenter', (event) => showcard(event, span));
    span.addEventListener('mouseleave', hidecard);

    const { startContainer, startOffset, endContainer, endOffset } = range;
    //尝试处理文字
    //可以通过startContainer, startOffset, endContainer, endOffset来跳过开头和结尾的空格？
    try {
        range.surroundContents(span);
        console.log('简单选择');
        return;
    } catch (e) {
        // 进入方案2
        console.warn('跨元素选择:',e);
    }
    // 分割文本节点并包裹
    // 收集所有在范围内的文本节点（使用 TreeWalker 从 startContainer 到 endContainer）
    const textNodes = [];
    const walker = document.createTreeWalker(
        range.commonAncestorContainer,   // 从共同祖先遍历
        NodeFilter.SHOW_TEXT,
        {
            acceptNode: function (node) {
                // 只处理选区内的文本节点（判断：节点在 range 内或部分在内）
                if (!range.intersectsNode(node)) {
                    return NodeFilter.FILTER_REJECT;
                }
                if (node.textContent.trim() === '') {
                    return NodeFilter.FILTER_SKIP; // 跳过空白文本
                }
                return NodeFilter.FILTER_ACCEPT;
            }
        }
    );
    //尝试使用while直接处理,可以把文本节点处理放到外面，创建单独的函数，在while中调用
    //逻辑太复杂了，优化？
    let node;
    while ((node = walker.nextNode())) {
        textNodes.push(node);
    }

    // 对每个文本节点进行处理
    textNodes.forEach((textNode) => {
        // 确定该节点的哪些部分在 range 内
        const nodeRange = document.createRange();
        nodeRange.selectNode(textNode);

        // 计算在当前文本节点上的偏移
        const start = textNode === startContainer ? startOffset : 0;
        const end = textNode === endContainer ? endOffset : textNode.length;

        // 如果整个节点都在 range 内，直接包裹
        if (start === 0 && end === textNode.length) {

            textNode.parentNode.replaceChild(span, textNode);
            span.appendChild(textNode);
            return;
        }

        // 否则需要分割节点：保留范围外的部分，包裹范围内的部分
        // 先分割出右侧多余部分，再分割左侧多余部分，中间部分即为选区内容
        // 分割后文本位置可能会改变，所以按 end 从后向前分较为安全
        let targetNode = textNode;

        // 先分割出右侧多余部分，结束的尾部，如果结束位置不是末尾
        if (end < textNode.length) {
            targetNode.splitText(end);
        }

        // 分割出左侧多余部分，如果开始位置 > 0，此时 targetNode 变为包含选区内容的部分
        if (start > 0) {
            const leftPart = targetNode.splitText(start);
            targetNode = leftPart; // leftPart 现在包含从 start 到原来 end 的内容
        }

        // 现在 targetNode 正好是选区范围内的文本节点
        targetNode.parentNode.replaceChild(span, targetNode);
        span.appendChild(targetNode);
    });
}

document.addEventListener('dblclick',saveWord);
document.addEventListener('keydown', function (event) {
    if (event.key === 's' || event.key === 'S') {
        snatchword();
    }
});


//鼠标移到划线单词上去显示单词卡片
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
            action:"delWord",
            text:card.getAttribute("data-id")
        })
            .then(response => {
                console.log("删除成功：",response);

            })
            .catch(error => console.error('删除失败:', error));
    }
});

async function showcard(event, el) {
    const keyword = el.textContent.trim().toLowerCase();
    let word;
    let translation;
    let usphon;
    let suggestion;
    // console.log(keyword);
    const result = await searchWordwithRetry(keyword, 30, 1000);
    // console.log(result);
    if (!result) return;


    word = result.name;
    translation = result.translate;
    usphon = result.usphone;
    suggestion = "记忆建议：" + result.suggestion;

    // 填充内容
    card.querySelector('.word').textContent = word;
    card.querySelector('.usphon').textContent = usphon;
    card.querySelector('.translation').textContent = translation;
    card.querySelector('.suggestion').textContent = suggestion;
    card.setAttribute("data-id",result.id);

    // 显示弹窗
    card.style.display = 'block';

    // 定位弹窗：在下划线下方
    positioncard(event);
}

function hidecard() {
    card.style.display = 'none';
}

//考虑根据元素位置定位而不是鼠标位置？
function positioncard(event) {
    const mouseX = event.clientX;
    const mouseY = event.clientY;

    // 先显示再获取其尺寸
    let left = mouseX;
    let top = mouseY + 15;  // 鼠标下方 15px

    // 防止超出右边界
    if (left + card.offsetWidth > window.innerWidth) {
        left = window.innerWidth - card.offsetWidth - 10;
    }

    // 防止超出下边界
    if (top + card.offsetHeight > window.innerHeight) {
        top = mouseY - card.offsetHeight - 10;  // 显示在鼠标上方
    }

    card.style.left = left + 'px';
    card.style.top = top + 'px';
}

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
            // console.error('所有重试均失败');
            return null;
        }
        // 等待指定时间后递归调用
        await new Promise(resolve => setTimeout(resolve, Ms));
        // console.log("重试");
        return searchWordwithRetry(keyword, times - 1, Ms);
    }
}

//针对单页网站的响应
// const observer = new MutationObserver((mutations) => {
//     for (const mutation of mutations) {
//         // If a new article was added.
//         for (const node of mutation.addedNodes) {
//             if (node instanceof Element && node.tagName === 'ARTICLE') {
//                 // Render the reading time for this particular article.
//                 renderReadingTime(node);
//             }
//         }
//     }
// });

// https://developer.chrome.com/ is a SPA (Single Page Application) so can
// update the address bar and render new content without reloading. Our content
// script won't be reinjected when this happens, so we need to watch for
// changes to the content.
// observer.observe(document.querySelector('devsite-content'), {
//     childList: true
// });
if (document.readyState !== 'loading') {
    // 情况一：脚本注入时，页面DOM已经就绪（如 `run_at` 为 `document_idle`），直接执行
    initmark();
} else {
    // 情况二：脚本注入时，页面还在加载，则等待 `DOMContentLoaded` 事件
    document.addEventListener('DOMContentLoaded', initmark);
}
//目前还无法处理跨元素单词？
async function initmark(){
// 用treeworker遍历，获取数据库key，对照，创建range，调用mark函数
    const targetNode = document.getElementsByTagName("body")[0];
    const wordlist=await chrome.runtime.sendMessage({
        action:"getallWord",
        text:""
    });
    const walker = document.createTreeWalker(targetNode,NodeFilter.SHOW_TEXT);
    let node;
    const Nodes = [];
    while ((node = walker.nextNode())) {
        Nodes.push(node);
    }

    function isWordBoundary(text, index, word) {
        const charBefore = text[index - 1];
        const charAfter = text[index + word.length];
        const isWordChar = (ch) => ch && /[a-zA-Z0-9_]/.test(ch);
        return !isWordChar(charBefore) && !isWordChar(charAfter);
    }

    const ranges = [];
    for (const Node of Nodes) {
        const content = Node.textContent.toLowerCase();
        for (const item of wordlist) {
            const word = item.searchname;
            let startIndex = 0;
            while ((startIndex = content.indexOf(word, startIndex)) !== -1) {
                if(isWordBoundary(content,startIndex,word)){
                    const range = document.createRange();
                    range.setStart(Node, startIndex);
                    range.setEnd(Node, startIndex + word.length);
                    ranges.push(range);
                }
                startIndex += word.length; // 跳过已匹配的部分
            }
        }
    }

    for (let i = ranges.length - 1; i >= 0; i--) {
        markWord(ranges[i]);
    }
    // while (node = wholetree.nextNode()) {
    //     console.log(node);
    //     for (const items of wordlist){
    //         const word=items.name;
    //         const index = node.textContent.indexOf(word);
    //         if(index==-1) continue;
    //         const range=document.createRange();
    //         range.setStart(node,index);
    //         range.setEnd(node,word.length);
    //         console.log(range);
    //         markWord(range);
    //     }
    // }
    // try{
    //     const wordlist = await chrome.runtime.sendMessage({
    //         action: "getallkeys",
    //         text: "name"
    //     });
    // }catch(e){
    //     console.log("获取单词列表失败：",e);
    // }

}

const connectport = chrome.runtime.connect({ name: 'indexedDB-change-pipeline' });
connectport.onMessage.addListener((msg)=>{
    if(msg.action==='marksUpdated'){
        initmark();
    }
});

connectport.onDisconnect.addListener(() => {
    const delay = 1000 + Math.random() * 2000;
    setTimeout(createMarksPort, delay);
});

const observerOptions = { subtree: true, childList: true };
// const observercallback =