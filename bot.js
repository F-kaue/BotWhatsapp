const schedule = require('node-schedule');
const { default: makeWASocket, useMultiFileAuthState, fetchLatestBaileysVersion, DisconnectReason } = require('@whiskeysockets/baileys');
const qrcode = require('qrcode-terminal');

// Configurações gerais
const groupId = '120363369329720966@g.us'; // Grupo Kaká
//const groupId = '120363389372931037@g.us'; //Grupo Teste

// Lista de lançamentos (edite conforme necessário)
const weeklyReleases = [
    //{group:'Mensagem teste'},
    {group:`
SUPER SORTEIO
🥇🥈🥉: Pix de 50
+ 15 bancas de 20,00
resultado 17/01
——————————————
DEPOSITE NO MINIMO 10,00R$
EM QUALQUER PLATAFORMA INDICADA
E GANHA 1 NUMERO

DEPOSITE 30R$ EM QUALQUER
PLATAFORMA INDICADA E GANHE
10 NÚMEROS
———————————————
ENVIAR PRINT PARA @+558592441873 : .

PODE DEPOSITAR NA MESMA 
CONTA! ✅
———————————————

PLATAFORMAS 🌊🐚🐙

Grupo FP
https://3hippopg.com/?id=614882014&currency=BRL&type=2

Equipe 777
https://www.praca777.win/?id=872194851&currency=BRL&type=2



`}
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
    // schedule.scheduleJob('*/30 * * * *', () => {
    //     console.log('[BOT] Enviando mensagens automáticas...');
    //     sendWeeklyReleases(sock, groupId);
    // });
};

