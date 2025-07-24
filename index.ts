
import TelegramBot from 'node-telegram-bot-api';
import * as fs from 'fs';
import * as path from 'path';

// Bot Configuration - AnasCP Bot
const BOT_TOKEN = '7887918168:AAEpThFn3nIzg62w16hQwp43Lo-FXFRSwWw';
const ADMIN_ID = 7391363898;
const BOT_USERNAME = '@task_cpbot';
const BOT_NAME = 'AnasCP';

const REQUIRED_CHANNELS = [
  'https://t.me/AnasEarnHunter',
  'https://t.me/ExpossDark', 
  'https://t.me/Anas_Promotion',
  'https://t.me/givwas'
];

// Constants
const CONFIG = {
  REF_BONUS: 0.02,
  PLATFORM_FEE: 0.20,
  MIN_CPC: 0.005,
  MAX_CPC: 0.100,
  MIN_DEPOSIT: 0.2,
  MAX_DEPOSIT: 1000,
  MIN_WITHDRAW: 5.0,
  MAX_WITHDRAW: 500,
  CURRENCY: 'USDT',
  BINANCE_PAY_ID: '787819330',
  PAYEER_ID: 'P1102512228',
  BOT_USERNAME: '@task_cpbot',
  BOT_NAME: 'AnasCP'
};

// Data storage
let users: any = {};
let tasks: any = {};
let withdrawals: any = {};
let deposits: any = {};
let advertisements: any = {};
let userStates: any = {};

// Load data
const loadData = () => {
  try {
    if (fs.existsSync('users.json')) users = JSON.parse(fs.readFileSync('users.json', 'utf8'));
    if (fs.existsSync('tasks.json')) tasks = JSON.parse(fs.readFileSync('tasks.json', 'utf8'));
    if (fs.existsSync('withdrawals.json')) withdrawals = JSON.parse(fs.readFileSync('withdrawals.json', 'utf8'));
    if (fs.existsSync('deposits.json')) deposits = JSON.parse(fs.readFileSync('deposits.json', 'utf8'));
    if (fs.existsSync('advertisements.json')) advertisements = JSON.parse(fs.readFileSync('advertisements.json', 'utf8'));
  } catch (error) {
    console.log('Starting with fresh data files...');
  }
};

// Save data
const saveData = () => {
  fs.writeFileSync('users.json', JSON.stringify(users, null, 2));
  fs.writeFileSync('tasks.json', JSON.stringify(tasks, null, 2));
  fs.writeFileSync('withdrawals.json', JSON.stringify(withdrawals, null, 2));
  fs.writeFileSync('deposits.json', JSON.stringify(deposits, null, 2));
  fs.writeFileSync('advertisements.json', JSON.stringify(advertisements, null, 2));
};

// Initialize bot
const bot = new TelegramBot(BOT_TOKEN, { polling: true });

// Check channel membership
const checkChannelMembership = async (userId: number): Promise<boolean> => {
  try {
    for (const channel of REQUIRED_CHANNELS) {
      const channelUsername = channel.replace('https://t.me/', '@');
      const member = await bot.getChatMember(channelUsername, userId);
      if (member.status === 'left' || member.status === 'kicked') {
        return false;
      }
    }
    return true;
  } catch (error) {
    console.log(`Error checking membership for user ${userId}:`, error);
    return false;
  }
};

// Generate referral link
const generateReferralLink = (userId: number): string => {
  return `https://t.me/task_cpbot?start=${userId}`;
};

// Main keyboard
const getMainKeyboard = () => {
  return {
    reply_markup: {
      inline_keyboard: [
        [
          { text: '💰 Balance', callback_data: 'balance' },
          { text: '👥 Referrals', callback_data: 'referrals' }
        ],
        [
          { text: '🌐 Visit Sites', callback_data: 'visit_sites' },
          { text: '👥 Join Channels', callback_data: 'join_channels' }
        ],
        [
          { text: '🤖 Join Bots', callback_data: 'join_bots' },
          { text: '😄 More Tasks', callback_data: 'more_tasks' }
        ],
        [
          { text: '📊 Advertise 📊', callback_data: 'advertise' }
        ],
        [
          { text: '💳 Deposit', callback_data: 'deposit' },
          { text: '🏧 Withdraw', callback_data: 'withdraw' }
        ],
        [
          { text: 'ℹ️ Info', callback_data: 'info' },
          { text: '🎁 Daily Bonus', callback_data: 'daily_bonus' }
        ]
      ]
    }
  };
};

// Advertise keyboard
const getAdvertiseKeyboard = () => {
  return {
    reply_markup: {
      inline_keyboard: [
        [
          { text: '👥 Channel Members', callback_data: 'ad_channel_members' },
          { text: '💬 Group Members', callback_data: 'ad_group_members' }
        ],
        [
          { text: '🤖 Bot Members', callback_data: 'ad_bot_members' },
          { text: '🔗 Site Visits', callback_data: 'ad_site_visits' }
        ],
        [
          { text: '📊 Post Views', callback_data: 'ad_post_views' },
          { text: '🐦 Twitter Tasks', callback_data: 'ad_twitter' }
        ],
        [
          { text: '📱 YouTube Views', callback_data: 'ad_youtube' },
          { text: '💎 Premium Ads', callback_data: 'ad_premium' }
        ],
        [
          { text: '📈 My Ads', callback_data: 'my_ads' },
          { text: '🔙 Back', callback_data: 'back_to_main' }
        ]
      ]
    }
  };
};

// Deposit methods keyboard
const getDepositMethodsKeyboard = () => {
  return {
    reply_markup: {
      inline_keyboard: [
        [
          { text: '🟡 Binance Pay', callback_data: 'deposit_binance' },
          { text: '🔵 Payeer', callback_data: 'deposit_payeer' }
        ],
        [
          { text: '💳 Other Methods', callback_data: 'deposit_other' }
        ],
        [
          { text: '🔙 Back', callback_data: 'back_to_main' }
        ]
      ]
    }
  };
};

// Withdraw methods keyboard
const getWithdrawMethodsKeyboard = () => {
  return {
    reply_markup: {
      inline_keyboard: [
        [
          { text: '🟡 Binance Pay', callback_data: 'withdraw_binance' },
          { text: '🔵 Payeer', callback_data: 'withdraw_payeer' }
        ],
        [
          { text: '💳 Bank Transfer', callback_data: 'withdraw_bank' }
        ],
        [
          { text: '🔙 Back', callback_data: 'back_to_main' }
        ]
      ]
    }
  };
};

// Admin panel keyboard
const getAdminKeyboard = () => {
  return {
    reply_markup: {
      inline_keyboard: [
        [
          { text: '👥 Total Users', callback_data: 'admin_users' },
          { text: '💳 Deposits', callback_data: 'admin_deposits' }
        ],
        [
          { text: '🏧 Withdrawals', callback_data: 'admin_withdrawals' },
          { text: '📢 Broadcast', callback_data: 'admin_broadcast' }
        ],
        [
          { text: '📊 Advertisements', callback_data: 'admin_ads' },
          { text: '⚙️ Settings', callback_data: 'admin_settings' }
        ],
        [
          { text: '📊 Statistics', callback_data: 'admin_stats' },
          { text: '💰 Add Balance', callback_data: 'admin_add_balance' }
        ]
      ]
    }
  };
};

