require('dotenv').config();
const TelegramBot = require('node-telegram-bot-api');
const { GoogleGenAI } = require('@google/generative-ai');

// ============================================
// INITIALIZATION
// ============================================

const token = process.env.TELEGRAM_BOT_TOKEN;
const bot = new TelegramBot(token, { polling: true });

// Gemini AI ማዋቀር
const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
const model = ai.getGenerativeModel({ 
  model: 'gemini-2.5-flash',
  systemInstruction: 'You are a helpful assistant. Reply in Amharic when asked in Amharic. Be friendly and concise.'
});

const conversations = {};

// ============================================
// /START COMMAND
// ============================================

bot.onText(/\/start/, (msg) => {
  const chatId = msg.chat.id;
  conversations[chatId] = [];
  
  const welcomeMessage = 
    '👋 ወደ Gemini AI Chatbot እንኳን ደህና መጡ!\n\n' +
    '🤖 ከ Gemini AI ጋር በቀጥታ ይወያዩ\n\n' +
    '📝 የምሳሌ ጥያቄዎች:\n' +
    '• "ሰላም! ስምህ ማን ነው?"\n' +
    '• "2 + 2 ስንት ይሆናል?"\n' +
    '• "የ Python hello world ኮድ ጻፍልኝ"\n' +
    '• "የምግብ አሰራር ዘዴ ስጠኝ"\n\n' +
    '📋 ትዕዛዞች (Commands):\n' +
    '/start - ቦቱን ለመጀመር\n' +
    '/help - እርዳታ ለማግኘት\n' +
    '/joke - ቀልድ ለመስማት\n' +
    '/quote - አነቃቂ አባባሎች\n' +
    '/clear - የንግግር ታሪክ ለማጽዳት\n\n' +
    '💬 መልዕክትዎን መላክ ይችላሉ!';
  
  bot.sendMessage(chatId, welcomeMessage);
  console.log(`✅ User ${chatId} started bot`);
});

// ============================================
// /HELP COMMAND
// ============================================

bot.onText(/\/help/, (msg) => {
  const chatId = msg.chat.id;
  const helpMessage = 
    '📚 የምሳሌ ጥያቄዎች:\n\n' +
    '1️⃣ "ሰላም! ስምህ ማን ነው?"\n' +
    '   → ሰላምታ\n\n' +
    '2️⃣ "10 ÷ 2 = ?"\n' +
    '   → ሂሳብ\n\n' +
    '3️⃣ "Python loop ምሳሌ"\n' +
    '   → የኮዲንግ እገዛ\n\n' +
    '4️⃣ "የኬክ አሰራር ስጡኝ"\n' +
    '   → የምግብ አዘገጃጀት\n\n' +
    '5️⃣ "አጠቃላይ እውቀት"\n' +
    '   → ማንኛውንም ጥያቄ\n\n' +
    '/clear - ታሪክ ያጸዳል\n' +
    '/joke - ቀልዶች\n' +
    '/quote - ጥቅሶች';
  
  bot.sendMessage(chatId, helpMessage);
  console.log(`✅ User ${chatId} requested help`);
});

// ============================================
// /JOKE COMMAND
// ============================================

bot.onText(/\/joke/, (msg) => {
  const chatId = msg.chat.id;
  const jokes = [
    '😂 ኮምፒውተር ለምን ዶክተር ጋር ሄደ?\nምክንያቱም ቫይረስ ስላለበት!',
    '😂 ሁለት ፕሮግራም አውጪዎች ተገናኝተው:\n- "ትዳር ህይወት እንዴት ነው?"\n- "ጥሩ ነው ግን ዶክመንቴሽን የለውም!"',
    '😂 አባት ለልጁ: "ፈተና እንዴት ነበር?"\nልጅ: "ጥያቄዎቹ ቀላል ነበሩ መልሶቹ ግን ከበዱኝ!"'
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
    '💡 "ትልቁ ስኬት መውደቅ ሳይሆን ወድቆ መነሳት ነው።"',
    '🎯 "አዲስ ነገር ለመጀመር ጎበዝ መሆን አያስፈልግህም፣ ግን ጎበዝ ለመሆን መጀመር አለብህ።"',
    '🚀 "የወደፊቱን ጊዜ ለመተንበይ የተሻለው መንገድ እራስህ መፍጠር ነው።"',
    '🌟 "ትናንት አልፏል፣ ነገም ገና ነው፣ ዛሬ ግን ስጦታ ነው።"'
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
  bot.sendMessage(chatId, '✅ የንግግር ታሪክዎ ተሰርዟል!\n💬 አዲስ ውይይት መጀመር ይችላሉ።');
  console.log(`🧹 Chat history cleared for user ${chatId}`);
});

// ============================================
// MAIN MESSAGE HANDLER
// ============================================

bot.on('message', async (msg) => {
  const chatId = msg.chat.id;
  const userMessage = msg.text;

  // ፅሁፍ መሆኑን እና Command አለመሆኑን ማረጋገጥ
  if (!userMessage || userMessage.startsWith('/')) {
    return;
  }

  // Initialize conversation
  if (!conversations[chatId]) {
    conversations[chatId] = [];
  }

  console.log(`📨 User ${chatId}: ${userMessage}`);
  
  try {
    bot.sendChatAction(chatId, 'typing');

    // የንግግር ታሪክን ለ Gemini ማዘጋጀት
    conversations[chatId].push({
      role: 'user',
      parts: [{ text: userMessage }]
    });

    // የመጨረሻዎቹን 10 መልዕክቶች ብቻ መያዝ
    const recentHistory = conversations[chatId].slice(-10);

    // Gemini AI በመጥራት Chat መጀመር
    const chat = model.startChat({
      history: recentHistory.slice(0, -1)
    });

    const result = await chat.sendMessage(userMessage);
    const aiMessage = result.response.text();

    // የአይ መልስን ወደ ታሪክ መጨመር
    conversations[chatId].push({
      role: 'model',
      parts:
