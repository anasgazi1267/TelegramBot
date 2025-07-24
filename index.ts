
import TelegramBot from 'node-telegram-bot-api';
import * as fs from 'fs';
import * as path from 'path';

// Bot Configuration
const BOT_TOKEN = '7887918168:AAEpThFn3nIzg62w16hQwp43Lo-FXFRSwWw';
const ADMIN_ID = 7391363898;
const REQUIRED_CHANNELS = [
  '@AnasEarnHunter',
  '@ExpossDark', 
  '@Anas_Promotion',
  '@givwas'
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
  PAYEER_ID: 'P1102512228'
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
      const member = await bot.getChatMember(channel, userId);
      if (member.status === 'left' || member.status === 'kicked') {
        return false;
      }
    }
    return true;
  } catch (error) {
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
          { text: '🤖 Bot', callback_data: 'ad_bot' }
        ],
        [
          { text: '📊 Post Views', callback_data: 'ad_post_views' },
          { text: '🔗 Link Visits', callback_data: 'ad_link_visits' }
        ],
        [
          { text: '🐦 Twitter Engagement', callback_data: 'ad_twitter' }
        ],
        [
          { text: '🔙 Back', callback_data: 'back_to_main' }
        ]
      ]
    }
  };
};

// More tasks keyboard
const getMoreTasksKeyboard = () => {
  return {
    reply_markup: {
      inline_keyboard: [
        [
          { text: '📊 TG Post Views', callback_data: 'tg_post_views' },
          { text: '🐦 Twitter Raids', callback_data: 'twitter_raids' }
        ],
        [
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
        ]
      ]
    }
  };
};

// Handle /start command
bot.onText(/\/start(.*)/, async (msg, match) => {
  const chatId = msg.chat.id;
  const userId = msg.from?.id!;
  const username = msg.from?.username || 'Unknown';
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
      completedTasks: []
    };

    // Give referral bonus
    if (referrerId && users[referrerId]) {
      users[referrerId].balance += CONFIG.REF_BONUS;
      users[referrerId].referrals += 1;
      users[referrerId].totalEarned += CONFIG.REF_BONUS;
      
      // Notify referrer
      bot.sendMessage(referrerId, 
        `🎉 New referral! ${firstName} joined using your link.\n` +
        `💰 You earned ${CONFIG.REF_BONUS} ${CONFIG.CURRENCY}!`
      );

      // Notify admin
      bot.sendMessage(ADMIN_ID, 
        `🆕 New User Alert!\n\n` +
        `👤 User: ${firstName} (@${username})\n` +
        `🆔 ID: ${userId}\n` +
        `👥 Referred by: ${users[referrerId].firstName} (${referrerId})\n` +
        `💰 Referral bonus: ${CONFIG.REF_BONUS} ${CONFIG.CURRENCY}`
      );
    } else {
      // Notify admin of new user without referrer
      bot.sendMessage(ADMIN_ID, 
        `🆕 New User Alert!\n\n` +
        `👤 User: ${firstName} (@${username})\n` +
        `🆔 ID: ${userId}\n` +
        `👥 No referrer`
      );
    }

    saveData();
  }

  const welcomeMessage = `🎉 Welcome ${firstName}!\n\n` +
    `💰 Balance: ${users[userId].balance.toFixed(4)} ${CONFIG.CURRENCY}\n` +
    `👥 Referrals: ${users[userId].referrals}\n\n` +
    `Earn by completing simple tasks:\n\n` +
    `📱 Visit Sites - Earn by clicking links\n` +
    `👥 Join Channels - Earn by joining chats\n` +
    `🤖 Join Bots - Earn by talking to bots\n` +
    `😄 More - TG Post Views, Twitter Raids\n\n` +
    `You can also create your own ads with /advertise\n\n` +
    `Use the /help command or read @ClickBeeFAQ for more info`;

  bot.sendMessage(chatId, welcomeMessage, getMainKeyboard());
});

// Handle admin command
bot.onText(/\/admin/, (msg) => {
  const chatId = msg.chat.id;
  const userId = msg.from?.id!;

  if (userId !== ADMIN_ID) {
    return bot.sendMessage(chatId, '❌ Access denied');
  }

  const totalUsers = Object.keys(users).length;
  const pendingDeposits = Object.values(deposits).filter((d: any) => d.status === 'pending').length;
  const pendingWithdrawals = Object.values(withdrawals).filter((w: any) => w.status === 'pending').length;
  const pendingAds = Object.values(advertisements).filter((a: any) => a.status === 'pending').length;

  const adminMessage = `👑 Admin Panel\n\n` +
    `📊 Statistics:\n` +
    `👥 Total Users: ${totalUsers}\n` +
    `💳 Pending Deposits: ${pendingDeposits}\n` +
    `🏧 Pending Withdrawals: ${pendingWithdrawals}\n` +
    `📢 Pending Ads: ${pendingAds}`;

  bot.sendMessage(chatId, adminMessage, getAdminKeyboard());
});

