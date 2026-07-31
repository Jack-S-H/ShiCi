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
    // 获取所有数据
    const items = await getall();
    // 创建表格元素
    const table = document.createElement('table');
    table.border = '1';
    // 创建表头
    const thead=document.createElement('thead');
    const tr = document.createElement('tr');
    for (const key of displaytablehead) {
        const th = document.createElement('th')
        th.textContent = key;
        tr.appendChild(th);
    }
    
    // 将表头添加进表格元素
    thead.appendChild(tr);
    table.appendChild(thead);
    // 创建表体
    const tbody=document.createElement('tbody');
    for (const item of items) {
        const tr = document.createElement('tr');
        for (const key of displaytablehead.slice(0,-1)) {
            const td = document.createElement('td')
            td.textContent = item[key];
            tr.appendChild(td);
        }

        const td=document.createElement('td');
        //定义删除按钮
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
    document.getElementsByTagName('main')[0].appendChild(table);
    
    // 设置排序
    const headerCells = table.tHead.rows[0].cells;
    for (const th of headerCells) {
        // 设置表头排序方向
        th.setAttribute("data-sort", "asc");
        // 获取列名
        const columnName = th.textContent.trim();
        // 获取列序号
        const cellIndex = th.cellIndex;
        th.addEventListener("click", () => {

            const tBody = table.tBodies[0];
            //获取表格行数据
            const rows= Array.from(tBody.rows);
            if (rows.length === 0) return;
            // 判断正序或倒序排列
            // 先获取目前的状态
            const current = th.getAttribute("data-sort") || "asc";
            // 设置新状态
            const newDirct = current === "asc" ? "desc" : "asc";

            th.setAttribute("data-sort", newDirct);
            // sort逻辑为遍历rows，返回负数，则tr1在前，反之tr2在前
            // 所以将第一个元素tr1-第二个元素tr2，如果为asc则小的在前，反之小的在后
            rows.sort((tr1, tr2) => {
                const tr1Text = tr1.cells[cellIndex].textContent;
                const tr2Text = tr2.cells[cellIndex].textContent;

                if (columnName == "date"){
                    const cmp = new Date(tr1Text) - new Date(tr2Text);
                    return newDirct == "asc" ? cmp : -cmp;
                }
                else{
                    const cmp = tr1Text.localeCompare(tr2Text);
                    return newDirct == "asc" ? cmp : -cmp;
                }
            });
            tBody.append(...rows);
        });
    }
});