// Handle /start command
bot.onText(/\/start(.*)/, async (msg, match) => {
  const chatId = msg.chat.id;
  const userId = msg.from?.id!;
  const username = msg.from?.username || '';
  const firstName = msg.from?.first_name || 'User';
  
  // Check if user joined required channels
  const hasJoined = await checkChannelMembership(userId);
  
  if (!hasJoined) {
    const joinMessage = `🔐 স্বাগতম ${CONFIG.BOT_NAME} বটে!\n\n` +
      `আপনাকে অবশ্যই ৪টি চ্যানেল জয়েন করতে হবে:\n\n` +
      `1️⃣ ${REQUIRED_CHANNELS[0]}\n` +
      `2️⃣ ${REQUIRED_CHANNELS[1]}\n` +
      `3️⃣ ${REQUIRED_CHANNELS[2]}\n` +
      `4️⃣ ${REQUIRED_CHANNELS[3]}\n\n` +
      `সব চ্যানেল জয়েন করার পর /start চাপুন।`;
    
    return bot.sendMessage(chatId, joinMessage, {
      reply_markup: {
        inline_keyboard: [
          [{ text: '✅ Membership Check', callback_data: 'check_membership' }]
        ]
      }
    });
  }

  // Handle referral
  const referralCode = match?.[1]?.trim();
  let referrerId = null;
  
  if (referralCode && referralCode !== userId.toString()) {
    referrerId = parseInt(referralCode);
  }

  // Register or update user
  if (!users[userId]) {
    users[userId] = {
      id: userId,
      username,
      firstName,
      balance: 0,
      referrals: 0,
      referrerId,
      joinedAt: new Date().toISOString(),
      totalEarned: 0,
      tasksCompleted: 0,
      completedTasks: [],
      totalDeposited: 0,
      totalWithdrawn: 0,
      adsCreated: 0,
      isActive: true,
      lastDailyBonus: null,
      totalReferralEarned: 0
    };

    // Give referral bonus
    if (referrerId && users[referrerId]) {
      users[referrerId].balance += CONFIG.REF_BONUS;
      users[referrerId].referrals += 1;
      users[referrerId].totalEarned += CONFIG.REF_BONUS;
      users[referrerId].totalReferralEarned += CONFIG.REF_BONUS;
      
      // Notify referrer
      bot.sendMessage(referrerId, 
        `🎉 নতুন রেফারেল জয়েন!\n\n` +
        `👤 ${firstName} আপনার লিংক দিয়ে যোগ দিয়েছে\n` +
        `💰 আপনি ${CONFIG.REF_BONUS} ${CONFIG.CURRENCY} বোনাস পেয়েছেন!\n\n` +
        `🔗 আরো রেফার করুন এবং আয় বাড়ান!`);

      // Notify admin
      const adminNotification = `🆕 নতুন ইউজার জয়েন!\n\n` +
        `👤 নাম: ${firstName}\n` +
        `🆔 ID: ${userId}\n` +
        `👥 Username: @${username || 'নেই'}\n` +
        `📍 রেফারার: ${users[referrerId].firstName} (${referrerId})\n` +
        `💰 রেফারেল বোনাস: ${CONFIG.REF_BONUS} ${CONFIG.CURRENCY}\n` +
        `📅 সময়: ${new Date().toLocaleString('bn-BD')}\n` +
        `📊 মোট ইউজার: ${Object.keys(users).length}`;
      
      bot.sendMessage(ADMIN_ID, adminNotification);
    } else {
      // Notify admin of new user without referrer
      const adminNotification = `🆕 নতুন ইউজার জয়েন!\n\n` +
        `👤 নাম: ${firstName}\n` +
        `🆔 ID: ${userId}\n` +
        `👥 Username: @${username || 'নেই'}\n` +
        `📍 কোন রেফারার নেই\n` +
        `📅 সময়: ${new Date().toLocaleString('bn-BD')}\n` +
        `📊 মোট ইউজার: ${Object.keys(users).length}`;
      
      bot.sendMessage(ADMIN_ID, adminNotification);
    }

    saveData();
  }

  const welcomeMessage = `🎉 স্বাগতম ${firstName}!\n` +
    `💎 ${CONFIG.BOT_NAME} CPC প্ল্যাটফর্মে আপনাকে স্বাগতম\n\n` +
    `💰 আপনার ব্যালেন্স: ${users[userId].balance.toFixed(6)} ${CONFIG.CURRENCY}\n` +
    `👥 রেফারেল: ${users[userId].referrals} জন\n` +
    `🎯 সম্পন্ন টাস্ক: ${users[userId].tasksCompleted}টি\n\n` +
    `🚀 সহজ উপায়ে টাকা আয় করুন:\n\n` +
    `🌐 Visit Sites - সাইট ভিজিট করে আয় করুন\n` +
    `👥 Join Channels - চ্যানেল জয়েন করে আয় করুন\n` +
    `🤖 Join Bots - বট জয়েন করে আয় করুন\n` +
    `😄 More Tasks - আরো টাস্ক এবং বোনাস\n\n` +
    `📊 নিজের বিজ্ঞাপন তৈরি করুন এবং ব্যবসা বাড়ান!\n\n` +
    `ℹ️ সাহায্যের জন্য /help কমান্ড ব্যবহার করুন`;

  bot.sendMessage(chatId, welcomeMessage, getMainKeyboard());
});

// Handle admin command
bot.onText(/\/admin/, (msg) => {
  const chatId = msg.chat.id;
  const userId = msg.from?.id!;

  if (userId !== ADMIN_ID) {
    return bot.sendMessage(chatId, '❌ শুধুমাত্র এডমিন এই কমান্ড ব্যবহার করতে পারেন।');
  }

  const totalUsers = Object.keys(users).length;
  const activeUsers = Object.values(users).filter((u: any) => u.isActive).length;
  const totalBalance = Object.values(users).reduce((sum: number, u: any) => sum + u.balance, 0);
  const pendingDeposits = Object.values(deposits).filter((d: any) => d.status === 'pending').length;
  const pendingWithdrawals = Object.values(withdrawals).filter((w: any) => w.status === 'pending').length;
  const activeAds = Object.values(advertisements).filter((a: any) => a.status === 'active').length;

  const adminMessage = `👑 ${CONFIG.BOT_NAME} এডমিন প্যানেল\n\n` +
    `📊 পরিসংখ্যান:\n` +
    `👥 মোট ইউজার: ${totalUsers}\n` +
    `✅ সক্রিয় ইউজার: ${activeUsers}\n` +
    `💰 মোট ব্যালেন্স: ${totalBalance.toFixed(6)} ${CONFIG.CURRENCY}\n` +
    `💳 পেন্ডিং ডিপোজিট: ${pendingDeposits}\n` +
    `🏧 পেন্ডিং উইথড্র: ${pendingWithdrawals}\n` +
    `📢 সক্রিয় বিজ্ঞাপন: ${activeAds}\n\n` +
    `🤖 বট: ${CONFIG.BOT_USERNAME}\n` +
    `👑 এডমিন ID: ${ADMIN_ID}`;

  bot.sendMessage(chatId, adminMessage, getAdminKeyboard());
});

// Handle /help command
bot.onText(/\/help/, (msg) => {
  const chatId = msg.chat.id;
  const helpMessage = `📋 ${CONFIG.BOT_NAME} সাহায্য কেন্দ্র\n\n` +
    `🔰 মূল বৈশিষ্ট্য:\n` +
    `💰 Balance - আপনার ব্যালেন্স দেখুন\n` +
    `👥 Referrals - রেফারেল তথ্য দেখুন\n` +
    `🌐 Visit Sites - সাইট ভিজিট টাস্ক\n` +
    `👥 Join Channels - চ্যানেল জয়েন টাস্ক\n` +
    `🤖 Join Bots - বট জয়েন টাস্ক\n` +
    `📊 Advertise - বিজ্ঞাপন তৈরি করুন\n` +
    `💳 Deposit - অ্যাকাউন্টে টাকা জমা\n` +
    `🏧 Withdraw - টাকা উত্তোলন\n\n` +
    `💡 টিপস:\n` +
    `• প্রতিদিন টাস্ক করুন\n` +
    `• বন্ধুদের রেফার করুন\n` +
    `• নিয়মিত ডেইলি বোনাস নিন\n\n` +
    `📞 সাপোর্ট: @Owner_Anas1\n` +
    `🌐 গ্রুপ: @AnasEarnHunter`;

  bot.sendMessage(chatId, helpMessage, {
    reply_markup: {
      inline_keyboard: [
        [{ text: '🏠 Main Menu', callback_data: 'back_to_main' }]
      ]
    }
  });
});

