
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
  MIN_WITHDRAW: 0.1,
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

// Admin panel keyboard
const getAdminKeyboard = () => {
  return {
    reply_markup: {
      inline_keyboard: [
        [
          { text: '👥 Users', callback_data: 'admin_users' },
          { text: '💳 Deposits', callback_data: 'admin_deposits' }
        ],
        [
          { text: '🏧 Withdrawals', callback_data: 'admin_withdrawals' },
          { text: '📢 Broadcast', callback_data: 'admin_broadcast' }
        ],
        [
          { text: '📊 Advertisements', callback_data: 'admin_ads' },
          { text: '💰 Add Balance', callback_data: 'admin_add_balance' }
        ],
        [
          { text: '📈 Statistics', callback_data: 'admin_stats' },
          { text: '⚙️ Settings', callback_data: 'admin_settings' }
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
    const joinMessage = `🔐 Welcome to ${CONFIG.BOT_NAME} Bot!\n\n` +
      `You must join these 4 channels first:\n\n` +
      `1️⃣ ${REQUIRED_CHANNELS[0]}\n` +
      `2️⃣ ${REQUIRED_CHANNELS[1]}\n` +
      `3️⃣ ${REQUIRED_CHANNELS[2]}\n` +
      `4️⃣ ${REQUIRED_CHANNELS[3]}\n\n` +
      `After joining all channels, press /start`;
    
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
        `🎉 New Referral Joined!\n\n` +
        `👤 ${firstName} joined using your link\n` +
        `💰 You earned ${CONFIG.REF_BONUS} ${CONFIG.CURRENCY} bonus!\n\n` +
        `🔗 Keep referring to earn more!`);

      // Notify admin
      const adminNotification = `🆕 New User Joined!\n\n` +
        `👤 Name: ${firstName}\n` +
        `🆔 ID: ${userId}\n` +
        `👥 Username: @${username || 'none'}\n` +
        `📍 Referrer: ${users[referrerId].firstName} (${referrerId})\n` +
        `💰 Referral Bonus: ${CONFIG.REF_BONUS} ${CONFIG.CURRENCY}\n` +
        `📅 Time: ${new Date().toLocaleString()}\n` +
        `📊 Total Users: ${Object.keys(users).length}`;
      
      bot.sendMessage(ADMIN_ID, adminNotification);
    } else {
      // Notify admin of new user without referrer
      const adminNotification = `🆕 New User Joined!\n\n` +
        `👤 Name: ${firstName}\n` +
        `🆔 ID: ${userId}\n` +
        `👥 Username: @${username || 'none'}\n` +
        `📍 No referrer\n` +
        `📅 Time: ${new Date().toLocaleString()}\n` +
        `📊 Total Users: ${Object.keys(users).length}`;
      
      bot.sendMessage(ADMIN_ID, adminNotification);
    }

    saveData();
  }

  const welcomeMessage = `🎉 Welcome ${firstName}!\n` +
    `💎 Welcome to ${CONFIG.BOT_NAME} CPC Platform\n\n` +
    `💰 Your Balance: ${users[userId].balance.toFixed(6)} ${CONFIG.CURRENCY}\n` +
    `👥 Referrals: ${users[userId].referrals} people\n` +
    `🎯 Completed Tasks: ${users[userId].tasksCompleted} tasks\n\n` +
    `🚀 Easy ways to earn money:\n\n` +
    `🌐 Visit Sites - Earn by visiting websites\n` +
    `👥 Join Channels - Earn by joining channels\n` +
    `🤖 Join Bots - Earn by joining bots\n` +
    `😄 More Tasks - More tasks and bonuses\n\n` +
    `📊 Create your own advertisements to grow your business!\n\n` +
    `ℹ️ Use /help command for assistance`;

  bot.sendMessage(chatId, welcomeMessage, getMainKeyboard());
});