// Função principal para conectar ao WhatsApp
const connectToWhatsApp = async () => {
    const { state, saveCreds } = await useMultiFileAuthState('./ativ_whatsapp'); //Alterar para ./ativ_whatsapp_teste para testes
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
     // Substitua pela sua função de envio
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
        const messageType = Object.keys(message.message)[0];

        if (text.startsWith('/')) {
            const command = text.split(' ')[0];
            const args = text.split(' ').slice(1);
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
                case '/tag':
                    if (
                        message.message.extendedTextMessage && 
                        message.message.extendedTextMessage.contextInfo &&
                        message.message.extendedTextMessage.contextInfo.quotedMessage
                    ) {
                        const quotedMessage = message.message.extendedTextMessage.contextInfo.quotedMessage;
                        const groupId = message.key.remoteJid; // Obtém o ID do grupo
                        await handleTagCommand(sock, sender, quotedMessage, groupId);
                    } else {
                        await sock.sendMessage(sender, { text: 'Por favor, responda a uma mensagem ao usar o comando /tag.' });
                    }
                    break;
                case '/forca':
                    try {
                        console.log("Comando /forca recebido");
                        await resetGame();
                        await sock.sendMessage(sender, {
                            text: `
            🤖 *Jogo da Forca Iniciado!* 🤖
            Tema: ${currentHint}
            
            ✅ Comandos:
            - /letra (letra): Para chutar uma letra.
            - /adivinhar (palavra): Para tentar adivinhar a palavra completa.
            - Você tem ${attemptsLeft} tentativas!
            
            Progresso da palavra: ${getWordProgress()}
                                `,
                            });
                        } catch (error) {
                            console.error('Erro ao iniciar jogo da forca:', error);
                            await sock.sendMessage(sender, { text: 'Erro ao iniciar o jogo da forca. Tente novamente mais tarde.' });
                        }
                        break;
            
                case '/letra':
                    if (!args[0] || args[0].length !== 1) {
                        await sock.sendMessage(sender, { text: 'Envie uma letra válida! Exemplo: /letra a' });
                    } else {
                        const result = guessLetter(args[0]);
                        await sock.sendMessage(sender, { text: result });
                    }
                    break;
            
                case '/adivinhar':
                    if (!args[0]) {
                        await sock.sendMessage(sender, { text: 'Envie uma palavra válida! Exemplo: /adivinhar casa' });
                    } else {
                        const result = guessWord(args.join(' '));
                        await sock.sendMessage(sender, { text: result });
                    }
                    break;
                case '/quiz':
                    await handleQuizCommand(sock, sender);
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

// Função para reenviar mensagem respondida e mencionar todos
const handleTagCommand = async (sock, sender, quotedMessage, groupId) => {
    try {
        if (!quotedMessage) {
            await sock.sendMessage(sender, { text: 'Por favor, responda a uma mensagem ao usar o comando /tag.' });
            return;
        }

        // Obtém os dados do grupo
        const groupMetadata = await sock.groupMetadata(groupId);
        const mentions = groupMetadata.participants.map(p => p.id); // Lista de IDs dos membros do grupo

        // Identifica o tipo de mensagem citada e reenvia com as menções
        let messageContent = {};
        if (quotedMessage.conversation) {
            // Mensagem de texto
            messageContent = { text: quotedMessage.conversation, mentions };
        } else if (quotedMessage.imageMessage) {
            // Mensagem com imagem
            const caption = quotedMessage.imageMessage.caption || ''; // Obtém a legenda, se houver
            const imageBuffer = await sock.downloadMediaMessage(quotedMessage.imageMessage); // Faz download da mídia
            messageContent = { 
                image: imageBuffer, 
                caption, 
                mentions 
            };
        } else if (quotedMessage.videoMessage) {
            // Mensagem com vídeo
            const caption = quotedMessage.videoMessage.caption || ''; // Obtém a legenda, se houver
            const videoBuffer = await sock.downloadMediaMessage(quotedMessage.videoMessage); // Faz download da mídia
            messageContent = { 
                video: videoBuffer, 
                caption, 
                mentions 
            };
        } else if (quotedMessage.audioMessage) {
            // Mensagem com áudio
            const audioBuffer = await sock.downloadMediaMessage(quotedMessage.audioMessage); // Faz download da mídia
            messageContent = { 
                audio: audioBuffer, 
                mimetype: quotedMessage.audioMessage.mimetype, 
                ptt: true // Define como mensagem de áudio PTT (push-to-talk)
            };
        } else {
            // Outros tipos de mensagens não suportados
            await sock.sendMessage(sender, { text: 'Este tipo de mensagem ainda não é suportado pelo comando /tag.' });
            return;
        }

        // Reenvia a mensagem no grupo com as menções
        await sock.sendMessage(groupId, messageContent);
        console.log(`[BOT] Mensagem respondida e todos os membros mencionados no grupo ${groupId}`);
    } catch (error) {
        console.error('Erro ao processar o comando /tag:', error);
        await sock.sendMessage(sender, { text: 'Erro ao processar o comando /tag. Tente novamente mais tarde.' });
    }
};


//Função Forca
// Dependências
const fs = require('fs'); // Para manipular arquivos
const palavras = require('./palavras'); // Importa o arquivo com palavras e dicas

// Estados do jogo
let currentWord = ''; // Palavra atual do jogo
let currentHint = ''; // Dica ou tema da palavra
let usedWords = []; // Palavras já usadas
let guessedLetters = []; // Letras já adivinhadas
let attemptsLeft = 6; // Número de tentativas restantes

// Carrega as palavras já usadas do arquivo JSON
const loadUsedWords = () => {
    if (fs.existsSync('usedWords.json')) {
        usedWords = JSON.parse(fs.readFileSync('usedWords.json', 'utf-8'));
    }
};

// Salva as palavras já usadas no arquivo JSON
const saveUsedWords = () => {
    fs.writeFileSync('usedWords.json', JSON.stringify(usedWords));
};

// Busca uma nova palavra aleatória do arquivo de palavras
const fetchNewWord = async () => {
    console.log("Buscando nova palavra...");
    const randomIndex = Math.floor(Math.random() * palavras.length);
    const { word, hint } = palavras[randomIndex];

    // Verifica se a palavra já foi usada
    if (!usedWords.includes(word)) {
        usedWords.push(word);
        saveUsedWords(); // Atualiza a lista de palavras usadas
        return { word, hint };
    } else {
        console.log("Palavra já usada, tentando outra...");
        return await fetchNewWord(); // Busca outra palavra recursivamente
    }
};

// Reseta o estado do jogo
const resetGame = async () => {
    console.log("Resetando o jogo...");
    const newWord = await fetchNewWord();
    if (newWord) {
        currentWord = newWord.word;
        currentHint = newWord.hint;
        guessedLetters = [];
        attemptsLeft = 6;
        console.log("Novo jogo iniciado:", currentWord);
    } else {
        throw new Error('Não foi possível iniciar um novo jogo.');
    }
};

// Exibe o progresso da palavra
const getWordProgress = () => {
    return currentWord
        .split('')
        .map((letter) => (guessedLetters.includes(letter) ? letter : '_'))
        .join(' ');
};

// Processa a adivinhação de uma letra
const guessLetter = (letter) => {
    letter = letter.toUpperCase();

    if (guessedLetters.includes(letter)) {
        return `A letra "${letter}" já foi usada! Tente outra.`;
    }

    guessedLetters.push(letter);

    if (currentWord.includes(letter)) {
        if (!getWordProgress().includes('_')) {
            const completedWord = currentWord;
            resetGame(); // Reseta o jogo após vitória
            return `🎉 Parabéns! Você completou a palavra: ${completedWord}`;
        }
        return `✅ Acertou! Progresso: ${getWordProgress()}`;
    } else {
        attemptsLeft -= 1;
        if (attemptsLeft <= 0) {
            const word = currentWord;
            resetGame(); // Reseta o jogo após derrota
            return `💀 Você perdeu! A palavra era: ${word}`;
        }
        return `❌ Errou! Tentativas restantes: ${attemptsLeft}\nProgresso: ${getWordProgress()}`;
    }
};
// Processa a adivinhação da palavra completa
const guessWord = (guess) => {
    guess = guess.toUpperCase();

    if (guess === currentWord) {
        const word = currentWord;
        resetGame(); // Reseta o jogo após vitória
        return `🎉 Parabéns! Você acertou a palavra: ${word}`;
    } else {
        attemptsLeft -= 1;
        if (attemptsLeft <= 0) {
            const word = currentWord;
            resetGame(); // Reseta o jogo após derrota
            return `💀 Você perdeu! A palavra era: ${word}`;
        }
        return `❌ Errou! Tentativas restantes: ${attemptsLeft}`;
    }
};

//Função Quiz

let usedQuestions = []; // Lista de perguntas já usadas

// Função para carregar perguntas do arquivo
const loadQuestions = () => {
    const data = fs.readFileSync('./questions.json', 'utf-8');
    return JSON.parse(data);
};

// Função para escolher uma pergunta que ainda não foi feita
const getRandomQuestion = () => {
    const questions = loadQuestions();
    const availableQuestions = questions.filter(q => !usedQuestions.includes(q.question));

    if (availableQuestions.length === 0) {
        usedQuestions = []; // Reseta a lista se todas as perguntas já foram usadas
        return getRandomQuestion();
    }

    const randomIndex = Math.floor(Math.random() * availableQuestions.length);
    const selectedQuestion = availableQuestions[randomIndex];
    usedQuestions.push(selectedQuestion.question);
    return selectedQuestion;
};

// Função para lidar com o comando /quiz
const handleQuizCommand = async (sock, sender) => {
    const question = getRandomQuestion();

    const message = `
🤔 *Pergunta do Quiz* 🤔

${question.question}
A) ${question.options[0]}
B) ${question.options[1]}
C) ${question.options[2]}
D) ${question.options[3]}

Responda enviando a alternativa correspondente.
A resposta correta será revelada em 30 segundos!
`;

    await sock.sendMessage(sender, { text: message });

    // Esperar 30 segundos antes de revelar a resposta
    setTimeout(async () => {
        const answerMessage = `✅ *Resposta correta*: ${question.answer}`;
        await sock.sendMessage(sender, { text: answerMessage });
    }, 30000); // 30 segundos
};

// Função para enviar a lista de comandos disponíveis
const sendHelpMessage = async (sock, sender) => {
    const helpMessage = `
🌟 *Comandos Disponíveis* 🌟

/help - Mostra esta lista de comandos.
/everyone - Menciona todos os membros do grupo.
/bingo - Inicia uma rodada de bingo.
/sorte - Mostra sua sorte do dia em forma de porcentagem.
/tag - Marcar a mensagem e enviar para todos.
/forca - Iniciar brincadeira da forca.
/quiz - Iniciar um quiz.


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