// Handle callback queries
bot.on('callback_query', async (query) => {
  const chatId = query.message?.chat.id!;
  const userId = query.from.id;
  const data = query.data;
  
  if (!users[userId] && data !== 'check_membership') {
    return bot.answerCallbackQuery(query.id, { text: 'প্রথমে /start দিয়ে বট চালু করুন' });
  }

  try {
    switch (data) {
      case 'check_membership':
        const hasJoined = await checkChannelMembership(userId);
        if (hasJoined) {
          bot.answerCallbackQuery(query.id, { text: '✅ সদস্যপদ নিশ্চিত!' });
          setTimeout(() => {
            bot.sendMessage(chatId, '/start');
          }, 1000);
        } else {
          bot.answerCallbackQuery(query.id, { text: '❌ প্রথমে সব চ্যানেল জয়েন করুন!' });
        }
        break;

      case 'balance':
        const balanceMessage = `💰 আপনার ব্যালেন্স তথ্য\n\n` +
          `💵 বর্তমান ব্যালেন্স: ${users[userId].balance.toFixed(6)} ${CONFIG.CURRENCY}\n` +
          `📈 মোট আয়: ${users[userId].totalEarned.toFixed(6)} ${CONFIG.CURRENCY}\n` +
          `📥 মোট জমা: ${users[userId].totalDeposited.toFixed(6)} ${CONFIG.CURRENCY}\n` +
          `📤 মোট উত্তোলন: ${users[userId].totalWithdrawn.toFixed(6)} ${CONFIG.CURRENCY}\n` +
          `👥 রেফারেল আয়: ${users[userId].totalReferralEarned?.toFixed(6) || '0.000000'} ${CONFIG.CURRENCY}\n` +
          `✅ সম্পন্ন টাস্ক: ${users[userId].tasksCompleted}\n` +
          `📊 তৈরি বিজ্ঞাপন: ${users[userId].adsCreated}\n\n` +
          `💡 আরো আয় করতে টাস্ক করুন বা বিজ্ঞাপন তৈরি করুন!`;
        
        bot.editMessageText(balanceMessage, {
          chat_id: chatId,
          message_id: query.message?.message_id,
          reply_markup: {
            inline_keyboard: [
              [
                { text: '💳 Deposit', callback_data: 'deposit' },
                { text: '🏧 Withdraw', callback_data: 'withdraw' }
              ],
              [
                { text: '📊 Earning History', callback_data: 'earning_history' },
                { text: '🎁 Daily Bonus', callback_data: 'daily_bonus' }
              ],
              [{ text: '🔙 Back', callback_data: 'back_to_main' }]
            ]
          }
        });
        break;

      case 'deposit':
        const depositMessage = `💳 ${CONFIG.CURRENCY} জমা করুন\n\n` +
          `📊 ${CONFIG.BOT_NAME} প্ল্যাটফর্মে আপনার অ্যাকাউন্টে টাকা জমা করুন\n\n` +
          `💰 সর্বনিম্ন জমা: ${CONFIG.MIN_DEPOSIT} ${CONFIG.CURRENCY}\n` +
          `💰 সর্বোচ্চ জমা: ${CONFIG.MAX_DEPOSIT} ${CONFIG.CURRENCY}\n\n` +
          `🏦 উপলব্ধ পেমেন্ট পদ্ধতি:\n\n` +
          `🟡 Binance Pay - তাৎক্ষণিক এবং নিরাপদ\n` +
          `🔵 Payeer - সহজ এবং দ্রুত\n` +
          `💳 Other Methods - আরো অপশন\n\n` +
          `⚡ সাধারণত ৫-১৫ মিনিটে অনুমোদিত হয়`;
        
        bot.editMessageText(depositMessage, {
          chat_id: chatId,
          message_id: query.message?.message_id,
          ...getDepositMethodsKeyboard()
        });
        break;

      case 'deposit_binance':
        userStates[userId] = 'awaiting_deposit_amount_binance';
        bot.editMessageText(`🟡 Binance Pay জমা\n\n` +
          `💰 জমার পরিমাণ লিখুন (${CONFIG.MIN_DEPOSIT} - ${CONFIG.MAX_DEPOSIT} ${CONFIG.CURRENCY}):\n\n` +
          `💡 শুধু সংখ্যা লিখুন (যেমন: 10.50)\n\n` +
          `⚠️ সঠিক পরিমাণ লিখুন, এটাই আপনার অ্যাকাউন্টে যোগ হবে।`, {
          chat_id: chatId,
          message_id: query.message?.message_id,
          reply_markup: {
            inline_keyboard: [
              [
                { text: `${CONFIG.MIN_DEPOSIT} ${CONFIG.CURRENCY}`, callback_data: `set_deposit_amount_binance_${CONFIG.MIN_DEPOSIT}` },
                { text: `1 ${CONFIG.CURRENCY}`, callback_data: `set_deposit_amount_binance_1` }
              ],
              [
                { text: `5 ${CONFIG.CURRENCY}`, callback_data: `set_deposit_amount_binance_5` },
                { text: `10 ${CONFIG.CURRENCY}`, callback_data: `set_deposit_amount_binance_10` }
              ],
              [
                { text: `25 ${CONFIG.CURRENCY}`, callback_data: `set_deposit_amount_binance_25` },
                { text: `50 ${CONFIG.CURRENCY}`, callback_data: `set_deposit_amount_binance_50` }
              ],
              [{ text: '🔙 Back', callback_data: 'deposit' }]
            ]
          }
        });
        break;

      case 'deposit_payeer':
        userStates[userId] = 'awaiting_deposit_amount_payeer';
        bot.editMessageText(`🔵 Payeer জমা\n\n` +
          `💰 জমার পরিমাণ লিখুন (${CONFIG.MIN_DEPOSIT} - ${CONFIG.MAX_DEPOSIT} ${CONFIG.CURRENCY}):\n\n` +
          `💡 শুধু সংখ্যা লিখুন (যেমন: 10.50)\n\n` +
          `⚠️ সঠিক পরিমাণ লিখুন, এটাই আপনার অ্যাকাউন্টে যোগ হবে।`, {
          chat_id: chatId,
          message_id: query.message?.message_id,
          reply_markup: {
            inline_keyboard: [
              [
                { text: `${CONFIG.MIN_DEPOSIT} ${CONFIG.CURRENCY}`, callback_data: `set_deposit_amount_payeer_${CONFIG.MIN_DEPOSIT}` },
                { text: `1 ${CONFIG.CURRENCY}`, callback_data: `set_deposit_amount_payeer_1` }
              ],
              [
                { text: `5 ${CONFIG.CURRENCY}`, callback_data: `set_deposit_amount_payeer_5` },
                { text: `10 ${CONFIG.CURRENCY}`, callback_data: `set_deposit_amount_payeer_10` }
              ],
              [
                { text: `25 ${CONFIG.CURRENCY}`, callback_data: `set_deposit_amount_payeer_25` },
                { text: `50 ${CONFIG.CURRENCY}`, callback_data: `set_deposit_amount_payeer_50` }
              ],
              [{ text: '🔙 Back', callback_data: 'deposit' }]
            ]
          }
        });
        break;

      case 'withdraw':
        if (users[userId].balance < CONFIG.MIN_WITHDRAW) {
          bot.answerCallbackQuery(query.id, { 
            text: `❌ সর্বনিম্ন উত্তোলন: ${CONFIG.MIN_WITHDRAW} ${CONFIG.CURRENCY}`,
            show_alert: true 
          });
        } else {
          const withdrawMsg = `🏧 ${CONFIG.CURRENCY} উত্তোলন\n\n` +
            `📊 ${CONFIG.BOT_NAME} প্ল্যাটফর্ম থেকে টাকা উত্তোলন করুন\n\n` +
            `💰 উপলব্ধ: ${users[userId].balance.toFixed(6)} ${CONFIG.CURRENCY}\n` +
            `💰 সর্বনিম্ন: ${CONFIG.MIN_WITHDRAW} ${CONFIG.CURRENCY}\n` +
            `💰 সর্বোচ্চ: ${CONFIG.MAX_WITHDRAW} ${CONFIG.CURRENCY}\n\n` +
            `🏦 উপলব্ধ পেমেন্ট পদ্ধতি:\n\n` +
            `🟡 Binance Pay - দ্রুত প্রসেসিং\n` +
            `🔵 Payeer - তাৎক্ষণিক পেমেন্ট\n` +
            `💳 Bank Transfer - ব্যাংক ট্রান্সফার\n\n` +
            `⏰ সাধারণত ২-৬ ঘন্টায় প্রসেস হয়`;
          
          bot.editMessageText(withdrawMsg, {
            chat_id: chatId,
            message_id: query.message?.message_id,
            ...getWithdrawMethodsKeyboard()
          });
        }
        break;

      case 'withdraw_binance':
        userStates[userId] = 'awaiting_withdraw_amount_binance';
        const maxWithdrawBinance = Math.min(CONFIG.MAX_WITHDRAW, users[userId].balance);
        bot.editMessageText(`🟡 Binance Pay উত্তোলন\n\n` +
          `💰 উপলব্ধ: ${users[userId].balance.toFixed(6)} ${CONFIG.CURRENCY}\n` +
          `💰 উত্তোলনের পরিমাণ লিখুন (${CONFIG.MIN_WITHDRAW} - ${maxWithdrawBinance.toFixed(6)} ${CONFIG.CURRENCY}):\n\n` +
          `💡 শুধু সংখ্যা লিখুন (যেমন: 5.50)`, {
          chat_id: chatId,
          message_id: query.message?.message_id,
          reply_markup: {
            inline_keyboard: [
              [
                { text: `${CONFIG.MIN_WITHDRAW} ${CONFIG.CURRENCY}`, callback_data: `set_withdraw_amount_binance_${CONFIG.MIN_WITHDRAW}` },
                { text: `10 ${CONFIG.CURRENCY}`, callback_data: `set_withdraw_amount_binance_10` }
              ],
              [
                { text: `25 ${CONFIG.CURRENCY}`, callback_data: `set_withdraw_amount_binance_25` },
                { text: `50 ${CONFIG.CURRENCY}`, callback_data: `set_withdraw_amount_binance_50` }
              ],
              [
                { text: `সব উত্তোলন`, callback_data: `set_withdraw_amount_binance_${users[userId].balance}` }
              ],
              [{ text: '🔙 Back', callback_data: 'withdraw' }]
            ]
          }
        });
        break;

      case 'withdraw_payeer':
        userStates[userId] = 'awaiting_withdraw_amount_payeer';
        const maxWithdrawPayeer = Math.min(CONFIG.MAX_WITHDRAW, users[userId].balance);
        bot.editMessageText(`🔵 Payeer উত্তোলন\n\n` +
          `💰 উপলব্ধ: ${users[userId].balance.toFixed(6)} ${CONFIG.CURRENCY}\n` +
          `💰 উত্তোলনের পরিমাণ লিখুন (${CONFIG.MIN_WITHDRAW} - ${maxWithdrawPayeer.toFixed(6)} ${CONFIG.CURRENCY}):\n\n` +
          `💡 শুধু সংখ্যা লিখুন (যেমন: 5.50)`, {
          chat_id: chatId,
          message_id: query.message?.message_id,
          reply_markup: {
            inline_keyboard: [
              [
                { text: `${CONFIG.MIN_WITHDRAW} ${CONFIG.CURRENCY}`, callback_data: `set_withdraw_amount_payeer_${CONFIG.MIN_WITHDRAW}` },
                { text: `10 ${CONFIG.CURRENCY}`, callback_data: `set_withdraw_amount_payeer_10` }
              ],
              [
                { text: `25 ${CONFIG.CURRENCY}`, callback_data: `set_withdraw_amount_payeer_25` },
                { text: `50 ${CONFIG.CURRENCY}`, callback_data: `set_withdraw_amount_payeer_50` }
              ],
              [
                { text: `সব উত্তোলন`, callback_data: `set_withdraw_amount_payeer_${users[userId].balance}` }
              ],
              [{ text: '🔙 Back', callback_data: 'withdraw' }]
            ]
          }
        });
        break;

      case 'advertise':
        bot.editMessageText(`📊 ${CONFIG.BOT_NAME} বিজ্ঞাপন সিস্টেম\n\n` +
          `💎 প্রফেশনাল CPC বিজ্ঞাপন প্ল্যাটফর্ম\n\n` +
          `🎯 আপনি কী প্রমোট করতে চান?\n\n` +
          `💡 কাস্টম CPC রেট সেট করুন (${CONFIG.MIN_CPC} - ${CONFIG.MAX_CPC} ${CONFIG.CURRENCY})\n` +
          `📈 রিয়েল-টাইম পারফরমেন্স ট্র্যাকিং\n` +
          `🎯 টার্গেটেড অডিয়েন্স রিচ\n` +
          `📊 বিস্তারিত এনালিটিক্স\n\n` +
          `🚀 আপনার ব্যবসা বৃদ্ধি করুন ${CONFIG.BOT_NAME} এর সাথে!`, {
          chat_id: chatId,
          message_id: query.message?.message_id,
          ...getAdvertiseKeyboard()
        });
        break;

      case 'visit_sites':
        // Generate site visiting tasks
        const availableSiteTasks = Object.values(advertisements).filter((ad: any) => 
          ad.status === 'active' && 
          ad.type === 'site_visits' && 
          ad.spentToday < ad.dailyBudget &&
          !users[userId].completedTasks.includes(ad.id)
        );

        if (availableSiteTasks.length === 0) {
          bot.editMessageText(`🌐 সাইট ভিজিট টাস্ক\n\n` +
            `❌ বর্তমানে কোন সাইট ভিজিট টাস্ক নেই!\n\n` +
            `🔄 পরে আবার চেক করুন\n` +
            `📊 অথবা নিজের সাইটের জন্য বিজ্ঞাপন তৈরি করুন`, {
            chat_id: chatId,
            message_id: query.message?.message_id,
            reply_markup: {
              inline_keyboard: [
                [{ text: '➕ বিজ্ঞাপন তৈরি করুন', callback_data: 'ad_site_visits' }],
                [
                  { text: '🔄 Refresh', callback_data: 'visit_sites' },
                  { text: '🔙 Back', callback_data: 'back_to_main' }
                ]
              ]
            }
          });
        } else {
          const task = availableSiteTasks[Math.floor(Math.random() * availableSiteTasks.length)] as any;
          const siteTaskMessage = `🌐 সাইট ভিজিট টাস্ক #${task.id}\n\n` +
            `📝 বিবরণ: ${task.description}\n` +
            `🔗 ওয়েবসাইট: ${task.link}\n\n` +
            `💰 পুরস্কার: ${task.cpc.toFixed(6)} ${CONFIG.CURRENCY}\n` +
            `⏱️ প্রয়োজনীয় সময়: ৩০ সেকেন্ড\n\n` +
            `📋 নির্দেশনা:\n` +
            `1️⃣ "🌐 Visit Website" বাটন চাপুন\n` +
            `2️⃣ ওয়েবসাইটে ৩০+ সেকেন্ড থাকুন\n` +
            `3️⃣ সাইটটি ব্রাউজ করুন\n` +
            `4️⃣ "✅ টাস্ক সম্পন্ন" চাপুন\n\n` +
            `🎯 উপলব্ধ টাস্ক: ${availableSiteTasks.length}টি`;
          
          bot.editMessageText(siteTaskMessage, {
            chat_id: chatId,
            message_id: query.message?.message_id,
            reply_markup: {
              inline_keyboard: [
                [
                  { text: '⏭️ Skip Task', callback_data: 'visit_sites' },
                  { text: '🌐 Visit Website', url: task.link }
                ],
                [{ text: '✅ টাস্ক সম্পন্ন', callback_data: `complete_task_${task.id}` }],
                [{ text: '🔙 Back', callback_data: 'back_to_main' }]
              ]
            }
          });
        }
        break;

      case 'info':
        const joinDate = new Date(users[userId].joinedAt);
        const referralLink = generateReferralLink(userId);
        const infoMessage = `📊 আপনার ${CONFIG.BOT_NAME} প্রোফাইল\n\n` +
          `👤 নাম: ${users[userId].firstName}\n` +
          `🆔 ID: ${userId}\n` +
          `👥 ইউজারনেম: @${users[userId].username || 'নেই'}\n` +
          `💰 ব্যালেন্স: ${users[userId].balance.toFixed(6)} ${CONFIG.CURRENCY}\n` +
          `👥 রেফারেল: ${users[userId].referrals} জন\n` +
          `📈 মোট আয়: ${users[userId].totalEarned.toFixed(6)} ${CONFIG.CURRENCY}\n` +
          `💎 রেফারেল আয়: ${users[userId].totalReferralEarned?.toFixed(6) || '0.000000'} ${CONFIG.CURRENCY}\n` +
          `✅ সম্পন্ন টাস্ক: ${users[userId].tasksCompleted}\n` +
          `📊 তৈরি বিজ্ঞাপন: ${users[userId].adsCreated}\n` +
          `📅 যোগদান: ${joinDate.toLocaleDateString('bn-BD')}\n\n` +
          `🔗 আপনার রেফারেল লিংক:\n${referralLink}\n\n` +
          `💡 প্রতি রেফারেলে ${CONFIG.REF_BONUS} ${CONFIG.CURRENCY} বোনাস!`;
        
        bot.editMessageText(infoMessage, {
          chat_id: chatId,
          message_id: query.message?.message_id,
          reply_markup: {
            inline_keyboard: [
              [
                { text: '📤 Share Link', switch_inline_query: `Join ${CONFIG.BOT_NAME} and earn money! ${referralLink}` },
                { text: '📋 Copy Link', callback_data: 'copy_referral_link' }
              ],
              [
                { text: '📊 Detailed Stats', callback_data: 'detailed_stats' },
                { text: '👥 My Referrals', callback_data: 'my_referrals' }
              ],
              [{ text: '🔙 Back', callback_data: 'back_to_main' }]
            ]
          }
        });
        break;

      case 'daily_bonus':
        const today = new Date().toDateString();
        const lastBonus = users[userId].lastDailyBonus;
        
        if (lastBonus === today) {
          bot.answerCallbackQuery(query.id, { 
            text: '❌ আজকের ডেইলি বোনাস নেওয়া হয়ে গেছে!',
            show_alert: true 
          });
        } else {
          const bonusAmount = 0.001; // 0.001 USDT daily bonus
          users[userId].balance += bonusAmount;
          users[userId].totalEarned += bonusAmount;
          users[userId].lastDailyBonus = today;
          saveData();
          
          bot.answerCallbackQuery(query.id, { 
            text: `🎁 ${bonusAmount} ${CONFIG.CURRENCY} ডেইলি বোনাস পেয়েছেন!`,
            show_alert: true 
          });
          
          bot.editMessageText(`🎁 ডেইলি বোনাস সংগ্রহ সফল!\n\n` +
            `💰 বোনাস: ${bonusAmount} ${CONFIG.CURRENCY}\n` +
            `💎 নতুন ব্যালেন্স: ${users[userId].balance.toFixed(6)} ${CONFIG.CURRENCY}\n\n` +
            `📅 আগামীকাল আবার আসুন নতুন বোনাসের জন্য!\n\n` +
            `💡 আরো আয় করতে টাস্ক করুন এবং রেফার করুন।`, {
            chat_id: chatId,
            message_id: query.message?.message_id,
            reply_markup: {
              inline_keyboard: [
                [
                  { text: '🌐 Visit Sites', callback_data: 'visit_sites' },
                  { text: '👥 Referrals', callback_data: 'referrals' }
                ],
                [{ text: '🔙 Back', callback_data: 'back_to_main' }]
              ]
            }
          });
        }
        break;

      case 'back_to_main':
        const welcomeMessage = `🎉 স্বাগতম ${users[userId].firstName}!\n` +
          `💎 ${CONFIG.BOT_NAME} CPC প্ল্যাটফর্মে আপনাকে স্বাগতম\n\n` +
          `💰 আপনার ব্যালেন্স: ${users[userId].balance.toFixed(6)} ${CONFIG.CURRENCY}\n` +
          `👥 রেফারেল: ${users[userId].referrals} জন\n` +
          `🎯 সম্পন্ন টাস্ক: ${users[userId].tasksCompleted}টি\n\n` +
          `🚀 সহজ উপায়ে টাকা আয় করুন:\n\n` +
          `🌐 Visit Sites - সাইট ভিজিট করে আয় করুন\n` +
          `👥 Join Channels - চ্যানেল জয়েন করে আয় করুন\n` +
          `🤖 Join Bots - বট জয়েন করে আয় করুন\n` +
          `😄 More Tasks - আরো টাস্ক এবং বোনাস\n\n` +
          `📊 নিজের বিজ্ঞাপন তৈরি করুন এবং ব্যবসা বাড়ান!`;

        bot.editMessageText(welcomeMessage, {
          chat_id: chatId,
          message_id: query.message?.message_id,
          ...getMainKeyboard()
        });
        break;

      // Admin callbacks
      case 'admin_deposits':
        if (userId !== ADMIN_ID) return bot.answerCallbackQuery(query.id, { text: 'অ্যাক্সেস নেই' });
        
        const pendingDeposits = Object.values(deposits).filter((d: any) => d.status === 'pending');
        if (pendingDeposits.length === 0) {
          bot.editMessageText(`💳 পেন্ডিং ডিপোজিট নেই\n\n📊 ${CONFIG.BOT_NAME} এডমিন প্যানেল`, {
            chat_id: chatId,
            message_id: query.message?.message_id,
            reply_markup: {
              inline_keyboard: [
                [{ text: '🔄 Refresh', callback_data: 'admin_deposits' }],
                [{ text: '🔙 Back', callback_data: 'admin_back' }]
              ]
            }
          });
        } else {
          const deposit = pendingDeposits[0] as any;
          const user = users[deposit.userId];
          bot.editMessageText(`💳 PENDING DEPOSIT #${deposit.id}\n\n` +
            `👤 User: ${user?.firstName || 'Unknown'} (@${user?.username || 'no username'})\n` +
            `🆔 User ID: ${deposit.userId}\n` +
            `💰 Amount: ${deposit.amount} ${CONFIG.CURRENCY}\n` +
            `💳 Method: ${deposit.method}\n` +
            `📅 Date: ${new Date(deposit.createdAt).toLocaleString('bn-BD')}\n` +
            `🆔 Deposit ID: ${deposit.id}\n` +
            `📸 Proof: ${deposit.proof || 'Provided'}\n\n` +
            `📊 Remaining: ${pendingDeposits.length} deposits`, {
            chat_id: chatId,
            message_id: query.message?.message_id,
            reply_markup: {
              inline_keyboard: [
                [
                  { text: '✅ APPROVE', callback_data: `approve_deposit_${deposit.id}` },
                  { text: '❌ REJECT', callback_data: `reject_deposit_${deposit.id}` }
                ],
                [
                  { text: '👤 User Info', callback_data: `user_info_${deposit.userId}` },
                  { text: '📝 Custom Amount', callback_data: `custom_deposit_${deposit.id}` }
                ],
                [{ text: '🔙 Back', callback_data: 'admin_back' }]
              ]
            }
          });
        }
        break;

      case 'admin_withdrawals':
        if (userId !== ADMIN_ID) return bot.answerCallbackQuery(query.id, { text: 'অ্যাক্সেস নেই' });
        
        const pendingWithdrawals = Object.values(withdrawals).filter((w: any) => w.status === 'pending');
        if (pendingWithdrawals.length === 0) {
          bot.editMessageText(`🏧 পেন্ডিং উইথড্রয়াল নেই\n\n📊 ${CONFIG.BOT_NAME} এডমিন প্যানেল`, {
            chat_id: chatId,
            message_id: query.message?.message_id,
            reply_markup: {
              inline_keyboard: [
                [{ text: '🔄 Refresh', callback_data: 'admin_withdrawals' }],
                [{ text: '🔙 Back', callback_data: 'admin_back' }]
              ]
            }
          });
        } else {
          const withdrawal = pendingWithdrawals[0] as any;
          const user = users[withdrawal.userId];
          bot.editMessageText(`🏧 PENDING WITHDRAWAL #${withdrawal.id}\n\n` +
            `👤 User: ${user?.firstName || 'Unknown'} (@${user?.username || 'no username'})\n` +
            `🆔 User ID: ${withdrawal.userId}\n` +
            `💰 Amount: ${withdrawal.amount} ${CONFIG.CURRENCY}\n` +
            `💳 Method: ${withdrawal.method}\n` +
            `🆔 Payment ID: ${withdrawal.paymentId}\n` +
            `📅 Date: ${new Date(withdrawal.createdAt).toLocaleString('bn-BD')}\n` +
            `💰 User Balance: ${user?.balance.toFixed(6) || '0'} ${CONFIG.CURRENCY}\n\n` +
            `📊 Remaining: ${pendingWithdrawals.length} withdrawals`, {
            chat_id: chatId,
            message_id: query.message?.message_id,
            reply_markup: {
              inline_keyboard: [
                [
                  { text: '✅ APPROVE', callback_data: `approve_withdrawal_${withdrawal.id}` },
                  { text: '❌ REJECT', callback_data: `reject_withdrawal_${withdrawal.id}` }
                ],
                [
                  { text: '👤 User Info', callback_data: `user_info_${withdrawal.userId}` },
                  { text: '📋 Copy Payment ID', callback_data: `copy_payment_id_${withdrawal.id}` }
                ],
                [{ text: '🔙 Back', callback_data: 'admin_back' }]
              ]
            }
          });
        }
        break;

      case 'admin_back':
        if (userId !== ADMIN_ID) return;
        setTimeout(() => {
          bot.sendMessage(chatId, '/admin');
        }, 500);
        break;
    }

    // Handle quick deposit amount selection
    if (data.startsWith('set_deposit_amount_')) {
      const parts = data.split('_');
      const method = parts[3]; // binance or payeer
      const amount = parseFloat(parts[4]);
      
      if (amount >= CONFIG.MIN_DEPOSIT && amount <= CONFIG.MAX_DEPOSIT) {
        processDepositAmount(chatId, userId, amount, method, query.message?.message_id);
      }
    }

    // Handle quick withdraw amount selection
    if (data.startsWith('set_withdraw_amount_')) {
      const parts = data.split('_');
      const method = parts[3]; // binance or payeer
      const amount = parseFloat(parts[4]);
      
      if (amount >= CONFIG.MIN_WITHDRAW && amount <= Math.min(CONFIG.MAX_WITHDRAW, users[userId].balance)) {
        processWithdrawAmount(chatId, userId, amount, method, query.message?.message_id);
      }
    }

    // Handle task completion
    if (data.startsWith('complete_task_')) {
      const taskId = data.split('_')[2];
      const task = advertisements[taskId];
      
      if (task && task.status === 'active' && !users[userId].completedTasks.includes(taskId)) {
        // Add reward
        users[userId].balance += task.cpc;
        users[userId].totalEarned += task.cpc;
        users[userId].tasksCompleted += 1;
        users[userId].completedTasks.push(taskId);
        
        // Update ad stats
        advertisements[taskId].totalClicks += 1;
        advertisements[taskId].spentToday += task.cpc;
        
        // Give referral bonus to referrer
        if (users[userId].referrerId && users[users[userId].referrerId]) {
          const referralBonus = task.cpc * 0.20; // 20% referral bonus
          users[users[userId].referrerId].balance += referralBonus;
          users[users[userId].referrerId].totalEarned += referralBonus;
          users[users[userId].referrerId].totalReferralEarned += referralBonus;
          
          bot.sendMessage(users[userId].referrerId, 
            `🎉 রেফারেল বোনাস!\n\n${users[userId].firstName} একটি টাস্ক সম্পন্ন করেছে।\n💰 আপনি ${referralBonus.toFixed(6)} ${CONFIG.CURRENCY} বোনাস পেয়েছেন!`);
        }
        
        saveData();
        
        bot.answerCallbackQuery(query.id, { 
          text: `✅ টাস্ক সম্পন্ন! ${task.cpc.toFixed(6)} ${CONFIG.CURRENCY} পেয়েছেন!`,
          show_alert: true 
        });

        // Notify advertiser
        if (task.userId && users[task.userId]) {
          bot.sendMessage(task.userId, 
            `📈 আপনার বিজ্ঞাপনে নতুন ক্লিক!\n\n` +
            `💰 খরচ: ${task.cpc.toFixed(6)} ${CONFIG.CURRENCY}\n` +
            `📊 মোট ক্লিক: ${advertisements[taskId].totalClicks}\n` +
            `🎯 বিজ্ঞাপন ID: ${taskId}`);
        }
      }
    }

    // Handle admin approval/rejection
    if (data.startsWith('approve_deposit_') || data.startsWith('reject_deposit_')) {
      if (userId !== ADMIN_ID) return;
      const depositId = data.split('_')[2];
      const action = data.split('_')[0];
      
      if (deposits[depositId]) {
        if (action === 'approve') {
          deposits[depositId].status = 'approved';
          deposits[depositId].approvedAt = new Date().toISOString();
          users[deposits[depositId].userId].balance += deposits[depositId].amount;
          users[deposits[depositId].userId].totalDeposited += deposits[depositId].amount;
          
          bot.sendMessage(deposits[depositId].userId, 
            `✅ আপনার ${deposits[depositId].amount} ${CONFIG.CURRENCY} জমা অনুমোদিত!\n\n` +
            `💰 নতুন ব্যালেন্স: ${users[deposits[depositId].userId].balance.toFixed(6)} ${CONFIG.CURRENCY}\n` +
            `📅 সময়: ${new Date().toLocaleString('bn-BD')}\n\n` +
            `🎉 এখন টাস্ক করুন এবং আয় শুরু করুন!\n` +
            `💎 ${CONFIG.BOT_NAME} এ আপনাকে স্বাগতম!`);
        } else {
          deposits[depositId].status = 'rejected';
          deposits[depositId].rejectedAt = new Date().toISOString();
          
          bot.sendMessage(deposits[depositId].userId, 
            `❌ আপনার ${deposits[depositId].amount} ${CONFIG.CURRENCY} জমা প্রত্যাখ্যান।\n\n` +
            `📞 সাহায্যের জন্য যোগাযোগ: @Owner_Anas1\n` +
            `💬 গ্রুপ: @AnasEarnHunter`);
        }
        saveData();
        bot.answerCallbackQuery(query.id, { text: `Deposit ${action}d successfully` });
        
        // Show next pending deposit
        setTimeout(() => {
          bot.emit('callback_query', { ...query, data: 'admin_deposits' });
        }, 1000);
      }
    }

    if (data.startsWith('approve_withdrawal_') || data.startsWith('reject_withdrawal_')) {
      if (userId !== ADMIN_ID) return;
      const withdrawalId = data.split('_')[2];
      const action = data.split('_')[0];
      
      if (withdrawals[withdrawalId]) {
        if (action === 'approve') {
          withdrawals[withdrawalId].status = 'approved';
          withdrawals[withdrawalId].approvedAt = new Date().toISOString();
          users[withdrawals[withdrawalId].userId].totalWithdrawn += withdrawals[withdrawalId].amount;
          
          bot.sendMessage(withdrawals[withdrawalId].userId, 
            `✅ আপনার ${withdrawals[withdrawalId].amount} ${CONFIG.CURRENCY} উত্তোলন অনুমোদিত!\n\n` +
            `💳 পেমেন্ট মেথড: ${withdrawals[withdrawalId].method}\n` +
            `🆔 পেমেন্ট ID: ${withdrawals[withdrawalId].paymentId}\n` +
            `📅 সময়: ${new Date().toLocaleString('bn-BD')}\n\n` +
            `💰 ২৪ ঘন্টার মধ্যে পেমেন্ট পাঠানো হবে।\n` +
            `💎 ${CONFIG.BOT_NAME} ব্যবহারের জন্য ধন্যবাদ!`);
        } else {
          withdrawals[withdrawalId].status = 'rejected';
          withdrawals[withdrawalId].rejectedAt = new Date().toISOString();
          users[withdrawals[withdrawalId].userId].balance += withdrawals[withdrawalId].amount; // Refund
          
          bot.sendMessage(withdrawals[withdrawalId].userId, 
            `❌ আপনার ${withdrawals[withdrawalId].amount} ${CONFIG.CURRENCY} উত্তোলন প্রত্যাখ্যান।\n\n` +
            `💰 টাকা আপনার অ্যাকাউন্টে ফেরত দেওয়া হয়েছে।\n` +
            `📞 সাহায্যের জন্য যোগাযোগ: @Owner_Anas1`);
        }
        saveData();
        bot.answerCallbackQuery(query.id, { text: `Withdrawal ${action}d successfully` });
        
        // Show next pending withdrawal
        setTimeout(() => {
          bot.emit('callback_query', { ...query, data: 'admin_withdrawals' });
        }, 1000);
      }
    }

  } catch (error) {
    console.error('Error handling callback query:', error);
    bot.answerCallbackQuery(query.id, { text: 'একটি ত্রুটি ঘটেছে। আবার চেষ্টা করুন।' });
  }
});

