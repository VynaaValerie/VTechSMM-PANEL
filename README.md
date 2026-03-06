# Vynaa Bot - WhatsApp SMM Bot

![VegaTech Logo](https://e.top4top.io/p_3710h64px9.png)

SMM Panel Multi Provider lengkap dan profesional dengan Node.js + Baileys. Platform Social Media Marketing terbaik dengan harga termurah dan layanan terlengkap.

## Group 
https://chat.whatsapp.com/IweqL2NAVve5ZKcoagMizs?mode=gi_t 

web https://vtechsmm.biz.id

• Jasa pembuatan website 
• Menerima perbaikan script atau fitur bot
• Menerima pembuatan fitur bot
• Menerima semua kebutuhan bot
• Menerima dia dengan segala kekurangannya;)
ℹ️ Information

• Bisa bayar di awal atau akhir
• Pembayaran melalu QRIS Only
• Testimoni Banyak

## Overview
A WhatsApp bot built with Node.js using the Baileys library. Integrated with VTech SMM API for services and Pakasir API for QRIS payments.

## Features
- **SMM Panel Integration**: Buy followers, likes, etc. directly via WhatsApp.
- **QRIS Payment**: Automatic invoice generation with QRIS. No deposit system, pay per order.
- **Service Management**: 
    - `allservice`: List services with pagination (20 per page).
    - `search [query]`: Search services by ID, Name, or Category.
    - `updatesrv`: Manually sync services from provider.
- **No-Prefix Ordering**: Order format `ID.JUMLAH.LINK` (e.g., `123.1000.https://social.com/user`).

## Configuration
- `smm_config.json`: Contains API keys and URLs for SMM and Payment providers.
- `database/services.json`: Local cache of provider services.

## Setup
1. `npm install`
2. Configure `smm_config.json` with valid API keys.
3. `node index.js`
