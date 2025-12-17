import { AnalysisResult, NewsItem } from '../types';

// The valid SiliconFlow key provided by the user
const SILICON_FLOW_KEY = "sk-mkduhzolnutgyagkhuvivocucmzrjgczzkmjwfgziwvgygtw";

// Get API Key with strict priority
const getApiKey = () => {
  // We prioritize the hardcoded key because the environment variable 'API_KEY'
  // might be polluted with a Google Gemini key (starts with AIza) or an invalid/expired key
  // from a previous session, which causes the 401 error.
  
  // You can still override this by setting a specific VITE_SILICON_KEY in your env if needed in the future,
  // but for now, we return the known working key.
  return SILICON_FLOW_KEY;
};

const API_URL = "https://api.siliconflow.cn/v1/chat/completions";

// Helper function to call SiliconFlow API
const callSiliconFlow = async (messages: any[]) => {
    const apiKey = getApiKey();
    
    // Debug log to confirm correct key usage (security: mask part of it)
    const maskedKey = apiKey && apiKey.length > 10 ? `${apiKey.substring(0, 5)}...${apiKey.substring(apiKey.length - 4)}` : 'INVALID';
    console.log(`[SiliconFlow] Requesting with model Qwen/QwQ-32B using key: ${maskedKey}`);

    const options = {
        method: 'POST',
        headers: {
            Authorization: `Bearer ${apiKey}`,
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({
            model: 'Qwen/QwQ-32B',
            messages: messages,
            stream: false,
            max_tokens: 4096,
            // Removed enable_thinking and thinking_budget as they cause 400 errors with this model
            min_p: 0.05,
            temperature: 0.7,
            top_p: 0.7,
            top_k: 50,
            frequency_penalty: 0.5,
            n: 1,
            response_format: { type: 'text' }
        })
    };

    try {
        const response = await fetch(API_URL, options);
        
        if (!response.ok) {
            const errText = await response.text();
            // Specific handling for 401 to give clear feedback
            if (response.status === 401) {
                console.error("Authentication Failed: The API Key is invalid.");
            }
            throw new Error(`SiliconFlow API Error (${response.status}): ${errText}`);
        }
        
        const data = await response.json();
        return data.choices?.[0]?.message?.content || "";
    } catch (error) {
        console.error("API Request Failed:", error);
        throw error;
    }
};

// Helper to clean and parse JSON from LLM output (handles Markdown code blocks)
const parseJSON = (text: string) => {
    try {
        let cleanText = text.trim();
        // Remove markdown code block markers if present
        if (cleanText.includes("```")) {
            cleanText = cleanText.replace(/```json/g, "").replace(/```/g, "");
        }
        return JSON.parse(cleanText);
    } catch (e) {
        console.error("JSON Parse Error:", e, "Input text:", text);
        return null;
    }
};

export const fetchRealtimeNews = async (): Promise<NewsItem[]> => {
  const prompt = `Generate 5 representative examples of common or recent internet rumors or hot news in China.
  Return a strict JSON array (no other text) where each item has: title, source, status (must be 'verified' or 'debunked'), and timestamp (e.g., '1 hour ago').`;

  try {
    const content = await callSiliconFlow([
        { role: 'user', content: prompt }
    ]);

    const data = parseJSON(content);
    if (!data || !Array.isArray(data)) return [];
    
    // Fallback images
    const FALLBACK_IMAGES = [
       'https://images.unsplash.com/photo-1586339949916-3e9457bef6d3?w=800&auto=format&fit=crop',
       'https://images.unsplash.com/photo-1504711434969-e33886168f5c?w=800&auto=format&fit=crop',
       'https://images.unsplash.com/photo-1554224155-8d04cb21cd6c?w=800&auto=format&fit=crop',
       'https://images.unsplash.com/photo-1495020689067-958852a7765e?w=800&auto=format&fit=crop',
       'https://images.unsplash.com/photo-1526304640152-d4619684e884?w=800&auto=format&fit=crop'
    ];

    return data.map((item: any, index: number) => ({
        id: `sf-${Date.now()}-${index}`,
        title: item.title,
        source: item.source,
        status: item.status === 'verified' ? 'verified' : 'debunked',
        timestamp: item.timestamp,
        url: `https://www.baidu.com/s?wd=${encodeURIComponent(item.title)}`,
        imageUrl: FALLBACK_IMAGES[index % FALLBACK_IMAGES.length]
    }));

  } catch (error) {
    console.error("Failed to fetch news:", error);
    return [];
  }
};

export const checkRumor = async (query: string): Promise<AnalysisResult> => {
  const prompt = `Analyze the following information for rumors: "${query}".
  
  You must return a valid JSON object. Do not include any explanation outside the JSON.
  The JSON structure must be:
  {
    "message": "A detailed diagnosis report in Markdown format, analyzing credibility with logic.",
    "isRumor": true/false,
    "graphData": {
       "nodes": [{"id": "...", "label": "...", "group": 1, "time": "..."}], 
       "links": [{"source": "...", "target": "...", "value": 1}]
    }
  }
  
  Graph Node Groups: 1=Source/Rumor, 2=Spreader/Media, 3=Debunk/Official.
  `;

  try {
    const content = await callSiliconFlow([
        { role: 'user', content: prompt }
    ]);

    const result = parseJSON(content);
    
    if (!result) {
        throw new Error("Failed to parse JSON response from model");
    }

    // Safety check for null graphData
    if (!result.graphData) {
        result.graphData = { nodes: [], links: [] };
    }

    return result as AnalysisResult;

  } catch (error: any) {
    console.error("Analysis Error:", error);
    let errorMsg = "分析过程中出现错误，请稍后重试。";
    
    if (error.message.includes("401")) {
        errorMsg = "认证失败：API Key 无效。请检查配置。";
    }

    return {
        message: errorMsg,
        isRumor: false,
        graphData: null
    };
  }
};