// Function to process deposit amount
const processDepositAmount = (chatId: number, userId: number, amount: number, method: string, messageId?: number) => {
  const methodName = method === 'binance' ? 'Binance Pay' : 'Payeer';
  const paymentId = method === 'binance' ? CONFIG.BINANCE_PAY_ID : CONFIG.PAYEER_ID;
  
  userStates[userId] = `awaiting_deposit_proof_${method}_${amount}`;
  
  const message = `💳 ${CONFIG.BOT_NAME} - ${methodName} জমা\n\n` +
    `💰 পরিমাণ: ${amount} ${CONFIG.CURRENCY}\n` +
    `🆔 ${methodName} ID: \`${paymentId}\`\n\n` +
    `📋 Deposit ${CONFIG.CURRENCY}\n` +
    `💰 Minimum: ${CONFIG.MIN_DEPOSIT} ${CONFIG.CURRENCY}\n\n` +
    `🏦 Payment Methods:\n` +
    `🟡 ${methodName} ID: ${paymentId}\n\n` +
    `After payment, send screenshot with amount for verification.\n\n` +
    `📱 ধাপসমূহ:\n` +
    `1️⃣ উপরের ID তে ${amount} ${CONFIG.CURRENCY} পাঠান\n` +
    `2️⃣ পেমেন্টের স্ক্রিনশট নিন\n` +
    `3️⃣ স্ক্রিনশট এখানে পাঠান\n\n` +
    `⚠️ পরিমাণ হুবহু ${amount} ${CONFIG.CURRENCY} হতে হবে!\n` +
    `🕐 সাধারণত ৫-১৫ মিনিটে অনুমোদন`;

  const keyboard = {
    reply_markup: {
      inline_keyboard: [
        [{ text: `📋 Copy ${methodName} ID`, callback_data: `copy_${method}_id` }],
        [{ text: '🔙 Back', callback_data: 'deposit' }],
        [{ text: '❌ Cancel', callback_data: 'back_to_main' }]
      ]
    }
  };

  if (messageId) {
    bot.editMessageText(message, {
      chat_id: chatId,
      message_id: messageId,
      parse_mode: 'Markdown',
      ...keyboard
    });
  } else {
    bot.sendMessage(chatId, message, {
      parse_mode: 'Markdown',
      ...keyboard
    });
  }
};

