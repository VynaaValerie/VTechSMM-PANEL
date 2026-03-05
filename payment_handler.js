import axios from 'axios';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const configPath = path.resolve(__dirname, 'smm_config.json');
const config = JSON.parse(fs.readFileSync(configPath, 'utf8'));

export const createQris = async (orderId, amount) => {
    try {
        console.log(`Creating QRIS: orderId=${orderId}, amount=${amount}`);
        const response = await axios.post(`${config.pakasir.api_url}/transactioncreate/qris`, {
            project: config.pakasir.slug,
            order_id: orderId,
            amount: Math.max(500, parseInt(amount)),
            api_key: config.pakasir.api_key
        });
        console.log('Pakasir Response:', response.data);
        return response.data;
    } catch (error) {
        console.error('Pakasir Error:', error.response?.data || error.message);
        return { error: error.message };
    }
};

export const checkPaymentStatus = async (orderId, amount) => {
    try {
        const url = `${config.pakasir.api_url}/transactiondetail?project=${config.pakasir.slug}&amount=${amount}&order_id=${orderId}&api_key=${config.pakasir.api_key}`;
        const response = await axios.get(url);
        return response.data;
    } catch (error) {
        return { error: error.message };
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