// Handle admin command
bot.onText(/\/admin/, (msg) => {
  const chatId = msg.chat.id;
  const userId = msg.from?.id!;

  if (userId !== ADMIN_ID) {
    return bot.sendMessage(chatId, '❌ Only admin can use this command.');
  }

  const totalUsers = Object.keys(users).length;
  const activeUsers = Object.values(users).filter((u: any) => u.isActive).length;
  const totalBalance = Object.values(users).reduce((sum: number, u: any) => sum + u.balance, 0);
  const pendingDeposits = Object.values(deposits).filter((d: any) => d.status === 'pending').length;
  const pendingWithdrawals = Object.values(withdrawals).filter((w: any) => w.status === 'pending').length;
  const activeAds = Object.values(advertisements).filter((a: any) => a.status === 'active').length;

  const adminMessage = `👑 ${CONFIG.BOT_NAME} Admin Panel\n\n` +
    `📊 Statistics:\n` +
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

// Handle /help command
bot.onText(/\/help/, (msg) => {
  const chatId = msg.chat.id;
  const helpMessage = `📋 ${CONFIG.BOT_NAME} Help Center\n\n` +
    `🔰 Main Features:\n` +
    `💰 Balance - Check your balance\n` +
    `👥 Referrals - View referral information\n` +
    `🌐 Visit Sites - Website visit tasks\n` +
    `👥 Join Channels - Channel join tasks\n` +
    `🤖 Join Bots - Bot join tasks\n` +
    `📊 Advertise - Create advertisements\n` +
    `💳 Deposit - Add money to account\n` +
    `🏧 Withdraw - Withdraw money\n\n` +
    `💡 Tips:\n` +
    `• Complete daily tasks\n` +
    `• Refer friends\n` +
    `• Claim daily bonus regularly\n\n` +
    `📞 Support: @Owner_Anas1\n` +
    `🌐 Group: @AnasEarnHunter`;

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
    return bot.answerCallbackQuery(query.id, { text: 'Please start the bot first with /start' });
  }

  try {
    switch (data) {
      case 'check_membership':
        const hasJoined = await checkChannelMembership(userId);
        if (hasJoined) {
          bot.answerCallbackQuery(query.id, { text: '✅ Membership confirmed!' });
          setTimeout(() => {
            bot.sendMessage(chatId, '/start');
          }, 1000);
        } else {
          bot.answerCallbackQuery(query.id, { text: '❌ Please join all channels first!' });
        }
        break;

      case 'balance':
        const balanceMessage = `💰 Your Balance Information\n\n` +
          `💵 Current Balance: ${users[userId].balance.toFixed(6)} ${CONFIG.CURRENCY}\n` +
          `📈 Total Earned: ${users[userId].totalEarned.toFixed(6)} ${CONFIG.CURRENCY}\n` +
          `📥 Total Deposited: ${users[userId].totalDeposited.toFixed(6)} ${CONFIG.CURRENCY}\n` +
          `📤 Total Withdrawn: ${users[userId].totalWithdrawn.toFixed(6)} ${CONFIG.CURRENCY}\n` +
          `👥 Referral Earnings: ${users[userId].totalReferralEarned?.toFixed(6) || '0.000000'} ${CONFIG.CURRENCY}\n` +
          `✅ Completed Tasks: ${users[userId].tasksCompleted}\n` +
          `📊 Created Ads: ${users[userId].adsCreated}\n\n` +
          `💡 Complete more tasks or create advertisements to earn more!`;
        
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
        const depositMessage = `💳 Deposit ${CONFIG.CURRENCY}\n\n` +
          `📊 Add money to your ${CONFIG.BOT_NAME} account\n\n` +
          `💰 Minimum Deposit: ${CONFIG.MIN_DEPOSIT} ${CONFIG.CURRENCY}\n` +
          `💰 Maximum Deposit: ${CONFIG.MAX_DEPOSIT} ${CONFIG.CURRENCY}\n\n` +
          `🏦 Available Payment Methods:\n\n` +
          `🟡 Binance Pay - Instant and secure\n` +
          `🔵 Payeer - Easy and fast\n\n` +
          `⚡ Usually approved within 5-15 minutes\n\n` +
          `📋 Process:\n` +
          `1️⃣ Enter deposit amount\n` +
          `2️⃣ Select payment method\n` +
          `3️⃣ Send payment to our ID\n` +
          `4️⃣ Submit payment proof`;
        
        bot.editMessageText(depositMessage, {
          chat_id: chatId,
          message_id: query.message?.message_id,
          reply_markup: {
            inline_keyboard: [
              [
                { text: '🟡 Binance Pay', callback_data: 'deposit_binance' },
                { text: '🔵 Payeer', callback_data: 'deposit_payeer' }
              ],
              [{ text: '🔙 Back', callback_data: 'back_to_main' }]
            ]
          }
        });
        break;

      case 'deposit_binance':
        userStates[userId] = 'awaiting_deposit_amount_binance';
        bot.editMessageText(`🟡 Binance Pay Deposit\n\n` +
          `💰 Enter deposit amount (${CONFIG.MIN_DEPOSIT} - ${CONFIG.MAX_DEPOSIT} ${CONFIG.CURRENCY}):\n\n` +
          `💡 Enter numbers only (example: 10.50)\n\n` +
          `⚠️ Enter the exact amount that will be added to your account.`, {
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
        bot.editMessageText(`🔵 Payeer Deposit\n\n` +
          `💰 Enter deposit amount (${CONFIG.MIN_DEPOSIT} - ${CONFIG.MAX_DEPOSIT} ${CONFIG.CURRENCY}):\n\n` +
          `💡 Enter numbers only (example: 10.50)\n\n` +
          `⚠️ Enter the exact amount that will be added to your account.`, {
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
            text: `❌ Minimum withdrawal: ${CONFIG.MIN_WITHDRAW} ${CONFIG.CURRENCY}`,
            show_alert: true 
          });
        } else {
          const withdrawMsg = `🏧 Withdraw ${CONFIG.CURRENCY}\n\n` +
            `📊 Withdraw money from your ${CONFIG.BOT_NAME} account\n\n` +
            `💰 Available: ${users[userId].balance.toFixed(6)} ${CONFIG.CURRENCY}\n` +
            `💰 Minimum: ${CONFIG.MIN_WITHDRAW} ${CONFIG.CURRENCY}\n` +
            `💰 Maximum: ${CONFIG.MAX_WITHDRAW} ${CONFIG.CURRENCY}\n\n` +
            `🏦 Available Payment Methods:\n\n` +
            `🟡 Binance Pay - Fast processing\n` +
            `🔵 Payeer - Instant payment\n\n` +
            `⏰ Usually processed within 2-6 hours\n\n` +
            `📋 Process:\n` +
            `1️⃣ Enter withdrawal amount\n` +
            `2️⃣ Select payment method\n` +
            `3️⃣ Enter your payment ID\n` +
            `4️⃣ Wait for admin approval`;
          
          bot.editMessageText(withdrawMsg, {
            chat_id: chatId,
            message_id: query.message?.message_id,
            reply_markup: {
              inline_keyboard: [
                [
                  { text: '🟡 Binance Pay', callback_data: 'withdraw_binance' },
                  { text: '🔵 Payeer', callback_data: 'withdraw_payeer' }
                ],
                [{ text: '🔙 Back', callback_data: 'back_to_main' }]
              ]
            }
          });
        }
        break;

      case 'withdraw_binance':
        userStates[userId] = 'awaiting_withdraw_amount_binance';
        const maxWithdrawBinance = Math.min(CONFIG.MAX_WITHDRAW, users[userId].balance);
        bot.editMessageText(`🟡 Binance Pay Withdrawal\n\n` +
          `💰 Available: ${users[userId].balance.toFixed(6)} ${CONFIG.CURRENCY}\n` +
          `💰 Enter withdrawal amount (${CONFIG.MIN_WITHDRAW} - ${maxWithdrawBinance.toFixed(6)} ${CONFIG.CURRENCY}):\n\n` +
          `💡 Enter numbers only (example: 5.50)`, {
          chat_id: chatId,
          message_id: query.message?.message_id,
          reply_markup: {
            inline_keyboard: [
              [
                { text: `${CONFIG.MIN_WITHDRAW} ${CONFIG.CURRENCY}`, callback_data: `set_withdraw_amount_binance_${CONFIG.MIN_WITHDRAW}` },
                { text: `1 ${CONFIG.CURRENCY}`, callback_data: `set_withdraw_amount_binance_1` }
              ],
              [
                { text: `5 ${CONFIG.CURRENCY}`, callback_data: `set_withdraw_amount_binance_5` },
                { text: `10 ${CONFIG.CURRENCY}`, callback_data: `set_withdraw_amount_binance_10` }
              ],
              [
                { text: `Withdraw All`, callback_data: `set_withdraw_amount_binance_${users[userId].balance}` }
              ],
              [{ text: '🔙 Back', callback_data: 'withdraw' }]
            ]
          }
        });
        break;

      case 'withdraw_payeer':
        userStates[userId] = 'awaiting_withdraw_amount_payeer';
        const maxWithdrawPayeer = Math.min(CONFIG.MAX_WITHDRAW, users[userId].balance);
        bot.editMessageText(`🔵 Payeer Withdrawal\n\n` +
          `💰 Available: ${users[userId].balance.toFixed(6)} ${CONFIG.CURRENCY}\n` +
          `💰 Enter withdrawal amount (${CONFIG.MIN_WITHDRAW} - ${maxWithdrawPayeer.toFixed(6)} ${CONFIG.CURRENCY}):\n\n` +
          `💡 Enter numbers only (example: 5.50)`, {
          chat_id: chatId,
          message_id: query.message?.message_id,
          reply_markup: {
            inline_keyboard: [
              [
                { text: `${CONFIG.MIN_WITHDRAW} ${CONFIG.CURRENCY}`, callback_data: `set_withdraw_amount_payeer_${CONFIG.MIN_WITHDRAW}` },
                { text: `1 ${CONFIG.CURRENCY}`, callback_data: `set_withdraw_amount_payeer_1` }
              ],
              [
                { text: `5 ${CONFIG.CURRENCY}`, callback_data: `set_withdraw_amount_payeer_5` },
                { text: `10 ${CONFIG.CURRENCY}`, callback_data: `set_withdraw_amount_payeer_10` }
              ],
              [
                { text: `Withdraw All`, callback_data: `set_withdraw_amount_payeer_${users[userId].balance}` }
              ],
              [{ text: '🔙 Back', callback_data: 'withdraw' }]
            ]
          }
        });
        break;

      case 'advertise':
        bot.editMessageText(`📊 ${CONFIG.BOT_NAME} Advertisement System\n\n` +
          `💎 Professional CPC Advertisement Platform\n\n` +
          `🎯 What would you like to promote?\n\n` +
          `💡 Set custom CPC rates (${CONFIG.MIN_CPC} - ${CONFIG.MAX_CPC} ${CONFIG.CURRENCY})\n` +
          `📈 Real-time performance tracking\n` +
          `🎯 Targeted audience reach\n` +
          `📊 Detailed analytics\n\n` +
          `🚀 Grow your business with ${CONFIG.BOT_NAME}!`, {
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
          bot.editMessageText(`🌐 Website Visit Tasks\n\n` +
            `❌ No website visit tasks available currently!\n\n` +
            `🔄 Please check back later\n` +
            `📊 Or create advertisements for your website`, {
            chat_id: chatId,
            message_id: query.message?.message_id,
            reply_markup: {
              inline_keyboard: [
                [{ text: '➕ Create Advertisement', callback_data: 'ad_site_visits' }],
                [
                  { text: '🔄 Refresh', callback_data: 'visit_sites' },
                  { text: '🔙 Back', callback_data: 'back_to_main' }
                ]
              ]
            }
          });
        } else {
          const task = availableSiteTasks[Math.floor(Math.random() * availableSiteTasks.length)] as any;
          const siteTaskMessage = `🌐 Website Visit Task #${task.id}\n\n` +
            `📝 Description: ${task.description}\n` +
            `🔗 Website: ${task.link}\n\n` +
            `💰 Reward: ${task.cpc.toFixed(6)} ${CONFIG.CURRENCY}\n` +
            `⏱️ Required Time: 30 seconds\n\n` +
            `📋 Instructions:\n` +
            `1️⃣ Click "🌐 Visit Website" button\n` +
            `2️⃣ Stay on website for 30+ seconds\n` +
            `3️⃣ Browse the website\n` +
            `4️⃣ Click "✅ Task Complete"\n\n` +
            `🎯 Available Tasks: ${availableSiteTasks.length}`;
          
          bot.editMessageText(siteTaskMessage, {
            chat_id: chatId,
            message_id: query.message?.message_id,
            reply_markup: {
              inline_keyboard: [
                [
                  { text: '⏭️ Skip Task', callback_data: 'visit_sites' },
                  { text: '🌐 Visit Website', url: task.link }
                ],
                [{ text: '✅ Task Complete', callback_data: `complete_task_${task.id}` }],
                [{ text: '🔙 Back', callback_data: 'back_to_main' }]
              ]
            }
          });
        }
        break;

      case 'referrals':
        const referralLink = generateReferralLink(userId);
        const referralMessage = `👥 Your Referral Information\n\n` +
          `👥 Total Referrals: ${users[userId].referrals}\n` +
          `💰 Referral Earnings: ${users[userId].totalReferralEarned?.toFixed(6) || '0.000000'} ${CONFIG.CURRENCY}\n` +
          `🎁 Bonus per Referral: ${CONFIG.REF_BONUS} ${CONFIG.CURRENCY}\n\n` +
          `🔗 Your Referral Link:\n${referralLink}\n\n` +
          `💡 Share your link and earn ${CONFIG.REF_BONUS} ${CONFIG.CURRENCY} for each person who joins!\n` +
          `🎯 Plus 20% from their task earnings!`;
        
        bot.editMessageText(referralMessage, {
          chat_id: chatId,
          message_id: query.message?.message_id,
          reply_markup: {
            inline_keyboard: [
              [
                { text: '📤 Share Link', switch_inline_query: `Join ${CONFIG.BOT_NAME} and earn money! ${referralLink}` },
                { text: '📋 Copy Link', callback_data: 'copy_referral_link' }
              ],
              [{ text: '🔙 Back', callback_data: 'back_to_main' }]
            ]
          }
        });
        break;

      case 'info':
        const joinDate = new Date(users[userId].joinedAt);
        const referralLinkInfo = generateReferralLink(userId);
        const infoMessage = `📊 Your ${CONFIG.BOT_NAME} Profile\n\n` +
          `👤 Name: ${users[userId].firstName}\n` +
          `🆔 ID: ${userId}\n` +
          `👥 Username: @${users[userId].username || 'none'}\n` +
          `💰 Balance: ${users[userId].balance.toFixed(6)} ${CONFIG.CURRENCY}\n` +
          `👥 Referrals: ${users[userId].referrals} people\n` +
          `📈 Total Earned: ${users[userId].totalEarned.toFixed(6)} ${CONFIG.CURRENCY}\n` +
          `💎 Referral Earnings: ${users[userId].totalReferralEarned?.toFixed(6) || '0.000000'} ${CONFIG.CURRENCY}\n` +
          `✅ Completed Tasks: ${users[userId].tasksCompleted}\n` +
          `📊 Created Ads: ${users[userId].adsCreated}\n` +
          `📅 Joined: ${joinDate.toLocaleDateString()}\n\n` +
          `🔗 Your Referral Link:\n${referralLinkInfo}\n\n` +
          `💡 Earn ${CONFIG.REF_BONUS} ${CONFIG.CURRENCY} for each referral!`;
        
        bot.editMessageText(infoMessage, {
          chat_id: chatId,
          message_id: query.message?.message_id,
          reply_markup: {
            inline_keyboard: [
              [
                { text: '📤 Share Link', switch_inline_query: `Join ${CONFIG.BOT_NAME} and earn money! ${referralLinkInfo}` },
                { text: '📋 Copy Link', callback_data: 'copy_referral_link' }
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
            text: '❌ Daily bonus already claimed today!',
            show_alert: true 
          });
        } else {
          const bonusAmount = 0.001; // 0.001 USDT daily bonus
          users[userId].balance += bonusAmount;
          users[userId].totalEarned += bonusAmount;
          users[userId].lastDailyBonus = today;
          saveData();
          
          bot.answerCallbackQuery(query.id, { 
            text: `🎁 ${bonusAmount} ${CONFIG.CURRENCY} daily bonus claimed!`,
            show_alert: true 
          });
          
          bot.editMessageText(`🎁 Daily Bonus Claimed Successfully!\n\n` +
            `💰 Bonus: ${bonusAmount} ${CONFIG.CURRENCY}\n` +
            `💎 New Balance: ${users[userId].balance.toFixed(6)} ${CONFIG.CURRENCY}\n\n` +
            `📅 Come back tomorrow for another bonus!\n\n` +
            `💡 Complete tasks and refer friends to earn more.`, {
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
        const welcomeMessage = `🎉 Welcome ${users[userId].firstName}!\n` +
          `💎 Welcome to ${CONFIG.BOT_NAME} CPC Platform\n\n` +
          `💰 Your Balance: ${users[userId].balance.toFixed(6)} ${CONFIG.CURRENCY}\n` +
          `👥 Referrals: ${users[userId].referrals} people\n` +
          `🎯 Completed Tasks: ${users[userId].tasksCompleted} tasks\n\n` +
          `🚀 Easy ways to earn money:\n\n` +
          `🌐 Visit Sites - Earn by visiting websites\n` +
          `👥 Join Channels - Earn by joining channels\n` +
          `🤖 Join Bots - Earn by joining bots\n` +
          `😄 More Tasks - More tasks and bonuses\n\n` +
          `📊 Create your own advertisements to grow your business!`;

        bot.editMessageText(welcomeMessage, {
          chat_id: chatId,
          message_id: query.message?.message_id,
          ...getMainKeyboard()
        });
        break;

      // Admin callbacks
      case 'admin_users':
        if (userId !== ADMIN_ID) return bot.answerCallbackQuery(query.id, { text: 'Access denied' });
        
        const totalUsers = Object.keys(users).length;
        const activeUsers = Object.values(users).filter((u: any) => u.isActive).length;
        const todayUsers = Object.values(users).filter((u: any) => {
          const joinDate = new Date(u.joinedAt);
          const today = new Date();
          return joinDate.toDateString() === today.toDateString();
        }).length;
        
        bot.editMessageText(`👥 User Statistics\n\n` +
          `📊 Total Users: ${totalUsers}\n` +
          `✅ Active Users: ${activeUsers}\n` +
          `🆕 New Today: ${todayUsers}\n` +
          `📈 Growth Rate: ${totalUsers > 0 ? ((todayUsers / totalUsers) * 100).toFixed(1) : 0}%\n\n` +
          `💰 Total Platform Balance: ${Object.values(users).reduce((sum: number, u: any) => sum + u.balance, 0).toFixed(6)} ${CONFIG.CURRENCY}`, {
          chat_id: chatId,
          message_id: query.message?.message_id,
          reply_markup: {
            inline_keyboard: [
              [{ text: '🔙 Back', callback_data: 'admin_back' }]
            ]
          }
        });
        break;

      case 'admin_deposits':
        if (userId !== ADMIN_ID) return bot.answerCallbackQuery(query.id, { text: 'Access denied' });
        
        const pendingDeposits = Object.values(deposits).filter((d: any) => d.status === 'pending');
        if (pendingDeposits.length === 0) {
          bot.editMessageText(`💳 No Pending Deposits\n\n📊 ${CONFIG.BOT_NAME} Admin Panel`, {
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
            `📅 Date: ${new Date(deposit.createdAt).toLocaleString()}\n` +
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
        if (userId !== ADMIN_ID) return bot.answerCallbackQuery(query.id, { text: 'Access denied' });
        
        const pendingWithdrawals = Object.values(withdrawals).filter((w: any) => w.status === 'pending');
        if (pendingWithdrawals.length === 0) {
          bot.editMessageText(`🏧 No Pending Withdrawals\n\n📊 ${CONFIG.BOT_NAME} Admin Panel`, {
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
            `📅 Date: ${new Date(withdrawal.createdAt).toLocaleString()}\n` +
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

      case 'admin_add_balance':
        if (userId !== ADMIN_ID) return bot.answerCallbackQuery(query.id, { text: 'Access denied' });
        
        userStates[userId] = 'awaiting_user_id_for_balance';
        bot.editMessageText(`💰 Add Balance to User\n\n` +
          `📝 Enter User ID to add balance:\n\n` +
          `💡 You can find User ID from user info or deposit/withdrawal requests\n\n` +
          `⚠️ Make sure to enter correct User ID`, {
          chat_id: chatId,
          message_id: query.message?.message_id,
          reply_markup: {
            inline_keyboard: [
              [{ text: '🔙 Back', callback_data: 'admin_back' }]
            ]
          }
        });
        break;

      case 'admin_stats':
        if (userId !== ADMIN_ID) return bot.answerCallbackQuery(query.id, { text: 'Access denied' });
        
        const totalUsersStats = Object.keys(users).length;
        const totalBalance = Object.values(users).reduce((sum: number, u: any) => sum + u.balance, 0);
        const totalEarned = Object.values(users).reduce((sum: number, u: any) => sum + u.totalEarned, 0);
        const totalDeposited = Object.values(users).reduce((sum: number, u: any) => sum + u.totalDeposited, 0);
        const totalWithdrawn = Object.values(users).reduce((sum: number, u: any) => sum + u.totalWithdrawn, 0);
        const totalTasks = Object.values(users).reduce((sum: number, u: any) => sum + u.tasksCompleted, 0);
        const totalReferrals = Object.values(users).reduce((sum: number, u: any) => sum + u.referrals, 0);
        
        bot.editMessageText(`📈 Platform Statistics\n\n` +
          `👥 Total Users: ${totalUsersStats}\n` +
          `💰 Total Balance: ${totalBalance.toFixed(6)} ${CONFIG.CURRENCY}\n` +
          `📈 Total Earned: ${totalEarned.toFixed(6)} ${CONFIG.CURRENCY}\n` +
          `📥 Total Deposited: ${totalDeposited.toFixed(6)} ${CONFIG.CURRENCY}\n` +
          `📤 Total Withdrawn: ${totalWithdrawn.toFixed(6)} ${CONFIG.CURRENCY}\n` +
          `✅ Total Tasks Completed: ${totalTasks}\n` +
          `👥 Total Referrals: ${totalReferrals}\n\n` +
          `💡 Platform Profit: ${(totalDeposited - totalWithdrawn).toFixed(6)} ${CONFIG.CURRENCY}`, {
          chat_id: chatId,
          message_id: query.message?.message_id,
          reply_markup: {
            inline_keyboard: [
              [{ text: '🔙 Back', callback_data: 'admin_back' }]
            ]
          }
        });
        break;

      case 'admin_back':
        if (userId !== ADMIN_ID) return;
        bot.deleteMessage(chatId, query.message?.message_id!);
        setTimeout(() => {
          // Send admin panel message
          const totalUsers = Object.keys(users).length;
          const activeUsers = Object.values(users).filter((u: any) => u.isActive).length;
          const totalBalance = Object.values(users).reduce((sum: number, u: any) => sum + u.balance, 0);
          const pendingDeposits = Object.values(deposits).filter((d: any) => d.status === 'pending').length;
          const pendingWithdrawals = Object.values(withdrawals).filter((w: any) => w.status === 'pending').length;
          const activeAds = Object.values(advertisements).filter((a: any) => a.status === 'active').length;

          const adminMessage = `👑 ${CONFIG.BOT_NAME} Admin Panel\n\n` +
            `📊 Statistics:\n` +
            `👥 Total Users: ${totalUsers}\n` +
            `✅ Active Users: ${activeUsers}\n` +
            `💰 Total Balance: ${totalBalance.toFixed(6)} ${CONFIG.CURRENCY}\n` +
            `💳 Pending Deposits: ${pendingDeposits}\n` +
            `🏧 Pending Withdrawals: ${pendingWithdrawals}\n` +
            `📢 Active Ads: ${activeAds}\n\n` +
            `🤖 Bot: ${CONFIG.BOT_USERNAME}\n` +
            `👑 Admin ID: ${ADMIN_ID}`;

          bot.sendMessage(chatId, adminMessage, getAdminKeyboard());
        }, 500);
        break;

      case 'copy_referral_link':
        const copyLink = generateReferralLink(userId);
        bot.answerCallbackQuery(query.id, { 
          text: `Link copied: ${copyLink}`,
          show_alert: true 
        });
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
            `🎉 Referral Bonus!\n\n${users[userId].firstName} completed a task.\n💰 You earned ${referralBonus.toFixed(6)} ${CONFIG.CURRENCY} bonus!`);
        }
        
        saveData();
        
        bot.answerCallbackQuery(query.id, { 
          text: `✅ Task complete! Earned ${task.cpc.toFixed(6)} ${CONFIG.CURRENCY}!`,
          show_alert: true 
        });

        // Notify advertiser
        if (task.userId && users[task.userId]) {
          bot.sendMessage(task.userId, 
            `📈 New click on your advertisement!\n\n` +
            `💰 Cost: ${task.cpc.toFixed(6)} ${CONFIG.CURRENCY}\n` +
            `📊 Total Clicks: ${advertisements[taskId].totalClicks}\n` +
            `🎯 Ad ID: ${taskId}`);
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
            `✅ Your ${deposits[depositId].amount} ${CONFIG.CURRENCY} deposit has been approved!\n\n` +
            `💰 New Balance: ${users[deposits[depositId].userId].balance.toFixed(6)} ${CONFIG.CURRENCY}\n` +
            `📅 Time: ${new Date().toLocaleString()}\n\n` +
            `🎉 Start completing tasks and earning!\n` +
            `💎 Welcome to ${CONFIG.BOT_NAME}!`);
        } else {
          deposits[depositId].status = 'rejected';
          deposits[depositId].rejectedAt = new Date().toISOString();
          
          bot.sendMessage(deposits[depositId].userId, 
            `❌ Your ${deposits[depositId].amount} ${CONFIG.CURRENCY} deposit was rejected.\n\n` +
            `📞 Contact support: @Owner_Anas1\n` +
            `💬 Group: @AnasEarnHunter`);
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
            `✅ Your ${withdrawals[withdrawalId].amount} ${CONFIG.CURRENCY} withdrawal has been approved!\n\n` +
            `💳 Payment Method: ${withdrawals[withdrawalId].method}\n` +
            `🆔 Payment ID: ${withdrawals[withdrawalId].paymentId}\n` +
            `📅 Time: ${new Date().toLocaleString()}\n\n` +
            `💰 Payment will be sent within 24 hours.\n` +
            `💎 Thank you for using ${CONFIG.BOT_NAME}!`);
        } else {
          withdrawals[withdrawalId].status = 'rejected';
          withdrawals[withdrawalId].rejectedAt = new Date().toISOString();
          users[withdrawals[withdrawalId].userId].balance += withdrawals[withdrawalId].amount; // Refund
          
          bot.sendMessage(withdrawals[withdrawalId].userId, 
            `❌ Your ${withdrawals[withdrawalId].amount} ${CONFIG.CURRENCY} withdrawal was rejected.\n\n` +
            `💰 Amount refunded to your account.\n` +
            `📞 Contact support: @Owner_Anas1`);
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
    bot.answerCallbackQuery(query.id, { text: 'An error occurred. Please try again.' });
  }
});

// Function to process deposit amount
const processDepositAmount = (chatId: number, userId: number, amount: number, method: string, messageId?: number) => {
  const methodName = method === 'binance' ? 'Binance Pay' : 'Payeer';
  const paymentId = method === 'binance' ? CONFIG.BINANCE_PAY_ID : CONFIG.PAYEER_ID;
  
  userStates[userId] = `awaiting_deposit_proof_${method}_${amount}`;
  
  const message = `💳 ${CONFIG.BOT_NAME} - ${methodName} Deposit\n\n` +
    `💰 Amount: ${amount} ${CONFIG.CURRENCY}\n` +
    `🆔 ${methodName} ID: \`${paymentId}\`\n\n` +
    `💰 Minimum: ${CONFIG.MIN_DEPOSIT} ${CONFIG.CURRENCY}\n\n` +
    `🏦 Payment Methods:\n` +
    `🟡 ${methodName} ID: ${paymentId}\n` +
    `🔵 Payeer ID: P1102512228\n\n` +
    `After payment, send screenshot with amount for verification.\n\n` +
    `📱 Steps:\n` +
    `1️⃣ Send ${amount} ${CONFIG.CURRENCY} to above ID\n` +
    `2️⃣ Take payment screenshot\n` +
    `3️⃣ Send screenshot here\n\n` +
    `⚠️ Amount must be exactly ${amount} ${CONFIG.CURRENCY}!\n` +
    `🕐 Usually approved within 5-15 minutes`;

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
  
  const message = `🏧 ${CONFIG.BOT_NAME} - ${methodName} Withdrawal\n\n` +
    `💰 Withdrawal Amount: ${amount} ${CONFIG.CURRENCY}\n\n` +
    `💳 Enter your ${methodName} ID:\n\n` +
    `💡 Example:\n` +
    `${methodName === 'Binance Pay' ? '• Binance Pay ID: 123456789' : '• Payeer ID: P1234567890'}\n\n` +
    `⚠️ Enter correct ID, wrong ID = no refund!\n\n` +
    `🕐 Payment sent within 24 hours after approval.`;

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
          `❌ Invalid amount.\n\nPlease enter a number between ${CONFIG.MIN_DEPOSIT} and ${CONFIG.MAX_DEPOSIT} ${CONFIG.CURRENCY}.\n\n💡 Example: 10 or 25.50`);
      }

      processDepositAmount(chatId, userId, amount, method);
    }

    // Handle withdrawal amount input
    else if (userState === 'awaiting_withdraw_amount_binance' || userState === 'awaiting_withdraw_amount_payeer') {
      const amount = parseFloat(text);
      const method = userState.includes('binance') ? 'binance' : 'payeer';
      
      if (isNaN(amount) || amount < CONFIG.MIN_WITHDRAW || amount > Math.min(CONFIG.MAX_WITHDRAW, users[userId].balance)) {
        return bot.sendMessage(chatId, 
          `❌ Invalid amount.\n\nPlease enter a number between ${CONFIG.MIN_WITHDRAW} and ${Math.min(CONFIG.MAX_WITHDRAW, users[userId].balance).toFixed(6)} ${CONFIG.CURRENCY}.\n\n💰 Your Balance: ${users[userId].balance.toFixed(6)} ${CONFIG.CURRENCY}`);
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
        return bot.sendMessage(chatId, '❌ Please enter a valid payment ID.\n\n💡 Must be at least 5 characters long.');
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
        `✅ Withdrawal request submitted successfully!\n\n` +
        `💰 Amount: ${amount} ${CONFIG.CURRENCY}\n` +
        `💳 Method: ${method}\n` +
        `🆔 Payment ID: ${paymentId}\n` +
        `🔗 Request ID: ${withdrawalId}\n\n` +
        `⏳ Waiting for admin approval\n` +
        `🕐 Usually takes 2-6 hours\n\n` +
        `📱 You'll be notified when approved`,
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
      const adminNotification = `🏧 New Withdrawal Request - ${CONFIG.BOT_NAME}\n\n` +
        `👤 User: ${user.firstName} (@${user.username || 'no username'})\n` +
        `🆔 User ID: ${userId}\n` +
        `💰 Amount: ${amount} ${CONFIG.CURRENCY}\n` +
        `💳 Method: ${method}\n` +
        `🆔 Payment ID: ${paymentId}\n` +
        `🔗 Request ID: ${withdrawalId}\n` +
        `💰 User Balance (after): ${user.balance.toFixed(6)} ${CONFIG.CURRENCY}\n` +
        `📈 Total Earned: ${user.totalEarned.toFixed(6)} ${CONFIG.CURRENCY}\n` +
        `✅ Completed Tasks: ${user.tasksCompleted}\n` +
        `📅 Request Time: ${new Date().toLocaleString()}`;
      
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
        `✅ Deposit request submitted successfully!\n\n` +
        `💰 Amount: ${amount} ${CONFIG.CURRENCY}\n` +
        `💳 Method: ${method}\n` +
        `🔗 Request ID: ${depositId}\n\n` +
        `⏳ Waiting for admin verification\n` +
        `🕐 Usually takes 5-15 minutes\n\n` +
        `📱 You'll be notified when approved`,
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
      const adminNotification = `💳 New Deposit Request - ${CONFIG.BOT_NAME}\n\n` +
        `👤 User: ${user.firstName} (@${user.username || 'no username'})\n` +
        `🆔 User ID: ${userId}\n` +
        `💰 Amount: ${amount} ${CONFIG.CURRENCY}\n` +
        `💳 Method: ${method}\n` +
        `🔗 Request ID: ${depositId}\n` +
        `📸 Proof: ${msg.photo ? 'Screenshot provided' : 'Text proof'}\n` +
        `💰 Current Balance: ${user.balance.toFixed(6)} ${CONFIG.CURRENCY}\n` +
        `📈 Total Earned: ${user.totalEarned.toFixed(6)} ${CONFIG.CURRENCY}\n` +
        `📅 Request Time: ${new Date().toLocaleString()}`;
      
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

    // Handle admin balance addition
    else if (userState === 'awaiting_user_id_for_balance') {
      if (userId !== ADMIN_ID) return;
      
      const targetUserId = parseInt(text);
      if (isNaN(targetUserId) || !users[targetUserId]) {
        return bot.sendMessage(chatId, '❌ Invalid User ID. User not found.');
      }

      userStates[userId] = `awaiting_balance_amount_${targetUserId}`;
      bot.sendMessage(chatId, 
        `💰 Add Balance to User\n\n` +
        `👤 User: ${users[targetUserId].firstName} (@${users[targetUserId].username || 'no username'})\n` +
        `🆔 User ID: ${targetUserId}\n` +
        `💰 Current Balance: ${users[targetUserId].balance.toFixed(6)} ${CONFIG.CURRENCY}\n\n` +
        `💡 Enter amount to add (example: 10.50):`,
        {
          reply_markup: {
            inline_keyboard: [
              [
                { text: '1 USDT', callback_data: `admin_add_balance_${targetUserId}_1` },
                { text: '5 USDT', callback_data: `admin_add_balance_${targetUserId}_5` }
              ],
              [
                { text: '10 USDT', callback_data: `admin_add_balance_${targetUserId}_10` },
                { text: '50 USDT', callback_data: `admin_add_balance_${targetUserId}_50` }
              ],
              [{ text: '🔙 Back', callback_data: 'admin_back' }]
            ]
          }
        });
    }

    // Handle balance amount input
    else if (userState && userState.startsWith('awaiting_balance_amount_')) {
      if (userId !== ADMIN_ID) return;
      
      const targetUserId = parseInt(userState.split('_')[3]);
      const amount = parseFloat(text);
      
      if (isNaN(amount) || amount <= 0) {
        return bot.sendMessage(chatId, '❌ Invalid amount. Please enter a positive number.');
      }

      users[targetUserId].balance += amount;
      users[targetUserId].totalEarned += amount;
      delete userStates[userId];
      saveData();

      bot.sendMessage(chatId, 
        `✅ Balance added successfully!\n\n` +
        `👤 User: ${users[targetUserId].firstName}\n` +
        `🆔 User ID: ${targetUserId}\n` +
        `💰 Added: ${amount} ${CONFIG.CURRENCY}\n` +
        `💎 New Balance: ${users[targetUserId].balance.toFixed(6)} ${CONFIG.CURRENCY}`);
      
      // Notify user
      bot.sendMessage(targetUserId, 
        `🎉 Balance Added by Admin!\n\n` +
        `💰 Amount: ${amount} ${CONFIG.CURRENCY}\n` +
        `💎 New Balance: ${users[targetUserId].balance.toFixed(6)} ${CONFIG.CURRENCY}\n\n` +
        `🙏 Thank you for using ${CONFIG.BOT_NAME}!`);
    }

  } catch (error) {
    console.error('Error handling message:', error);
    bot.sendMessage(chatId, '❌ An error occurred. Please try again.');
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
      `✅ Deposit request with screenshot submitted!\n\n` +
      `💰 Amount: ${amount} ${CONFIG.CURRENCY}\n` +
      `💳 Method: ${method}\n` +
      `🔗 Request ID: ${depositId}\n\n` +
      `⏳ Waiting for admin verification\n` +
      `🕐 Usually takes 5-15 minutes\n\n` +
      `📱 You'll be notified instantly when approved`,
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
    const adminNotification = `💳 New Deposit (with Screenshot) - ${CONFIG.BOT_NAME}\n\n` +
      `👤 User: ${user.firstName} (@${user.username || 'no username'})\n` +
      `🆔 User ID: ${userId}\n` +
      `💰 Amount: ${amount} ${CONFIG.CURRENCY}\n` +
      `💳 Method: ${method}\n` +
      `🔗 Request ID: ${depositId}\n` +
      `💰 Current Balance: ${user.balance.toFixed(6)} ${CONFIG.CURRENCY}\n` +
      `📅 Request Time: ${new Date().toLocaleString()}`;
    
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
