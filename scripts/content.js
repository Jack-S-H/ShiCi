function saveWord() {
    const selection=window.getSelection();
    const selectedText=selection.toString().trim();
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
    try {
        range.surroundContents(span);
        console.log('简单选择');
        return;
    } catch (e) {
        console.warn('跨元素选择:',e);
    }
    // 分割文本节点并包裹
    const textNodes = [];
    const walker = document.createTreeWalker(
        range.commonAncestorContainer, 
        NodeFilter.SHOW_TEXT,
        {
            acceptNode: function (node) {
                if (!range.intersectsNode(node)) {
                    return NodeFilter.FILTER_REJECT;
                }
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

    // 对每个文本节点进行处理
    textNodes.forEach((textNode) => {
        const nodeRange = document.createRange();
        nodeRange.selectNode(textNode);

        // 计算在当前文本节点上的偏移
        const start = textNode === startContainer ? startOffset : 0;
        const end = textNode === endContainer ? endOffset : textNode.length;

        if (start === 0 && end === textNode.length) {

            textNode.parentNode.replaceChild(span, textNode);
            span.appendChild(textNode);
            return;
        }
        let targetNode = textNode;

        if (end < textNode.length) {
            targetNode.splitText(end);
        }

        if (start > 0) {
            const leftPart = targetNode.splitText(start);
            targetNode = leftPart; 
        }

        
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
    
    const result = await searchWordwithRetry(keyword, 30, 1000);
    
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

    
    let left = mouseX;
    let top = mouseY + 15;  

    
    if (left + card.offsetWidth > window.innerWidth) {
        left = window.innerWidth - card.offsetWidth - 10;
    }

    
    if (top + card.offsetHeight > window.innerHeight) {
        top = mouseY - card.offsetHeight - 10;  
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
            
            return null;
        }
        
        await new Promise(resolve => setTimeout(resolve, Ms));
        
        return searchWordwithRetry(keyword, times - 1, Ms);
    }
}

if (document.readyState !== 'loading') {
    
    initmark();
} else {
    
    document.addEventListener('DOMContentLoaded', initmark);
}

async function initmark(){

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
                startIndex += word.length; 
            }
        }
    }

    for (let i = ranges.length - 1; i >= 0; i--) {
        markWord(ranges[i]);
    }
    
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
