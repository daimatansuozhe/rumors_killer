import { GoogleGenAI, Type } from "@google/genai";
import { AnalysisResult, NewsItem } from '../types';

// Initialize Gemini API Client
// The API key is obtained exclusively from process.env.API_KEY as per guidelines.
const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

export const fetchRealtimeNews = async (): Promise<NewsItem[]> => {
  const prompt = `Generate 5 representative examples of common or recent internet rumors or hot news in China.`;

  const responseSchema = {
    type: Type.ARRAY,
    items: {
      type: Type.OBJECT,
      properties: {
        title: { type: Type.STRING },
        source: { type: Type.STRING },
        status: { type: Type.STRING, enum: ['verified', 'debunked', 'uncertain'] },
        timestamp: { type: Type.STRING },
      },
      required: ['title', 'source', 'status', 'timestamp'],
      propertyOrdering: ['title', 'source', 'status', 'timestamp'],
    },
  };

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: prompt,
      config: {
        responseMimeType: 'application/json',
        responseSchema: responseSchema,
      }
    });

    const data = JSON.parse(response.text || '[]');
    if (!Array.isArray(data)) return [];

    // Fallback images - Updated to stable Unsplash IDs
    const FALLBACK_IMAGES = [
       'https://images.unsplash.com/photo-1504711434969-e33886168f5c?w=800&auto=format&fit=crop', // News/Newspaper
       'https://images.unsplash.com/photo-1495020689067-958852a7765e?w=800&auto=format&fit=crop', // Newspapers stack
       'https://images.unsplash.com/photo-1557318041-1ce374d55ebf?w=800&auto=format&fit=crop', // Tech/Abstract
       'https://images.unsplash.com/photo-1586339949916-3e9457bef6d3?w=800&auto=format&fit=crop', // Broadcast
       'https://images.unsplash.com/photo-1526304640152-d4619684e884?w=800&auto=format&fit=crop'  // Abstract
    ];

    return data.map((item: any, index: number) => ({
        id: `gemini-${Date.now()}-${index}`,
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
  const prompt = `Analyze the following information for rumors: "${query}".`;
  
  const responseSchema = {
    type: Type.OBJECT,
    properties: {
      message: { 
        type: Type.STRING, 
        description: "A detailed diagnosis report in Markdown format, analyzing credibility with logic." 
      },
      isRumor: { type: Type.BOOLEAN },
      graphData: {
         type: Type.OBJECT,
         properties: {
           nodes: { 
             type: Type.ARRAY, 
             items: {
               type: Type.OBJECT,
               properties: {
                 id: { type: Type.STRING },
                 label: { type: Type.STRING },
                 group: { type: Type.INTEGER, description: "1=Source/Rumor, 2=Spreader/Media, 3=Debunk/Official" },
                 time: { type: Type.STRING }
               },
               required: ["id", "label", "group"],
               propertyOrdering: ["id", "label", "group", "time"]
             } 
           },
           links: { 
             type: Type.ARRAY,
             items: {
               type: Type.OBJECT,
               properties: {
                 source: { type: Type.STRING },
                 target: { type: Type.STRING },
                 value: { type: Type.NUMBER }
               },
               required: ["source", "target", "value"],
               propertyOrdering: ["source", "target", "value"]
             }
           }
         },
         required: ["nodes", "links"],
         propertyOrdering: ["nodes", "links"]
      }
    },
    required: ["message", "isRumor", "graphData"],
    propertyOrdering: ["message", "isRumor", "graphData"]
  };

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: prompt,
      config: {
        responseMimeType: 'application/json',
        responseSchema: responseSchema,
        systemInstruction: "You are a rumor checking expert. Analyze the credibility with logic.",
      }
    });

    const result = JSON.parse(response.text || '{}');

    // Safety check for null graphData
    if (!result.graphData) {
        result.graphData = { nodes: [], links: [] };
    }

    return result as AnalysisResult;

  } catch (error: any) {
    console.error("Analysis Error:", error);
    let errorMsg = "分析过程中出现错误，请稍后重试。";
    
    if (error.message?.includes("API key")) {
        errorMsg = "认证失败：API Key 无效。请检查配置。";
    }

    return {
        message: errorMsg,
        isRumor: false,
        graphData: null
    };
  }
};