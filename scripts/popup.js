
document.getElementById('openOptions').addEventListener('click',()=>{
    chrome.runtime.openOptionsPage();
    
})
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
                <span class="word">${escapeHTML(word.name)}</span>
                <span class="usphone">${escapeHTML(word.usphone)}</span>
                <span class="translation">${escapeHTML(word.translate)}</span>
            `;
            suggestions.appendChild(div);
        });
        suggestions.style.display = 'block';
    }
}

function escapeHTML(str) {
    const div = document.createElement('div');
    div.textContent = str;
    return div.innerHTML;
}

document.addEventListener('click', (e) => {
    if (!e.target.closest('.searchbox')) {
        suggestions.style.display = 'none';
    }
});

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