// Handle all commands
bot.onText(/\/(help|balance|withdraw|referrals|airdrop|premium|advertise)/, (msg, match) => {
  const chatId = msg.chat.id;
  const userId = msg.from?.id!;
  const command = match?.[1];

  if (!users[userId]) {
    return bot.sendMessage(chatId, 'Please start the bot first with /start');
  }

  switch (command) {
    case 'help':
      const helpMessage = `Here are all my commands:\n\n` +
        `/start - Show the main menu\n` +
        `/advertise - Create or manage your ads\n` +
        `/balance - Show your balance\n` +
        `/withdraw - Withdraw balance\n` +
        `/referrals - Referral details\n` +
        `/airdrop - ClickBee Token Airdrop\n` +
        `/premium - ClickBee Premium 💎\n` +
        `/help - Show help\n\n` +
        `Visit our FAQ channel for more info.\n\n` +
        `📊 Statistics\n` +
        `🔢 Total: ${Object.keys(users).length} users\n` +
        `🆕 New(last 24 hours): ${Object.values(users).filter((u: any) => {
          const joinDate = new Date(u.joinedAt);
          const now = new Date();
          return (now.getTime() - joinDate.getTime()) < 24 * 60 * 60 * 1000;
        }).length} users\n\n` +
        `Join our official channel at @AnasEarnHunter\n` +
        `👥 Join the talks at @AnasEarningDisc\n` +
        `& for technical support contact @Owner_Anas1📞`;
      
      bot.sendMessage(chatId, helpMessage, {
        reply_markup: {
          inline_keyboard: [
            [
              { text: '🪙 ClickBee Token', callback_data: 'clickbee_token' },
              { text: '💎 Premium', callback_data: 'premium' }
            ],
            [
              { text: '⚙️ Settings', callback_data: 'settings' }
            ],
            [
              { text: '🔙 Back', callback_data: 'back_to_main' }
            ]
          ]
        }
      });
      break;

    case 'balance':
      const balanceMessage = `💰 Account Details:\n\n` +
        `💎 Balance\n${users[userId].balance.toFixed(4)} ${CONFIG.CURRENCY}\n\n` +
        `💎 Available for payout\n${users[userId].balance.toFixed(4)} ${CONFIG.CURRENCY}\n\n` +
        `Click « Open Wallet » to access your wallet:`;
      
      bot.sendMessage(chatId, balanceMessage, {
        reply_markup: {
          inline_keyboard: [
            [
              { text: '🌸 Open Wallet 🌸', callback_data: 'open_wallet' }
            ]
          ]
        }
      });
      break;

    case 'referrals':
      const refMessage = `👥 Referrals\n\n` +
        `🔍 You currently have ${users[userId].referrals} referrals.\n\n` +
        `💰 You will earn 20% of your friend's earnings from tasks and 5% if they create ads.\n\n` +
        `Send this unique invite link to your friends:\n` +
        `${generateReferralLink(userId)}\n\n` +
        `• You can withdraw referral income to an external wallet or spend it on ads.`;
      
      bot.sendMessage(chatId, refMessage, {
        reply_markup: {
          inline_keyboard: [
            [
              { text: '📊 View User Stats', callback_data: 'user_stats' }
            ],
            [
              { text: 'Share ➡️', callback_data: 'share_referral' }
            ]
          ]
        }
      });
      break;

    case 'advertise':
      bot.sendMessage(chatId, `📊 Advertise 📊\n\nWhat would you like to promote?\n\nChoose an option below... 👇`, getAdvertiseKeyboard());
      break;
  }
});

