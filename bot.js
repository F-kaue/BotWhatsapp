const schedule = require('node-schedule');
const { default: makeWASocket, useMultiFileAuthState, fetchLatestBaileysVersion, DisconnectReason } = require('@whiskeysockets/baileys');
const qrcode = require('qrcode-terminal');




// Configurações gerais
const groupId = '120363385272147800@g.us'; // Grupo Kaká
//const groupId = '120363389372931037@g.us'; //Grupo Teste

// Lista de lançamentos (edite conforme necessário)
const weeklyReleases = [
    //{group:'Mensagem teste'},
    {group:'SUPER SORTEIO\n🥇🥈🥉: Pix de 50\n+ 15 bancas de 20,00\nresultado 17/01\n——————————————\nDEPOSITE NO MINIMO 15,00R$\nEM QUALQUER PLATAFORMA INDICADA\nE GANHA 1 NUMERO\n\nDEPOSITE 50R$ EM QUALQUER\nPLATAFORMA INDICADA E GANHE\n10 NUMEROS\n———————————————\nENVIAR PRINT PARA @Meu numero: .\n\nPODE DEPOSITAR NA MESMA \nCONTA! ✅\n———————————————\nPLATAFORMAS INDICADAS\n\nGRUPO FP 🔥\nhttps://1motelpg.com/?id=725526060&currency=BRL&type=2\n\nGRUPO EQP777 🏠\nhttps://777-capa777.net/?id=695199135&currency=BRL&type=2\n\nGRUPO MANGA🥭\nhttps://manga-vesak-pg.com/?id=214966595&currency=BRL&type=2'}
    ,//{ group: 'Grupo FP', code: 'GEMASPG🎰✅', link: 'https://gemaspg.com/?id=938963826&currency=BRL&type=2' },
    //{ group: 'Equipe 777', code: 'PARABÉNS777🎰✅', link: 'https://777-parabens777.cc/?id=451572321&currency=BRL&type=2' },
    //{ group: 'Grupo MK', code: '2025MK🎰✅', link: 'https://2025-mk.com/?id=103304974&currency=BRL&type=2' },
    //{ group: 'Grupo Anjo', code: 'BFFPG🎰✅', link: 'https://bffpg.net/?id=338627118&currency=BRL&type=2' },
    //{ group: 'Grupo KF', code: 'ABAB🎰✅', link: 'https://ababkf.bet/?id=516490713&currency=BRL&type=2' },
    
    //{ group: 'Grupo VOY', code: 'NEWYEARPG🎰✅', link: 'https://voy-newyearpg.com/?id=767103918&currency=BRL&type=2' },
];



// Função para enviar os lançamentos no grupo
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

// Agendamento para enviar a mensagem automaticamente a cada 1 minuto
const scheduleWeeklyReleases = (sock, groupId) => {
    console.log('[BOT] Agendando mensagens automáticas para o grupo...');

//Alterar o tempo de envio da mensagem ativar/desativar mensagem automatica
    schedule.scheduleJob('*/30 * * * *', () => {
        console.log('[BOT] Enviando mensagens automáticas...');
        sendWeeklyReleases(sock, groupId);
    });
};

