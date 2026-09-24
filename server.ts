import express, { Request, Response } from 'express';
import path from 'path';
import { createServer as createViteServer } from 'vite';
import { GoogleGenAI } from '@google/genai';
import dotenv from 'dotenv';

dotenv.config();

const PORT = 3000;
const app = express();

app.use(express.json({ limit: '1mb' }));

// Simple in-memory rate-limiter for cybersecurity compliance
const ipRequestTimestamps = new Map<string, number[]>();
const RATE_LIMIT_WINDOW_MS = 60 * 1000; // 1 minute
const MAX_REQUESTS_PER_WINDOW = 30; // 30 requests per minute per IP

function rateLimiter(req: Request, res: Response, next: () => void) {
  const ip = req.ip || req.socket.remoteAddress || 'unknown';
  const now = Date.now();
  const timestamps = ipRequestTimestamps.get(ip) || [];

  const recent = timestamps.filter((t) => now - t < RATE_LIMIT_WINDOW_MS);
  if (recent.length >= MAX_REQUESTS_PER_WINDOW) {
    return res.status(429).json({
      error: 'İstek limitine ulaştınız. Lütfen bir dakika sonra tekrar deneyin.',
    });
  }

  recent.push(now);
  ipRequestTimestamps.set(ip, recent);
  next();
}

// Lazy initialization of Gemini client
let aiClient: GoogleGenAI | null = null;
function getGeminiClient(): GoogleGenAI | null {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    console.warn('GEMINI_API_KEY environment variable is not set.');
    return null;
  }
  if (!aiClient) {
    aiClient = new GoogleGenAI({
      apiKey,
      httpOptions: {
        headers: {
          'User-Agent': 'aistudio-build',
        },
      },
    });
  }
  return aiClient;
}

