// Importações necessárias
const schedule = require('node-schedule');
const { default: makeWASocket, useMultiFileAuthState, fetchLatestBaileysVersion, DisconnectReason } = require('@whiskeysockets/baileys');
const qrcode = require('qrcode-terminal');
const axios = require('axios');
const axiosRetry = require('axios-retry').default;
const cheerio = require('cheerio');
const puppeteer = require('puppeteer-core');

// Configurações gerais
const groupId = '120363385860109166@g.us'; // Substitua pelo ID do seu grupo

// Lista de lançamentos
const weeklyReleases = [
    
    {group:'4 PIX DE 30!\n\npara participar basta criar uma conta,\ndepositar 15,00\n\nhttps://gemaspg.com/?id=938963826&currency=BRL&type=2\n\nbater print e manda para a kaká no privado!\n\napós isso, escolhe 1 número disponível e envie seu id.\n\nSORTEIO AMANHÃ, PRECISA PREENCHER A LISTA! 💖\n\ngráfico da fp para te ajudar nos ganhos;\nhttps://www.grupofpsinais.com.br'}
    ,//{ group: 'Grupo FP', code: 'GEMASPG🎰✅', link: 'https://gemaspg.com/?id=938963826&currency=BRL&type=2' },
    //{ group: 'Equipe 777', code: 'PARABÉNS777🎰✅', link: 'https://777-parabens777.cc/?id=451572321&currency=BRL&type=2' },
    //{ group: 'Grupo MK', code: '2025MK🎰✅', link: 'https://2025-mk.com/?id=103304974&currency=BRL&type=2' },
    //{ group: 'Grupo Anjo', code: 'BFFPG🎰✅', link: 'https://bffpg.net/?id=338627118&currency=BRL&type=2' },
    //{ group: 'Grupo KF', code: 'ABAB🎰✅', link: 'https://ababkf.bet/?id=516490713&currency=BRL&type=2' },
    
    //{ group: 'Grupo VOY', code: 'NEWYEARPG🎰✅', link: 'https://voy-newyearpg.com/?id=767103918&currency=BRL&type=2' },
];

// Função Sorte
const generateRandomLuck = () => Math.floor(Math.random() * 21) + 79;

//Função Bingo
const generateBingoNumbers = () => {
    const numbers = [];
    while (numbers.length < 6) {
        const randomNumber = Math.floor(Math.random() * 99) + 1;
        if (!numbers.includes(randomNumber)) {
            numbers.push(randomNumber);
        }
    }
    return numbers.sort((a, b) => a - b);
};

// Funções de envio de mensagens
const sendWeeklyReleases = async (sock, groupId) => {
    try {
        let message = '🌟 *SORTEIO DA SEMANA* 🌟\n\n';
        
        // Ativar quando quiser anunciar somente ao sorteio
        weeklyReleases.forEach((release) => {
            message += `${release.group}\n`;
        });

        // Ativar quando quiser mandar os links
        // weeklyReleases.forEach((release) => {
        //     message += `*${release.group}*\n${release.code}\n${release.link}\n\n`;
        // });

        await sock.sendMessage(groupId, { text: message });
        console.log(`[BOT] Mensagem enviada para o grupo ${groupId} com sucesso!`);
    } catch (error) {
        console.error('[BOT] Erro ao enviar os lançamentos:', error);
    }
};

//Mencionar todos do grupo
const mentionEveryone = async (sock, sender) => {
    try {
        console.log(`[BOT] Mencionando todos os membros do grupo ${sender}`);
        const groupMetadata = await sock.groupMetadata(sender);
        const mentions = groupMetadata.participants.map(p => p.id);
        await sock.sendMessage(sender, { text: 'Mencionando todos os membros do grupo!', mentions });
    } catch (error) {
        console.error('Erro ao mencionar todos:', error);
    }
};

const handleLuckCommand = async (sock, sender, senderName) => {
    try {
        console.log(`[BOT] Calculando sorte para ${senderName} no grupo ${sender}`);
        const randomLuck = generateRandomLuck();
        const message = `🌟 Sua sorte de hoje é: ${randomLuck}%!\nAproveite seu dia, ${senderName}!`;
        await sock.sendMessage(sender, { text: message });
    } catch (error) {
        console.error('Erro ao calcular a sorte:', error);
    }
};

// Função para responder ao comando /bingo
const handleBingoCommand = async (sock, sender) => {
    try {
        console.log(`[BOT] Gerando números de bingo para o grupo ${sender}`);
        const bingoNumbers = generateBingoNumbers();
        const message = `🎉 Seus números de bingo são:\n${bingoNumbers.join(', ')}`;
        await sock.sendMessage(sender, { text: message });
    } catch (error) {
        console.error('Erro ao gerar números de bingo:', error);
    }
};