// Handle callback queries
bot.on('callback_query', async (query) => {
  const chatId = query.message?.chat.id!;
  const userId = query.from.id;
  const data = query.data;
  
  if (!users[userId] && data !== 'check_membership') {
    return bot.answerCallbackQuery(query.id, { text: 'Please start the bot first with /start' });
  }

  switch (data) {
    case 'check_membership':
      const hasJoined = await checkChannelMembership(userId);
      if (hasJoined) {
        bot.answerCallbackQuery(query.id, { text: '✅ Membership verified!' });
        bot.sendMessage(chatId, '/start');
      } else {
        bot.answerCallbackQuery(query.id, { text: '❌ Please join all channels first!' });
      }
      break;

    case 'balance':
      const balanceMessage = `💰 Your Balance\n\n` +
        `💵 Current: ${users[userId].balance.toFixed(4)} ${CONFIG.CURRENCY}\n` +
        `📈 Total Earned: ${users[userId].totalEarned.toFixed(4)} ${CONFIG.CURRENCY}\n` +
        `✅ Tasks Completed: ${users[userId].tasksCompleted}`;
      bot.editMessageText(balanceMessage, {
        chat_id: chatId,
        message_id: query.message?.message_id,
        reply_markup: {
          inline_keyboard: [
            [{ text: '🔙 Back', callback_data: 'back_to_main' }]
          ]
        }
      });
      break;

    case 'referrals':
      const refMessage = `👥 Referral Stats\n\n` +
        `👤 Total Referrals: ${users[userId].referrals}\n` +
        `💰 Bonus per referral: ${CONFIG.REF_BONUS} ${CONFIG.CURRENCY}\n` +
        `💵 Total from referrals: ${(users[userId].referrals * CONFIG.REF_BONUS).toFixed(4)} ${CONFIG.CURRENCY}\n\n` +
        `🔗 Your referral link:\n${generateReferralLink(userId)}`;
      bot.editMessageText(refMessage, {
        chat_id: chatId,
        message_id: query.message?.message_id,
        reply_markup: {
          inline_keyboard: [
            [{ text: '🔙 Back', callback_data: 'back_to_main' }]
          ]
        }
      });
      break;

    case 'deposit':
      const depositMessage = `💳 Deposit ${CONFIG.CURRENCY}\n\n` +
        `💰 Minimum: ${CONFIG.MIN_DEPOSIT} ${CONFIG.CURRENCY}\n` +
        `💰 Maximum: ${CONFIG.MAX_DEPOSIT} ${CONFIG.CURRENCY}\n\n` +
        `Choose your payment method:`;
      bot.editMessageText(depositMessage, {
        chat_id: chatId,
        message_id: query.message?.message_id,
        ...getDepositMethodsKeyboard()
      });
      break;

    case 'deposit_binance':
      userStates[userId] = 'awaiting_deposit_amount_binance';
      bot.editMessageText(`🟡 Binance Pay Deposit\n\n` +
        `💰 Enter deposit amount (${CONFIG.MIN_DEPOSIT} - ${CONFIG.MAX_DEPOSIT} ${CONFIG.CURRENCY}):\n\n` +
        `💡 Send the amount as a number (e.g., 10.50)`, {
        chat_id: chatId,
        message_id: query.message?.message_id,
        reply_markup: {
          inline_keyboard: [
            [{ text: '🔙 Back', callback_data: 'deposit' }]
          ]
        }
      });
      break;

    case 'deposit_payeer':
      userStates[userId] = 'awaiting_deposit_amount_payeer';
      bot.editMessageText(`🔵 Payeer Deposit\n\n` +
        `💰 Enter deposit amount (${CONFIG.MIN_DEPOSIT} - ${CONFIG.MAX_DEPOSIT} ${CONFIG.CURRENCY}):\n\n` +
        `💡 Send the amount as a number (e.g., 10.50)`, {
        chat_id: chatId,
        message_id: query.message?.message_id,
        reply_markup: {
          inline_keyboard: [
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
          `💰 Available: ${users[userId].balance.toFixed(4)} ${CONFIG.CURRENCY}\n` +
          `💰 Minimum: ${CONFIG.MIN_WITHDRAW} ${CONFIG.CURRENCY}\n` +
          `💰 Maximum: ${CONFIG.MAX_WITHDRAW} ${CONFIG.CURRENCY}\n\n` +
          `Choose your payment method:`;
        bot.editMessageText(withdrawMsg, {
          chat_id: chatId,
          message_id: query.message?.message_id,
          ...getWithdrawMethodsKeyboard()
        });
      }
      break;

    case 'withdraw_binance':
      userStates[userId] = 'awaiting_withdraw_amount_binance';
      bot.editMessageText(`🟡 Binance Pay Withdrawal\n\n` +
        `💰 Available: ${users[userId].balance.toFixed(4)} ${CONFIG.CURRENCY}\n` +
        `💰 Enter withdrawal amount (${CONFIG.MIN_WITHDRAW} - ${Math.min(CONFIG.MAX_WITHDRAW, users[userId].balance).toFixed(4)} ${CONFIG.CURRENCY}):\n\n` +
        `💡 Send the amount as a number (e.g., 10.50)`, {
        chat_id: chatId,
        message_id: query.message?.message_id,
        reply_markup: {
          inline_keyboard: [
            [{ text: '🔙 Back', callback_data: 'withdraw' }]
          ]
        }
      });
      break;

    case 'withdraw_payeer':
      userStates[userId] = 'awaiting_withdraw_amount_payeer';
      bot.editMessageText(`🔵 Payeer Withdrawal\n\n` +
        `💰 Available: ${users[userId].balance.toFixed(4)} ${CONFIG.CURRENCY}\n` +
        `💰 Enter withdrawal amount (${CONFIG.MIN_WITHDRAW} - ${Math.min(CONFIG.MAX_WITHDRAW, users[userId].balance).toFixed(4)} ${CONFIG.CURRENCY}):\n\n` +
        `💡 Send the amount as a number (e.g., 10.50)`, {
        chat_id: chatId,
        message_id: query.message?.message_id,
        reply_markup: {
          inline_keyboard: [
            [{ text: '🔙 Back', callback_data: 'withdraw' }]
          ]
        }
      });
      break;

    case 'visit_sites':
      // Sample task
      const siteTaskMessage = `Hassle-Free Bitcoin Mining on the Cloud without technical expertise or big investments! 📈\n\n` +
        `_________________________\n\n` +
        `👆 Mission: Engage with this website.\n\n` +
        `❓ Press « 🌐 Open Link » and browse the website.\n\n` +
        `💰 Reward: ${(Math.random() * 0.01 + 0.001).toFixed(4)} ${CONFIG.CURRENCY}`;
      
      bot.editMessageText(siteTaskMessage, {
        chat_id: chatId,
        message_id: query.message?.message_id,
        reply_markup: {
          inline_keyboard: [
            [
              { text: '⏭️ Skip', callback_data: 'skip_task' },
              { text: '🌐 Open Link 🌐', callback_data: 'open_link' }
            ],
            [
              { text: '🔙 Back', callback_data: 'back_to_main' }
            ]
          ]
        }
      });
      break;

    case 'join_channels':
      bot.editMessageText(`❌ Oh no! There are NO TASKS available at the moment. Please check back later! 🔄\n\nYou can promote your own channels, groups, or bots with /advertise.`, {
        chat_id: chatId,
        message_id: query.message?.message_id,
        reply_markup: {
          inline_keyboard: [
            [
              { text: '➕ Create New Ad ➕', callback_data: 'create_ad' }
            ],
            [
              { text: '🔙 Back', callback_data: 'back_to_main' }
            ]
          ]
        }
      });
      break;

    case 'join_bots':
      bot.editMessageText(`❌ Oh no! There are NO TASKS available at the moment. Please check back later! 🔄\n\nYou can promote your own channels, groups, or bots with /advertise.`, {
        chat_id: chatId,
        message_id: query.message?.message_id,
        reply_markup: {
          inline_keyboard: [
            [
              { text: '➕ Create New Ad ➕', callback_data: 'create_ad' }
            ],
            [
              { text: '🔙 Back', callback_data: 'back_to_main' }
            ]
          ]
        }
      });
      break;

    case 'more_tasks':
      bot.editMessageText(`😄 More Tasks\n\nChoose a task category:`, {
        chat_id: chatId,
        message_id: query.message?.message_id,
        ...getMoreTasksKeyboard()
      });
      break;

    case 'advertise':
      bot.editMessageText(`📊 Advertise 📊\n\nWhat would you like to promote?\n\nChoose an option below... 👇`, {
        chat_id: chatId,
        message_id: query.message?.message_id,
        ...getAdvertiseKeyboard()
      });
      break;

    case 'ad_channel_members':
      userStates[userId] = 'awaiting_channel_link';
      bot.editMessageText(`🔗 Send the PUBLIC LINK of your channel/group\n\n` +
        `ℹ️ Please make sure the link starts with https://t.me/.\n` +
        `ℹ️ Alternatively, you can share the @username (including @.....)\n\n` +
        `Members will join your channels or groups immediately after you activate this ad!\n\n` +
        `👇 Send the link to your channel or group now.`, {
        chat_id: chatId,
        message_id: query.message?.message_id,
        reply_markup: {
          inline_keyboard: [
            [{ text: '🔙 Back', callback_data: 'advertise' }]
          ]
        }
      });
      break;

    case 'ad_group_members':
      userStates[userId] = 'awaiting_group_link';
      bot.editMessageText(`🔗 Send the PUBLIC LINK of your channel/group\n\n` +
        `ℹ️ Please make sure the link starts with https://t.me/.\n` +
        `ℹ️ Alternatively, you can share the @username (including @.....)\n\n` +
        `Members will join your channels or groups immediately after you activate this ad!\n\n` +
        `👇 Send the link to your channel or group now.`, {
        chat_id: chatId,
        message_id: query.message?.message_id,
        reply_markup: {
          inline_keyboard: [
            [{ text: '🔙 Back', callback_data: 'advertise' }]
          ]
        }
      });
      break;

    case 'ad_bot':
      userStates[userId] = 'awaiting_bot_forward';
      bot.editMessageText(`🔗 FORWARD a message from the bot you want to promote\n\n` +
        `1️⃣ Go to the bot you want to promote\n` +
        `2️⃣ Select any message\n` +
        `3️⃣ Forward it to this bot\n\n` +
        `👇 Do it now`, {
        chat_id: chatId,
        message_id: query.message?.message_id,
        reply_markup: {
          inline_keyboard: [
            [{ text: '🔙 Back', callback_data: 'advertise' }]
          ]
        }
      });
      break;

    case 'info':
      const infoMessage = `📊 Your Profile\n\n` +
        `👤 Name: ${users[userId].firstName}\n` +
        `🆔 ID: ${userId}\n` +
        `💰 Balance: ${users[userId].balance.toFixed(4)} ${CONFIG.CURRENCY}\n` +
        `👥 Referrals: ${users[userId].referrals}\n` +
        `📈 Total Earned: ${users[userId].totalEarned.toFixed(4)} ${CONFIG.CURRENCY}\n` +
        `✅ Tasks Completed: ${users[userId].tasksCompleted}\n` +
        `📅 Joined: ${new Date(users[userId].joinedAt).toLocaleDateString()}`;
      bot.editMessageText(infoMessage, {
        chat_id: chatId,
        message_id: query.message?.message_id,
        reply_markup: {
          inline_keyboard: [
            [{ text: '🔙 Back', callback_data: 'back_to_main' }]
          ]
        }
      });
      break;

    case 'back_to_main':
      const welcomeMessage = `🎉 Welcome ${users[userId].firstName}!\n\n` +
        `💰 Balance: ${users[userId].balance.toFixed(4)} ${CONFIG.CURRENCY}\n` +
        `👥 Referrals: ${users[userId].referrals}\n\n` +
        `Earn by completing simple tasks:\n\n` +
        `📱 Visit Sites - Earn by clicking links\n` +
        `👥 Join Channels - Earn by joining chats\n` +
        `🤖 Join Bots - Earn by talking to bots\n` +
        `😄 More - TG Post Views, Twitter Raids\n\n` +
        `You can also create your own ads with /advertise\n\n` +
        `Use the /help command or read @ClickBeeFAQ for more info`;

      bot.editMessageText(welcomeMessage, {
        chat_id: chatId,
        message_id: query.message?.message_id,
        ...getMainKeyboard()
      });
      break;

    case 'open_link':
      // Simulate task completion and reward
      const reward = Math.random() * 0.01 + 0.001;
      users[userId].balance += reward;
      users[userId].totalEarned += reward;
      users[userId].tasksCompleted += 1;
      saveData();
      
      bot.answerCallbackQuery(query.id, { 
        text: `✅ Task completed! You earned ${reward.toFixed(4)} ${CONFIG.CURRENCY}`,
        show_alert: true 
      });
      break;

    case 'skip_task':
      bot.answerCallbackQuery(query.id, { text: 'Task skipped' });
      break;

    // Admin callbacks
    case 'admin_users':
      if (userId !== ADMIN_ID) return;
      const totalUsers = Object.keys(users).length;
      const todayUsers = Object.values(users).filter((u: any) => {
        const joinDate = new Date(u.joinedAt);
        const today = new Date();
        return joinDate.toDateString() === today.toDateString();
      }).length;
      
      bot.editMessageText(`👥 User Statistics\n\n` +
        `📊 Total Users: ${totalUsers}\n` +
        `🆕 Today's New Users: ${todayUsers}\n` +
        `💰 Total Balance: ${Object.values(users).reduce((sum: number, u: any) => sum + u.balance, 0).toFixed(4)} ${CONFIG.CURRENCY}`, {
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
      if (userId !== ADMIN_ID) return;
      const pendingDeposits = Object.values(deposits).filter((d: any) => d.status === 'pending');
      if (pendingDeposits.length === 0) {
        bot.editMessageText(`💳 No pending deposits`, {
          chat_id: chatId,
          message_id: query.message?.message_id,
          reply_markup: {
            inline_keyboard: [
              [{ text: '🔙 Back', callback_data: 'admin_back' }]
            ]
          }
        });
      } else {
        const deposit = pendingDeposits[0] as any;
        bot.editMessageText(`💳 Pending Deposit\n\n` +
          `👤 User: ${users[deposit.userId]?.firstName || 'Unknown'}\n` +
          `💰 Amount: ${deposit.amount} ${CONFIG.CURRENCY}\n` +
          `💳 Method: ${deposit.method}\n` +
          `📅 Date: ${new Date(deposit.createdAt).toLocaleString()}`, {
          chat_id: chatId,
          message_id: query.message?.message_id,
          reply_markup: {
            inline_keyboard: [
              [
                { text: '✅ Approve', callback_data: `approve_deposit_${deposit.id}` },
                { text: '❌ Reject', callback_data: `reject_deposit_${deposit.id}` }
              ],
              [{ text: '🔙 Back', callback_data: 'admin_back' }]
            ]
          }
        });
      }
      break;

    case 'admin_withdrawals':
      if (userId !== ADMIN_ID) return;
      const pendingWithdrawals = Object.values(withdrawals).filter((w: any) => w.status === 'pending');
      if (pendingWithdrawals.length === 0) {
        bot.editMessageText(`🏧 No pending withdrawals`, {
          chat_id: chatId,
          message_id: query.message?.message_id,
          reply_markup: {
            inline_keyboard: [
              [{ text: '🔙 Back', callback_data: 'admin_back' }]
            ]
          }
        });
      } else {
        const withdrawal = pendingWithdrawals[0] as any;
        bot.editMessageText(`🏧 Pending Withdrawal\n\n` +
          `👤 User: ${users[withdrawal.userId]?.firstName || 'Unknown'}\n` +
          `💰 Amount: ${withdrawal.amount} ${CONFIG.CURRENCY}\n` +
          `💳 Method: ${withdrawal.method}\n` +
          `🆔 Payment ID: ${withdrawal.paymentId}\n` +
          `📅 Date: ${new Date(withdrawal.createdAt).toLocaleString()}`, {
          chat_id: chatId,
          message_id: query.message?.message_id,
          reply_markup: {
            inline_keyboard: [
              [
                { text: '✅ Approve', callback_data: `approve_withdrawal_${withdrawal.id}` },
                { text: '❌ Reject', callback_data: `reject_withdrawal_${withdrawal.id}` }
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

  // Handle admin approval/rejection
  if (data.startsWith('approve_deposit_') || data.startsWith('reject_deposit_')) {
    if (userId !== ADMIN_ID) return;
    const depositId = data.split('_')[2];
    const action = data.split('_')[0];
    
    if (deposits[depositId]) {
      if (action === 'approve') {
        deposits[depositId].status = 'approved';
        users[deposits[depositId].userId].balance += deposits[depositId].amount;
        bot.sendMessage(deposits[depositId].userId, 
          `✅ Your deposit of ${deposits[depositId].amount} ${CONFIG.CURRENCY} has been approved!`);
      } else {
        deposits[depositId].status = 'rejected';
        bot.sendMessage(deposits[depositId].userId, 
          `❌ Your deposit of ${deposits[depositId].amount} ${CONFIG.CURRENCY} has been rejected.`);
      }
      saveData();
      bot.answerCallbackQuery(query.id, { text: `Deposit ${action}d successfully` });
    }
  }

  if (data.startsWith('approve_withdrawal_') || data.startsWith('reject_withdrawal_')) {
    if (userId !== ADMIN_ID) return;
    const withdrawalId = data.split('_')[2];
    const action = data.split('_')[0];
    
    if (withdrawals[withdrawalId]) {
      if (action === 'approve') {
        withdrawals[withdrawalId].status = 'approved';
        bot.sendMessage(withdrawals[withdrawalId].userId, 
          `✅ Your withdrawal of ${withdrawals[withdrawalId].amount} ${CONFIG.CURRENCY} has been approved!`);
      } else {
        withdrawals[withdrawalId].status = 'rejected';
        users[withdrawals[withdrawalId].userId].balance += withdrawals[withdrawalId].amount; // Refund
        bot.sendMessage(withdrawals[withdrawalId].userId, 
          `❌ Your withdrawal of ${withdrawals[withdrawalId].amount} ${CONFIG.CURRENCY} has been rejected. Amount refunded.`);
      }
      saveData();
      bot.answerCallbackQuery(query.id, { text: `Withdrawal ${action}d successfully` });
    }
  }
});

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
    const method = userState.includes('binance') ? 'Binance Pay' : 'Payeer';
    const paymentId = userState.includes('binance') ? CONFIG.BINANCE_PAY_ID : CONFIG.PAYEER_ID;
    
    if (isNaN(amount) || amount < CONFIG.MIN_DEPOSIT || amount > CONFIG.MAX_DEPOSIT) {
      return bot.sendMessage(chatId, 
        `❌ Invalid amount. Please enter a number between ${CONFIG.MIN_DEPOSIT} and ${CONFIG.MAX_DEPOSIT} ${CONFIG.CURRENCY}`);
    }

    userStates[userId] = `awaiting_deposit_proof_${method.toLowerCase().replace(' ', '_')}_${amount}`;
    
    bot.sendMessage(chatId, 
      `💳 ${method} Deposit - ${amount} ${CONFIG.CURRENCY}\n\n` +
      `📋 Payment Details:\n` +
      `💰 Amount: ${amount} ${CONFIG.CURRENCY}\n` +
      `🆔 ${method} ID: \`${paymentId}\`\n\n` +
      `👆 Click to copy the ID above ☝️\n\n` +
      `📱 Steps:\n` +
      `1. Send ${amount} ${CONFIG.CURRENCY} to the ID above\n` +
      `2. Take a screenshot of the payment\n` +
      `3. Send the screenshot here as proof\n\n` +
      `⚠️ Make sure the amount matches exactly!`, 
      { 
        parse_mode: 'Markdown',
        reply_markup: {
          inline_keyboard: [
            [{ text: '📋 Copy ID', callback_data: `copy_${method.toLowerCase().replace(' ', '_')}_id` }],
            [{ text: '❌ Cancel', callback_data: 'deposit' }]
          ]
        }
      });
  }

  // Handle withdrawal amount input
  else if (userState === 'awaiting_withdraw_amount_binance' || userState === 'awaiting_withdraw_amount_payeer') {
    const amount = parseFloat(text);
    const method = userState.includes('binance') ? 'Binance Pay' : 'Payeer';
    
    if (isNaN(amount) || amount < CONFIG.MIN_WITHDRAW || amount > Math.min(CONFIG.MAX_WITHDRAW, users[userId].balance)) {
      return bot.sendMessage(chatId, 
        `❌ Invalid amount. Please enter a number between ${CONFIG.MIN_WITHDRAW} and ${Math.min(CONFIG.MAX_WITHDRAW, users[userId].balance).toFixed(4)} ${CONFIG.CURRENCY}`);
    }

    userStates[userId] = `awaiting_withdraw_id_${method.toLowerCase().replace(' ', '_')}_${amount}`;
    
    bot.sendMessage(chatId, 
      `🏧 ${method} Withdrawal - ${amount} ${CONFIG.CURRENCY}\n\n` +
      `💳 Enter your ${method} ID where you want to receive the payment:\n\n` +
      `💡 Example:\n` +
      `${method === 'Binance Pay' ? 'For Binance Pay: 123456789' : 'For Payeer: P1234567890'}`);
  }

  // Handle withdrawal ID input
  else if (userState && userState.startsWith('awaiting_withdraw_id_')) {
    const parts = userState.split('_');
    const method = parts[3] === 'binance' ? 'Binance Pay' : 'Payeer';
    const amount = parseFloat(parts[4]);
    const paymentId = text.trim();
    
    if (!paymentId) {
      return bot.sendMessage(chatId, '❌ Please enter a valid payment ID');
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
      `✅ Withdrawal request submitted!\n\n` +
      `💰 Amount: ${amount} ${CONFIG.CURRENCY}\n` +
      `💳 Method: ${method}\n` +
      `🆔 Payment ID: ${paymentId}\n` +
      `🔗 Request ID: ${withdrawalId}\n\n` +
      `⏳ Please wait for admin approval. You will be notified when processed.`);
    
    // Notify admin
    bot.sendMessage(ADMIN_ID, 
      `🏧 New Withdrawal Request\n\n` +
      `👤 User: ${users[userId].firstName} (${userId})\n` +
      `💰 Amount: ${amount} ${CONFIG.CURRENCY}\n` +
      `💳 Method: ${method}\n` +
      `🆔 Payment ID: ${paymentId}\n` +
      `🔗 Request ID: ${withdrawalId}`,
      {
        reply_markup: {
          inline_keyboard: [
            [
              { text: '✅ Approve', callback_data: `approve_withdrawal_${withdrawalId}` },
              { text: '❌ Reject', callback_data: `reject_withdrawal_${withdrawalId}` }
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
      `✅ Deposit request submitted!\n\n` +
      `💰 Amount: ${amount} ${CONFIG.CURRENCY}\n` +
      `💳 Method: ${method}\n` +
      `🔗 Request ID: ${depositId}\n\n` +
      `⏳ Please wait for admin approval. You will be notified when processed.`);
    
    // Notify admin
    bot.sendMessage(ADMIN_ID, 
      `💳 New Deposit Request\n\n` +
      `👤 User: ${users[userId].firstName} (${userId})\n` +
      `💰 Amount: ${amount} ${CONFIG.CURRENCY}\n` +
      `💳 Method: ${method}\n` +
      `🔗 Request ID: ${depositId}\n` +
      `📸 Proof: ${msg.photo ? 'Screenshot provided' : 'Text proof provided'}`,
      {
        reply_markup: {
          inline_keyboard: [
            [
              { text: '✅ Approve', callback_data: `approve_deposit_${depositId}` },
              { text: '❌ Reject', callback_data: `reject_deposit_${depositId}` }
            ]
          ]
        }
      });
  }

  // Handle advertisement creation
  else if (userState === 'awaiting_channel_link' || userState === 'awaiting_group_link') {
    if (text.includes('t.me/') || text.startsWith('@')) {
      userStates[userId] = `awaiting_ad_description_${userState === 'awaiting_channel_link' ? 'channel' : 'group'}_${encodeURIComponent(text)}`;
      
      bot.sendMessage(chatId, 
        `✏️ Create an engaging description for your AD:\n\n` +
        `• This will be the first thing users see and it should grab their attention and make them want to click on your link or check out your product/service.\n\n` +
        `ℹ️ You can use formatting options like *bold*, _italic_, and more to make your description stand out.\n\n` +
        `👇 Send your advertisement description now:`);
    } else {
      bot.sendMessage(chatId, '❌ Please send a valid Telegram link (starting with https://t.me/) or username (starting with @)');
    }
  }

  // Handle advertisement description
  else if (userState && userState.startsWith('awaiting_ad_description_')) {
    const parts = userState.split('_');
    const type = parts[3];
    const link = decodeURIComponent(parts[4]);
    const description = text;
    
    userStates[userId] = `awaiting_ad_cpc_${type}_${encodeURIComponent(link)}_${encodeURIComponent(description)}`;
    
    bot.sendMessage(chatId, 
      `📊 Preview of your AD:\n\n${description}\n\n` +
      `💰 How much do you want to pay for each click?\n\n` +
      `ℹ️ This is the amount you'll pay for each person who clicks on your ad. Paying more will get your ad displayed in front of others.\n\n` +
      `To target only Telegram Premium users, use /premium_users_only\n\n` +
      `🔻 Min: ${CONFIG.MIN_CPC.toFixed(4)} ${CONFIG.CURRENCY}\n\n` +
      `👇 Enter your desired CPC in ${CONFIG.CURRENCY}:`,
      {
        reply_markup: {
          inline_keyboard: [
            [
              { text: `${CONFIG.MIN_CPC.toFixed(4)} ${CONFIG.CURRENCY} (Slow)`, callback_data: `set_cpc_${CONFIG.MIN_CPC}` },
              { text: `${(CONFIG.MIN_CPC * 5).toFixed(4)} ${CONFIG.CURRENCY} (Fast)`, callback_data: `set_cpc_${CONFIG.MIN_CPC * 5}` },
              { text: `${CONFIG.MAX_CPC.toFixed(4)} ${CONFIG.CURRENCY}`, callback_data: `set_cpc_${CONFIG.MAX_CPC}` }
            ]
          ]
        }
      });
  }

  // Handle CPC input
  else if (userState && userState.startsWith('awaiting_ad_cpc_')) {
    const cpc = parseFloat(text);
    if (isNaN(cpc) || cpc < CONFIG.MIN_CPC || cpc > CONFIG.MAX_CPC) {
      return bot.sendMessage(chatId, 
        `❌ Invalid CPC. Please enter a number between ${CONFIG.MIN_CPC} and ${CONFIG.MAX_CPC} ${CONFIG.CURRENCY}`);
    }

    const parts = userState.split('_');
    const type = parts[3];
    const link = decodeURIComponent(parts[4]);
    const description = decodeURIComponent(parts[5]);
    
    userStates[userId] = `awaiting_ad_budget_${type}_${encodeURIComponent(link)}_${encodeURIComponent(description)}_${cpc}`;
    
    bot.sendMessage(chatId, 
      `💰 What is your daily budget for this ad campaign?\n\n` +
      `ℹ️ This will determine the maximum amount you are willing to spend per day on this ad campaign. Your ad will be paused for the day if the daily budget is exceeded.\n\n` +
      `💰 Available Balance: ${users[userId].balance.toFixed(4)} ${CONFIG.CURRENCY}\n\n` +
      `👇 Enter your desired daily budget in ${CONFIG.CURRENCY}:`);
  }

  // Handle daily budget input
  else if (userState && userState.startsWith('awaiting_ad_budget_')) {
    const budget = parseFloat(text);
    if (isNaN(budget) || budget <= 0 || budget > users[userId].balance) {
      return bot.sendMessage(chatId, 
        `❌ Invalid budget. Please enter a number between 0.01 and ${users[userId].balance.toFixed(4)} ${CONFIG.CURRENCY}`);
    }

    const parts = userState.split('_');
    const type = parts[3];
    const link = decodeURIComponent(parts[4]);
    const description = decodeURIComponent(parts[5]);
    const cpc = parseFloat(parts[6]);
    
    const adId = Date.now().toString();
    advertisements[adId] = {
      id: adId,
      userId,
      type: type === 'channel' ? 'channel_members' : 'group_members',
      link,
      description,
      cpc,
      dailyBudget: budget,
      status: 'active',
      createdAt: new Date().toISOString(),
      totalClicks: 0,
      totalSkips: 0,
      spentToday: 0,
      lastResetDate: new Date().toDateString()
    };
    
    delete userStates[userId];
    saveData();
    
    bot.sendMessage(chatId, 
      `✅ Promotion created successfully\n\n` +
      `🎯 Campaign #${adId.slice(-6)}/\n${users[userId].firstName} - 👥 ${type === 'channel' ? 'Channel' : 'Group'} Members\n\n` +
      `👁️ Your Advert (User can see this)\n\n` +
      `ℹ️ ${description}\n\n` +
      `🔗 Users will be asked to join ${link} and stay for at least 7 days.\n\n` +
      `🔍 Telegram Premium Users ONLY: disabled\n\n` +
      `💰 CPC: ${cpc.toFixed(4)} ${CONFIG.CURRENCY}\n` +
      `💰 Daily Budget: ${budget.toFixed(4)} ${CONFIG.CURRENCY}\n\n` +
      `ℹ️ Status: ⏸️ Paused after finishing budget\n` +
      `👆 Total Clicks: 0\n` +
      `⏭️ Total Skips: 0\n` +
      `💰 Spent Today: 0.00 ${CONFIG.CURRENCY}`,
      {
        reply_markup: {
          inline_keyboard: [
            [
              { text: '▶️ Activate', callback_data: `activate_ad_${adId}` },
              { text: '❌ Delete', callback_data: `delete_ad_${adId}` }
            ],
            [
              { text: '🔺 Increase CPC', callback_data: `increase_cpc_${adId}` },
              { text: '🎯 Edit Daily Budget', callback_data: `edit_budget_${adId}` }
            ],
            [
              { text: '📝 Edit Description', callback_data: `edit_description_${adId}` },
              { text: '🌍 Edit Geolocation', callback_data: `edit_geo_${adId}` }
            ]
          ]
        }
      });
    
    // Notify admin
    bot.sendMessage(ADMIN_ID, 
      `📢 New Advertisement Created\n\n` +
      `👤 User: ${users[userId].firstName} (${userId})\n` +
      `🔗 Link: ${link}\n` +
      `📝 Type: ${type === 'channel' ? 'Channel' : 'Group'} Members\n` +
      `💰 CPC: ${cpc.toFixed(4)} ${CONFIG.CURRENCY}\n` +
      `💰 Daily Budget: ${budget.toFixed(4)} ${CONFIG.CURRENCY}\n` +
      `🆔 Ad ID: ${adId}`);
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
      proof: 'photo_provided'
    };

    delete userStates[userId];
    saveData();

    bot.sendMessage(chatId, 
      `✅ Deposit request submitted with screenshot!\n\n` +
      `💰 Amount: ${amount} ${CONFIG.CURRENCY}\n` +
      `💳 Method: ${method}\n` +
      `🔗 Request ID: ${depositId}\n\n` +
      `⏳ Please wait for admin approval. You will be notified when processed.`);
    
    // Notify admin
    bot.sendMessage(ADMIN_ID, 
      `💳 New Deposit Request\n\n` +
      `👤 User: ${users[userId].firstName} (${userId})\n` +
      `💰 Amount: ${amount} ${CONFIG.CURRENCY}\n` +
      `💳 Method: ${method}\n` +
      `🔗 Request ID: ${depositId}\n` +
      `📸 Proof: Screenshot provided`,
      {
        reply_markup: {
          inline_keyboard: [
            [
              { text: '✅ Approve', callback_data: `approve_deposit_${depositId}` },
              { text: '❌ Reject', callback_data: `reject_deposit_${depositId}` }
            ]
          ]
        }
      });
  }
});

// Initialize
loadData();
console.log('🤖 AnasCP Bot started successfully!');
console.log(`Bot: @task_cpbot`);
console.log(`Admin ID: ${ADMIN_ID}`);
console.log(`Required Channels: ${REQUIRED_CHANNELS.join(', ')}`);