const SYSTEM_INSTRUCTION = `Sen "IntegrA 3646 FRC Scouting & Taktik Baş Analisti" ve Resmi Robotik Strateji Yapay Zekasısın.
Takımın adı: IntegrA #3646 (Bahçeşehir Fen ve Teknoloji Lisesi / İstanbul, Türkiye).

RESMİ VE DOĞRULANMIŞ KAYNAK İLKELERİ (ÇOK ÖNEMLİ):
1. BİLGİ KAYNAKLARI:
   - IntegrA Resmi Web Sitesi: https://integra3646.com
   - The Blue Alliance (TBA) Portalı: https://www.thebluealliance.com/team/3646
   - FIRST Resmi Sitesi: https://www.firstinspires.org
2. KESİNLİKLE YANLIŞ HABER VEYA UYDURMA VERİ VERME:
   - Asla hayali maç sonucu, uydurma takım puanı veya var olmayan ödül uydurma.
   - Herhangi bir takımın veya turnuvanın geçmişi sorulduğunda, Google Search aracını kullanarak The Blue Alliance ve FIRST Inspires resmi kayıtlarını doğrula.
   - IntegrA 3646 hakkında sorulduğunda resmi tarihi hatırla:
     * Kurulma / Çaylak yılı: 2011 (Midwest Regional Judges Award)
     * 2026: Regional FIRST Impact Award Kazananı (Dünya Şampiyonası Bileti)
     * 2025: South Florida Regional Finalist, Marmara Regional Gracious Professionalism Award
     * 2020: Bosphorus Regional Winner, Dean's List Finalisti
     * 2019: Houston Championship Einstein Field Chairman's Finalist, Galileo Division Winner, Istanbul Regional Chairman's Award, Bosphorus Regional Autonomous Award (Ford)
     * 2018: SBPLI Long Island Regional #1 Winner, Roebling Division Finalisti
     * 2017: Houston Championship Einstein Field Chairman's Finalist, Orange County Regional Chairman's Award
     * 2016: New York City Regional Chairman's Award
     * Sosyal Etki / Müfredat: 3.500+ okulda uygulanan Ulusal İHA/UAV müfredatı, İstanbul NASA Space Apps Challenge ev sahipliği, mezunların %100 STEAM kariyeri ($5.5M+ burs), Fas dahil onlarca FRC/FTC takımına kurucu mentörlük ve ISO 22301 standardı.

GÖREVLERİN & TAKTİK DİSİPLİNİ:
1. FIRST Robotics Competition oyun kuralları (Reefscape 2025, Crescendo 2024 vb.), robot mekanizmaları, swerve sürüş, otonom rotaları ve maç simülasyonu konularında uzmansın.
2. Scouting verilerini ve robot metriklerini analiz ederek takımların FRC Temel Arketiplerini ('Defender', 'Cycle-focused', 'All-rounder', 'Long-range Sniper', 'Feeder / Shuttle') temel alarak taktikler üret:
   - 'Defender': Sert fiziksel temaslı, koridor kapatan, rakiplerin intaking ve şut rotalarını bozan takımlar. Karşı taktik: Trench tünelini kullanma, swerve dönel kaçışları (orbit evasion), korumalı alanda temas tuzağı kurup Tech Foul alma.
   - 'Cycle-focused': Sadece seri döngü hızına (sub-8s) odaklı, temas altında ritmi bozulan takımlar. Karşı taktik: Orta saha koridor daraltması (Midfield Lane Choke), besleme koridorunu tıkama, otonomda orta çizgi notalarını kapma.
   - 'All-rounder': Hem otonom, hem teleop skor, hem de gerektiğinde savunma ve güvenli tırmanış yapabilen çok yönlü robotlar (ör. #3646 IntegrA). Karşı taktik: Otonom fazında erken fark yaratma, amplifikasyon pencerelerinde üstünlük kurma.
   - 'Long-range Sniper': Podium veya Wing'den AprilTag görüş kilidiyle uzaktan şut atanlar. Karşı taktik: Kamera vizyon görüş açısını gövdeyle gölgeleme, volan devrini bozacak hafif tampon temasları.
   - 'Feeder / Shuttle': Partnerini zemin veya duvar kanalından besleyen lojistik robotları. Karşı taktik: Orta sahada zemin paslarını kapma ve besleme hattını kesme.
3. Uygulamada simülasyonlar "Match Simulator" üzerinden çalışmaktadır. Kullanıcı karşılaşma simülasyonu istediğinde Match Simulator verilerine ve sahadaki 3v3 ittifak dinamiklerine göre taktik ver:
   - OTONOM (Autonomous): Rota, merkez çizgisi kontrolü, leave bonusu.
   - TELEOP & DÖNGÜ (Cycle Defense): Transit hatları, besleme koridoru ve şut açısı daraltma.
   - AMP / CO-OP ZAMANLAMASI: Bonus pencerelerini en yüksek katsayıyla kullanma.
   - ENDGAME & TIRMANMA (Climb / Trap): Zamanlama (son 25s), Trap veya çift tırmanış senkronizasyonu.
4. Kullanıcıya her zaman saygılı, enerjik, samimi ve profesyonel bir FRC mühendisi diliyle Türkçe cevap ver.
5. Yanıtlarında maddeler, net başlıklar ve kalın vurgular kullanarak kolay okunur olmasını sağla.`;

// API Routes
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', time: new Date().toISOString() });
});

// Chatbot API Endpoint with Google Search Grounding
app.post('/api/chat', rateLimiter, async (req: Request, res: Response) => {
  try {
    const { message, history, contextTeam, rivalTeam, archetypeIntel } = req.body;

    if (!message || typeof message !== 'string') {
      return res.status(400).json({ error: 'Geçersiz mesaj içeriği.' });
    }

    const trimmed = message.trim();
    if (trimmed.length === 0 || trimmed.length > 2500) {
      return res.status(400).json({ error: 'Mesaj uzunluğu 1 ile 2500 karakter arasında olmalıdır.' });
    }

    const ai = getGeminiClient();
    if (!ai) {
      return res.status(503).json({
        error: 'Gemini API anahtarı (GEMINI_API_KEY) tanımlanmamış. Lütfen Settings > Secrets panelinden API anahtarınızı kontrol edin.',
      });
    }

    // Build multi-turn content
    const contents: any[] = [];

    // Inject history if provided
    if (Array.isArray(history)) {
      for (const item of history) {
        if (item && item.role && item.text) {
          contents.push({
            role: item.role === 'model' ? 'model' : 'user',
            parts: [{ text: item.text }],
          });
        }
      }
    }

    // Add match context prefix if present
    let finalPrompt = trimmed;
    if (contextTeam || rivalTeam || archetypeIntel) {
      let contextInfo = '\n[SCOUTING & ARKETİP MAÇ KONTEKSTİ]:';
      if (contextTeam) {
        contextInfo += `\n- Dost Takım: #${contextTeam.number} ${contextTeam.name} (Skor: ${contextTeam.score}, Tier: ${contextTeam.tier}, TEC: ${contextTeam.stats?.tec || 'N/A'}, DAT: ${contextTeam.stats?.dat || 'N/A'})`;
      }
      if (rivalTeam) {
        contextInfo += `\n- Rakip Takım: #${rivalTeam.number} ${rivalTeam.name} (Skor: ${rivalTeam.score}, Tier: ${rivalTeam.tier}, TEC: ${rivalTeam.stats?.tec || 'N/A'}, Zayıf Yön: ${rivalTeam.cons?.join(', ') || 'Bilinmiyor'}, Karşı Taktik: ${rivalTeam.counterPlay || 'N/A'})`;
      }
      if (archetypeIntel) {
        contextInfo += `\n- Dost Robot Arketipi: [${archetypeIntel.allyArchetype?.coreArchetype || 'All-rounder'}] - ${archetypeIntel.allyArchetype?.detailedArchetype || ''}`;
        contextInfo += `\n- Rakip Robot Arketipi: [${archetypeIntel.rivalArchetype?.coreArchetype || 'Cycle-focused'}] - ${archetypeIntel.rivalArchetype?.detailedArchetype || ''}`;
        contextInfo += `\n- Tehdit Seviyesi: ${archetypeIntel.threatLevel || 'MODERATE'} | Hesaplanan Kazanma İhtimali: %${archetypeIntel.winProbabilityEstimate || 50}`;
        if (archetypeIntel.rivalArchetype?.vulnerabilities?.length) {
          contextInfo += `\n- Rakip Zayıf Noktaları (Scouting): ${archetypeIntel.rivalArchetype.vulnerabilities.join('; ')}`;
        }
      }
      finalPrompt = `${contextInfo}\n\nKullanıcı Sorusu: ${trimmed}`;
    }

    contents.push({
      role: 'user',
      parts: [{ text: finalPrompt }],
    });

    // Call Gemini 3.8 Flash or 3.5 Flash with Google Search Grounding tool
    const response = await ai.models.generateContent({
      model: 'gemini-3.8-flash',
      contents,
      config: {
        systemInstruction: SYSTEM_INSTRUCTION,
        tools: [{ googleSearch: {} }],
        temperature: 0.7,
      },
    });

    const responseText = response.text || 'Üzgünüm, şu anda bu taktik analizi oluşturulamadı.';
    
    // Extract Grounding metadata for sources & links
    const candidate = response.candidates?.[0];
    const groundingMetadata = candidate?.groundingMetadata;
    const groundingChunks = groundingMetadata?.groundingChunks || [];
    const webSearchQueries = groundingMetadata?.webSearchQueries || [];

    return res.json({
      success: true,
      text: responseText,
      groundingChunks: groundingChunks.map((chunk: any) => ({
        web: chunk.web ? { uri: chunk.web.uri, title: chunk.web.title } : undefined,
      })).filter((c: any) => !!c.web),
      searchQueries: webSearchQueries,
    });
  } catch (error: any) {
    console.error('Error generating Gemini response:', error);
    return res.status(500).json({
      error: error?.message || 'Yapay zeka ile iletişim kurulurken beklenmedik bir hata oluştu.',
    });
  }
});

async function startServer() {
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server running on http://0.0.0.0:${PORT}`);
  });
}

startServer();
