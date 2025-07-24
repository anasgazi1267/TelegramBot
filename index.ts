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
  MIN_CPC: 0.001,
  MAX_CPC: 0.100,
  MIN_DEPOSIT: 0.20,
  MAX_DEPOSIT: 1000,
  MIN_WITHDRAW: 0.10,
  MAX_WITHDRAW: 500,
  CURRENCY: 'USDT',
  BINANCE_PAY_ID: '787819330',
  PAYEER_ID: 'P1102512228',
  BOT_USERNAME: '@task_cpbot',
  BOT_NAME: 'AnasCP',
  ADMIN_COMMISSION: 0.0001,
  MIN_BUDGET: 0.10
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

// Enhanced channel membership check with retry mechanism
const checkChannelMembership = async (userId: number, retryCount = 0): Promise<boolean> => {
  try {
    for (const channel of REQUIRED_CHANNELS) {
      const channelUsername = channel.replace('https://t.me/', '@');
      try {
        const member = await bot.getChatMember(channelUsername, userId);
        if (member.status === 'left' || member.status === 'kicked') {
          console.log(`User ${userId} not in channel ${channelUsername}`);
          return false;
        }
      } catch (error: any) {
        console.log(`Error checking ${channelUsername} for user ${userId}:`, error.message);
        // If it's a network error and we haven't retried too much, try again
        if (retryCount < 2 && (error.message.includes('ETELEGRAM') || error.message.includes('network'))) {
          await new Promise(resolve => setTimeout(resolve, 1000)); // Wait 1 second
          return checkChannelMembership(userId, retryCount + 1);
        }
        return false;
      }
    }
    return true;
  } catch (error) {
    console.log(`General error checking membership for user ${userId}:`, error);
    return false;
  }
};

