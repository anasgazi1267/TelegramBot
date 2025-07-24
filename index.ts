
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
  MIN_WITHDRAW: 0.30,
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
        `🔢 Total: 4,317,555 users\n` +
        `🆕 New(last 24 hours): 714 users\n\n` +
        `Join our official channel at @ClickBee\n` +
        `👥 Join the talks at @ClickBeeGroup\n` +
        `& for technical support contact @ClickBeeSupport📞`;
      
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

    case 'visit_sites':
      // Sample task
      const siteTaskMessage = `Hassle-Free Bitcoin Mining on the Cloud without technical expertise or big investments! 📈\n\n` +
        `_________________________\n\n` +
        `👆 Mission: Engage with this website.\n\n` +
        `❓ Press « 🌐 Open Link » and browse the website.`;
      
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
      bot.editMessageText(`❌ Oh no! There are NO TASKS available at the moment. Please check back later! 🔄\n\nYou can promote your own channels, groups, or bots with /OrderAds.`, {
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
      bot.editMessageText(`❌ Oh no! There are NO TASKS available at the moment. Please check back later! 🔄\n\nYou can promote your own channels, groups, or bots with /OrderAds.`, {
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
      bot.editMessageText(`🔗 FORWARD a message from the bot you want to promote\n\n` +
        `ℹ️ Go to the bot you want to promote\n` +
        `2️⃣ select any messages\n` +
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

    case 'deposit':
      const depositMessage = `💳 Deposit ${CONFIG.CURRENCY}\n\n` +
        `💰 Minimum: ${CONFIG.MIN_DEPOSIT} ${CONFIG.CURRENCY}\n\n` +
        `📋 Payment Methods:\n` +
        `🟡 Binance Pay ID: ${CONFIG.BINANCE_PAY_ID}\n` +
        `🔵 Payeer ID: ${CONFIG.PAYEER_ID}\n\n` +
        `After payment, send screenshot with amount for verification.`;
      bot.editMessageText(depositMessage, {
        chat_id: chatId,
        message_id: query.message?.message_id,
        reply_markup: {
          inline_keyboard: [
            [{ text: '🔙 Back', callback_data: 'back_to_main' }]
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
          `💰 Minimum: ${CONFIG.MIN_WITHDRAW} ${CONFIG.CURRENCY}\n\n` +
          `Send: /withdraw <amount> <payment_method> <payment_id>`;
        bot.editMessageText(withdrawMsg, {
          chat_id: chatId,
          message_id: query.message?.message_id,
          reply_markup: {
            inline_keyboard: [
              [{ text: '🔙 Back', callback_data: 'back_to_main' }]
            ]
          }
        });
      }
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
      const reward = 0.001;
      users[userId].balance += reward;
      users[userId].totalEarned += reward;
      users[userId].tasksCompleted += 1;
      saveData();
      
      bot.answerCallbackQuery(query.id, { 
        text: `✅ Task completed! You earned ${reward} ${CONFIG.CURRENCY}`,
        show_alert: true 
      });
      break;

    case 'skip_task':
      bot.answerCallbackQuery(query.id, { text: 'Task skipped' });
      break;
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
  
  if (userState === 'awaiting_channel_link' || userState === 'awaiting_group_link') {
    if (text.includes('t.me/') || text.startsWith('@')) {
      const adId = Date.now().toString();
      advertisements[adId] = {
        id: adId,
        userId,
        type: userState === 'awaiting_channel_link' ? 'channel' : 'group',
        link: text,
        status: 'pending',
        createdAt: new Date().toISOString()
      };
      
      delete userStates[userId];
      saveData();
      
      bot.sendMessage(chatId, `✅ Advertisement submitted for review!\n\nLink: ${text}\nType: ${userState === 'awaiting_channel_link' ? 'Channel Members' : 'Group Members'}\n\nAdmin will review and approve your ad soon.`);
      
      // Notify admin
      bot.sendMessage(ADMIN_ID, 
        `📢 New Advertisement Request\n\n` +
        `👤 User: ${users[userId].firstName} (${userId})\n` +
        `🔗 Link: ${text}\n` +
        `📝 Type: ${userState === 'awaiting_channel_link' ? 'Channel Members' : 'Group Members'}\n` +
        `🆔 Ad ID: ${adId}`
      );
    } else {
      bot.sendMessage(chatId, '❌ Please send a valid Telegram link (starting with https://t.me/) or username (starting with @)');
    }
  }
});

// Handle withdraw command
bot.onText(/\/withdraw (.+)/, (msg, match) => {
  const chatId = msg.chat.id;
  const userId = msg.from?.id!;
  const params = match?.[1]?.split(' ');
  
  if (!params || params.length < 3) {
    return bot.sendMessage(chatId, 'Usage: /withdraw <amount> <method> <payment_id>');
  }

  const amount = parseFloat(params[0]);
  const method = params[1];
  const paymentId = params.slice(2).join(' ');

  if (amount < CONFIG.MIN_WITHDRAW) {
    return bot.sendMessage(chatId, `❌ Minimum withdrawal: ${CONFIG.MIN_WITHDRAW} ${CONFIG.CURRENCY}`);
  }

  if (users[userId].balance < amount) {
    return bot.sendMessage(chatId, '❌ Insufficient balance');
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
  saveData();

  bot.sendMessage(chatId, `✅ Withdrawal request submitted!\n\nAmount: ${amount} ${CONFIG.CURRENCY}\nRequest ID: ${withdrawalId}`);
  
  // Notify admin
  bot.sendMessage(ADMIN_ID, 
    `🏧 New Withdrawal Request\n\n` +
    `👤 User: ${users[userId].firstName} (${userId})\n` +
    `💰 Amount: ${amount} ${CONFIG.CURRENCY}\n` +
    `💳 Method: ${method}\n` +
    `🆔 Payment ID: ${paymentId}\n` +
    `🔗 Request ID: ${withdrawalId}`
  );
});

// Initialize
loadData();
console.log('🤖 AnasCP Bot started successfully!');
console.log(`Bot: @task_cpbot`);
console.log(`Admin ID: ${ADMIN_ID}`);
console.log(`Required Channels: ${REQUIRED_CHANNELS.join(', ')}`);
