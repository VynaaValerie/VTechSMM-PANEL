import axios from 'axios';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import cron from 'node-cron';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const configPath = path.resolve(__dirname, 'smm_config.json');
const config = JSON.parse(fs.readFileSync(configPath, 'utf8'));

const SERVICE_FILE = path.resolve(__dirname, 'database/services.json');

if (!fs.existsSync(path.resolve(__dirname, 'database'))) {
    fs.mkdirSync(path.resolve(__dirname, 'database'));
}

export const hitungHarga = (rate, quantity) => {
    const margin = 1.25;

    const unit = parseFloat(rate) / 1000;
    const finalPrice = Math.ceil(unit * parseInt(quantity) * margin);

    console.log(`[DEBUG HARGA] Rate: ${rate}, Qty: ${quantity}, Margin: ${margin}, FinalPrice: ${finalPrice}`);

    return finalPrice;
};

export const fetchServices = async () => {
    try {
        const response = await axios.post(config.smm.api_url, {
            key: config.smm.api_key,
            action: 'services'
        });
        if (Array.isArray(response.data)) {
            // Map the services to ensure IDs are strings/numbers as expected and clean up data
            const cleanedServices = response.data.map(s => ({
                service: s.service,
                name: s.name,
                category: s.category,
                rate: s.rate,
                min: s.min,
                max: s.max,
                type: s.type,
                desc: s.desc
            }));
            fs.writeFileSync(SERVICE_FILE, JSON.stringify(cleanedServices, null, 2));
            return cleanedServices;
        }
        return [];
    } catch (error) {
        console.error('Error fetching services:', error.message);
        return [];
    }
};

export const getServices = () => {
    if (fs.existsSync(SERVICE_FILE)) {
        return JSON.parse(fs.readFileSync(SERVICE_FILE, 'utf8'));
    }
    return [];
};

export const searchServices = (query) => {
    const services = getServices();
    const q = query.toLowerCase();
    return services.filter(s => 
        s.service.toString().includes(q) || 
        s.name.toLowerCase().includes(q) || 
        s.category.toLowerCase().includes(q)
    );
};

export const getOrderStatus = async (orderId) => {
    try {
        const response = await axios.post(config.smm.api_url, {
            key: config.smm.api_key,
            action: 'status',
            order: orderId.toString()
        });
        return response.data;
    } catch (error) {
        console.error('SMM Status Error:', error.response?.data || error.message);
        return { error: error.message };
    }
};

export const createOrder = async (serviceId, link, quantity) => {
    try {
        console.log(`Sending order to SMM: service=${serviceId}, link=${link}, quantity=${quantity}`);
        const response = await axios.post(config.smm.api_url, {
            key: config.smm.api_key,
            action: 'add',
            service: serviceId.toString(),
            link: link,
            quantity: parseInt(quantity)
        }, {
            headers: {
                'Content-Type': 'application/json'
            }
        });
        console.log('SMM Response:', response.data);
        return response.data;
    } catch (error) {
        console.error('SMM API Error:', error.response?.data || error.message);
        return { error: error.message };
    }
};

// Auto update services every 24 hours
cron.schedule('0 0 * * *', () => {
    fetchServices();
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