//Função Help
const sendHelpMessage = async (sock, sender) => {
    const helpMessage = `
🌟 *Comandos Disponíveis* 🌟

/help - Mostra esta lista de comandos.
/everyone - Menciona todos os membros do grupo.
/bingo - Gera uma sequência de números de bingo.
/sorte - Mostra sua sorte do dia em forma de porcentagem.

⚠️ *Regras do Grupo* ⚠️
- Envio de links por membros não-administradores resulta em expulsão automática do grupo.
    `;
    try {
        console.log(`[BOT] Enviando mensagem de ajuda para o grupo ${sender}`);
        await sock.sendMessage(sender, { text: helpMessage });
    } catch (error) {
        console.error('Erro ao enviar a mensagem de ajuda:', error);
    }
};

// Eventos do WhatsApp
const handleMessage = async (sock, message) => {
    const sender = message.key.remoteJid;
    const text = message.message?.conversation || message.message?.extendedTextMessage?.text || '';
    console.log(`[BOT] Mensagem recebida no grupo ${sender}:`, text);

    if (text.startsWith('/')) {
        const command = text.split(' ')[0].toLowerCase();
        console.log(`[BOT] Comando detectado: ${command}`);
        switch (command) {
            case '/help':
                await sendHelpMessage(sock, sender);
                break;
            case '/everyone':
                await mentionEveryone(sock, sender);
                break;
            case '/bingo':
                await handleBingoCommand(sock, sender);
                break;
            case '/sorte':
                await handleLuckCommand(sock, sender, message.pushName || sender.split('@')[0]);
                break;
            default:
                console.log(`[BOT] Comando não reconhecido: ${command}`);
                await sock.sendMessage(sender, { text: 'Comando não reconhecido! Use /help para ver a lista de comandos.' });
        }
    }
};

// Conexão principal do WhatsApp
const connectToWhatsApp = async () => {
    const { state, saveCreds } = await useMultiFileAuthState('./auth_info');
    const { version } = await fetchLatestBaileysVersion();

    const sock = makeWASocket({
        version,
        auth: state,
    });

    sock.ev.on('messages.upsert', async (msgEvent) => {
        for (const msg of msgEvent.messages) {
            if (!msg.key.fromMe) {
                console.log(`[BOT] Nova mensagem recebida no grupo ${msg.key.remoteJid}`);
                await handleMessage(sock, msg);
            }
        }
    });

    sock.ev.on('connection.update', (update) => {
        const { connection, lastDisconnect, qr } = update;
        if (connection === 'close') {
            const shouldReconnect = (lastDisconnect?.error?.output?.statusCode || 0) !== DisconnectReason.loggedOut;
            console.log(`[BOT] Conexão encerrada. Reconectar: ${shouldReconnect}`);
            if (shouldReconnect) connectToWhatsApp();
        } else if (connection === 'open') {
            console.log(`[BOT] Conectado ao WhatsApp! Grupo ID: ${groupId}`);

            //Alterar o tempo Mensagem Automática
            schedule.scheduleJob('*/30 * * * *', () => sendWeeklyReleases(sock, groupId));
        } else if (qr) {
            console.log('[BOT] QR Code gerado para conexão.');
            qrcode.generate(qr, { small: true });
        }
    });

    sock.ev.on('creds.update', saveCreds);

    sock.ev.on('messages.upsert', async (msgEvent) => {
        for (const msg of msgEvent.messages) {
            const sender = msg.key.remoteJid;
            const text = msg.message?.conversation || '';
            console.log(`[BOT] Mensagem detectada no grupo ${sender}:`, text);
            if (text.match(/https?:\/\/[^\s]+/)) {
                console.log(`[BOT] Mensagem com link detectada no grupo ${sender}`);
                await handleLinkMessage(sock, groupId, msg);
            }
        }
    });
};

// Função para expulsar quem enviar links
const handleLinkMessage = async (sock, groupId, message) => {
    const sender = message.key.participant || message.key.remoteJid;
    const text = message.message?.conversation || message.message?.extendedTextMessage?.text || '';

    console.log(`[BOT] Verificando mensagem por links no grupo ${groupId} por ${sender}`);

    if (text.match(/https?:\/\/[^\s]+/) && !message.key.fromMe) {
        try {
            const groupMetadata = await sock.groupMetadata(groupId);
            const isAdmin = groupMetadata.participants.some(
                (participant) => participant.id === sender && participant.admin
            );

            if (!isAdmin) {
                console.log(`[BOT] Link detectado. Removendo participante ${sender} do grupo ${groupId}`);
                await sock.groupParticipantsUpdate(groupId, [sender], 'remove');
                await sock.sendMessage(
                    groupId,
                    { text: `⚠️ O usuário @${sender.split('@')[0]} desobedeceu às regras do grupo e foi removido.`, mentions: [sender] }
                );
            }
        } catch (error) {
            console.error('Erro ao verificar/remover participante:', error);
        }
    }
};

// Inicialização
connectToWhatsApp();