// Function to process withdraw amount
const processWithdrawAmount = (chatId: number, userId: number, amount: number, method: string, messageId?: number) => {
  const methodName = method === 'binance' ? 'Binance Pay' : 'Payeer';
  
  userStates[userId] = `awaiting_withdraw_id_${method}_${amount}`;
  
  const message = `🏧 ${CONFIG.BOT_NAME} - ${methodName} উত্তোলন\n\n` +
    `💰 উত্তোলনের পরিমাণ: ${amount} ${CONFIG.CURRENCY}\n\n` +
    `💳 আপনার ${methodName} ID লিখুন:\n\n` +
    `💡 উদাহরণ:\n` +
    `${methodName === 'Binance Pay' ? '• Binance Pay ID: 123456789' : '• Payeer ID: P1234567890'}\n\n` +
    `⚠️ সঠিক ID দিন, ভুল ID তে টাকা পাঠানো হলে ফেরত পাবেন না!\n\n` +
    `🕐 অনুমোদনের পর ২৪ ঘন্টার মধ্যে পেমেন্ট পাঠানো হবে।`;

  const keyboard = {
    reply_markup: {
      inline_keyboard: [
        [{ text: '🔙 Back', callback_data: 'withdraw' }],
        [{ text: '❌ Cancel', callback_data: 'back_to_main' }]
      ]
    }
  };

  if (messageId) {
    bot.editMessageText(message, {
      chat_id: chatId,
      message_id: messageId,
      ...keyboard
    });
  } else {
    bot.sendMessage(chatId, message, keyboard);
  }
};

