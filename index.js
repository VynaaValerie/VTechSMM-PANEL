/*  
  Made By Vynaa
  WhatsApp : wa.me/6282389924037
  Telegram : t.me/VynaaValerie
  Youtube : @VegaTech

  Copy Code?, Recode?, Rename?, Reupload?, Reseller? Taruh Credit Ya :D
*/
import {
  makeWASocket,
  useMultiFileAuthState,
  fetchLatestBaileysVersion,
  downloadContentFromMessage,
  getContentType
} from "@whiskeysockets/baileys";
import pino from "pino";
import chalk from "chalk";
import readline from "readline";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const usePairingCode = true;

async function question(prompt) {
  process.stdout.write(prompt);
  const r1 = readline.createInterface({
    input: process.stdin,
    output: process.stdout
  });

  return new Promise((resolve) => {
    r1.question("", (ans) => {
      r1.close();
      resolve(ans);
    });
  });
}

const unwrapMessage = (m) => {
  let msg = m?.message ?? m;
  while (msg?.ephemeralMessage || msg?.viewOnceMessage || msg?.viewOnceMessageV2 || msg?.viewOnceMessageV2Extension || msg?.documentWithCaptionMessage) {
    msg =
      msg?.ephemeralMessage?.message ??
      msg?.viewOnceMessage?.message ??
      msg?.viewOnceMessageV2?.message ??
      msg?.viewOnceMessageV2Extension?.message ??
      msg?.documentWithCaptionMessage?.message;
  }
  return msg;
};

async function connectToWhatsApp() {
  const { state, saveCreds } = await useMultiFileAuthState(
    path.resolve(__dirname, "VynaaSesi")
  );

  const { version, isLatest } = await fetchLatestBaileysVersion();
  console.log(`Vynaa Using WA v${version.join(".")}, isLatest: ${isLatest}`);

  const vynaa = makeWASocket({
    logger: pino({ level: "silent" }),
    printQRInTerminal: !usePairingCode,
    auth: state,
    browser: ["Ubuntu", "Chrome", "20.0.04"],
    version,
    syncFullHistory: false,
    generateHighQualityLinkPreview: true,
  });

  vynaa.downloadMediaMessage = async (input) => {
    try {
      const root = input?.message ? input : { message: input };
      const unwrapped = unwrapMessage(root.message);
      const type = getContentType(unwrapped);
      if (!type) throw new Error('Tidak ada media pada pesan');

      const msgContent = unwrapped[type];
      const mediaKind = type.replace('Message', '');
      const stream = await downloadContentFromMessage(msgContent, mediaKind);
      let buffer = Buffer.alloc(0);
      for await (const chunk of stream) buffer = Buffer.concat([buffer, chunk]);

      const mimetype =
        msgContent.mimetype ||
        (mediaKind === 'sticker' ? 'image/webp' : undefined);

      return { buffer, mimetype, type: mediaKind };
    } catch (error) {
      console.error('Error downloading media:', error);
      throw error;
    }
  };

  if (usePairingCode && !vynaa.authState.creds.registered) {
    try {
      const phoneNumber = await question("☘️ Masukan Nomor Yang Diawali Dengan 62 :\n");
      const code = await vynaa.requestPairingCode(phoneNumber.trim());
      console.log(`🎁 Pairing Code : ${code}`);
    } catch (err) {
      console.error("Failed to get pairing code:", err);
    }
  }

  vynaa.ev.on("creds.update", saveCreds);

  vynaa.ev.on("connection.update", (update) => {
    const { connection, lastDisconnect } = update;
    
    if (connection === "close") {
      const shouldReconnect = lastDisconnect?.error?.output?.statusCode !== 401;
      console.log(chalk.red("❌ Koneksi Terputus, Mencoba Menyambung Ulang..."));
      
      if (shouldReconnect) {
        setTimeout(() => {
          connectToWhatsApp();
        }, 5000);
      }
    } else if (connection === "open") {
      console.log(chalk.green("✔ Bot Berhasil Terhubung Ke WhatsApp"));
      console.log(chalk.blue("🤖 Vynaa Bot siap menerima pesan!"));
    } else if (connection === "connecting") {
      console.log(chalk.yellow("🔄 Menghubungkan ke WhatsApp..."));
    }
  });

  vynaa.ev.on("messages.upsert", async (m) => {
    try {
      const msg = m.messages[0];
      if (!msg.message || msg.key.fromMe) return;

      const { default: handler } = await import('./case.js');
      await handler(vynaa, m);
    } catch (error) {
    }
  });

  return vynaa;
}

connectToWhatsApp().catch(err => {
});
/*
• Jasa pembuatan website 
• Menerima perbaikan script atau fitur bot
• Menerima pembuatan fitur bot
• Menerima semua kebutuhan bot
• Menerima dia dengan segala kekurangannya;)
ℹ️ Information

• Bisa bayar di awal atau akhir
• Pembayaran melalu QRIS Only
• Testimoni Banyak
*/