const { default: makeWASocket, makeInMemoryStore, fetchLatestBaileysVersion, useMultiFileAuthState, DisconnectReason } = require('@whiskeysockets/baileys');
const qrcode = require('qrcode-terminal');
const puppeteer = require('puppeteer');
const { createCanvas, loadImage } = require('canvas');

const connectToWhatsApp = async () => {
    const { state, saveCreds } = await useMultiFileAuthState('./auth_info');
    const { version, isLatest } = await fetchLatestBaileysVersion();
    console.log(`Usando a versão do WA v${version.join('.')}, é a mais recente: ${isLatest}`);

    const sock = makeWASocket({
        version,
        auth: state,
    });

    sock.ev.on('creds.update', saveCreds);

    sock.ev.on('connection.update', (update) => {
        const { connection, qr, lastDisconnect } = update;
        if (qr) {
            console.log('Escaneie o QR Code abaixo para se conectar:');
            qrcode.generate(qr, { small: true });
        }

        if (connection === 'close') {
            const shouldReconnect = (lastDisconnect?.error?.output?.statusCode || 0) !== DisconnectReason.loggedOut;
            console.log('Conexão encerrada. Reconectando:', shouldReconnect);
            if (shouldReconnect) {
                connectToWhatsApp();
            }
        } else if (connection === 'open') {
            console.log('Conectado ao WhatsApp!');
        }
    });

    sock.ev.on('messages.upsert', async ({ messages }) => {
        const message = messages[0];
        if (!message.message || message.key.fromMe) return;

        const sender = message.key.remoteJid; // ID do remetente
        const senderName = message.pushName || sender.split('@')[0]; // Nome ou número do remetente
        let text = '';

        if (message.message.conversation) {
            text = message.message.conversation;
        } else if (message.message.extendedTextMessage?.text) {
            text = message.message.extendedTextMessage.text;
        }

        console.log(`Mensagem de ${senderName}: ${text}`);

        if (text.startsWith('/')) {
            const command = text.split(' ')[0];
            switch (command) {
                case '/everyone':
                    await mentionEveryone(sock, sender);
                    break;

                case '/slots':
                    await sendSlotsWithImages(sock, sender);
                    break;

                case '/bingo':
                    await handleBingoCommand(sock, sender);
                    break;

                case '/sorte':
                    await handleLuckCommand(sock, sender, senderName);
                    break;

                default:
                    await sock.sendMessage(sender, { text: 'Comando não reconhecido! Tente: /everyone, /slots, ou /sorte.' });
            }
        }
    });
};

// Função para mencionar todos os membros de um grupo
const mentionEveryone = async (sock, sender) => {
    try {
        const groupMetadata = await sock.groupMetadata(sender);
        const mentions = groupMetadata.participants.map(p => p.id);
        const numbers = mentions.map(id => `@${id.split('@')[0]}`).join(' ');

        await sock.sendMessage(sender, { text: `Mencionando todos:\n${numbers}`, mentions });
    } catch (error) {
        console.error('Erro ao mencionar todos:', error);
        await sock.sendMessage(sender, { text: 'Erro ao tentar mencionar todos os membros.' });
    }
};

// Função para gerar uma sorte aleatória acima de 79
const generateRandomLuck = () => {
    return Math.floor(Math.random() * 21) + 79; // Gera números de 79 a 99
};

// Lista de mensagens criativas para a sorte
const luckMessages = [
    "Hoje é o seu dia de brilhar, @! 💫 Sua sorte está tão alta que até o universo está de olho em você!",
    "A sorte sorriu para você, @! 🍀 Apenas cuidado para não tropeçar no excesso de boa fortuna!",
    "Parabéns, @! 🎉 Sua sorte está no topo hoje. Que tal usar isso para ganhar na loteria?",
    "Cuidado, @! 🔥 Com uma sorte dessas, você pode acabar virando meme de tão incrível que vai ser o seu dia!",
    "Uau, @! 🦄 Sua sorte é tão alta que até as estrelas estão te aplaudindo. Aproveite e faça algo inesquecível hoje!"
];

// Função para responder ao comando /sorte
const handleLuckCommand = async (sock, sender, senderName) => {
    try {
        const randomLuck = generateRandomLuck();
        const randomMessage = luckMessages[Math.floor(Math.random() * luckMessages.length)];

        // Substitui '@' pelo nome ou número do usuário
        const message = randomMessage.replace('@', `@${senderName}`) + `\n\n🌟 Sua sorte de hoje: ${randomLuck}%`;

        // Envia a mensagem mencionando o usuário
        await sock.sendMessage(sender, { 
            text: message, 
            mentions: [sender] 
        });
    } catch (error) {
        console.error('Erro ao calcular a sorte:', error);
        await sock.sendMessage(sender, { text: 'Erro ao calcular sua sorte. Tente novamente mais tarde.' });
    }
};