// Handle text messages for states
bot.on('message', (msg) => {
  const chatId = msg.chat.id;
  const userId = msg.from?.id!;
  const text = msg.text;

  if (!text || text.startsWith('/') || text.startsWith('👑')) return;
  if (!users[userId]) return;

  const userState = userStates[userId];
  
  try {
    // Handle deposit amount input
    if (userState === 'awaiting_deposit_amount_binance' || userState === 'awaiting_deposit_amount_payeer') {
      const amount = parseFloat(text);
      const method = userState.includes('binance') ? 'binance' : 'payeer';
      
      if (isNaN(amount) || amount < CONFIG.MIN_DEPOSIT || amount > CONFIG.MAX_DEPOSIT) {
        return bot.sendMessage(chatId, 
          `❌ ভুল পরিমাণ।\n\nঅনুগ্রহ করে ${CONFIG.MIN_DEPOSIT} থেকে ${CONFIG.MAX_DEPOSIT} ${CONFIG.CURRENCY} এর মধ্যে একটি সংখ্যা লিখুন।\n\n💡 উদাহরণ: 10 অথবা 25.50`);
      }

      processDepositAmount(chatId, userId, amount, method);
    }

    // Handle withdrawal amount input
    else if (userState === 'awaiting_withdraw_amount_binance' || userState === 'awaiting_withdraw_amount_payeer') {
      const amount = parseFloat(text);
      const method = userState.includes('binance') ? 'binance' : 'payeer';
      
      if (isNaN(amount) || amount < CONFIG.MIN_WITHDRAW || amount > Math.min(CONFIG.MAX_WITHDRAW, users[userId].balance)) {
        return bot.sendMessage(chatId, 
          `❌ ভুল পরিমাণ।\n\nঅনুগ্রহ করে ${CONFIG.MIN_WITHDRAW} থেকে ${Math.min(CONFIG.MAX_WITHDRAW, users[userId].balance).toFixed(6)} ${CONFIG.CURRENCY} এর মধ্যে একটি সংখ্যা লিখুন।\n\n💰 আপনার ব্যালেন্স: ${users[userId].balance.toFixed(6)} ${CONFIG.CURRENCY}`);
      }

      processWithdrawAmount(chatId, userId, amount, method);
    }

    // Handle withdrawal ID input
    else if (userState && userState.startsWith('awaiting_withdraw_id_')) {
      const parts = userState.split('_');
      const method = parts[3] === 'binance' ? 'Binance Pay' : 'Payeer';
      const amount = parseFloat(parts[4]);
      const paymentId = text.trim();
      
      if (!paymentId || paymentId.length < 5) {
        return bot.sendMessage(chatId, '❌ অনুগ্রহ করে একটি সঠিক পেমেন্ট ID লিখুন।\n\n💡 কমপক্ষে ৫ ক্যারেক্টার লম্বা হতে হবে।');
      }

      const withdrawalId = Date.now().toString();
      withdrawals[withdrawalId] = {
        id: withdrawalId,
        userId,
        amount,
        method,
        paymentId,
        status: 'pending',
        createdAt: new Date().toISOString()
      };

      users[userId].balance -= amount;
      delete userStates[userId];
      saveData();

      bot.sendMessage(chatId, 
        `✅ উত্তোলনের আবেদন সফলভাবে জমা দেওয়া হয়েছে!\n\n` +
        `💰 পরিমাণ: ${amount} ${CONFIG.CURRENCY}\n` +
        `💳 পদ্ধতি: ${method}\n` +
        `🆔 পেমেন্ট ID: ${paymentId}\n` +
        `🔗 আবেদন ID: ${withdrawalId}\n\n` +
        `⏳ এডমিন অনুমোদনের জন্য অপেক্ষা করুন\n` +
        `🕐 সাধারণত ২-৬ ঘন্টা সময় লাগে\n\n` +
        `📱 অনুমোদন হলে নোটিফিকেশন পাবেন`,
        {
          reply_markup: {
            inline_keyboard: [
              [
                { text: '💰 Balance', callback_data: 'balance' },
                { text: '🏠 Main Menu', callback_data: 'back_to_main' }
              ]
            ]
          }
        });
      
      // Notify admin with detailed info
      const user = users[userId];
      const adminNotification = `🏧 নতুন উত্তোলন আবেদন - ${CONFIG.BOT_NAME}\n\n` +
        `👤 ইউজার: ${user.firstName} (@${user.username || 'no username'})\n` +
        `🆔 User ID: ${userId}\n` +
        `💰 পরিমাণ: ${amount} ${CONFIG.CURRENCY}\n` +
        `💳 পদ্ধতি: ${method}\n` +
        `🆔 Payment ID: ${paymentId}\n` +
        `🔗 Request ID: ${withdrawalId}\n` +
        `💰 ইউজার ব্যালেন্স (পরে): ${user.balance.toFixed(6)} ${CONFIG.CURRENCY}\n` +
        `📈 মোট আয়: ${user.totalEarned.toFixed(6)} ${CONFIG.CURRENCY}\n` +
        `✅ সম্পন্ন টাস্ক: ${user.tasksCompleted}\n` +
        `📅 আবেদনের সময়: ${new Date().toLocaleString('bn-BD')}`;
      
      bot.sendMessage(ADMIN_ID, adminNotification, {
        reply_markup: {
          inline_keyboard: [
            [
              { text: '✅ APPROVE', callback_data: `approve_withdrawal_${withdrawalId}` },
              { text: '❌ REJECT', callback_data: `reject_withdrawal_${withdrawalId}` }
            ],
            [
              { text: '👤 User Info', callback_data: `user_info_${userId}` },
              { text: '📋 Copy Payment ID', callback_data: `copy_payment_id_${withdrawalId}` }
            ]
          ]
        }
      });
    }

    // Handle deposit proof upload
    else if (userState && userState.startsWith('awaiting_deposit_proof_')) {
      const parts = userState.split('_');
      const method = parts[3] === 'binance' ? 'Binance Pay' : 'Payeer';
      const amount = parseFloat(parts[4]);
      
      const depositId = Date.now().toString();
      deposits[depositId] = {
        id: depositId,
        userId,
        amount,
        method,
        status: 'pending',
        createdAt: new Date().toISOString(),
        proof: msg.photo ? 'photo_provided' : 'text_provided'
      };

      delete userStates[userId];
      saveData();

      bot.sendMessage(chatId, 
        `✅ জমার আবেদন সফলভাবে জমা দেওয়া হয়েছে!\n\n` +
        `💰 পরিমাণ: ${amount} ${CONFIG.CURRENCY}\n` +
        `💳 পদ্ধতি: ${method}\n` +
        `🔗 আবেদন ID: ${depositId}\n\n` +
        `⏳ এডমিন যাচাইয়ের জন্য অপেক্ষা করুন\n` +
        `🕐 সাধারণত ৫-১৫ মিনিট সময় লাগে\n\n` +
        `📱 অনুমোদন হলে নোটিফিকেশন পাবেন`,
        {
          reply_markup: {
            inline_keyboard: [
              [
                { text: '💰 Balance', callback_data: 'balance' },
                { text: '🏠 Main Menu', callback_data: 'back_to_main' }
              ]
            ]
          }
        });
      
      // Notify admin with detailed info
      const user = users[userId];
      const adminNotification = `💳 নতুন জমা আবেদন - ${CONFIG.BOT_NAME}\n\n` +
        `👤 ইউজার: ${user.firstName} (@${user.username || 'no username'})\n` +
        `🆔 User ID: ${userId}\n` +
        `💰 পরিমাণ: ${amount} ${CONFIG.CURRENCY}\n` +
        `💳 পদ্ধতি: ${method}\n` +
        `🔗 Request ID: ${depositId}\n` +
        `📸 প্রমাণ: ${msg.photo ? 'স্ক্রিনশট পাঠানো হয়েছে' : 'টেক্সট প্রমাণ'}\n` +
        `💰 বর্তমান ব্যালেন্স: ${user.balance.toFixed(6)} ${CONFIG.CURRENCY}\n` +
        `📈 মোট আয়: ${user.totalEarned.toFixed(6)} ${CONFIG.CURRENCY}\n` +
        `📅 আবেদনের সময়: ${new Date().toLocaleString('bn-BD')}`;
      
      bot.sendMessage(ADMIN_ID, adminNotification, {
        reply_markup: {
          inline_keyboard: [
            [
              { text: '✅ APPROVE', callback_data: `approve_deposit_${depositId}` },
              { text: '❌ REJECT', callback_data: `reject_deposit_${depositId}` }
            ],
            [
              { text: '👤 User Info', callback_data: `user_info_${userId}` },
              { text: '📝 Custom Amount', callback_data: `custom_deposit_${depositId}` }
            ]
          ]
        }
      });
    }
  } catch (error) {
    console.error('Error handling message:', error);
    bot.sendMessage(chatId, '❌ একটি ত্রুটি ঘটেছে। আবার চেষ্টা করুন।');
  }
});