// Check if user is member of a specific channel (for task validation)
const checkSpecificChannelMembership = async (userId: number, channelLink: string): Promise<boolean> => {
  try {
    const channelUsername = channelLink.replace('https://t.me/', '@');
    const member = await bot.getChatMember(channelUsername, userId);
    return member.status !== 'left' && member.status !== 'kicked';
  } catch (error) {
    console.log(`Error checking specific channel ${channelLink} for user ${userId}:`, error);
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
          { text: '🗳️ Voting Tasks', callback_data: 'voting_tasks' }
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
          { text: '🗳️ Voting Tasks', callback_data: 'ad_voting_tasks' },
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

  // Store referral code for later use
  const referralCode = match?.[1]?.trim();
  let referrerId = null;

  if (referralCode && referralCode !== userId.toString()) {
    referrerId = parseInt(referralCode);
  }

  // Check if user joined required channels
  const hasJoined = await checkChannelMembership(userId);

  if (!hasJoined) {
    const joinMessage = `🔐 Welcome to ${CONFIG.BOT_NAME} Bot!\n\n` +
      `You must join these 4 channels first:\n\n` +
      `1️⃣ ${REQUIRED_CHANNELS[0]}\n` +
      `2️⃣ ${REQUIRED_CHANNELS[1]}\n` +
      `3️⃣ ${REQUIRED_CHANNELS[2]}\n` +
      `4️⃣ ${REQUIRED_CHANNELS[3]}\n\n` +
      `After joining all channels, press the button below:`;

    return bot.sendMessage(chatId, joinMessage, {
      reply_markup: {
        inline_keyboard: [
          [{ text: '✅ Check Membership', callback_data: `check_membership_${referrerId || 'none'}` }]
        ]
      }
    });
  }

  // Register or update user (now we know they've joined channels)
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
      users[referrerId].totalReferralEarned = (users[referrerId].totalReferralEarned || 0) + CONFIG.REF_BONUS;

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
    `🗳️ Voting Tasks - Earn by completing voting tasks\n\n` +
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
    `🗳️ Voting Tasks - Voting tasks\n` +
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

  if (!users[userId] && !data?.startsWith('check_membership')) {
    return bot.answerCallbackQuery(query.id, { text: 'Please start the bot first with /start' });
  }

  try {
    switch (data) {
      case 'check_membership':
      case (data?.match(/^check_membership_/) || {}).input:
        const referrerIdFromCallback = data.includes('_') ? data.split('_')[2] : null;
        const referrerId = referrerIdFromCallback !== 'none' ? parseInt(referrerIdFromCallback) : null;

        const hasJoined = await checkChannelMembership(userId);
        if (hasJoined) {
          bot.answerCallbackQuery(query.id, { text: '✅ Membership confirmed!' });

          // Register user now with referral
          if (!users[userId]) {
            const username = query.from.username || '';
            const firstName = query.from.first_name || 'User';

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
              users[referrerId].totalReferralEarned = (users[referrerId].totalReferralEarned || 0) + CONFIG.REF_BONUS;

              // Notify referrer
              bot.sendMessage(referrerId, 
                `🎉 New Referral Joined!\n\n` +
                `👤 ${firstName} joined using your link\n` +
                `💰 You earned ${CONFIG.REF_BONUS} ${CONFIG.CURRENCY} bonus!\n\n` +
                `🔗 Keep referring to earn more!`);
            }

            saveData();
          }

          setTimeout(() => {
            const welcomeMessage = `🎉 Welcome ${query.from.first_name}!\n` +
              `💎 Welcome to ${CONFIG.BOT_NAME} CPC Platform\n\n` +
              `💰 Your Balance: ${users[userId].balance.toFixed(6)} ${CONFIG.CURRENCY}\n` +
              `👥 Referrals: ${users[userId].referrals} people\n` +
              `🎯 Completed Tasks: ${users[userId].tasksCompleted} tasks\n\n` +
              `🚀 Easy ways to earn money:\n\n` +
              `🌐 Visit Sites - Earn by visiting websites\n` +
              `👥 Join Channels - Earn by joining channels\n` +
              `🤖 Join Bots - Earn by joining bots\n` +
              `🗳️ Voting Tasks - Earn by completing voting tasks\n\n` +
              `📊 Create your own advertisements to grow your business!`;

            bot.editMessageText(welcomeMessage, {
              chat_id: chatId,
              message_id: query.message?.message_id,
              ...getMainKeyboard()
            });
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

      case 'copy_binance_id':
        bot.answerCallbackQuery(query.id, { 
          text: `Binance Pay ID: ${CONFIG.BINANCE_PAY_ID}`,
          show_alert: true 
        });
        break;

      case 'copy_payeer_id':
        bot.answerCallbackQuery(query.id, { 
          text: `Payeer ID: ${CONFIG.PAYEER_ID}`,
          show_alert: true 
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

      // Advertisement creation handlers
      case 'ad_channel_members':
        if (users[userId].balance < CONFIG.MIN_CPC) {
          bot.answerCallbackQuery(query.id, { 
            text: `❌ Minimum balance required: ${CONFIG.MIN_CPC} ${CONFIG.CURRENCY}`,
            show_alert: true 
          });
        } else {
          userStates[userId] = 'creating_ad_channel_members_title';
          bot.editMessageText(`👥 Create Channel Members Advertisement\n\n` +
            `📝 Enter advertisement title:\n\n```python
`💡 Example: "Join our amazing cryptochannel!"\n` +
            `📏 Maximum 50 characters\n\n` +
            `⚠️ IMPORTANT: After creating this ad, you MUST add ${CONFIG.BOT_USERNAME} as admin to your channel so we can verify if users actually joined!\n\n` +
            `🔧 Add ${CONFIG.BOT_USERNAME} as admin in your channel`, {
            chat_id: chatId,
            message_id: query.message?.message_id,
            reply_markup: {
              inline_keyboard: [
                [{ text: '🔙 Back', callback_data: 'advertise' }]
              ]
            }
          });
        }
        break;

      case 'ad_site_visits':
        if (users[userId].balance < CONFIG.MIN_CPC) {
          bot.answerCallbackQuery(query.id, { 
            text: `❌ Minimum balance required: ${CONFIG.MIN_CPC} ${CONFIG.CURRENCY}`,
            show_alert: true 
          });
        } else {
          userStates[userId] = 'creating_ad_site_visits_title';
          bot.editMessageText(`🌐 Create Website Visit Advertisement\n\n` +
            `📝 Enter advertisement title:\n\n` +
            `💡 Example: "Visit our amazing website!"\n` +
            `📏 Maximum 50 characters\n\n` +
            `⚠️ Make sure your title is attractive and clear`, {
            chat_id: chatId,
            message_id: query.message?.message_id,
            reply_markup: {
              inline_keyboard: [
                [{ text: '🔙 Back', callback_data: 'advertise' }]
              ]
            }
          });
        }
        break;

      case 'ad_bot_members':
        if (users[userId].balance < CONFIG.MIN_CPC) {
          bot.answerCallbackQuery(query.id, { 
            text: `❌ Minimum balance required: ${CONFIG.MIN_CPC} ${CONFIG.CURRENCY}`,
            show_alert: true 
          });
        } else {
          userStates[userId] = 'creating_ad_bot_members_title';
          bot.editMessageText(`🤖 Create Bot Members Advertisement\n\n` +
            `📝 Enter advertisement title:\n\n` +
            `💡 Example: "Join our amazing bot!"\n` +
            `📏 Maximum 50 characters\n\n` +
            `⚠️ Make sure your title is attractive and clear`, {
            chat_id: chatId,
            message_id: query.message?.message_id,
            reply_markup: {
              inline_keyboard: [
                [{ text: '🔙 Back', callback_data: 'advertise' }]
              ]
            }
          });
        }
        break;

      case 'ad_voting_tasks':
        if (users[userId].balance < CONFIG.MIN_BUDGET) {
          bot.answerCallbackQuery(query.id, { 
            text: `❌ Minimum balance required: ${CONFIG.MIN_BUDGET} ${CONFIG.CURRENCY}`,
            show_alert: true 
          });
        } else {
          userStates[userId] = 'creating_ad_voting_tasks_title';
          bot.editMessageText(`🗳️ Create Voting Tasks Advertisement\n\n` +
            `📝 Enter advertisement title:\n\n` +
            `💡 Example: "Vote for our project and get reward!"\n` +
            `📏 Maximum 50 characters\n\n` +
            `⚠️ Make sure your title is attractive and clear`, {
            chat_id: chatId,
            message_id: query.message?.message_id,
            reply_markup: {
              inline_keyboard: [
                [{ text: '🔙 Back', callback_data: 'advertise' }]
              ]
            }
          });
        }
        break;

      case 'my_ads':
        const userAds = Object.values(advertisements).filter((ad: any) => ad.userId === userId);

        if (userAds.length === 0) {
          bot.editMessageText(`📈 My Advertisements\n\n` +
            `❌ You haven't created any advertisements yet!\n\n` +
            `🚀 Create your first advertisement to start promoting your business`, {
            chat_id: chatId,
            message_id: query.message?.message_id,
            reply_markup: {
              inline_keyboard: [
                [{ text: '➕ Create Advertisement', callback_data: 'advertise' }],
                [{ text: '🔙 Back', callback_data: 'advertise' }]
              ]
            }
          });
        } else {
          let adsText = `📈 My Advertisements (${userAds.length})\n\n`;

          userAds.forEach((ad: any, index: number) => {
            const statusEmoji = ad.status === 'active' ? '🟢' : ad.status === 'paused' ? '🟡' : '🔴';
            const remainingBudget = (ad.totalBudget - ad.totalSpent).toFixed(6);
            const completionRate = ad.totalBudget > 0 ? ((ad.totalSpent / ad.totalBudget) * 100).toFixed(1) : '0';

            adsText += `${statusEmoji} Ad #${ad.id}\n` +
              `📝 ${ad.title}\n` +
              `💰 CPC: ${ad.cpc.toFixed(6)} ${CONFIG.CURRENCY}\n` +
              `📊 Clicks: ${ad.totalClicks}\n` +
              `💵 Spent: ${ad.totalSpent.toFixed(6)} ${CONFIG.CURRENCY}\n` +
              `💎 Remaining: ${remainingBudget} ${CONFIG.CURRENCY}\n` +
              `📈 Progress: ${completionRate}%\n\n`;
          });

          bot.editMessageText(adsText, {
            chat_id: chatId,
            message_id: query.message?.message_id,
            reply_markup: {
              inline_keyboard: [
                [{ text: '🔄 Refresh', callback_data: 'my_ads' }],
                [{ text: '➕ Create New Ad', callback_data: 'advertise' }],
                [{ text: '🔙 Back', callback_data: 'advertise' }]
              ]
            }
          });
        }
        break;

      case 'visit_sites':
        // Generate site visiting tasks
        const availableSiteTasks = Object.values(advertisements).filter((ad: any) => 
          ad.status === 'active' && 
          ad.type === 'site_visits' && 
          ad.totalSpent < ad.totalBudget &&
          !users[userId].completedTasks.includes(ad.id) &&
          ad.userId !== userId // Don't show own ads
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
          const remainingBudget = (task.totalBudget - task.totalSpent).toFixed(6);
          const remainingClicks = Math.floor((task.totalBudget - task.totalSpent) / task.cpc);

          const siteTaskMessage = `🌐 Website Visit Task #${task.id}\n\n` +
            `📝 Title: ${task.title}\n` +
            `📄 Description: ${task.description}\n` +
            `🔗 Website: ${task.link}\n\n` +
            `💰 Reward: ${task.cpc.toFixed(6)} ${CONFIG.CURRENCY}\n` +
            `📊 Remaining Budget: ${remainingBudget} ${CONFIG.CURRENCY}\n` +
            `🎯 Remaining Clicks: ${remainingClicks}\n` +
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

      case 'join_channels':
        // Generate channel joining tasks
        const availableChannelTasks = Object.values(advertisements).filter((ad: any) => 
          ad.status === 'active' && 
          ad.type === 'join_channels' && 
          ad.totalSpent < ad.totalBudget &&
          !users[userId].completedTasks.includes(ad.id) &&
          ad.userId !== userId // Don't show own ads
        );

        if (availableChannelTasks.length === 0) {
          bot.editMessageText(`👥 Channel Join Tasks\n\n` +
            `❌ No channel join tasks available currently!\n\n` +
            `🔄 Please check back later\n` +
            `📊 Or create advertisements for your channel`, {
            chat_id: chatId,
            message_id: query.message?.message_id,
            reply_markup: {
              inline_keyboard: [
                [{ text: '➕ Create Advertisement', callback_data: 'ad_channel_members' }],
                [
                  { text: '🔄 Refresh', callback_data: 'join_channels' },
                  { text: '🔙 Back', callback_data: 'back_to_main' }
                ]
              ]
            }
          });
        } else {
          const task = availableChannelTasks[Math.floor(Math.random() * availableChannelTasks.length)] as any;
          const remainingBudget = (task.totalBudget - task.totalSpent).toFixed(6);
          const remainingClicks = Math.floor((task.totalBudget - task.totalSpent) / task.cpc);

          const channelTaskMessage = `👥 Channel Join Task #${task.id}\n\n` +
            `📝 Title: ${task.title}\n` +
            `📄 Description: ${task.description}\n` +
            `🔗 Channel: ${task.link}\n\n` +
            `💰 Reward: ${task.cpc.toFixed(6)} ${CONFIG.CURRENCY}\n` +
            `📊 Remaining Budget: ${remainingBudget} ${CONFIG.CURRENCY}\n` +
            `🎯 Remaining Clicks: ${remainingClicks}\n\n` +
            `📋 Instructions:\n` +
            `1️⃣ Click "👥 Join Channel" button\n` +
            `2️⃣ Join the channel\n` +
            `3️⃣ Stay in channel for 30+ seconds\n` +
            `4️⃣ Click "✅ Task Complete"\n\n` +
            `⚠️ You must actually join to get reward!\n` +
            `🎯 Available Tasks: ${availableChannelTasks.length}`;

          bot.editMessageText(channelTaskMessage, {
            chat_id: chatId,
            message_id: query.message?.message_id,
            reply_markup: {
              inline_keyboard: [
                [
                  { text: '⏭️ Skip Task', callback_data: 'join_channels' },
                  { text: '👥 Join Channel', url: task.link }
                ],
                [{ text: '✅ Task Complete', callback_data: `complete_task_${task.id}` }],
                [{ text: '🔙 Back', callback_data: 'back_to_main' }]
              ]
            }
          });
        }
        break;

      case 'join_bots':
        // Generate bot joining tasks
        const availableBotTasks = Object.values(advertisements).filter((ad: any) => 
          ad.status === 'active' && 
          ad.type === 'join_bots' && 
          ad.totalSpent < ad.totalBudget &&
          !users[userId].completedTasks.includes(ad.id) &&
          ad.userId !== userId // Don't show own ads
        );

        if (availableBotTasks.length === 0) {
          bot.editMessageText(`🤖 Bot Join Tasks\n\n` +
            `❌ No bot join tasks available currently!\n\n` +
            `🔄 Please check back later\n` +
            `📊 Or create advertisements for your bot`, {
            chat_id: chatId,
            message_id: query.message?.message_id,
            reply_markup: {
              inline_keyboard: [
                [{ text: '➕ Create Advertisement', callback_data: 'ad_bot_members' }],
                [
                  { text: '🔄 Refresh', callback_data: 'join_bots' },
                  { text: '🔙 Back', callback_data: 'back_to_main' }
                ]
              ]
            }
          });
        } else {
          const task = availableBotTasks[Math.floor(Math.random() * availableBotTasks.length)] as any;
          const remainingBudget = (task.totalBudget - task.totalSpent).toFixed(6);
          const remainingClicks = Math.floor((task.totalBudget - task.totalSpent) / task.cpc);

          const botTaskMessage = `🤖 Bot Join Task #${task.id}\n\n` +
            `📝 Title: ${task.title}\n` +
            `📄 Description: ${task.description}\n` +
            `🔗 Bot: ${task.link}\n\n` +
            `💰 Reward: ${task.cpc.toFixed(6)} ${CONFIG.CURRENCY}\n` +
            `📊 Remaining Budget: ${remainingBudget} ${CONFIG.CURRENCY}\n` +
            `🎯 Remaining Clicks: ${remainingClicks}\n\n` +
            `📋 Instructions:\n` +
            `1️⃣ Click "🤖 Start Bot" button\n` +
            `2️⃣ Start the bot\n` +
            `3️⃣ Interact with bot for 30+ seconds\n` +
            `4️⃣ Click "✅ Task Complete"\n\n` +
            `🎯 Available Tasks: ${availableBotTasks.length}`;

          bot.editMessageText(botTaskMessage, {
            chat_id: chatId,
            message_id: query.message?.message_id,
            reply_markup: {
              inline_keyboard: [
                [
                  { text: '⏭️ Skip Task', callback_data: 'join_bots' },
                  { text: '🤖 Start Bot', url: task.link }
                ],
                [{ text: '✅ Task Complete', callback_data: `complete_task_${task.id}` }],
                [{ text: '🔙 Back', callback_data: 'back_to_main' }]
              ]
            }
          });
        }
        break;

      case 'voting_tasks':
        // Generate voting tasks
        const availableVotingTasks = Object.values(advertisements).filter((ad: any) => 
          ad.status === 'active' && 
          ad.type === 'voting_tasks' && 
          ad.totalSpent < ad.totalBudget &&
          !users[userId].completedTasks.includes(ad.id) &&
          ad.userId !== userId
        );

        if (availableVotingTasks.length === 0) {
          bot.editMessageText(`🗳️ Voting Tasks\n\n` +
            `❌ No voting tasks available currently!\n\n` +
            `🔄 Please check back later\n` +
            `📊 Or create advertisements for voting tasks`, {
            chat_id: chatId,
            message_id: query.message?.message_id,
            reply_markup: {
              inline_keyboard: [
                [{ text: '➕ Create Advertisement', callback_data: 'ad_voting_tasks' }],
                [
                  { text: '🔄 Refresh', callback_data: 'voting_tasks' },
                  { text: '🔙 Back', callback_data: 'back_to_main' }
                ]
              ]
            }
          });
        } else {
          const task = availableVotingTasks[Math.floor(Math.random() * availableVotingTasks.length)] as any;
          const remainingBudget = (task.totalBudget - task.totalSpent).toFixed(6);
          const remainingClicks = Math.floor((task.totalBudget - task.totalSpent) / task.cpc);

          const votingTaskMessage = `🗳️ Voting Task #${task.id}\n\n` +
            `📝 Title: ${task.title}\n` +
            `📄 Description: ${task.description}\n` +
            `🔗 Link: ${task.link}\n\n` +
            `💰 Reward: ${task.cpc.toFixed(6)} ${CONFIG.CURRENCY}\n` +
            `📊 Remaining Budget: ${remainingBudget} ${CONFIG.CURRENCY}\n` +
            `🎯 Remaining Clicks: ${remainingClicks}\n\n` +
            `📋 Instructions:\n` +
            `1️⃣ Click "🗳️ Vote Now" button\n` +
            `2️⃣ Complete the voting process\n` +
            `3️⃣ Come back and click "✅ Task Complete"\n\n` +
            `🎯 Available Tasks: ${availableVotingTasks.length}`;

          bot.editMessageText(votingTaskMessage, {
            chat_id: chatId,
            message_id: query.message?.message_id,
            reply_markup: {
              inline_keyboard: [
                [
                  { text: '⏭️ Skip Task', callback_data: 'voting_tasks' },
                  { text: '🗳️ Vote Now', url: task.link }
                ],
                [{ text: '✅ Task Complete', callback_data: `complete_voting_task_${task.id}` }],
                [{ text: '🔙 Back', callback_data: 'back_to_main' }]
              ]
            }
          });
        }
        break;

      case 'more_tasks':
        const allAvailableTasks = Object.values(advertisements).filter((ad: any) => 
          ad.status === 'active' && 
          ad.totalSpent < ad.totalBudget &&
          !users[userId].completedTasks.includes(ad.id) &&
          ad.userId !== userId
        );

        if (allAvailableTasks.length === 0) {
          bot.editMessageText(`😄 More Tasks\n\n` +
            `❌ No additional tasks available currently!\n\n` +
            `🔄 Please check back later\n` +
            `📊 Or create your own advertisements`, {
            chat_id: chatId,
            message_id: query.message?.message_id,
            reply_markup: {
              inline_keyboard: [
                [{ text: '📊 Create Advertisement', callback_data: 'advertise' }],
                [
                  { text: '🔄 Refresh', callback_data: 'more_tasks' },
                  { text: '🔙 Back', callback_data: 'back_to_main' }
                ]
              ]
            }
          });
        } else {
          const siteTasks = allAvailableTasks.filter((ad: any) => ad.type === 'site_visits').length;
          const channelTasks = allAvailableTasks.filter((ad: any) => ad.type === 'join_channels').length;
          const botTasks = allAvailableTasks.filter((ad: any) => ad.type === 'join_bots').length;
          const votingTasks = allAvailableTasks.filter((ad: any) => ad.type === 'voting_tasks').length;
          const totalEarnings = allAvailableTasks.reduce((sum: number, ad: any) => sum + ad.cpc, 0);

          bot.editMessageText(`😄 All Available Tasks\n\n` +
            `📊 Task Summary:\n` +
            `🌐 Website Visits: ${siteTasks} tasks\n` +
            `👥 Channel Joins: ${channelTasks} tasks\n` +
            `🤖 Bot Starts: ${botTasks} tasks\n` +
            `🗳️ Voting Tasks: ${votingTasks} tasks\n\n` +
            `💰 Total Potential Earnings: ${totalEarnings.toFixed(6)} ${CONFIG.CURRENCY}\n` +
            `🎯 Total Available Tasks: ${allAvailableTasks.length}\n\n` +
            `🚀 Choose a category to start earning!`, {
            chat_id: chatId,
            message_id: query.message?.message_id,
            reply_markup: {
              inline_keyboard: [
                [
                  { text: `🌐 Sites (${siteTasks})`, callback_data: 'visit_sites' },
                  { text: `👥 Channels (${channelTasks})`, callback_data: 'join_channels' }
                ],
                [
                  { text: `🤖 Bots (${botTasks})`, callback_data: 'join_bots' },
                  { text: `🗳️ Voting (${votingTasks})`, callback_data: 'voting_tasks' }
                ],
                [{ text: '🎁 Daily Bonus', callback_data: 'daily_bonus' }],
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
          `🗳️ Voting Tasks - Earn by completing voting tasks\n\n` +
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

      case 'admin```python
_add_balance':
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

    // Handle task completion with enhanced verification
    if (data.startsWith('complete_task_')) {
      const taskId = data.split('_')[2];
      const task = advertisements[taskId];

      if (task && task.status === 'active' && !users[userId].completedTasks.includes(taskId)) {
        // Check if budget is exhausted
        if (task.totalSpent + task.cpc > task.totalBudget) {
          // Mark ad as completed and inactive
          advertisements[taskId].status = 'completed';
          saveData();

          bot.answerCallbackQuery(query.id, { 
            text: '❌ This advertisement has reached its budget limit!',
            show_alert: true 
          });

          // Notify advertiser
          if (task.userId && users[task.userId]) {
            bot.sendMessage(task.userId, 
              `⏹️ Advertisement Completed - Budget Exhausted\n\n` +
              `📊 Ad ID: ${taskId}\n` +
              `📝 Title: ${task.title}\n` +
              `💰 Total Spent: ${task.totalSpent.toFixed(6)} ${CONFIG.CURRENCY}\n` +
              `📊 Total Clicks: ${task.totalClicks}\n` +
              `💎 Budget: ${task.totalBudget.toFixed(6)} ${CONFIG.CURRENCY}\n\n` +
              `✅ Your advertisement campaign has been completed successfully!`);
          }
          return;
        }

        // Enhanced verification for channel join tasks
        if (task.type === 'join_channels') {
          const hasJoinedChannel = await checkSpecificChannelMembership(userId, task.link);
          if (!hasJoinedChannel) {
            bot.answerCallbackQuery(query.id, { 
              text: '❌ You must actually join the channel to complete this task!',
              show_alert: true 
            });
            return;
          }
        }

        // Add reward
        users[userId].balance += task.cpc;
        users[userId].totalEarned += task.cpc;
        users[userId].tasksCompleted += 1;
        users[userId].completedTasks.push(taskId);

        // Update ad stats
        advertisements[taskId].totalClicks += 1;
        advertisements[taskId].totalSpent += task.cpc;
        advertisements[taskId].spentToday += task.cpc;

        // Check if budget is now exhausted
        if (advertisements[taskId].totalSpent >= advertisements[taskId].totalBudget) {
          advertisements[taskId].status = 'completed';
        }

        // Give referral bonus to referrer
        if (users[userId].referrerId && users[users[userId].referrerId]) {
          const referralBonus = task.cpc * 0.20; // 20% referral bonus
          users[users[userId].referrerId].balance += referralBonus;
          users[users[userId].referrerId].totalEarned += referralBonus;
          users[users[userId].referrerId].totalReferralEarned = (users[users[userId].referrerId].totalReferralEarned || 0) + referralBonus;

          bot.sendMessage(users[userId].referrerId, 
            `🎉 Referral Bonus!\n\n${users[userId].firstName} completed a task.\n💰 You earned ${referralBonus.toFixed(6)} ${CONFIG.CURRENCY} bonus!`);
        }

        saveData();

        bot.answerCallbackQuery(query.id, { 
          text: `✅ Task complete! Earned ${task.cpc.toFixed(6)} ${CONFIG.CURRENCY}!`,
          show_alert: true 
        });

        // Notify advertiser with detailed stats
        if (task.userId && users[task.userId]) {
          const remainingBudget = task.totalBudget - advertisements[taskId].totalSpent;
          const completionRate = ((advertisements[taskId].totalSpent / task.totalBudget) * 100).toFixed(1);

          bot.sendMessage(task.userId, 
            `📈 New Click on Your Advertisement!\n\n` +
            `📊 Ad ID: ${taskId}\n` +
            `📝 Title: ${task.title}\n` +
            `💰 Cost: ${task.cpc.toFixed(6)} ${CONFIG.CURRENCY}\n` +
            `📊 Total Clicks: ${advertisements[taskId].totalClicks}\n` +
            `💵 Total Spent: ${advertisements[taskId].totalSpent.toFixed(6)} ${CONFIG.CURRENCY}\n` +
            `💎 Remaining Budget: ${remainingBudget.toFixed(6)} ${CONFIG.CURRENCY}\n` +
            `📈 Progress: ${completionRate}%\n` +
            `🟢 Status: ${advertisements[taskId].status}`);
        }
      }
    }

    // Handle quick CPC selection
    if (data.startsWith('set_ad_cpc_')) {
      const cpc = parseFloat(data.split('_')[3]);
      const tempAd = advertisements[`temp_${userId}`];

      if (tempAd && cpc >= CONFIG.MIN_CPC && cpc <= CONFIG.MAX_CPC) {
        tempAd.cpc = cpc;
        userStates[userId] = `creating_ad_${tempAd.type}_temp_budget`;

        const maxBudget = users[userId].balance;
        const estimatedClicks = Math.floor(maxBudget / cpc);

        bot.editMessageText(`💎 Set Total Budget\n\n` +
          `Enter your total advertisement budget:\n\n` +
          `💰 Your Balance: ${maxBudget.toFixed(6)} ${CONFIG.CURRENCY}\n` +
          `💡 CPC Rate: ${cpc.toFixed(6)} ${CONFIG.CURRENCY}\n` +
          `📊 Estimated Clicks: ${estimatedClicks} clicks\n\n` +
          `⚠️ Budget will be deducted from your balance`, {
          chat_id: chatId,
          message_id: query.message?.message_id,
          reply_markup: {
            inline_keyboard: [
              [
                { text: `${cpc.toFixed(3)} ${CONFIG.CURRENCY}`, callback_data: `set_ad_budget_${cpc}` },
                { text: `${(cpc * 10).toFixed(3)} ${CONFIG.CURRENCY}`, callback_data: `set_ad_budget_${cpc * 10}` }
              ],
              [
                { text: `${(cpc * 50).toFixed(3)} ${CONFIG.CURRENCY}`, callback_data: `set_ad_budget_${cpc * 50}` },
                { text: `All Balance`, callback_data: `set_ad_budget_${maxBudget}` }
              ],
              [{ text: '🔙 Back', callback_data: 'advertise' }]
            ]
          }
        });
      }
    }

    // Handle quick budget selection
    if (data.startsWith('set_ad_budget_')) {
      const budget = parseFloat(data.split('_')[3]);
      const tempAd = advertisements[`temp_${userId}`];

      if (tempAd && budget > 0 && budget <= users[userId].balance && budget >= tempAd.cpc) {
        // Create the advertisement
        const adId = Date.now().toString();
        const estimatedClicks = Math.floor(budget / tempAd.cpc);

        advertisements[adId] = {
          id: adId,
          userId,
          title: tempAd.title,
          description: tempAd.description,
          link: tempAd.link,
          type: tempAd.type === 'channel' ? 'join_channels' : 
                tempAd.type === 'site' ? 'site_visits' : 'join_bots',
          cpc: tempAd.cpc,
          totalBudget: budget,
          totalSpent: 0,
          totalClicks: 0,
          status: 'active',
          createdAt: new Date().toISOString(),
          dailyBudget: budget,
          spentToday: 0
        };

        // Deduct budget from user balance
        users[userId].balance -= budget;
        users[userId].adsCreated = (users[userId].adsCreated || 0) + 1;

        // Clean up temp data
        delete advertisements[`temp_${userId}`];
        delete userStates[userId];

        saveData();

        const reminderMessage = tempAd.type === 'channel' ? 
          `\n\n⚠️ IMPORTANT REMINDER:\nYou must add ${CONFIG.BOT_USERNAME} as admin to your channel for task verification to work properly!` : '';

        bot.editMessageText(`✅ Advertisement Created Successfully!\n\n` +
          `📊 Ad ID: ${adId}\n` +
          `📝 Title: ${tempAd.title}\n` +
          `💰 CPC: ${tempAd.cpc.toFixed(6)} ${CONFIG.CURRENCY}\n` +
          `💎 Budget: ${budget.toFixed(6)} ${CONFIG.CURRENCY}\n` +
          `📈 Estimated Clicks: ${estimatedClicks}\n` +
          `🎯 Type: ${tempAd.type}\n` +
          `🟢 Status: Active\n\n` +
          `💰 Remaining Balance: ${users[userId].balance.toFixed(6)} ${CONFIG.CURRENCY}\n\n` +
          `🚀 Your ad is now live and will be shown to users!${reminderMessage}`, {
          chat_id: chatId,
          message_id: query.message?.message_id,
          reply_markup: {
            inline_keyboard: [
              [
                { text: '📈 My Ads', callback_data: 'my_ads' },
                { text: '📊 Create More', callback_data: 'advertise' }
              ],
              [{ text: '🏠 Main Menu', callback_data: 'back_to_main' }]
            ]
          }
        });

        // Notify admin
        bot.sendMessage(ADMIN_ID, 
          `📢 New Advertisement Created - ${CONFIG.BOT_NAME}\n\n` +
          `👤 User: ${users[userId].firstName} (@${users[userId].username || 'no username'})\n` +
          `🆔 User ID: ${userId}\n` +
          `📊 Ad ID: ${adId}\n` +
          `📝 Title: ${tempAd.title}\n` +
          `🎯 Type: ${tempAd.type}\n` +
          `💰 CPC: ${tempAd.cpc.toFixed(6)} ${CONFIG.CURRENCY}\n` +
          `💎 Budget: ${budget.toFixed(6)} ${CONFIG.CURRENCY}\n` +
          `📈 Estimated Clicks: ${estimatedClicks}\n` +
          `📅 Created: ${new Date().toLocaleString()}`);
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
```python
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

    // Handle voting proof submission
    else if (userState && userState.startsWith('awaiting_voting_proof_')) {
      const taskId = userState.split('_')[3];
      const task = advertisements[taskId];

      if (task && task.status === 'active') {
        // Auto-approve voting task
        users[userId].balance += task.cpc;
        users[userId].totalEarned += task.cpc;
        users[userId].tasksCompleted += 1;
        users[userId].completedTasks.push(taskId);

        // Update ad stats
        advertisements[taskId].totalClicks += 1;
        advertisements[taskId].totalSpent += task.cpc;
        advertisements[taskId].spentToday += task.cpc;

        // Add admin commission
        if (!users[ADMIN_ID]) {
          users[ADMIN_ID] = {
            id: ADMIN_ID,
            username: 'Owner_Anas1',
            firstName: 'Bot Owner',
            balance: 0,
            referrals: 0,
            referrerId: null,
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
        }

        users[ADMIN_ID].balance += CONFIG.ADMIN_COMMISSION;
        users[ADMIN_ID].totalEarned += CONFIG.ADMIN_COMMISSION;

        // Check if budget is exhausted
        if (advertisements[taskId].totalSpent >= advertisements[taskId].totalBudget) {
          advertisements[taskId].status = 'completed';
        }

        // Give referral bonus
        if (users[userId].referrerId && users[users[userId].referrerId]) {
          const referralBonus = task.cpc * 0.20;
          users[users[userId].referrerId].balance += referralBonus;
          users[users[userId].referrerId].totalEarned += referralBonus;
          users[users[userId].referrerId].totalReferralEarned = (users[users[userId].referrerId].totalReferralEarned || 0) + referralBonus;

          bot.sendMessage(users[userId].referrerId, 
            `🎉 Referral Bonus!\n\n${users[userId].firstName} completed a voting task.\n💰 You earned ${referralBonus.toFixed(6)} ${CONFIG.CURRENCY} bonus!`);
        }

        delete userStates[userId];
        saveData();

        bot.sendMessage(chatId, 
          `✅ Voting Task Completed & Auto-Verified!\n\n` +
          `🗳️ Task: ${task.title}\n` +
          `💰 Reward: ${task.cpc.toFixed(6)} ${CONFIG.CURRENCY}\n` +
          `💎 New Balance: ${users[userId].balance.toFixed(6)} ${CONFIG.CURRENCY}\n\n` +
          `⚡ Auto-verification successful!\n` +
          `🎯 Admin Commission: ${CONFIG.ADMIN_COMMISSION.toFixed(6)} ${CONFIG.CURRENCY}`,
          {
            reply_markup: {
              inline_keyboard: [
                [
                  { text: '🗳️ More Voting Tasks', callback_data: 'voting_tasks' },
                  { text: '💰 Balance', callback_data: 'balance' }
                ],
                [{ text: '🏠 Main Menu', callback_data: 'back_to_main' }]
              ]
            }
          });

        // Notify task owner
        if (task.userId && users[task.userId]) {
          const remainingBudget = task.totalBudget - advertisements[taskId].totalSpent;

          bot.sendMessage(task.userId, 
            `📈 New Vote on Your Task!\n\n` +
            `🗳️ Task: ${task.title}\n` +
            `💰 Cost: ${task.cpc.toFixed(6)} ${CONFIG.CURRENCY}\n` +
            `📊 Total Votes: ${advertisements[taskId].totalClicks}\n` +
            `💵 Total Spent: ${advertisements[taskId].totalSpent.toFixed(6)} ${CONFIG.CURRENCY}\n` +
            `💎 Remaining Budget: ${remainingBudget.toFixed(6)} ${CONFIG.CURRENCY}\n` +
            `✅ Auto-verified completion`);
        }

        // Notify admin about commission
        bot.sendMessage(ADMIN_ID, 
          `💰 Commission Earned!\n\n` +
          `🗳️ Voting task completed by ${users[userId].firstName}\n` +
          `💵 Commission: ${CONFIG.ADMIN_COMMISSION.toFixed(6)} ${CONFIG.CURRENCY}\n` +
          `💎 Total Balance: ${users[ADMIN_ID].balance.toFixed(6)} ${CONFIG.CURRENCY}\n` +
          `📈 Total Earned: ${users[ADMIN_ID].totalEarned.toFixed(6)} ${CONFIG.CURRENCY}`);
      }
    }

    // Handle advertisement creation handlers
    else if (userState && userState.startsWith('creating_ad_')) {
      const adType = userState.split('_')[2]; // channel, site, bot, voting
      const step = userState.split('_')[4]; // title, description, link, cpc, budget

      // Handle title input
      if (step === 'title') {
        if (!text || text.length > 50) {
          return bot.sendMessage(chatId, '❌ Title must be 1-50 characters long. Please try again.');
        }

        userStates[userId] = `creating_ad_${adType}_temp_description`;
        advertisements[`temp_${userId}`] = { title: text, type: adType };

        bot.sendMessage(chatId, 
          `📝 Advertisement Description\n\n` +
          `Enter a detailed description for your advertisement:\n\n` +
          `💡 Example: "Join our channel for daily crypto signals and trading tips!"\n` +
          `📏 Maximum 200 characters\n\n` +
          `⚠️ Make it attractive and informative`,
          {
            reply_markup: {
              inline_keyboard: [
                [{ text: '🔙 Back', callback_data: 'advertise' }]
              ]
            }
          });
      }

      // Handle description input
      else if (step === 'description') {
        if (!text || text.length > 200) {
          return bot.sendMessage(chatId, '❌ Description must be 1-200 characters long. Please try again.');
        }

        advertisements[`temp_${userId}`].description = text;
        userStates[userId] = `creating_ad_${adType}_temp_link`;

        const linkType = adType === 'channel' ? 'channel' : adType === 'site' ? 'website' : adType === 'voting' ? 'voting' : 'bot';
        const linkExample = adType === 'channel' ? 'https://t.me/yourchannel' : 
                           adType === 'site' ? 'https://yourwebsite.com' : adType === 'voting' ? 'https://example.com/vote' : 'https://t.me/yourbot';

        const channelReminder = adType === 'channel' ? 
          `\n\n⚠️ IMPORTANT: After creating this ad, you must add ${CONFIG.BOT_USERNAME} as admin to your channel!` : '';

        bot.sendMessage(chatId, 
          `🔗 ${linkType.charAt(0).toUpperCase() + linkType.slice(1)} Link\n\n` +
          `Enter your ${linkType} link:\n\n` +
          `💡 Example: ${linkExample}\n\n` +
          `⚠️ Make sure the link is working and accessible${channelReminder}`,
          {
            reply_markup: {
              inline_keyboard: [
                [{ text: '🔙 Back', callback_data: 'advertise' }]
              ]
            }
          });
      }

      // Handle link input
      else if (step === 'link') {
        if (!text || !text.startsWith('http')) {
          return bot.sendMessage(chatId, '❌ Please enter a valid URL starting with http:// or https://');
        }

        advertisements[`temp_${userId}`].link = text;
        userStates[userId] = `creating_ad_${adType}_temp_cpc`;

        bot.sendMessage(chatId, 
          `💰 Set CPC (Cost Per Click)\n\n` +
          `Enter CPC rate (${CONFIG.MIN_CPC} - ${CONFIG.MAX_CPC} ${CONFIG.CURRENCY}):\n\n` +
          `💡 Higher CPC = More visibility\n` +
          `📊 Example: 0.01 (1 cent per click)\n\n` +
          `💰 Your Balance: ${users[userId].balance.toFixed(6)} ${CONFIG.CURRENCY}`,
          {
            reply_markup: {
              inline_keyboard: [
                [
                  { text: `${CONFIG.MIN_CPC} ${CONFIG.CURRENCY}`, callback_data: `set_ad_cpc_${CONFIG.MIN_CPC}` },
                  { text: `0.01 ${CONFIG.CURRENCY}`, callback_data: `set_ad_cpc_0.01` }
                ],
                [
                  { text: `0.02 ${CONFIG.CURRENCY}`, callback_data: `set_ad_cpc_0.02` },
                  { text: `0.05 ${CONFIG.CURRENCY}`, callback_data: `set_ad_cpc_0.05` }
                ],
                [{ text: '🔙 Back', callback_data: 'advertise' }]
              ]
            }
          });
      }

      // Handle CPC input
      else if (step === 'cpc') {
        const cpc = parseFloat(text);
        if (isNaN(cpc) || cpc < CONFIG.MIN_CPC || cpc > CONFIG.MAX_CPC) {
          return bot.sendMessage(chatId, 
            `❌ Invalid CPC rate.\n\nPlease enter a number between ${CONFIG.MIN_CPC} and ${CONFIG.MAX_CPC} ${CONFIG.CURRENCY}`);
        }

        advertisements[`temp_${userId}`].cpc = cpc;
        userStates[userId] = `creating_ad_${adType}_temp_budget`;

        const maxBudget = users[userId].balance;
        const estimatedClicks = Math.floor(maxBudget / cpc);

        bot.sendMessage(chatId, 
          `💎 Set Total Budget\n\n` +
          `Enter your total advertisement budget:\n\n` +
          `💰 Your Balance: ${maxBudget.toFixed(6)} ${CONFIG.CURRENCY}\n` +
          `💡 CPC Rate: ${cpc.toFixed(6)} ${CONFIG.CURRENCY}\n` +
          `📊 Estimated Clicks: ${estimatedClicks} clicks\n\n` +
          `⚠️ Budget will be deducted from your balance`,
          {
            reply_markup: {
              inline_keyboard: [
                [
                  { text: `${cpc.toFixed(3)} ${CONFIG.CURRENCY}`, callback_data: `set_ad_budget_${cpc}` },
                  { text: `${(cpc * 10).toFixed(3)} ${CONFIG.CURRENCY}`, callback_data: `set_ad_budget_${cpc * 10}` }
                ],
                [
                  { text: `${(cpc * 50).toFixed(3)} ${CONFIG.CURRENCY}`, callback_data: `set_ad_budget_${cpc * 50}` },
                  { text: `All Balance`, callback_data: `set_ad_budget_${maxBudget}` }
                ],
                [{ text: '🔙 Back', callback_data: 'advertise' }]
              ]
            }
          });
      }

      // Handle budget input
      else if (step === 'budget') {
        const budget = parseFloat(text);
        const tempAd = advertisements[`temp_${userId}`];

        if (isNaN(budget) || budget <= 0 || budget > users[userId].balance) {
          return bot.sendMessage(chatId, 
            `❌ Invalid budget.\n\nPlease enter a valid amount (0.001 - ${users[userId].balance.toFixed(6)} ${CONFIG.CURRENCY})`);
        }

        if (budget < tempAd.cpc) {
          return bot.sendMessage(chatId, 
            `❌ Budget must be at least ${tempAd.cpc.toFixed(6)} ${CONFIG.CURRENCY} (1 click)\n\nPlease enter a higher amount.`);
        }

        // Create the advertisement
        const adId = Date.now().toString();
        const estimatedClicks = Math.floor(budget / tempAd.cpc);

        advertisements[adId] = {
          id: adId,
          userId,
          title: tempAd.title,
          description: tempAd.description,
          link: tempAd.link,
          type: tempAd.type === 'channel' ? 'join_channels' : 
                tempAd.type === 'site' ? 'site_visits' : 
                tempAd.type === 'voting' ? 'voting_tasks' : 'join_bots',
          cpc: tempAd.cpc,
          totalBudget: budget,
          totalSpent: 0,
          totalClicks: 0,
          status: 'active',
          createdAt: new Date().toISOString(),
          dailyBudget: budget,
          spentToday: 0
        };

        // Deduct budget from user balance
        users[userId].balance -= budget;
        users[userId].adsCreated = (users[userId].adsCreated || 0) + 1;

        // Clean up temp data
        delete advertisements[`temp_${userId}`];
        delete userStates[userId];

        saveData();

        const reminderMessage = tempAd.type === 'channel' ? 
          `\n\n⚠️ IMPORTANT REMINDER:\nYou must add ${CONFIG.BOT_USERNAME} as admin to your channel for task verification to work properly!` : '';

        bot.sendMessage(chatId, 
          `✅ Advertisement Created Successfully!\n\n` +
          `📊 Ad ID: ${adId}\n` +
          `📝 Title: ${tempAd.title}\n` +
          `💰 CPC: ${tempAd.cpc.toFixed(6)} ${CONFIG.CURRENCY}\n` +
          `💎 Budget: ${budget.toFixed(6)} ${CONFIG.CURRENCY}\n` +
          `📈 Estimated Clicks: ${estimatedClicks}\n` +
          `🎯 Type: ${tempAd.type}\n` +
          `🟢 Status: Active\n\n` +
          `💰 Remaining Balance: ${users[userId].balance.toFixed(6)} ${CONFIG.CURRENCY}\n\n` +
          `🚀 Your ad is now live and will be shown to users!${reminderMessage}`,
          {
            reply_markup: {
              inline_keyboard: [
                [
                  { text: '📈 My Ads', callback_data: 'my_ads' },
                  { text: '📊 Create More', callback_data: 'advertise' }
                ],
                [{ text: '🏠 Main Menu', callback_data: 'back_to_main' }]
              ]
            }
          });

        // Notify admin
        bot.sendMessage(ADMIN_ID, 
          `📢 New Advertisement Created - ${CONFIG.BOT_NAME}\n\n` +
          `👤 User: ${users[userId].firstName} (@${users[userId].username || 'no username'})\n` +
          `🆔 User ID: ${userId}\n` +
          `📊 Ad ID: ${adId}\n` +
          `📝 Title: ${tempAd.title}\n` +
          `🎯 Type: ${tempAd.type}\n` +
          `💰 CPC: ${tempAd.cpc.toFixed(6)} ${CONFIG.CURRENCY}\n` +
          `💎 Budget: ${budget.toFixed(6)} ${CONFIG.CURRENCY}\n` +
          `📈 Estimated Clicks: ${estimatedClicks}\n` +
          `📅 Created: ${new Date().toLocaleString()}`);
      }
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

// Handle callback queries
bot.on('callback_query', async (query) => {
  const chatId = query.message?.chat.id!;
  const userId = query.from.id;
  const data = query.data;

  if (!users[userId] && !data?.startsWith('check_membership')) {
    return bot.answerCallbackQuery(query.id, { text: 'Please start the bot first with /start' });
  }

  try {
     if (data.startsWith('complete_voting_task_')) {
      const taskId = data.split('_')[3]; // Extract task ID
      userStates[userId] = `awaiting_voting_proof_${taskId}`;

      bot.answerCallbackQuery(query.id, {
        text: '✅ Task completion initiated! Please wait for auto-verification...',
        show_alert: true
      });
    }

    switch (data) {
      case 'check_membership':
      case (data?.match(/^check_membership_/) || {}).input:
        const referrerIdFromCallback = data.includes('_') ? data.split('_')[2] : null;
        const referrerId = referrerIdFromCallback !== 'none' ? parseInt(referrerIdFromCallback) : null;

        const hasJoined = await checkChannelMembership(userId);
        if (hasJoined) {
          bot.answerCallbackQuery(query.id, { text: '✅ Membership confirmed!' });

          // Register user now with referral
          if (!users[userId]) {
            const username = query.from.username || '';
            const firstName = query.from.first_name || 'User';

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
              users[referrerId].totalReferralEarned = (users[referrerId].totalReferralEarned || 0) + CONFIG.REF_BONUS;

              // Notify referrer
              bot.sendMessage(referrerId, 
                `🎉 New Referral Joined!\n\n` +
                `👤 ${firstName} joined using your link\n` +
                `💰 You earned ${CONFIG.REF_BONUS} ${CONFIG.CURRENCY} bonus!\n\n` +
                `🔗 Keep referring to earn more!`);
            }

            saveData();
          }

          setTimeout(() => {
            const welcomeMessage = `🎉 Welcome ${query.from.first_name}!\n` +
              `💎 Welcome to ${CONFIG.BOT_NAME} CPC Platform\n\n` +
              `💰 Your Balance: ${users[userId].balance.toFixed(6)} ${CONFIG.CURRENCY}\n` +
              `👥 Referrals: ${users[userId].referrals} people\n` +
              `🎯 Completed Tasks: ${users[userId].tasksCompleted} tasks\n\n` +
              `🚀 Easy ways to earn money:\n\n` +
              `🌐 Visit Sites - Earn by visiting websites\n` +
              `👥 Join Channels - Earn by joining channels\n` +
              `🤖 Join Bots - Earn by joining bots\n` +
              `🗳️ Voting Tasks - Earn by completing voting tasks\n\n` +
              `📊 Create your own advertisements to grow your business!`;

            bot.editMessageText(welcomeMessage, {
              chat_id: chatId,
              message_id: query.message?.message_id,
              ...getMainKeyboard()
            });
          }, 1000);
        } else {
          bot.answerCallbackQuery(query.id, { text: '❌ Please join all channels first!' });
        }
        break;
         case 'ad_voting_tasks':
        if (users[userId].balance < CONFIG.MIN_BUDGET) {
          bot.answerCallbackQuery(query.id, { 
            text: `❌ Minimum balance required: ${CONFIG.MIN_BUDGET} ${CONFIG.CURRENCY}`,
            show_alert: true 
          });
        } else {
          userStates[userId] = 'creating_ad_voting_tasks_title';
          bot.editMessageText(`🗳️ Create Voting Tasks Advertisement\n\n` +
            `📝 Enter advertisement title:\n\n` +
            `💡 Example: "Vote for our project and get reward!"\n` +
            `📏 Maximum 50 characters\n\n` +
            `⚠️ Make sure your title is attractive and clear`, {
            chat_id: chatId,
            message_id: query.message?.message_id,
            reply_markup: {
              inline_keyboard: [
                [{ text: '🔙 Back', callback_data: 'advertise' }]
              ]
            }
          });
        }
        break;
  }
   } catch (error) {
    console.error('Error handling callback query:', error);
    bot.answerCallbackQuery(query.id, { text: 'An error occurred. Please try again.' });
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