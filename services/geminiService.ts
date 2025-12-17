import { AnalysisResult, NewsItem } from '../types';

// Directly use the provided API Key to avoid any build-time injection issues
const API_KEY = "sk-mkduhzolnutgyagkhuvivocucmzrjgczzkmjwfgziwvgygtw";
const BASE_URL = 'https://api.siliconflow.cn/v1/chat/completions';
const MODEL = 'deepseek-ai/DeepSeek-V3.1-Terminus'; 

const FALLBACK_IMAGES = [
  'https://images.unsplash.com/photo-1504711434969-e33886168f5c?w=800&auto=format&fit=crop',
  'https://images.unsplash.com/photo-1495020689067-958852a7765e?w=800&auto=format&fit=crop',
  'https://images.unsplash.com/photo-1557318041-1ce374d55ebf?w=800&auto=format&fit=crop',
  'https://images.unsplash.com/photo-1586339949916-3e9457bef6d3?w=800&auto=format&fit=crop',
  'https://images.unsplash.com/photo-1526304640152-d4619684e884?w=800&auto=format&fit=crop'
];

/**
 * Helper function to call DeepSeek API via SiliconFlow
 */
async function fetchDeepSeek(messages: any[]) {
  if (!API_KEY) throw new Error("API Key is missing");

  // Log partial key for debugging (visible in console)
  console.log("DeepSeek Request with Key:", API_KEY.slice(0, 8) + "...");

  const response = await fetch(BASE_URL, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${API_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: MODEL,
      messages: messages,
      response_format: { type: 'json_object' }, 
      temperature: 0.7,
      max_tokens: 2048,
    })
  });

  if (!response.ok) {
     const errorText = await response.text();
     console.error("DeepSeek API Response Error:", response.status, errorText);
     throw new Error(`DeepSeek API Error: ${response.status} - ${errorText}`);
  }

  const data = await response.json();
  return data.choices[0]?.message?.content || '{}';
}

export const fetchRealtimeNews = async (): Promise<NewsItem[]> => {
  const systemPrompt = `You are a news aggregator for a rumor debunking platform.
  Generate 5 representative examples of recent internet rumors or debunked news in Simplified Chinese from: "China Internet Joint Rumor Debunking Platform" (source name: 中国互联网联合辟谣平台), "Toutiao" (source name: 今日头条), and "Weibo" (source name: 微博).
  
  Return a strictly valid JSON object with a key "items" containing an array.
  Each item in the array must have:
  - title (string): The headline in Chinese.
  - source (string): Must be exactly one of '中国互联网联合辟谣平台', '今日头条', '微博'.
  - status (string): 'verified' (for truths/official news) or 'debunked' (for rumors).
  - timestamp (string): e.g., "10分钟前", "1小时前".
  
  Ensure the content is relevant to social topics, health, or safety in China.`;

  try {
    const jsonStr = await fetchDeepSeek([
      { role: 'system', content: systemPrompt },
      { role: 'user', content: 'Generate the news list now.' }
    ]);
    
    let parsed;
    try {
        parsed = JSON.parse(jsonStr);
    } catch (e) {
        console.error("JSON Parse Error", e);
        return [];
    }

    const data = parsed.items || parsed; 

    if (!Array.isArray(data)) return [];

    return data.map((item: any, index: number) => {
        let searchUrl = '';
        const source = item.source || '中国互联网联合辟谣平台';
        
        if (source.includes('微博')) {
            searchUrl = `https://s.weibo.com/weibo?q=${encodeURIComponent(item.title)}`;
        } else if (source.includes('头条')) {
            searchUrl = `https://so.toutiao.com/search?keyword=${encodeURIComponent(item.title)}`;
        } else {
            searchUrl = `https://www.piyao.org.cn/pysjk/frontsql.htm?kw=${encodeURIComponent(item.title)}`;
        }

        return {
            id: `deepseek-${Date.now()}-${index}`,
            title: item.title,
            source: source,
            status: item.status === 'verified' ? 'verified' : 'debunked',
            timestamp: item.timestamp,
            url: searchUrl,
            imageUrl: FALLBACK_IMAGES[index % FALLBACK_IMAGES.length]
        };
    });

  } catch (error) {
    console.error("Failed to fetch news:", error);
    return [];
  }
};

export const checkRumor = async (query: string): Promise<AnalysisResult> => {
   const systemPrompt = `You are a professional rumor checking expert. Analyze the credibility of the user's query with logic and evidence.
   
   IMPORTANT: The 'message' field MUST be in Simplified Chinese.
   
   Return a strictly valid JSON object with the following structure:
   {
     "message": "A detailed diagnosis report in Simplified Chinese (Markdown format). Use bolding and clear structure.",
     "isRumor": boolean,
     "graphData": {
       "nodes": [
         { "id": "1", "label": "Origin Name", "group": 1, "time": "Date" }
       ],
       "links": [
         { "source": "1", "target": "2", "value": 1 }
       ]
     }
   }
   
   Graph Data Rules:
   - Generate a logical propagation path or relationship graph based on the event analysis.
   - group 1: Source/Rumor Origin (Color: Red)
   - group 2: Spreader/Media/Key Node (Color: Orange)
   - group 3: Debunk/Official/Truth (Color: Blue)
   - Ensure 'source' and 'target' in links match the 'id' in nodes.
   `;

   try {
     const jsonStr = await fetchDeepSeek([
        { role: 'system', content: systemPrompt },
        { role: 'user', content: `Analyze this information: "${query}"` }
     ]);

     let result;
     try {
         result = JSON.parse(jsonStr);
     } catch (e) {
         console.error("JSON Parse Error", e);
         throw new Error("AI returned invalid JSON.");
     }

     if (!result.graphData) {
        result.graphData = { nodes: [], links: [] };
     }

     return result as AnalysisResult;

   } catch (error: any) {
    console.error("Analysis Error:", error);
    let errorMsg = "分析过程中出现错误，请稍后重试。";
    
    // Pass through exact API error if available
    if (error.message?.includes("API Error")) {
        errorMsg = `API 请求失败: ${error.message}`;
    }

    return {
        message: `${errorMsg}`,
        isRumor: false,
        graphData: null
    };
   }
};