// Handle photo messages (for deposit proof)
bot.on('photo', (msg) => {
  const chatId = msg.chat.id;
  const userId = msg.from?.id!;
  
  if (!users[userId]) return;
  
  const userState = userStates[userId];
  
  if (userState && userState.startsWith('awaiting_deposit_proof_')) {
    // Handle as deposit proof (same logic as text message)
    const parts = userState.split('_');
    const method = parts[3] === 'binance' ? 'Binance Pay' : 'Payeer';
    const amount = parseFloat(parts[4]);
    
    const depositId = Date.now().toString();
    deposits[depositId] = {
      id: depositId,
      userId,
      amount,
      method,
      status: 'pending',
      createdAt: new Date().toISOString(),
      proof: 'photo_provided',
      photoId: msg.photo[msg.photo.length - 1].file_id
    };

    delete userStates[userId];
    saveData();

    bot.sendMessage(chatId, 
      `✅ স্ক্রিনশট সহ জমার আবেদন সফলভাবে জমা!\n\n` +
      `💰 পরিমাণ: ${amount} ${CONFIG.CURRENCY}\n` +
      `💳 পদ্ধতি: ${method}\n` +
      `🔗 আবেদন ID: ${depositId}\n\n` +
      `⏳ এডমিন যাচাইয়ের জন্য অপেক্ষা করুন\n` +
      `🕐 সাধারণত ৫-১৫ মিনিট সময় লাগে\n\n` +
      `📱 অনুমোদন হলে তাৎক্ষণিক নোটিফিকেশন পাবেন`,
      {
        reply_markup: {
          inline_keyboard: [
            [
              { text: '💰 Balance', callback_data: 'balance' },
              { text: '🏠 Main Menu', callback_data: 'back_to_main' }
            ]
          ]
        }
      });
    
    // Forward photo to admin with details
    const user = users[userId];
    const adminNotification = `💳 নতুন জমা (স্ক্রিনশট সহ) - ${CONFIG.BOT_NAME}\n\n` +
      `👤 ইউজার: ${user.firstName} (@${user.username || 'no username'})\n` +
      `🆔 User ID: ${userId}\n` +
      `💰 পরিমাণ: ${amount} ${CONFIG.CURRENCY}\n` +
      `💳 পদ্ধতি: ${method}\n` +
      `🔗 Request ID: ${depositId}\n` +
      `💰 বর্তমান ব্যালেন্স: ${user.balance.toFixed(6)} ${CONFIG.CURRENCY}\n` +
      `📅 আবেদনের সময়: ${new Date().toLocaleString('bn-BD')}`;
    
    // First forward the photo
    bot.forwardMessage(ADMIN_ID, chatId, msg.message_id);
    
    // Then send the details with buttons
    bot.sendMessage(ADMIN_ID, adminNotification, {
      reply_markup: {
        inline_keyboard: [
          [
            { text: '✅ APPROVE', callback_data: `approve_deposit_${depositId}` },
            { text: '❌ REJECT', callback_data: `reject_deposit_${depositId}` }
          ],
          [
            { text: '👤 User Info', callback_data: `user_info_${userId}` },
            { text: '📝 Custom Amount', callback_data: `custom_deposit_${depositId}` }
          ]
        ]
      }
    });
  }
});

// Error handling
bot.on('polling_error', (error) => {
  console.log('Polling error:', error);
});

process.on('unhandledRejection', (reason, promise) => {
  console.log('Unhandled Rejection at:', promise, 'reason:', reason);
});

process.on('uncaughtException', (error) => {
  console.log('Uncaught Exception:', error);
});

// Initialize
loadData();

console.log(`🤖 ${CONFIG.BOT_NAME} Bot started successfully!`);
console.log(`Bot: ${CONFIG.BOT_USERNAME}`);
console.log(`Admin ID: ${ADMIN_ID}`);
console.log(`Required Channels: ${REQUIRED_CHANNELS.join(', ')}`);
console.log(`Min CPC: ${CONFIG.MIN_CPC} ${CONFIG.CURRENCY}`);
console.log(`Max CPC: ${CONFIG.MAX_CPC} ${CONFIG.CURRENCY}`);
console.log(`Referral Bonus: ${CONFIG.REF_BONUS} ${CONFIG.CURRENCY}`);
console.log(`Min Deposit: ${CONFIG.MIN_DEPOSIT} ${CONFIG.CURRENCY}`);
console.log(`Min Withdraw: ${CONFIG.MIN_WITHDRAW} ${CONFIG.CURRENCY}`);
