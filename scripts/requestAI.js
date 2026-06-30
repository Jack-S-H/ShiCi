/**
 * 所有调用大模型的函数都定义在这个文件中。
 * 这里不处理错误，需要在调用时处理
 * 函数输出：如果成功就输出大模型回复的内容，如果失败就抛出错误
*/

export async function requestAI(sysprompt,data,apikey) {
    try{
        let response=await fetch("https://api.deepseek.com/chat/completions", {
            method: "POST",
            mode: "cors",
            headers: {
                "Content-Type": "application/json",
                "Accept": "application/json",
                "Authorization": `Bearer ${apikey}`
            },
            body: JSON.stringify({
                "messages": [
                    {
                        "content": sysprompt,
                        "role": "system"
                    },
                    {
                        "content": "现在，请翻译以下内容并以 JSON 形式返回：" + data,
                        "role": "user"
                    }
                ],
                "model": "deepseek-v4-flash",
                "thinking": {
                    "type": "disabled"
                },
                "temperature": 0.1,
                "max_tokens": 500,
                "response_format": {
                    "type": "text"
                },
                "stop": null,
                "stream": false
            }),
        });
        if (!response.ok) {
            const errorText = await response.text();
            throw new Error(`HTTP ${response.status}: ${errorText}`);
        }

        const jsonData = await response.json();
        return jsonData;
    }
    catch (error) {
        console.error('请求失败:', error);
        throw error;
    }
}