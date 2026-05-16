require('dotenv').config();
const TelegramBot = require('node-telegram-bot-api');
const Anthropic = require('@anthropic-ai/sdk');

// ============================================
// INITIALIZATION
// ============================================

const token = process.env.TELEGRAM_BOT_TOKEN;
const bot = new TelegramBot(token, { polling: true });

const client = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
});

const conversations = {};

// ============================================
// /START COMMAND
// ============================================

bot.onText(/\/start/, (msg) => {
  const chatId = msg.chat.id;
  conversations[chatId] = [];
  
  const welcomeMessage = 
    '👋 ወደ AI Chatbot እንኖት!\n\n' +
    '🤖 Claude AI ጋር ተነጋገር\n\n' +
    '📝 ምሳሌ ጥያቄዎች:\n' +
    '• "ሰላም! ምን ስም?"\n' +
    '• "2 + 2 ምስብ?"\n' +
    '• "Python hello world ኮድ"\n' +
    '• "ጋ recipe ስጡኝ"\n\n' +
    '📋 Commands:\n' +
    '/start - ጀምር\n' +
    '/help - ሕዋስ\n' +
    '/joke - ዜናታ\n' +
    '/quote - ምሳሌ\n' +
    '/clear - ታሪክ ያጸዳ\n\n' +
    '💬 መቀጠል ይችላሉ!';
  
  bot.sendMessage(chatId, welcomeMessage);
  console.log(`✅ User ${chatId} started bot`);
});

// ============================================
// /HELP COMMAND
// ============================================

bot.onText(/\/help/, (msg) => {
  const chatId = msg.chat.id;
  const helpMessage = 
    '📚 ምሳሌ ጥያቄዎች:\n\n' +
    '1️⃣ "ሰላም! ምን ስም?"\n' +
    '   → Greeting\n\n' +
    '2️⃣ "10 ÷ 2 = ?"\n' +
    '   → Math\n\n' +
    '3️⃣ "Python loop ምሳሌ"\n' +
    '   → Code\n\n' +
    '4️⃣ "ጋ recipe ስጡኝ"\n' +
    '   → Recipe\n\n' +
    '5️⃣ "አሚ ማረጋገጫ?"\n' +
    '   → General Q&A\n\n' +
    '/clear - ታሪክ ያጸዳ\n' +
    '/joke - ዜናታ\n' +
    '/quote - ምሳሌ';
  
  bot.sendMessage(chatId, helpMessage);
  console.log(`✅ User ${chatId} requested help`);
});

// ============================================
// /JOKE COMMAND
// ============================================

bot.onText(/\/joke/, (msg) => {
  const chatId = msg.chat.id;
  const jokes = [
    '😂 ወይ! ኮምyuter ለምን ደህተ?\nምክንያቱም ኮምyuter አስተሳሰብ ስሌት ነበር!',
    '😂 ሁለት ተዋና ተነጋገሩ:\n- "አስተሳሰብ ምንድ ነው?"\n- "አታውቅም!"',
    '😂 ኮምyuter ወደ ወኑ:\n"ዛሬ ጥሩ ቀን ነው!"\nመልስ: "ስሌተ ነው!"'
  ];
  const randomJoke = jokes[Math.floor(Math.random() * jokes.length)];
  bot.sendMessage(chatId, randomJoke);
  console.log(`😂 Joke sent to ${chatId}`);
});

// ============================================
// /QUOTE COMMAND
// ============================================

bot.onText(/\/quote/, (msg) => {
  const chatId = msg.chat.id;
  const quotes = [
    '💡 "በውጣት በማሰብ ሙቅ ንጽህናናል።"',
    '🎯 "አታስፍር ከሆናችሁ አይሠሩ።"',
    '🚀 "ሊሆን ይችላሉ ከሆናችሁ ዖኬ።"',
    '🌟 "ሕይወት ካዮቶችሪ የሚጀምር ነው።"'
  ];
  const randomQuote = quotes[Math.floor(Math.random() * quotes.length)];
  bot.sendMessage(chatId, randomQuote);
  console.log(`💡 Quote sent to ${chatId}`);
});

// ============================================
// /CLEAR COMMAND
// ============================================

bot.onText(/\/clear/, (msg) => {
  const chatId = msg.chat.id;
  conversations[chatId] = [];
  bot.sendMessage(chatId, '✅ ታሪክ ታጸደ!\n💬 አዲስ ውይይት ጀመርናል።');
  console.log(`🧹 Chat history cleared for user ${chatId}`);
});

// ============================================
// MAIN MESSAGE HANDLER
// ============================================

bot.on('message', async (msg) => {
  const chatId = msg.chat.id;
  const userMessage = msg.text;

  // Skip if it's a command
  if (userMessage.startsWith('/')) {
    return;
  }

  // Initialize conversation
  if (!conversations[chatId]) {
    conversations[chatId] = [];
  }

  console.log(`📨 User ${chatId}: ${userMessage}`);
  bot.sendChatAction(chatId, 'typing');

  try {
    // Add user message
    conversations[chatId].push({
      role: 'user',
      content: userMessage,
    });

    // Keep last 10 messages
    const recentMessages = conversations[chatId].slice(-10);

    // Call Claude API
    const response = await client.messages.create({
      model: 'claude-3-5-sonnet-20241022',
      max_tokens: 1024,
      system: 'You are a helpful assistant. Reply in Amharic when asked in Amharic. Be friendly and concise.',
      messages: recentMessages,
    });

    const aiMessage = response.content[0].text;

    // Add response
    conversations[chatId].push({
      role: 'assistant',
      content: aiMessage,
    });

    console.log(`🤖 Response sent (${aiMessage.length} chars)`);

    // Send message (max 4096)
    if (aiMessage.length > 4096) {
      const chunks = aiMessage.match(/[\s\S]{1,4096}/g);
      for (const chunk of chunks) {
        await bot.sendMessage(chatId, chunk);
      }
    } else {
      bot.sendMessage(chatId, aiMessage);
    }

  } catch (error) {
    console.error('❌ Error:', error.message);
    
    let errorMessage = '❌ ስህተት ተከስተ!';
    
    if (error.status === 401) {
      errorMessage = '❌ API Key Error! Setup ይመልከቱ።';
    } else if (error.code === 'ENOTFOUND') {
      errorMessage = '❌ Internet Error! Connection ይመልከቱ።';
    } else {
      errorMessage = '❌ ስህተት! እንደገና ሞክር።';
    }
    
    bot.sendMessage(chatId, errorMessage);
  }
});

// ============================================
// BOT STARTUP
// ============================================

console.log('');
console.log('═════════════════════════════════════');
console.log('🤖 Telegram AI Bot ስራ ተጀመረ!');
console.log('═════════════════════════════════════');
console.log('📊 Status: Online');
console.log('🔗 Connection: Polling mode');
console.log('💬 Ready for messages...');
console.log('⏹️  Stop: Ctrl + C');
console.log('═════════════════════════════════════');
console.log('');

process.on('SIGINT', () => {
  console.log('\n🛑 Bot shutting down...');
  process.exit(0);
});
