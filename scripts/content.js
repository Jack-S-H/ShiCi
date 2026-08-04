/**
 *_____ _     _   _____ _  
/  ___| |   (_) /  __ (_) 
\ `--.| |__  _  | /  \/_  
 `--. \ '_ \| | | |   | | 
/\__/ / | | | | | \__/\ | 
\____/|_| |_|_|  \____/_| 
 *
 * 这个文件实现的功能主要是保存和标记元素
 * 
*/
let isincard=false;
let isinword=false;
function saveWord() {
    const selection=window.getSelection();
    //Selection {anchorNode: text, anchorOffset: 9, focusNode: text, focusOffset: 11, isCollapsed: false, …}
    const selectedText=selection.toString().trim();
    //简单判断选取的内容是否符合规范
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

    if (parentElement.classList.contains('underline-wavy')) {
        return;
    }
    // console.log("发送方：",range);
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
/**
 * 先尝试直接标记节点，再进行跨节点标记
 * 使用TreeWalker收集所有在范围内的文本节点
 * 判断元素在该节点的哪些部分
 * 计算在当前文本节点上的偏移
 * 如果发现元素全部在该节点内，就直接提取这部分进行标记
 * 否则需要分割节点：保留范围外的部分，包裹范围内的部分
 * 先分割出右侧多余部分，再分割左侧多余部分，中间部分即为选区内容
 * 分割后文本位置可能会改变，所以按end从后向前分较为安全
 * 
 * @param {*} range 
 * @returns 
 */
function markWord(range){
    //创建包裹元素
    const span = document.createElement('span');
    span.style.textDecoration = 'underline wavy';
    span.style.textUnderlineOffset = '4px';
    span.style.textDecorationColor = '#e74c3c';
    span.classList.add('underline-wavy');
    span.addEventListener('mouseenter', (event) =>{
        isinword = true;
        showcard(span);
    });
    span.addEventListener('mouseleave', (e) => {
        isinword = false;
        const timer = setTimeout(() => {
            if (!isincard) {
                card.style.display = 'none';
            }
        }, 1);
        

    });
    const { startContainer, startOffset, endContainer, endOffset } = range;

    try {
        range.surroundContents(span);
        console.log('简单选择');
        return;
    } catch (e) {
        console.warn('选择错误:',e.name+":"+e.message);
    }

    const textNodes = [];
    const walker = document.createTreeWalker(
        range.commonAncestorContainer,
        NodeFilter.SHOW_TEXT,
        {
            acceptNode(node) {
                if (!range.intersectsNode(node)) {
                    return NodeFilter.FILTER_REJECT;
                }
                //跳过空白文本
                if (node.textContent.trim() === '') {
                    return NodeFilter.FILTER_SKIP;
                }
                return NodeFilter.FILTER_ACCEPT;
            }
        }
    );

    let node;
    while ((node = walker.nextNode())) {
        textNodes.push(node);
    }

    textNodes.forEach((textNode) => {
        const nodeRange = document.createRange();
        nodeRange.selectNode(textNode);

        const start = textNode === startContainer ? startOffset : 0;
        const end = textNode === endContainer ? endOffset : textNode.length;

        if (start === 0 && end === textNode.length) {
            textNode.parentNode.replaceChild(span, textNode);
            span.appendChild(textNode);
            return;
        }

        let targetNode = textNode;

        // 先分割出右侧多余部分，结束的尾部，如果结束位置不是末尾
        if (end < textNode.length) {
            targetNode.splitText(end);
        }

        // 分割出左侧多余部分，如果开始位置 > 0，此时 targetNode 变为包含选区内容的部分
        if (start > 0) {
            const leftPart = targetNode.splitText(start);
            targetNode = leftPart;
            // leftPart 现在包含从 start 到原来 end 的内容
        }
        // 现在 targetNode 正好是选区范围内的文本节点
        targetNode.parentNode.replaceChild(span, targetNode);
        span.appendChild(targetNode);
    });
}

// function isinputable(selection) {
//     const node = selection.anchorNode;
//     if (!node) return false;
//     const element = node.nodeType === Node.TEXT_NODE ? node.parentElement : node;
//     return element.closest('input, textarea, [contenteditable="true"]') !== null;
// }
document.addEventListener('dblclick',saveWord);
document.addEventListener('keydown', function (event) {
    if (event.ctrlKey && event.altKey && event.key.toLowerCase() === 's') {
        saveWord();
    }
});
document.addEventListener('keydown', function (event) {
    if (event.ctrlKey && event.altKey && event.key.toLowerCase() === 't') {
        translate();
    }
});
async function translate() {
    const selection = window.getSelection();
    //Selection {anchorNode: text, anchorOffset: 9, focusNode: text, focusOffset: 11, isCollapsed: false, …}
    const selectedText = selection.toString().trim();
    //简单判断选取的内容是否符合规范
    if (!selectedText) return;
    if (!/[a-zA-Z]/.test(selectedText)) return;

    chrome.runtime.sendMessage(
        {
            action: 'translate',
            text: selectedText
        }
    )
        .then(show_translation_card)
        .catch(error => console.error('翻译请求失败:', error));
}

requestIdleCallback(initmark);

/**
 * 用treeworker遍历，获取数据库key，对照，创建range，调用mark函数
 * 因为少了range信息，所以目前还无法处理跨元素的单词
 */
async function initmark(){
    const targetNode = document.getElementsByTagName("body")[0];
    const wordlist=await chrome.runtime.sendMessage({
        action:"getallWord",
        text:""
    });
    if (!targetNode) return;
    const walker = document.createTreeWalker(targetNode, NodeFilter.SHOW_TEXT);
    let node;
    const Nodes = [];
    while ((node = walker.nextNode())) {
        // console.log(node.parentElement.className);
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
                startIndex += word.length;
            }
        }
    }

    for (let i = ranges.length - 1; i >= 0; i--) {
        markWord(ranges[i]);
    }

}
//自定义快捷键的测试代码
// chrome.runtime.onMessage.addListener((message,sender,sendResponse)=>{
//     switch(message.action){
//         case "saveWord":
//             saveWord();
//     }
// })