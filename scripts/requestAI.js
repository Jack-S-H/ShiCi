import { en2zh } from "../prompt/en2zh.js";
export async function requestAI(data,apikey) {
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
                        "content": en2zh(),
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