
import TelegramBot from 'node-telegram-bot-api';
import * as fs from 'fs';
import * as path from 'path';

// Bot Configuration
const BOT_TOKEN = '7887918168:AAEpThFn3nIzg62w16hQwp43Lo-FXFRSwWw';
const ADMIN_ID = 7391363898;
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
  MIN_DEPOSIT: 0.20,
  MAX_DEPOSIT: 1000,
  MIN_WITHDRAW: 0.30,
  MAX_WITHDRAW: 500,
  CURRENCY: 'USDT',
  BINANCE_PAY_ID: '787819330',
  PAYEER_ID: 'P1102512228',
  BOT_USERNAME: '@task_cpbot'
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
    console.log('No existing data files found, starting fresh');
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

// Check if user joined all required channels
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

// Main keyboard with inline buttons
const getMainKeyboard = () => {
  return {
    reply_markup: {
      inline_keyboard: [
        [
          { text: '💰 Balance', callback_data: 'balance' },
          { text: '👥 Referrals', callback_data: 'referrals' }
        ],
        [
          { text: '📱 Visit Sites', callback_data: 'visit_sites' },
          { text: '👥 Join Channels', callback_data: 'join_channels' }
        ],
        [
          { text: '🤖 Join Bots', callback_data: 'join_bots' },
          { text: '😄 More', callback_data: 'more_tasks' }
        ],
        [
          { text: '📊 Advertise 📊', callback_data: 'advertise' }
        ],
        [
          { text: '💳 Deposit', callback_data: 'deposit' },
          { text: '🏧 Withdraw', callback_data: 'withdraw' }
        ],
        [
          { text: 'ℹ️ Info', callback_data: 'info' }
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
          { text: '🤖 Bot Members', callback_data: 'ad_bot' }
        ],
        [
          { text: '📊 Post Views', callback_data: 'ad_post_views' },
          { text: '🔗 Site Visits', callback_data: 'ad_site_visits' }
        ],
        [
          { text: '🐦 Twitter Engagement', callback_data: 'ad_twitter' },
          { text: '📱 YouTube Views', callback_data: 'ad_youtube' }
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
          { text: '💰 Balance Management', callback_data: 'admin_balance' }
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
    const joinMessage = `🔐 Welcome to AnasCP Bot!\n\n` +
      `To use this bot, you must join all 4 required channels:\n\n` +
      `1. ${REQUIRED_CHANNELS[0]}\n` +
      `2. ${REQUIRED_CHANNELS[1]}\n` +
      `3. ${REQUIRED_CHANNELS[2]}\n` +
      `4. ${REQUIRED_CHANNELS[3]}\n\n` +
      `After joining all channels, click /start again.`;
    
    return bot.sendMessage(chatId, joinMessage, {
      reply_markup: {
        inline_keyboard: [
          [{ text: '✅ Check Membership', callback_data: 'check_membership' }]
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
      isActive: true
    };

    // Give referral bonus
    if (referrerId && users[referrerId]) {
      users[referrerId].balance += CONFIG.REF_BONUS;
      users[referrerId].referrals += 1;
      users[referrerId].totalEarned += CONFIG.REF_BONUS;
      
      // Notify referrer
      bot.sendMessage(referrerId, 
        `🎉 নতুন রেফারেল! ${firstName} আপনার লিংক ব্যবহার করে যোগ দিয়েছে।\n` +
        `💰 আপনি ${CONFIG.REF_BONUS} ${CONFIG.CURRENCY} পেয়েছেন!`
      );

      // Notify admin with detailed info
      const adminNotification = `🆕 NEW USER JOINED!\n\n` +
        `👤 User: ${firstName}\n` +
        `🆔 User ID: ${userId}\n` +
        `👥 Username: @${username || 'No username'}\n` +
        `📍 Referred by: ${users[referrerId].firstName} (ID: ${referrerId})\n` +
        `💰 Referral bonus given: ${CONFIG.REF_BONUS} ${CONFIG.CURRENCY}\n` +
        `📅 Join time: ${new Date().toLocaleString()}\n` +
        `📊 Total users now: ${Object.keys(users).length + 1}`;
      
      bot.sendMessage(ADMIN_ID, adminNotification);
    } else {
      // Notify admin of new user without referrer
      const adminNotification = `🆕 NEW USER JOINED!\n\n` +
        `👤 User: ${firstName}\n` +
        `🆔 User ID: ${userId}\n` +
        `👥 Username: @${username || 'No username'}\n` +
        `📍 No referrer\n` +
        `📅 Join time: ${new Date().toLocaleString()}\n` +
        `📊 Total users now: ${Object.keys(users).length + 1}`;
      
      bot.sendMessage(ADMIN_ID, adminNotification);
    }

    saveData();
  }

  const welcomeMessage = `🎉 স্বাগতম ${firstName}!\n\n` +
    `💰 ব্যালেন্স: ${users[userId].balance.toFixed(6)} ${CONFIG.CURRENCY}\n` +
    `👥 রেফারেল: ${users[userId].referrals}\n` +
    `🎯 কমপ্লিট টাস্ক: ${users[userId].tasksCompleted}\n\n` +
    `🚀 সহজ টাস্ক করে টাকা আয় করুন:\n\n` +
    `📱 Visit Sites - লিংক ক্লিক করে আয় করুন\n` +
    `👥 Join Channels - চ্যানেল জয়েন করে আয় করুন\n` +
    `🤖 Join Bots - বট জয়েন করে আয় করুন\n` +
    `😄 More - আরো টাস্ক এবং সুবিধা\n\n` +
    `📊 নিজের বিজ্ঞাপন তৈরি করুন /advertise দিয়ে\n\n` +
    `ℹ️ সাহায্যের জন্য /help কমান্ড ব্যবহার করুন`;

  bot.sendMessage(chatId, welcomeMessage, getMainKeyboard());
});

// Handle admin command
bot.onText(/\/admin/, (msg) => {
  const chatId = msg.chat.id;
  const userId = msg.from?.id!;

  if (userId !== ADMIN_ID) {
    return bot.sendMessage(chatId, '❌ Access denied. Only admin can use this command.');
  }

  const totalUsers = Object.keys(users).length;
  const activeUsers = Object.values(users).filter((u: any) => u.isActive).length;
  const totalBalance = Object.values(users).reduce((sum: number, u: any) => sum + u.balance, 0);
  const pendingDeposits = Object.values(deposits).filter((d: any) => d.status === 'pending').length;
  const pendingWithdrawals = Object.values(withdrawals).filter((w: any) => w.status === 'pending').length;
  const activeAds = Object.values(advertisements).filter((a: any) => a.status === 'active').length;

  const adminMessage = `👑 ADMIN PANEL\n\n` +
    `📊 STATISTICS:\n` +
    `👥 Total Users: ${totalUsers}\n` +
    `✅ Active Users: ${activeUsers}\n` +
    `💰 Total Balance: ${totalBalance.toFixed(6)} ${CONFIG.CURRENCY}\n` +
    `💳 Pending Deposits: ${pendingDeposits}\n` +
    `🏧 Pending Withdrawals: ${pendingWithdrawals}\n` +
    `📢 Active Ads: ${activeAds}\n\n` +
    `🤖 Bot: ${CONFIG.BOT_USERNAME}\n` +
    `👑 Admin ID: ${ADMIN_ID}`;

  bot.sendMessage(chatId, adminMessage, getAdminKeyboard());
});

// Handle callback queries
bot.on('callback_query', async (query) => {
  const chatId = query.message?.chat.id!;
  const userId = query.from.id;
  const data = query.data;
  
  if (!users[userId] && data !== 'check_membership') {
    return bot.answerCallbackQuery(query.id, { text: 'প্রথমে /start দিয়ে বট চালু করুন' });
  }

  switch (data) {
    case 'check_membership':
      const hasJoined = await checkChannelMembership(userId);
      if (hasJoined) {
        bot.answerCallbackQuery(query.id, { text: '✅ সদস্যপদ নিশ্চিত!' });
        bot.sendMessage(chatId, '/start');
      } else {
        bot.answerCallbackQuery(query.id, { text: '❌ প্রথমে সব চ্যানেল জয়েন করুন!' });
      }
      break;

    case 'balance':
      const balanceMessage = `💰 আপনার ব্যালেন্স\n\n` +
        `💵 বর্তমান ব্যালেন্স: ${users[userId].balance.toFixed(6)} ${CONFIG.CURRENCY}\n` +
        `📈 মোট আয়: ${users[userId].totalEarned.toFixed(6)} ${CONFIG.CURRENCY}\n` +
        `📥 মোট জমা: ${users[userId].totalDeposited.toFixed(6)} ${CONFIG.CURRENCY}\n` +
        `📤 মোট উত্তোলন: ${users[userId].totalWithdrawn.toFixed(6)} ${CONFIG.CURRENCY}\n` +
        `✅ সম্পন্ন টাস্ক: ${users[userId].tasksCompleted}\n` +
        `📊 তৈরি বিজ্ঞাপন: ${users[userId].adsCreated}\n\n` +
        `💡 আরো টাকা আয় করতে টাস্ক করুন বা বিজ্ঞাপন তৈরি করুন!`;
      
      bot.editMessageText(balanceMessage, {
        chat_id: chatId,
        message_id: query.message?.message_id,
        reply_markup: {
          inline_keyboard: [
            [
              { text: '💳 Deposit', callback_data: 'deposit' },
              { text: '🏧 Withdraw', callback_data: 'withdraw' }
            ],
            [{ text: '🔙 Back', callback_data: 'back_to_main' }]
          ]
        }
      });
      break;

    case 'deposit':
      const depositMessage = `💳 ${CONFIG.CURRENCY} জমা করুন\n\n` +
        `💰 সর্বনিম্ন: ${CONFIG.MIN_DEPOSIT} ${CONFIG.CURRENCY}\n` +
        `💰 সর্বোচ্চ: ${CONFIG.MAX_DEPOSIT} ${CONFIG.CURRENCY}\n\n` +
        `🏦 পেমেন্ট পদ্ধতি নির্বাচন করুন:\n\n` +
        `🟡 Binance Pay - দ্রুত এবং নিরাপদ\n` +
        `🔵 Payeer - সহজ এবং সুবিধাজনক`;
      
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
        `⚠️ সঠিক পরিমাণ লিখুন, কারণ এটাই আপনার অ্যাকাউন্টে যোগ হবে।`, {
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
        `⚠️ সঠিক পরিমাণ লিখুন, কারণ এটাই আপনার অ্যাকাউন্টে যোগ হবে।`, {
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
          `💰 উপলব্ধ: ${users[userId].balance.toFixed(6)} ${CONFIG.CURRENCY}\n` +
          `💰 সর্বনিম্ন: ${CONFIG.MIN_WITHDRAW} ${CONFIG.CURRENCY}\n` +
          `💰 সর্বোচ্চ: ${CONFIG.MAX_WITHDRAW} ${CONFIG.CURRENCY}\n\n` +
          `🏦 পেমেন্ট পদ্ধতি নির্বাচন করুন:\n\n` +
          `🟡 Binance Pay - দ্রুত প্রসেসিং\n` +
          `🔵 Payeer - তাৎক্ষণিক পেমেন্ট`;
        
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
              { text: `সব উত্তোলন`, callback_data: `set_withdraw_amount_payeer_${users[userId].balance}` }
            ],
            [{ text: '🔙 Back', callback_data: 'withdraw' }]
          ]
        }
      });
      break;

    case 'advertise':
      bot.editMessageText(`📊 প্রফেশনাল বিজ্ঞাপন সিস্টেম\n\n` +
        `🎯 আপনি কী প্রমোট করতে চান?\n\n` +
        `💡 আপনার বিজ্ঞাপনের জন্য কাস্টমাইজড CPC সেট করুন এবং টার্গেট অডিয়েন্স পান।\n\n` +
        `📈 আপনার বিজ্ঞাপনের পারফরমেন্স ট্র্যাক করুন এবং ROI বৃদ্ধি করুন।`, {
        chat_id: chatId,
        message_id: query.message?.message_id,
        ...getAdvertiseKeyboard()
      });
      break;

    case 'visit_sites':
      // Generate available site visiting tasks
      const availableSiteTasks = Object.values(advertisements).filter((ad: any) => 
        ad.status === 'active' && 
        ad.type === 'site_visits' && 
        ad.spentToday < ad.dailyBudget &&
        !users[userId].completedTasks.includes(ad.id)
      );

      if (availableSiteTasks.length === 0) {
        bot.editMessageText(`❌ বর্তমানে কোন সাইট ভিজিট টাস্ক নেই!\n\n` +
          `🔄 পরে আবার চেক করুন অথবা নিজের সাইটের জন্য বিজ্ঞাপন তৈরি করুন।`, {
          chat_id: chatId,
          message_id: query.message?.message_id,
          reply_markup: {
            inline_keyboard: [
              [{ text: '➕ বিজ্ঞাপন তৈরি করুন', callback_data: 'ad_site_visits' }],
              [{ text: '🔙 Back', callback_data: 'back_to_main' }]
            ]
          }
        });
      } else {
        const task = availableSiteTasks[0] as any;
        const siteTaskMessage = `🌐 সাইট ভিজিট টাস্ক\n\n` +
          `📝 বিবরণ: ${task.description}\n\n` +
          `🔗 ওয়েবসাইট: ${task.link}\n\n` +
          `💰 পুরস্কার: ${task.cpc.toFixed(6)} ${CONFIG.CURRENCY}\n\n` +
          `📋 নির্দেশনা:\n` +
          `1. 🌐 Open Link বাটন চাপুন\n` +
          `2. ওয়েবসাইটে কমপক্ষে 30 সেকেন্ড থাকুন\n` +
          `3. সাইটটি ব্রাউজ করুন\n` +
          `4. টাস্ক সম্পন্ন হলে পুরস্কার পাবেন`;
        
        bot.editMessageText(siteTaskMessage, {
          chat_id: chatId,
          message_id: query.message?.message_id,
          reply_markup: {
            inline_keyboard: [
              [
                { text: '⏭️ Skip', callback_data: 'skip_task' },
                { text: '🌐 Open Link 🌐', url: task.link, callback_data: `complete_task_${task.id}` }
              ],
              [{ text: '✅ টাস্ক শেষ', callback_data: `complete_task_${task.id}` }],
              [{ text: '🔙 Back', callback_data: 'back_to_main' }]
            ]
          }
        });
      }
      break;

    case 'info':
      const joinDate = new Date(users[userId].joinedAt);
      const referralLink = generateReferralLink(userId);
      const infoMessage = `📊 আপনার প্রোফাইল\n\n` +
        `👤 নাম: ${users[userId].firstName}\n` +
        `🆔 ID: ${userId}\n` +
        `👥 ইউজারনেম: @${users[userId].username || 'না'}\n` +
        `💰 ব্যালেন্স: ${users[userId].balance.toFixed(6)} ${CONFIG.CURRENCY}\n` +
        `👥 রেফারেল: ${users[userId].referrals}\n` +
        `📈 মোট আয়: ${users[userId].totalEarned.toFixed(6)} ${CONFIG.CURRENCY}\n` +
        `✅ সম্পন্ন টাস্ক: ${users[userId].tasksCompleted}\n` +
        `📊 তৈরি বিজ্ঞাপন: ${users[userId].adsCreated}\n` +
        `📅 যোগদান: ${joinDate.toLocaleDateString('bn-BD')}\n\n` +
        `🔗 আপনার রেফারেল লিংক:\n${referralLink}`;
      
      bot.editMessageText(infoMessage, {
        chat_id: chatId,
        message_id: query.message?.message_id,
        reply_markup: {
          inline_keyboard: [
            [
              { text: '📤 Share Link', callback_data: 'share_referral' },
              { text: '📊 Stats', callback_data: 'user_detailed_stats' }
            ],
            [{ text: '🔙 Back', callback_data: 'back_to_main' }]
          ]
        }
      });
      break;

    case 'back_to_main':
      const welcomeMessage = `🎉 স্বাগতম ${users[userId].firstName}!\n\n` +
        `💰 ব্যালেন্স: ${users[userId].balance.toFixed(6)} ${CONFIG.CURRENCY}\n` +
        `👥 রেফারেল: ${users[userId].referrals}\n` +
        `🎯 কমপ্লিট টাস্ক: ${users[userId].tasksCompleted}\n\n` +
        `🚀 সহজ টাস্ক করে টাকা আয় করুন:\n\n` +
        `📱 Visit Sites - লিংক ক্লিক করে আয় করুন\n` +
        `👥 Join Channels - চ্যানেল জয়েন করে আয় করুন\n` +
        `🤖 Join Bots - বট জয়েন করে আয় করুন\n` +
        `😄 More - আরো টাস্ক এবং সুবিধা\n\n` +
        `📊 নিজের বিজ্ঞাপন তৈরি করুন /advertise দিয়ে`;

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
        bot.editMessageText(`💳 কোন পেন্ডিং ডিপোজিট নেই`, {
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
        bot.editMessageText(`💳 PENDING DEPOSIT REQUEST\n\n` +
          `👤 User: ${user?.firstName || 'Unknown'} (@${user?.username || 'no username'})\n` +
          `🆔 User ID: ${deposit.userId}\n` +
          `💰 Amount: ${deposit.amount} ${CONFIG.CURRENCY}\n` +
          `💳 Method: ${deposit.method}\n` +
          `📅 Date: ${new Date(deposit.createdAt).toLocaleString('bn-BD')}\n` +
          `🆔 Deposit ID: ${deposit.id}\n` +
          `📸 Proof: ${deposit.proof}\n\n` +
          `Remaining: ${pendingDeposits.length} deposits`, {
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
        bot.editMessageText(`🏧 কোন পেন্ডিং উত্তোলন নেই`, {
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
        bot.editMessageText(`🏧 PENDING WITHDRAWAL REQUEST\n\n` +
          `👤 User: ${user?.firstName || 'Unknown'} (@${user?.username || 'no username'})\n` +
          `🆔 User ID: ${withdrawal.userId}\n` +
          `💰 Amount: ${withdrawal.amount} ${CONFIG.CURRENCY}\n` +
          `💳 Method: ${withdrawal.method}\n` +
          `🆔 Payment ID: ${withdrawal.paymentId}\n` +
          `📅 Date: ${new Date(withdrawal.createdAt).toLocaleString('bn-BD')}\n` +
          `🆔 Withdrawal ID: ${withdrawal.id}\n\n` +
          `💰 User Balance: ${user?.balance.toFixed(6) || '0'} ${CONFIG.CURRENCY}\n` +
          `Remaining: ${pendingWithdrawals.length} withdrawals`, {
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
      bot.sendMessage(chatId, '/admin');
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
        
        bot.sendMessage(users[userId].referrerId, 
          `🎉 রেফারেল বোনাস!\n${users[userId].firstName} একটি টাস্ক সম্পন্ন করেছে।\nআপনি ${referralBonus.toFixed(6)} ${CONFIG.CURRENCY} বোনাস পেয়েছেন!`);
      }
      
      saveData();
      
      bot.answerCallbackQuery(query.id, { 
        text: `✅ টাস্ক সম্পন্ন! আপনি ${task.cpc.toFixed(6)} ${CONFIG.CURRENCY} পেয়েছেন!`,
        show_alert: true 
      });

      // Notify advertiser
      bot.sendMessage(task.userId, 
        `📈 আপনার বিজ্ঞাপনে নতুন ক্লিক!\n` +
        `💰 খরচ: ${task.cpc.toFixed(6)} ${CONFIG.CURRENCY}\n` +
        `📊 মোট ক্লিক: ${advertisements[taskId].totalClicks}`);
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
          `✅ আপনার ${deposits[depositId].amount} ${CONFIG.CURRENCY} জমা অনুমোদিত হয়েছে!\n\n` +
          `💰 নতুন ব্যালেন্স: ${users[deposits[depositId].userId].balance.toFixed(6)} ${CONFIG.CURRENCY}\n` +
          `📅 সময়: ${new Date().toLocaleString('bn-BD')}\n\n` +
          `🎉 ধন্যবাদ! এখন আপনি টাস্ক করা শুরু করতে পারেন।`);
      } else {
        deposits[depositId].status = 'rejected';
        deposits[depositId].rejectedAt = new Date().toISOString();
        
        bot.sendMessage(deposits[depositId].userId, 
          `❌ আপনার ${deposits[depositId].amount} ${CONFIG.CURRENCY} জমা প্রত্যাখ্যান করা হয়েছে।\n\n` +
          `📞 সাহায্যের জন্য সাপোর্টে যোগাযোগ করুন: @Owner_Anas1`);
      }
      saveData();
      bot.answerCallbackQuery(query.id, { text: `Deposit ${action}d successfully` });
      
      // Show next pending deposit
      setTimeout(() => {
        bot.sendMessage(chatId, 'Loading next deposit...').then(() => {
          // Trigger next deposit check
          bot.emit('callback_query', { ...query, data: 'admin_deposits' });
        });
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
          `✅ আপনার ${withdrawals[withdrawalId].amount} ${CONFIG.CURRENCY} উত্তোলন অনুমোদিত হয়েছে!\n\n` +
          `💳 পেমেন্ট মেথড: ${withdrawals[withdrawalId].method}\n` +
          `🆔 পেমেন্ট ID: ${withdrawals[withdrawalId].paymentId}\n` +
          `📅 সময়: ${new Date().toLocaleString('bn-BD')}\n\n` +
          `💰 পেমেন্ট 24 ঘন্টার মধ্যে পাঠানো হবে।`);
      } else {
        withdrawals[withdrawalId].status = 'rejected';
        withdrawals[withdrawalId].rejectedAt = new Date().toISOString();
        users[withdrawals[withdrawalId].userId].balance += withdrawals[withdrawalId].amount; // Refund
        
        bot.sendMessage(withdrawals[withdrawalId].userId, 
          `❌ আপনার ${withdrawals[withdrawalId].amount} ${CONFIG.CURRENCY} উত্তোলন প্রত্যাখ্যান করা হয়েছে।\n\n` +
          `💰 টাকা আপনার অ্যাকাউন্টে ফেরত দেওয়া হয়েছে।\n` +
          `📞 সাহায্যের জন্য সাপোর্টে যোগাযোগ করুন: @Owner_Anas1`);
      }
      saveData();
      bot.answerCallbackQuery(query.id, { text: `Withdrawal ${action}d successfully` });
      
      // Show next pending withdrawal
      setTimeout(() => {
        bot.sendMessage(chatId, 'Loading next withdrawal...').then(() => {
          // Trigger next withdrawal check
          bot.emit('callback_query', { ...query, data: 'admin_withdrawals' });
        });
      }, 1000);
    }
  }
});

// Function to process deposit amount
const processDepositAmount = (chatId: number, userId: number, amount: number, method: string, messageId?: number) => {
  const methodName = method === 'binance' ? 'Binance Pay' : 'Payeer';
  const paymentId = method === 'binance' ? CONFIG.BINANCE_PAY_ID : CONFIG.PAYEER_ID;
  
  userStates[userId] = `awaiting_deposit_proof_${method}_${amount}`;
  
  const message = `💳 ${methodName} জমা - ${amount} ${CONFIG.CURRENCY}\n\n` +
    `📋 পেমেন্ট তথ্য:\n` +
    `💰 পরিমাণ: ${amount} ${CONFIG.CURRENCY}\n` +
    `🆔 ${methodName} ID: \`${paymentId}\`\n\n` +
    `📱 ধাপসমূহ:\n` +
    `1️⃣ উপরের ID-তে ${amount} ${CONFIG.CURRENCY} পাঠান\n` +
    `2️⃣ পেমেন্টের স্ক্রিনশট নিন\n` +
    `3️⃣ স্ক্রিনশট এখানে পাঠান\n\n` +
    `⚠️ পরিমাণ হুবহু মিলতে হবে!\n` +
    `🕐 সাধারণত 5-10 মিনিটে অনুমোদন হয়`;

  if (messageId) {
    bot.editMessageText(message, {
      chat_id: chatId,
      message_id: messageId,
      parse_mode: 'Markdown',
      reply_markup: {
        inline_keyboard: [
          [{ text: `📋 Copy ${methodName} ID`, callback_data: `copy_${method}_id` }],
          [{ text: '❌ Cancel', callback_data: 'deposit' }]
        ]
      }
    });
  } else {
    bot.sendMessage(chatId, message, {
      parse_mode: 'Markdown',
      reply_markup: {
        inline_keyboard: [
          [{ text: `📋 Copy ${methodName} ID`, callback_data: `copy_${method}_id` }],
          [{ text: '❌ Cancel', callback_data: 'deposit' }]
        ]
      }
    });
  }
};

// Function to process withdraw amount
const processWithdrawAmount = (chatId: number, userId: number, amount: number, method: string, messageId?: number) => {
  const methodName = method === 'binance' ? 'Binance Pay' : 'Payeer';
  
  userStates[userId] = `awaiting_withdraw_id_${method}_${amount}`;
  
  const message = `🏧 ${methodName} উত্তোলন - ${amount} ${CONFIG.CURRENCY}\n\n` +
    `💳 আপনার ${methodName} ID লিখুন যেখানে টাকা পেতে চান:\n\n` +
    `💡 উদাহরণ:\n` +
    `${methodName === 'Binance Pay' ? 'Binance Pay এর জন্য: 123456789' : 'Payeer এর জন্য: P1234567890'}\n\n` +
    `⚠️ সঠিক ID দিন, ভুল ID দিলে টাকা হারিয়ে যেতে পারে!`;

  if (messageId) {
    bot.editMessageText(message, {
      chat_id: chatId,
      message_id: messageId,
      reply_markup: {
        inline_keyboard: [
          [{ text: '❌ Cancel', callback_data: 'withdraw' }]
        ]
      }
    });
  } else {
    bot.sendMessage(chatId, message, {
      reply_markup: {
        inline_keyboard: [
          [{ text: '❌ Cancel', callback_data: 'withdraw' }]
        ]
      }
    });
  }
};

// Handle text messages for states
bot.on('message', (msg) => {
  const chatId = msg.chat.id;
  const userId = msg.from?.id!;
  const text = msg.text;

  if (!text || text.startsWith('/')) return;
  if (!users[userId]) return;

  const userState = userStates[userId];
  
  // Handle deposit amount input
  if (userState === 'awaiting_deposit_amount_binance' || userState === 'awaiting_deposit_amount_payeer') {
    const amount = parseFloat(text);
    const method = userState.includes('binance') ? 'binance' : 'payeer';
    
    if (isNaN(amount) || amount < CONFIG.MIN_DEPOSIT || amount > CONFIG.MAX_DEPOSIT) {
      return bot.sendMessage(chatId, 
        `❌ ভুল পরিমাণ। অনুগ্রহ করে ${CONFIG.MIN_DEPOSIT} থেকে ${CONFIG.MAX_DEPOSIT} ${CONFIG.CURRENCY} এর মধ্যে একটি সংখ্যা লিখুন।`);
    }

    processDepositAmount(chatId, userId, amount, method);
  }

  // Handle withdrawal amount input
  else if (userState === 'awaiting_withdraw_amount_binance' || userState === 'awaiting_withdraw_amount_payeer') {
    const amount = parseFloat(text);
    const method = userState.includes('binance') ? 'binance' : 'payeer';
    
    if (isNaN(amount) || amount < CONFIG.MIN_WITHDRAW || amount > Math.min(CONFIG.MAX_WITHDRAW, users[userId].balance)) {
      return bot.sendMessage(chatId, 
        `❌ ভুল পরিমাণ। অনুগ্রহ করে ${CONFIG.MIN_WITHDRAW} থেকে ${Math.min(CONFIG.MAX_WITHDRAW, users[userId].balance).toFixed(6)} ${CONFIG.CURRENCY} এর মধ্যে একটি সংখ্যা লিখুন।`);
    }

    processWithdrawAmount(chatId, userId, amount, method);
  }

  // Handle withdrawal ID input
  else if (userState && userState.startsWith('awaiting_withdraw_id_')) {
    const parts = userState.split('_');
    const method = parts[3] === 'binance' ? 'Binance Pay' : 'Payeer';
    const amount = parseFloat(parts[4]);
    const paymentId = text.trim();
    
    if (!paymentId) {
      return bot.sendMessage(chatId, '❌ অনুগ্রহ করে একটি সঠিক পেমেন্ট ID লিখুন');
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
      `✅ উত্তোলনের আবেদন জমা দেওয়া হয়েছে!\n\n` +
      `💰 পরিমাণ: ${amount} ${CONFIG.CURRENCY}\n` +
      `💳 পদ্ধতি: ${method}\n` +
      `🆔 পেমেন্ট ID: ${paymentId}\n` +
      `🔗 আবেদন ID: ${withdrawalId}\n\n` +
      `⏳ অনুমোদনের জন্য অপেক্ষা করুন। অনুমোদন হলে জানানো হবে।\n` +
      `🕐 সাধারণত 2-6 ঘন্টা সময় লাগে।`,
      {
        reply_markup: {
          inline_keyboard: [
            [{ text: '💰 Balance', callback_data: 'balance' }],
            [{ text: '🏠 Main Menu', callback_data: 'back_to_main' }]
          ]
        }
      });
    
    // Notify admin with detailed info
    const user = users[userId];
    const adminNotification = `🏧 NEW WITHDRAWAL REQUEST\n\n` +
      `👤 User: ${user.firstName} (@${user.username || 'no username'})\n` +
      `🆔 User ID: ${userId}\n` +
      `💰 Amount: ${amount} ${CONFIG.CURRENCY}\n` +
      `💳 Method: ${method}\n` +
      `🆔 Payment ID: ${paymentId}\n` +
      `🔗 Request ID: ${withdrawalId}\n` +
      `💰 User Balance After: ${user.balance.toFixed(6)} ${CONFIG.CURRENCY}\n` +
      `📈 User Total Earned: ${user.totalEarned.toFixed(6)} ${CONFIG.CURRENCY}\n` +
      `✅ User Tasks Completed: ${user.tasksCompleted}\n` +
      `📅 Request Time: ${new Date().toLocaleString('bn-BD')}`;
    
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
      `✅ জমার আবেদন জমা দেওয়া হয়েছে!\n\n` +
      `💰 পরিমাণ: ${amount} ${CONFIG.CURRENCY}\n` +
      `💳 পদ্ধতি: ${method}\n` +
      `🔗 আবেদন ID: ${depositId}\n\n` +
      `⏳ অনুমোদনের জন্য অপেক্ষা করুন। অনুমোদন হলে জানানো হবে।\n` +
      `🕐 সাধারণত 5-30 মিনিট সময় লাগে।`,
      {
        reply_markup: {
          inline_keyboard: [
            [{ text: '💰 Balance', callback_data: 'balance' }],
            [{ text: '🏠 Main Menu', callback_data: 'back_to_main' }]
          ]
        }
      });
    
    // Notify admin with detailed info
    const user = users[userId];
    const adminNotification = `💳 NEW DEPOSIT REQUEST\n\n` +
      `👤 User: ${user.firstName} (@${user.username || 'no username'})\n` +
      `🆔 User ID: ${userId}\n` +
      `💰 Amount: ${amount} ${CONFIG.CURRENCY}\n` +
      `💳 Method: ${method}\n` +
      `🔗 Request ID: ${depositId}\n` +
      `📸 Proof: ${msg.photo ? 'Screenshot provided' : 'Text proof provided'}\n` +
      `💰 User Current Balance: ${user.balance.toFixed(6)} ${CONFIG.CURRENCY}\n` +
      `📈 User Total Earned: ${user.totalEarned.toFixed(6)} ${CONFIG.CURRENCY}\n` +
      `📅 Request Time: ${new Date().toLocaleString('bn-BD')}`;
    
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
      `✅ স্ক্রিনশট সহ জমার আবেদন জমা দেওয়া হয়েছে!\n\n` +
      `💰 পরিমাণ: ${amount} ${CONFIG.CURRENCY}\n` +
      `💳 পদ্ধতি: ${method}\n` +
      `🔗 আবেদন ID: ${depositId}\n\n` +
      `⏳ অনুমোদনের জন্য অপেক্ষা করুন। অনুমোদন হলে জানানো হবে।\n` +
      `🕐 সাধারণত 5-30 মিনিট সময় লাগে।`,
      {
        reply_markup: {
          inline_keyboard: [
            [{ text: '💰 Balance', callback_data: 'balance' }],
            [{ text: '🏠 Main Menu', callback_data: 'back_to_main' }]
          ]
        }
      });
    
    // Forward photo to admin with details
    const user = users[userId];
    const adminNotification = `💳 NEW DEPOSIT WITH SCREENSHOT\n\n` +
      `👤 User: ${user.firstName} (@${user.username || 'no username'})\n` +
      `🆔 User ID: ${userId}\n` +
      `💰 Amount: ${amount} ${CONFIG.CURRENCY}\n` +
      `💳 Method: ${method}\n` +
      `🔗 Request ID: ${depositId}\n` +
      `💰 User Current Balance: ${user.balance.toFixed(6)} ${CONFIG.CURRENCY}\n` +
      `📅 Request Time: ${new Date().toLocaleString('bn-BD')}`;
    
    // First send the photo
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

// Initialize
loadData();
console.log('🤖 AnasCP Bot started successfully!');
console.log(`Bot: ${CONFIG.BOT_USERNAME}`);
console.log(`Admin ID: ${ADMIN_ID}`);
console.log(`Required Channels: ${REQUIRED_CHANNELS.join(', ')}`);
console.log(`Min CPC: ${CONFIG.MIN_CPC} ${CONFIG.CURRENCY}`);
console.log(`Max CPC: ${CONFIG.MAX_CPC} ${CONFIG.CURRENCY}`);
console.log(`Referral Bonus: ${CONFIG.REF_BONUS} ${CONFIG.CURRENCY}`);
