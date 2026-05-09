function snatchword() {
    const selection=window.getSelection();
    
    const selectedText=selection.toString().trim();
    if (!selectedText) return;
    //选取文字所在的网址
    const baseUrl=selection.anchorNode.baseURI;
    //选取范围内的文字
    const textContent = selection.anchorNode.textContent;
    //获取元素的range对象
    const range=selection.getRangeAt(0);
    const parentElement=range.commonAncestorContainer.parentElement;
    if (parentElement && parentElement.classList.contains('wavy-underline')) {
        return;
    }
    //更大范围内的文字
    const parentText=parentElement.innerText;
    //尝试处理文字
    try {
        const span = document.createElement('span');
        span.style.textDecoration = 'underline wavy';
        span.style.textUnderlineOffset = '4px';
        span.style.textDecorationColor = '#e74c3c'; // 你的主题色
        span.classList.add('wavy-underline');        // 保留类名，方便后续操作

        range.surroundContents(span);
        console.log('✅ 简单选择，直接包裹成功');
        return; // 成功就直接返回
    } catch (e) {
        // 跨元素选择，进入降级方案
        console.warn('⚠️ 跨元素选择，进入降级方案');
    }
    //？为什么错误处理逻辑可以不在catch中
    //尝试降级处理
    const fragment=range.extractContents();
    //开始创建遍历，使用span包裹
    const walker = document.createTreeWalker(
        fragment,
        NodeFilter.SHOW_TEXT,
        {
            acceptNode: function (node) {
                // 自定义过滤：跳过空白文本
                if (node.textContent.trim() === '') {
                    return NodeFilter.FILTER_REJECT;
                }
                return NodeFilter.FILTER_ACCEPT;
            }
        }
    );

    const textNodes = [];
    let node;
    while (node = walker.nextNode()) {
        textNodes.push(node);
    }

    // 逐个包裹
    textNodes.forEach(node => {
        const span = document.createElement('span');
        span.classList.add('wavy-underline');
        node.parentNode.replaceChild(span, node);
        span.appendChild(node);
    });

    range.insertNode(fragment);

}

document.addEventListener('dblclick',snatchword);

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