import './config.js';
import { getServices, searchServices, fetchServices, getOrderStatus, hitungHarga } from './smm_handler.js';
import { createQris, checkPaymentStatus } from './payment_handler.js';
import { createOrder } from './smm_handler.js';
import QRCode from 'qrcode';
import chalk from 'chalk';

// Cache for pagination
const userSessions = new Map();

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
function getMessageBody(m) {
    const msg = m.messages[0];
    if (!msg.message) return '';
    
    return (
        msg.message.conversation ||
        msg.message.extendedTextMessage?.text ||
        msg.message.imageMessage?.caption ||
        msg.message.videoMessage?.caption ||
        msg.message.documentMessage?.caption ||
        ''
    );
}

export default async (vynaa, m) => {
    try {
        const body = getMessageBody(m);
        const msg = m.messages[0];
        const from = msg.key.remoteJid;
        const pushName = msg.pushName || 'User';
        const isGroup = from.endsWith('@g.us');

        if (!body) return;

        const command = body.toLowerCase().trim();
        const args = body.trim().split(/ +/).slice(1);

        const isOwner = global.owner.includes(msg.key.participant?.split('@')[0] || from.split('@')[0]);

        // Console Log Ini
        console.log(chalk.black(chalk.bgCyan(' MESSAGE ')), chalk.cyan(`[${new Date().toLocaleTimeString()}]`), chalk.white(body), chalk.yellow('from'), chalk.green(pushName), chalk.blue(`(${from})`));

        // Check for order pattern: Order id.jumlah.link
        if (command.startsWith('order')) {
            if (isGroup) return vynaa.sendMessage(from, { text: "❌ Fitur order hanya dapat digunakan di Private Chat." });
            
            if (command === 'order' && args.length === 0) {
                const helpOrder = `🛒 *CARA ORDER SMM*
                
Format: *Order ID_SERVICE.JUMLAH.LINK*
Contoh: Order 123.1000.https://instagram.com/vynaa_valerie

*Ketentuan:*
1. Minimal total harga order adalah Rp 500.
2. Pastikan ID Service benar (cek di *allservice*).
3. Pastikan Link target publik (tidak di-private).
4. cek via web https://vtechsmm.biz.id/service`;
                return vynaa.sendMessage(from, { text: helpOrder });
            }

            const orderContent = body.slice(5).trim(); // Remove "order" prefix
            const orderArgs = orderContent.split('.');
            
            if (orderArgs.length < 3) return vynaa.sendMessage(from, { text: "❌ Format salah. Ketik *order* saja untuk melihat bantuan." });

            const serviceId = orderArgs[0].trim();
            const quantity = parseInt(orderArgs[1].trim());
            const link = orderArgs.slice(2).join('.').trim();

            if (isNaN(quantity)) return vynaa.sendMessage(from, { text: "❌ Jumlah harus berupa angka." });

            const services = getServices();
            const service = services.find(s => s.service.toString() === serviceId);

            if (!service) return vynaa.sendMessage(from, { text: "❌ Service ID tidak ditemukan. Cek daftar di *allservice*." });

            // Anti-fraud/bug check: ensure quantity is within service limits
            if (quantity < parseInt(service.min)) return vynaa.sendMessage(from, { text: `❌ Jumlah minimal untuk layanan ini adalah ${service.min}` });
            if (quantity > parseInt(service.max)) return vynaa.sendMessage(from, { text: `❌ Jumlah maksimal untuk layanan ini adalah ${service.max}` });

            const price = hitungHarga(service.rate, quantity);
            
            // Debug with serviceId
            console.log(`[DEBUG ORDER] ServiceID: ${serviceId}, Rate: ${service.rate}, Qty: ${quantity}, Price: ${price}`);

            if (price < 500) return vynaa.sendMessage(from, { text: `❌ Minimal order adalah Rp 500. Total order Anda saat ini: Rp ${price}` });

            const orderId = `SMM${Date.now()}`;
            const qrisData = await createQris(orderId, price);
            if (qrisData.error || !qrisData.payment) {
                return vynaa.sendMessage(from, { text: "❌ Gagal membuat QRIS. Coba lagi nanti." });
            }

            const finalPrice = qrisData.payment.total_payment || qrisData.payment.amount;

            console.log(chalk.bgYellow(chalk.black(' ORDER ')), `Processing order for ${service.name}, Quantity: ${quantity}, Price: ${finalPrice}`);

            await vynaa.sendMessage(from, { text: `⏳ Membuat invoice untuk ${service.name}...\nTotal: Rp ${finalPrice}` });

            const qrBuffer = await QRCode.toBuffer(qrisData.payment.payment_number);
            await vynaa.sendMessage(from, { 
                image: qrBuffer, 
                caption: `✅ *INVOICE QRIS*\n\nOrder ID: ${orderId}\nService: ${service.name}\nJumlah: ${quantity}\nLink: ${link}\nTotal: Rp ${finalPrice}\n\n*SILAHKAN SCAN QRIS DI ATAS*\nBot akan memproses order otomatis setelah pembayaran terdeteksi.` 
            });

            // Status checking loop
            let paid = false;
            const maxAttempts = 40; // ~10 minutes (15s * 40)
            for (let i = 0; i < maxAttempts; i++) {
                await new Promise(r => setTimeout(r, 15000));
                const status = await checkPaymentStatus(orderId, finalPrice);
                if (status?.transaction?.status === 'completed' || status?.transaction?.status === 'success') {
                    paid = true;
                    break;
                }
            }

            if (paid) {
                await vynaa.sendMessage(from, { text: "✅ Pembayaran Berhasil! Memproses order ke provider..." });
                const smmOrder = await createOrder(serviceId, link, quantity);
                if (smmOrder.order) {
                    await vynaa.sendMessage(from, { text: `🚀 Order Berhasil!\nID Order: ${smmOrder.order}\nStatus: Processing` });
                } else {
                    await vynaa.sendMessage(from, { text: `❌ Pembayaran diterima tapi gagal order ke provider: ${smmOrder.error || 'Unknown Error'}\nSilahkan hubungi owner.` });
                }
            } else {
                await vynaa.sendMessage(from, { text: "⚠️ Transaksi kadaluarsa atau belum dibayar." });
            }
            return;
        }

        switch(command) {
            case "ping":
                const start = Date.now();
                await vynaa.sendMessage(msg.key.remoteJid, { text: "🏓" });
                const end = Date.now();
                const speed = end - start;
                
                await vynaa.sendMessage(msg.key.remoteJid, { 
                    text: `⏱️ ${speed}ms` 
                });
                break;

            case "help":
            case "menu":
                const helpText = `🤖 *VYNAA SMM BOT* 🤖

⚡ *SMM COMMANDS*
• allservice - List semua service
• search [query] - Cari service
• updatesrv - Update data service (Owner)
• status [ID_ORDER] - Cek status pesanan

🛒 *CARA ORDER*
Format: *Order ID_SERVICE.JUMLAH.LINK*
Contoh: Order 123.1000.https://vtechsmm.biz.id/order/new

⚡ *UTILITY*
• ping - Cek kecepatan bot
• help - Menu ini
• owner - Kontak Owner

⚠️ *INFO*
- Minimal Order Rp 500
- Order hanya via Private Chat
- Cek via web: vtechsmm.biz.id/service

━━━━━━━━━━━━━━━━━━
✨ *Vynaa Bot - SMM Panel Integration*`;
                
                await vynaa.sendMessage(from, { text: helpText });
                break;

            case "owner":
                const ownerNumbers = global.owner;
                let ownerText = `📞 *KONTAK OWNER*\n\n`;
                ownerNumbers.forEach((num, i) => {
                    ownerText += `${i + 1}. wa.me/${num}\n`;
                });
                await vynaa.sendMessage(from, { text: ownerText });
                break;

            case "status":
                if (args.length === 0) return vynaa.sendMessage(from, { text: "❌ Masukkan ID Order. Contoh: *status 123456*" });
                const orderIdStatus = args[0];
                await vynaa.sendMessage(from, { text: `⏳ Mengecek status order ${orderIdStatus}...` });
                const statusRes = await getOrderStatus(orderIdStatus);
                if (statusRes.error) {
                    await vynaa.sendMessage(from, { text: `❌ Gagal mengambil status: ${statusRes.error}` });
                } else if (statusRes.status) {
                    const statusText = `📊 *STATUS PESANAN*
                    
ID Order: ${orderIdStatus}
Status: *${statusRes.status}*
Sisa (Remains): ${statusRes.remains}
Jumlah Awal (Start Count): ${statusRes.start_count}

_Catatan: Status bisa berupa Pending, Processing, In Progress, Completed, Partial, Canceled._`;
                    await vynaa.sendMessage(from, { text: statusText });
                } else {
                    await vynaa.sendMessage(from, { text: "❌ ID Order tidak ditemukan atau terjadi kesalahan." });
                }
                break;

            case "updatesrv":
                if (!isOwner) return vynaa.sendMessage(from, { text: "❌ Perintah ini hanya untuk Owner." });
                await vynaa.sendMessage(from, { text: "⏳ Sedang memperbarui data service..." });
                const srvs = await fetchServices();
                await vynaa.sendMessage(from, { text: `✅ Berhasil memperbarui ${srvs.length} service.` });
                break;

            case "allservice":
            case "nextservice":
                let page = command === "nextservice" ? (userSessions.get(from)?.page || 0) + 1 : 0;
                const allSrv = getServices();
                if (allSrv.length === 0) {
                    await vynaa.sendMessage(from, { text: "❌ Data service kosong. Ketik *updatesrv* dulu." });
                    break;
                }
                
                const limit = 20;
                const startIdx = page * limit;
                const paginated = allSrv.slice(startIdx, startIdx + limit);

                if (paginated.length === 0) {
                    await vynaa.sendMessage(from, { text: "🏁 Sudah mencapai akhir daftar service." });
                    userSessions.delete(from);
                    break;
                }

                let srvText = `📂 *LIST SERVICE (Hal ${page + 1})*\n\n`;
                paginated.forEach(s => {
                    const price = hitungHarga(s.rate, 1000);
                    srvText += `ID: ${s.service}\nNama: ${s.name}\nHarga: Rp ${price}/1k\nMin/Max: ${s.min}/${s.max}\n\n`;
                });
                srvText += `Ketik *nextservice* untuk halaman berikutnya.`;

                userSessions.set(from, { page });
                await vynaa.sendMessage(from, { text: srvText });
                break;

            default:
                if (command.startsWith("search ")) {
                    const query = command.replace("search ", "");
                    const results = searchServices(query).slice(0, 20);
                    if (results.length === 0) {
                        await vynaa.sendMessage(from, { text: "❌ Tidak ditemukan service dengan kata kunci tersebut." });
                    } else {
                        let searchText = `🔍 *HASIL PENCARIAN: ${query}*\n\n`;
                        results.forEach(s => {
                            const price = hitungHarga(s.rate, 1000);
                            searchText += `ID: ${s.service}\nNama: ${s.name}\nHarga: Rp ${price}/1k\n\n`;
                        });
                        searchText += `_Format order: Order ID.JUMLAH.LINK_`;
                        await vynaa.sendMessage(from, { text: searchText });
                    }
                }
                break;
        }

    } catch (error) {
        console.error(error);
    }
};

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