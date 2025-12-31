import { NextRequest, NextResponse } from 'next/server';

// export const runtime = 'edge'; // Disabled to rule out edge-specific issues

export async function POST(req: NextRequest) {
    try {
        const body = await req.json();
        const { messages, apiKey, type, systemPrompt, model, language } = body;

        if (!apiKey) {
            return NextResponse.json({ error: 'API Key is missing' }, { status: 401 });
        }

        if (!messages || !Array.isArray(messages)) {
            return NextResponse.json({ error: 'Messages array is missing or invalid' }, { status: 400 });
        }

        const langInstruction = language === 'jp'
            ? "IMPORTANT: Respond in Japanese (日本語)."
            : "IMPORTANT: Respond in English.";

        let promptText = "";

        if (type === 'chat') {
            // --- Direct Chat Mode ---
            const conversation = messages.map((m: any) =>
                `${m.sender === 'user' ? 'User' : 'Model'}: ${m.text}`
            ).join('\n');

            const chatSystemInstruction = systemPrompt
                ? systemPrompt
                : "You are a helpful, friendly, and intelligent AI assistant. You are talking directly to the user. Answer their questions effectively.";

            promptText = `
System: ${chatSystemInstruction}

Conversation History:
${conversation}

Assistant's Response:
            `;

            // Append instruction to force JSON if needed, or just text.
            // The frontend expects { chatResponse: ... }
            promptText += `\n${langInstruction} Respond naturally. Output valid JSON: { "chatResponse": "your response string" }`;

        } else {
            // --- Analysis Mode ---
            const roleDefinition = systemPrompt
                ? `You are a custom AI assistant: ${systemPrompt}`
                : `You are an AI Staff Officer for a business chat.`;

            const chatHistory = messages.slice(-10).map((m: any) =>
                `${m.sender === 'me' ? 'User' : 'Partner'}: ${m.text}`
            ).join('\n');

            let instructions = "";
            if (type === 'summary') {
                instructions = `Provide up to 5 concise bullet points summarizing the discussion.Output JSON: { "summary": ["point"] }.`;
            } else if (type === 'todos') {
                instructions = `Detect action items.Output JSON: { "todos": [{ "id": 123, "task": "text", "status": "pending" }] }. Return empty list if none.`;
            } else if (type === 'suggestions') {
                instructions = `Provide one suggestion.Output JSON: { "suggestions": "text" }.`;
            } else if (type === 'mindmap') {
                instructions = `Create a Mermaid.js mindmap syntax summarizing usage. Output JSON: { "mindmap": "mindmap\\n  root((Main Topic))\\n    Child1\\n    Child2" }. Keep it simple.`;
            } else {
                instructions = `Provide summary, todos, suggestions, and mindmap in JSON.`;
            }

            promptText = `
${roleDefinition}
Conversation:
${chatHistory}

Instructions:
${instructions}
${langInstruction}

Return valid JSON only. No markdown formatting.
            `;
        }

        // --- Model Selection ---
        let modelId = 'gemini-3-flash'; // Default to modern standard

        if (model === 'gemini-3-pro') modelId = 'gemini-3-pro';
        else if (model === 'gemini-3-flash') modelId = 'gemini-3-flash';
        else if (model === 'gemini-2.5-pro') modelId = 'gemini-2.5-pro';
        else if (model === 'gemini-2.5-flash') modelId = 'gemini-2.5-flash';
        else if (model === 'gemini-2.0-flash') modelId = 'gemini-2.0-flash';

        // Helper
        const callGemini = async (targetModel: string) => {
            const url = `https://generativelanguage.googleapis.com/v1beta/models/${targetModel}:generateContent?key=${apiKey}`;
            return fetch(url, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    contents: [{ parts: [{ text: promptText }] }]
                })
            });
        };

        // 1. Attempt
        let response = await callGemini(modelId);

        // 2. Fallback
        if (!response.ok) {
            console.warn(`Model ${modelId} failed. Status: ${response.status}`);
            const FALLBACK_MODEL = 'gemini-2.5-flash';
            if (modelId !== FALLBACK_MODEL) {
                console.warn(`Retrying with ${FALLBACK_MODEL}...`);
                response = await callGemini(FALLBACK_MODEL);
            }
        }

        if (!response.ok) {
            const err = await response.json().catch(() => ({}));
            console.error("Gemini Critical Error:", {
                status: response.status,
                statusText: response.statusText,
                headers: Object.fromEntries(response.headers.entries()),
                errorBody: err
            });
            return NextResponse.json({
                error: err.error?.message || `Gemini API Error: ${response.status} ${response.statusText}`,
                details: err
            }, { status: response.status });
        }

        // Parsing
        const data = await response.json();
        const rawText = data.candidates?.[0]?.content?.parts?.[0]?.text;

        if (!rawText) throw new Error("No Content Returned");

        const jsonHook = rawText.replace(/```json\n?|\n?```/g, '').trim();
        let result = {};
        try {
            result = JSON.parse(jsonHook);
        } catch (e) {
            // Fallback for raw text responses
            if (type === 'chat') result = { chatResponse: rawText };
            else if (type === 'summary') result = { summary: [rawText] };
            else if (type === 'suggestions') result = { suggestions: rawText };
            else if (type === 'todos') result = { todos: [] };
            else if (type === 'mindmap') result = { mindmap: rawText };
        }

        // Add IDs for todos if present
        if ((result as any).todos) {
            (result as any).todos = (result as any).todos.map((t: any) => ({ ...t, id: t.id || Math.random() }));
        }

        return NextResponse.json(result);

    } catch (e: any) {
        console.error("Server Error:", e);
        return NextResponse.json({ error: e.message }, { status: 500 });
    }
}
