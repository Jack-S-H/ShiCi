import { deletename, getall } from "./indexedBD.js";

/**
 * 
 */
//定义单词表列
const displaytablehead = ["name", "usphone", "translate", "suggestion", "date","操作"];

// 初始化：恢复已保存的 key
(async () => {
    const result = await chrome.storage.local.get('deepseekapikey');
    const savedKey = result.deepseekapikey || "";
    document.getElementById('apikey').value = savedKey;
})();
// 提交按钮：保存 key
document.getElementById("submit").addEventListener("click", () => {
    const key = document.getElementById("apikey").value;
    chrome.storage.local.set({ deepseekapikey: key }).then(() => {
    });
});
//单词表生成
document.addEventListener("DOMContentLoaded",async ()=>{
    const items = await getall();
    const table = document.createElement('table');
    table.border = '1';

    const thead=document.createElement('thead');
    const tr = document.createElement('tr');
    
    for (const key of displaytablehead) {
        const th = document.createElement('th')
        th.textContent = key;
        tr.appendChild(th);
    }

    thead.appendChild(tr);
    table.appendChild(thead);
    
    const tbody=document.createElement('tbody');
    for (const item of items) {
        const tr = document.createElement('tr');
        for (const key of displaytablehead.slice(0,-1)) {
            const td = document.createElement('td')
            td.textContent = item[key];
            tr.appendChild(td);
        }

        const td=document.createElement('td');
        const delbutton=document.createElement('button');
        td.appendChild(delbutton);
        delbutton.textContent="删除";
        delbutton.className="delete";
        delbutton.setAttribute("data-id",item.id);
        tr.appendChild(td);

        delbutton.addEventListener("click", (event) => {
            deletename(Number(event.target.getAttribute("data-id")));
            if (document.startViewTransition) {
                document.startViewTransition(() => tr.remove());
            } else {
                tr.remove();
            }
        });
        tbody.appendChild(tr);
    }
    table.appendChild(tbody);
    document.getElementsByTagName('body')[0].appendChild(table);

    const headerCells = table.tHead.rows[0].cells;
    for (const th of headerCells) {

        th.setAttribute("data-sort", "asc");

        const cellIndex = th.cellIndex;

        th.addEventListener("click", () => {

            const tBody = table.tBodies[0];
            const rows= Array.from(tBody.rows);
            if (rows.length === 0) return;

            const current = th.getAttribute("data-sort") || "asc";
            const newDirct = current === "asc" ? "desc" : "asc";
            th.setAttribute("data-sort", newDirct);

            rows.sort((tr1, tr2) => {
                const tr1Text = tr1.cells[cellIndex].textContent;
                const tr2Text = tr2.cells[cellIndex].textContent;
                const cmp= tr1Text.localeCompare(tr2Text);
                return newDirct=="asc"? cmp:-cmp;
            });
            tBody.append(...rows);
        });
    }
});