// Função principal para conectar ao WhatsApp
const connectToWhatsApp = async () => {
    const { state, saveCreds } = await useMultiFileAuthState('./auth_info');
    const { version, isLatest } = await fetchLatestBaileysVersion();
    console.log(`Usando a versão do WA v${version.join('.')}, é a mais recente: ${isLatest}`);

    const sock = makeWASocket({
        version,
        auth: state,
    });

    sock.ev.on('messages.upsert', async (messageEvent) => {
        const messages = messageEvent.messages;
    
        for (const msg of messages) {
            const remoteJid = msg.key?.remoteJid;
    
            // Verifica se o ID do grupo existe e a mensagem é válida
            if (remoteJid?.endsWith('@g.us') && msg.message?.conversation === '!id') {
                try {
                    // Envia a mensagem para o grupo com o ID
                    await sock.sendMessage(remoteJid, { text: `O ID deste grupo é: ${remoteJid}` });
                } catch (error) {
                    console.error('Erro ao enviar a mensagem:', error);
                }
            }
        }
    });
    
try {
    await sendMessageFunction(); // Substitua pela sua função de envio
} catch (error) {
    console.error("Erro ao enviar mensagem:", error);
}

    sock.ev.on('messages.upsert', async (messageEvent) => {
        const messages = messageEvent.messages;
    
        for (const msg of messages) {
            if (msg.key.remoteJid.endsWith('@g.us')) {
                console.log(`Mensagem recebida de um grupo:`);
                console.log(`ID do Grupo: ${msg.key.remoteJid}`);
                console.log(`Nome do Grupo: ${msg.pushName || 'Desconhecido'}`);
            }
        }
    });

    sock.ev.on('connection.update', (update) => {
        const { connection, lastDisconnect } = update;
        if (connection === 'close') {
            const shouldReconnect = (lastDisconnect?.error?.output?.statusCode || 0) !== DisconnectReason.loggedOut;
            console.log('Conexão encerrada. Reconectando:', shouldReconnect);
            if (shouldReconnect) {
                connectToWhatsApp();
            }
        } else if (connection === 'open') {
            console.log('Conectado ao WhatsApp!');

            // Agendar envio de lançamentos para um grupo específico
            scheduleWeeklyReleases(sock, groupId);
        }
    });

    sock.ev.on('messages.upsert', async ({ messages }) => {
        const message = messages[0];
        if (!message.message || message.key.fromMe) return;

        const sender = message.key.remoteJid;
        const text = message.message.conversation || message.message.extendedTextMessage?.text || '';

        console.log(`Mensagem de ${message.pushName || sender.split('@')[0]}: ${text}`);

        if (text.startsWith('/')) {
            const command = text.split(' ')[0];
            switch (command) {
                case '/id':
                await sock.sendMessage(sender, { text: `O ID deste grupo é: ${sender}` });
                break;

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
                    await sock.sendMessage(sender, { text: 'Comando não reconhecido! Use /help para ver a lista de comandos.' });
            }
        }
    });
    sock.ev.on('connection.update', (update) => {
        const { connection, qr } = update;
        if (connection === 'open') {
            console.log('Conectado ao WhatsApp!');
        } else if (qr) {
            qrcode.generate(qr, { small: true }); // Exibe o QR code no terminal
        }
    });


    sock.ev.on('messages.upsert', async (messageEvent) => {
        const messages = messageEvent.messages;
    
        for (const msg of messages) {
            if (msg.key.remoteJid?.endsWith('@g.us')) {
                const groupId = msg.key.remoteJid;
    
                // Chama a função para verificar links
                await handleLinkMessage(sock, groupId, msg);
    
                const text = msg.message?.conversation || msg.message?.extendedTextMessage?.text || '';
    
                // Comando para iniciar o quiz
                if (text === '/quiz') {
                    await handleQuizCommand(sock, groupId);
                }
            }
        }
    });



    sock.ev.on('creds.update', saveCreds);
};

// Função para mencionar todos os membros de um grupo sem poluir a mensagem
const mentionEveryone = async (sock, sender) => {
    try {
        // Obtém os dados do grupo
        const groupMetadata = await sock.groupMetadata(sender);
        const mentions = groupMetadata.participants.map(p => p.id);

        // Envia uma mensagem limpa mencionando todos
        await sock.sendMessage(sender, { 
            text: 'Mencionando todos os membros do grupo!', 
            mentions 
        });
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

// Função para expulsar quem enviar links
const handleLinkMessage = async (sock, groupId, message) => {
    const sender = message.key.participant || message.key.remoteJid;
    const text = message.message?.conversation || message.message?.extendedTextMessage?.text || '';

    // Verifica se a mensagem contém um link e se o autor não é administrador
    if (text.match(/https?:\/\/[^\s]+/) && !message.key.fromMe) {
        try {
            const groupMetadata = await sock.groupMetadata(groupId);
            const isAdmin = groupMetadata.participants.some(
                (participant) => participant.id === sender && participant.admin
            );

            if (!isAdmin) {
                await sock.groupParticipantsUpdate(groupId, [sender], 'remove'); // Remove o participante
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

// Função para enviar a lista de comandos disponíveis
const sendHelpMessage = async (sock, sender) => {
    const helpMessage = `
🌟 *Comandos Disponíveis* 🌟

/help - Mostra esta lista de comandos.
/everyone - Menciona todos os membros do grupo.
/bingo - Inicia uma rodada de bingo.
/sorte - Mostra sua sorte do dia em forma de porcentagem.

⚠️ *Regras do Grupo* ⚠️
- Envio de links por membros não-administradores resulta em expulsão automática do grupo.

Use os comandos no formato indicado e aproveite as funcionalidades do bot! 😊
    `;

    try {
        await sock.sendMessage(sender, { text: helpMessage });
    } catch (error) {
        console.error('Erro ao enviar a mensagem de ajuda:', error);
        await sock.sendMessage(sender, { text: 'Erro ao enviar a mensagem de ajuda. Tente novamente mais tarde.' });
    }
};


// Inicializar o bot
connectToWhatsApp();
