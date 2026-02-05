import "dotenv/config"
import express from "express"
import cors from "cors"

const app = express()
app.use(cors())
app.use(express.json())

app.get("/api/ping", (req, res) => res.json({ ok: true }))

async function listModels(apiKey) {
  const r = await fetch("https://generativelanguage.googleapis.com/v1beta/models", {
    headers: { "x-goog-api-key": apiKey }
  })
  const raw = await r.text()
  let json
  try { json = JSON.parse(raw) } catch { json = { raw } }
  return { status: r.status, ok: r.ok, json }
}

function pickGenerateContentModel(modelsJson) {
  const models = modelsJson?.models
  if (!Array.isArray(models)) return null

  // generateContent 지원 모델 중에서 flash 계열 우선 선택(없으면 아무거나)
  const ok = models.filter(m =>
    Array.isArray(m?.supportedGenerationMethods) &&
    m.supportedGenerationMethods.includes("generateContent")
  )

  const flash = ok.find(m => String(m?.name || "").includes("flash"))
  return (flash ?? ok[0])?.name ?? null  // 예: "models/gemini-1.5-flash-002"
}

async function generateContent({ apiKey, modelName, text }) {
  const url = `https://generativelanguage.googleapis.com/v1beta/${modelName}:generateContent`
  const r = await fetch(url, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-goog-api-key": apiKey
    },
    body: JSON.stringify({
      contents: [{ role: "user", parts: [{ text }] }]
    })
  })

  const raw = await r.text()
  let json
  try { json = JSON.parse(raw) } catch { json = { raw } }
  return { status: r.status, ok: r.ok, json }
}

app.get("/api/gemini/models", async (req, res) => {
  const apiKey = process.env.GEMINI_API_KEY
  if (!apiKey) return res.status(500).json({ error: "Missing GEMINI_API_KEY" })

  const out = await listModels(apiKey)
  return res.status(out.status).json(out.json)
})

app.post("/api/gemini", async (req, res) => {
  try {
    const apiKey = process.env.GEMINI_API_KEY
    if (!apiKey) return res.status(500).json({ error: "Missing GEMINI_API_KEY" })

    const text = req.body?.text
    if (typeof text !== "string" || !text.trim()) {
      return res.status(400).json({ error: "Missing text" })
    }

    // 1) 모델 결정: env에 있으면 그걸 쓰고, 없으면 ListModels로 자동 선택
    let modelName = process.env.GEMINI_MODEL?.trim()
    if (modelName) {
      // 사용자가 "gemini-2.0-flash"처럼 줬을 수도 있으니 통일
      if (!modelName.startsWith("models/")) modelName = `models/${modelName}`
    } else {
      const lm = await listModels(apiKey)
      if (!lm.ok) return res.status(lm.status).json({ upstreamStatus: lm.status, upstream: lm.json })

      modelName = pickGenerateContentModel(lm.json)
      if (!modelName) {
        return res.status(500).json({ error: "No model supports generateContent for this API key/project." })
      }
    }

    // 2) generateContent 호출
    const out = await generateContent({ apiKey, modelName, text })

    if (!out.ok) {
      return res.status(out.status).json({
        upstreamStatus: out.status,
        upstream: out.json,
        modelUsed: modelName
      })
    }

    const answer =
      out.json?.candidates?.[0]?.content?.parts?.map(p => p.text).join("") ?? ""

    return res.json({ text: answer, modelUsed: modelName })
  } catch (e) {
    return res.status(500).json({ error: String(e) })
  }
})

const port = Number(process.env.PORT ?? 8787)
app.listen(port, "127.0.0.1", () => {
  console.log(`API server running on http://127.0.0.1:${port}`)
})