// Função para buscar os slots com maiores probabilidades
const getSlotsWithProbabilities = async () => {
    try {
        const browser = await puppeteer.launch({ headless: true });
        const page = await browser.newPage();
        await page.goto('https://alibabaslots.org/rtp-live/pg-soft/', {
            waitUntil: 'domcontentloaded',
        });

        await page.waitForSelector('.game-item'); // Espera o carregamento dos elementos

        const slots = await page.evaluate(() => {
            return Array.from(document.querySelectorAll('.game-item')).map(slot => ({
                name: slot.querySelector('.game-name')?.textContent?.trim() || 'Nome não encontrado',
                probability: parseFloat(slot.querySelector('.game-rtp')?.textContent?.replace('%', '').trim()) || 0,
                image: slot.querySelector('img')?.src || null,
            })).filter(slot => slot.image); // Filtra somente os slots com imagens disponíveis
        });

        await browser.close();
        return slots;
    } catch (error) {
        console.error('Erro ao buscar slots:', error);
        return [];
    }
};

// Função para gerar uma imagem com os slots e suas probabilidades
const generateSlotsImage = async () => {
    const canvas = createCanvas(800, 600);
    const ctx = canvas.getContext('2d');

    ctx.fillStyle = '#000000'; // Fundo preto
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    ctx.font = 'bold 30px Arial';
    ctx.fillStyle = '#FFD700'; // Cor dourada para o título
    ctx.textAlign = 'center';
    ctx.fillText('Top 6 Slots Pagantes 🌟', canvas.width / 2, 50);

    const slots = await getSlotsWithProbabilities();
    const filteredSlots = slots.sort((a, b) => b.probability - a.probability).slice(0, 6); // Exibir os 6 slots principais

    if (filteredSlots.length === 0) {
        ctx.font = '20px Arial';
        ctx.fillStyle = '#FF0000';
        ctx.fillText('Nenhum slot disponível', canvas.width / 2, canvas.height / 2);
        return canvas.toBuffer();
    }

    const slotWidth = 150;
    const slotHeight = 150;
    const marginX = 30;
    const marginY = 30;
    const startX = 50;
    const startY = 100;

    for (let i = 0; i < filteredSlots.length; i++) {
        const slot = filteredSlots[i];
        const col = i % 3;
        const row = Math.floor(i / 3);
        const x = startX + col * (slotWidth + marginX);
        const y = startY + row * (slotHeight + marginY);

        try {
            const image = await loadImage(slot.image);
            ctx.drawImage(image, x, y, slotWidth, slotHeight);
        } catch (err) {
            console.error(`Erro ao carregar imagem do slot: ${slot.name}`);
            ctx.fillStyle = '#CCCCCC';
            ctx.fillRect(x, y, slotWidth, slotHeight);
            ctx.fillStyle = '#000000';
            ctx.font = '12px Arial';
            ctx.textAlign = 'center';
            ctx.fillText('Imagem não disponível', x + slotWidth / 2, y + slotHeight / 2);
        }

        const barWidth = slotWidth;
        const barHeight = 15;
        const barX = x;
        const barY = y + slotHeight + 10;

        ctx.fillStyle = '#E0E0E0';
        ctx.fillRect(barX, barY, barWidth, barHeight);

        ctx.fillStyle = slot.probability > 70 ? '#00FF00' : slot.probability > 50 ? '#FFA500' : '#FF0000';
        ctx.fillRect(barX, barY, (slot.probability / 100) * barWidth, barHeight);

        ctx.fillStyle = '#FFFFFF';
        ctx.font = '14px Arial';
        ctx.textAlign = 'center';
        ctx.fillText(`${slot.probability.toFixed(2)}%`, barX + barWidth / 2, barY + barHeight - 5);

        ctx.font = '14px Arial';
        ctx.fillStyle = '#FFFFFF';
        ctx.fillText(slot.name, x + slotWidth / 2, barY + barHeight + 20);
    }

    return canvas.toBuffer();
};

// Função para enviar imagem com slots e probabilidades
const sendSlotsWithImages = async (sock, sender) => {
    try {
        const imageBuffer = await generateSlotsImage();
        await sock.sendMessage(sender, { image: imageBuffer, caption: 'Slots com as Melhores Probabilidades' });
    } catch (error) {
        console.error('Erro ao enviar imagem de slots:', error);
        await sock.sendMessage(sender, { text: 'Erro ao gerar imagem de slots.' });
    }
};

// Função para gerar 6 números de bingo
const generateBingoNumbers = () => {
    const numbers = [];
    while (numbers.length < 6) {
        const randomNumber = Math.floor(Math.random() * 99) + 1;
        if (!numbers.includes(randomNumber)) {
            numbers.push(randomNumber);
        }
    }
    return numbers.sort((a, b) => a - b); // Ordenar os números para facilitar a leitura
};

// Função para responder ao comando /bingo
const handleBingoCommand = async (sock, sender) => {
    try {
        const bingoNumbers = generateBingoNumbers();
        const message = `🎉 Seus números de bingo são:\n${bingoNumbers.join(', ')}`;
        await sock.sendMessage(sender, { text: message });
    } catch (error) {
        console.error('Erro ao gerar números de bingo:', error);
        await sock.sendMessage(sender, { text: 'Erro ao gerar números de bingo. Tente novamente mais tarde.' });
    }
};

// Inicializar o bot
connectToWhatsApp();
