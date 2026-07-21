export async function onRequestPost({ request, env }) {
  if (!env.OPENAI_API_KEY || !String(env.OPENAI_API_KEY).trim()) {
    return new Response(JSON.stringify({
      message: "Configuration error: Missing OPENAI_API_KEY."
    }), {
      status: 500,
      headers: { "Content-Type": "application/json" }
    });
  }

  let body;
  try {
    body = await request.json();
  } catch {
    return new Response(JSON.stringify({
      message: "Invalid JSON payload."
    }), {
      status: 400,
      headers: { "Content-Type": "application/json" }
    });
  }

  const { message, uuid } = body;

  if (!message || !String(message).trim()) {
    return new Response(JSON.stringify({
      message: "Bad Request: Message cannot be empty."
    }), {
      status: 400,
      headers: { "Content-Type": "application/json" }
    });
  }

  const systemPrompt = "You are the Architect for squared.guide. Focus: skeletal geometry, pelvic leveling, squaring the structural frame, and correcting rotational asymmetries. Respond in a sober, professional, practical tone with dry British precision.";

  try {
    const response = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${env.OPENAI_API_KEY}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        model: "gpt-4o-mini",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: String(message).trim() }
        ]
      })
    });

    const text = await response.text();

    if (!response.ok) {
      return new Response(JSON.stringify({
        message: `OpenAI error (${response.status}): ${text}`
      }), {
        status: 502,
        headers: { "Content-Type": "application/json" }
      });
    }

    const data = JSON.parse(text);
    const reply = data.choices?.[0]?.message?.content;

    if (!reply) {
      return new Response(JSON.stringify({
        message: "Error: Received empty response from model."
      }), {
        status: 502,
        headers: { "Content-Type": "application/json" }
      });
    }

    return new Response(JSON.stringify({
      message: reply,
      uuid: uuid || crypto.randomUUID()
    }), {
      status: 200,
      headers: { "Content-Type": "application/json" }
    });
  } catch (e) {
    return new Response(JSON.stringify({
      message: `Internal server error: ${e.message || "Unknown error"}`
    }), {
      status: 502,
      headers: { "Content-Type": "application/json" }
    });
  }
}
