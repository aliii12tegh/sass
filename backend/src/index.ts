export interface Env {
    AI: Ai;
}

const corsHeaders = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "POST, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type",
};

export default {
    async fetch(request: Request, env: Env): Promise<Response> {
        // Handle CORS preflight
        if (request.method === "OPTIONS") {
            return new Response(null, { headers: corsHeaders });
        }

        if (request.method !== "POST") {
            return new Response(JSON.stringify({ error: "Method not allowed. Use POST." }), { status: 405, headers: corsHeaders });
        }

        try {
            let prompt = "Describe this image in detail.";
            let blob: ArrayBuffer;

            const contentType = request.headers.get("content-type") || "";

            // If it's a multipart form data (from HTML file upload)
            if (contentType.includes("multipart/form-data")) {
                const formData = await request.formData();
                const file = formData.get("image") as File;
                if (!file) {
                    throw new Error("No image file uploaded");
                }
                blob = await file.arrayBuffer();

                // Optional custom prompt from the client
                const customPrompt = formData.get("prompt");
                if (customPrompt) {
                    prompt = customPrompt.toString();
                }
            } else {
                // Fallback for raw binary upload
                blob = await request.arrayBuffer();
            }

            if (!blob || blob.byteLength === 0) {
                throw new Error("Empty image body");
            }

            const input = {
                image: [...new Uint8Array(blob)],
                prompt: prompt,
                max_tokens: 512,
            };

            const aiResponse = await env.AI.run(
                "@cf/llava-hf/llava-1.5-7b-hf",
                input
            );

            return new Response(JSON.stringify(aiResponse), {
                headers: {
                    ...corsHeaders,
                    "Content-Type": "application/json",
                },
            });

        } catch (error: any) {
            return new Response(JSON.stringify({ error: error.message }), {
                status: 400,
                headers: {
                    ...corsHeaders,
                    "Content-Type": "application/json",
                },
            });
        }
    },
} satisfies ExportedHandler<Env>;
