
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

// Load data
const loadData = () => {
  try {
    if (fs.existsSync('users.json')) users = JSON.parse(fs.readFileSync('users.json', 'utf8'));
    if (fs.existsSync('tasks.json')) tasks = JSON.parse(fs.readFileSync('tasks.json', 'utf8'));
    if (fs.existsSync('withdrawals.json')) withdrawals = JSON.parse(fs.readFileSync('withdrawals.json', 'utf8'));
    if (fs.existsSync('deposits.json')) deposits = JSON.parse(fs.readFileSync('deposits.json', 'utf8'));
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

// Main keyboard
const getMainKeyboard = () => {
  return {
    reply_markup: {
      keyboard: [
        ['💰 Balance', '👥 Referrals'],
        ['📢 Tasks', '💳 Deposit'],
        ['🏧 Withdraw', '📊 Profile'],
        ['📞 Support']
      ],
      resize_keyboard: true
    }
  };
};

// Admin keyboard
const getAdminKeyboard = () => {
  return {
    reply_markup: {
      keyboard: [
        ['📊 Total Users', '💸 Set Platform Fee'],
        ['🎁 Set Ref Bonus', '💬 Broadcast'],
        ['💳 Set Binance ID', '✅ Approve Withdrawals'],
        ['💰 Approve Deposits', '📢 Manage Tasks'],
        ['👤 User Menu']
      ],
      resize_keyboard: true
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
      tasksCompleted: 0
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
    `💰 Balance: ${users[userId].balance} ${CONFIG.CURRENCY}\n` +
    `👥 Referrals: ${users[userId].referrals}\n\n` +
    `🔗 Your referral link:\n${generateReferralLink(userId)}\n\n` +
    `Use the menu below to navigate:`;

  const keyboard = userId === ADMIN_ID ? getAdminKeyboard() : getMainKeyboard();
  bot.sendMessage(chatId, welcomeMessage, keyboard);
});

// Handle callback queries
bot.on('callback_query', async (query) => {
  const chatId = query.message?.chat.id!;
  const userId = query.from.id;
  
  if (query.data === 'check_membership') {
    const hasJoined = await checkChannelMembership(userId);
    if (hasJoined) {
      bot.answerCallbackQuery(query.id, { text: '✅ Membership verified!' });
      bot.sendMessage(chatId, '/start', { reply_markup: { remove_keyboard: true } });
    } else {
      bot.answerCallbackQuery(query.id, { text: '❌ Please join all channels first!' });
    }
  }
});

// Handle menu commands
bot.on('message', async (msg) => {
  const chatId = msg.chat.id;
  const userId = msg.from?.id!;
  const text = msg.text;

  if (!users[userId]) return;

  switch (text) {
    case '💰 Balance':
      const balanceMsg = `💰 Your Balance\n\n` +
        `💵 Current: ${users[userId].balance} ${CONFIG.CURRENCY}\n` +
        `📈 Total Earned: ${users[userId].totalEarned} ${CONFIG.CURRENCY}\n` +
        `✅ Tasks Completed: ${users[userId].tasksCompleted}`;
      bot.sendMessage(chatId, balanceMsg);
      break;

    case '👥 Referrals':
      const refMsg = `👥 Referral Stats\n\n` +
        `👤 Total Referrals: ${users[userId].referrals}\n` +
        `💰 Bonus per referral: ${CONFIG.REF_BONUS} ${CONFIG.CURRENCY}\n` +
        `💵 Total from referrals: ${users[userId].referrals * CONFIG.REF_BONUS} ${CONFIG.CURRENCY}\n\n` +
        `🔗 Your referral link:\n${generateReferralLink(userId)}`;
      bot.sendMessage(chatId, refMsg);
      break;

    case '📢 Tasks':
      let taskMsg = '📢 Available Tasks\n\n';
      const availableTasks = Object.values(tasks).filter((task: any) => task.status === 'approved');
      
      if (availableTasks.length === 0) {
        taskMsg += 'No tasks available at the moment.';
      } else {
        availableTasks.forEach((task: any, index) => {
          taskMsg += `${index + 1}. ${task.title}\n`;
          taskMsg += `💰 Reward: ${task.reward} ${CONFIG.CURRENCY}\n`;
          taskMsg += `📝 Description: ${task.description}\n\n`;
        });
      }
      bot.sendMessage(chatId, taskMsg);
      break;

    case '💳 Deposit':
      const depositMsg = `💳 Deposit ${CONFIG.CURRENCY}\n\n` +
        `💰 Minimum: ${CONFIG.MIN_DEPOSIT} ${CONFIG.CURRENCY}\n\n` +
        `📋 Payment Methods:\n` +
        `🟡 Binance Pay ID: ${CONFIG.BINANCE_PAY_ID}\n` +
        `🔵 Payeer ID: ${CONFIG.PAYEER_ID}\n\n` +
        `After payment, send screenshot with amount for verification.`;
      bot.sendMessage(chatId, depositMsg);
      break;

    case '🏧 Withdraw':
      if (users[userId].balance < CONFIG.MIN_WITHDRAW) {
        bot.sendMessage(chatId, `❌ Minimum withdrawal: ${CONFIG.MIN_WITHDRAW} ${CONFIG.CURRENCY}`);
      } else {
        const withdrawMsg = `🏧 Withdraw ${CONFIG.CURRENCY}\n\n` +
          `💰 Available: ${users[userId].balance} ${CONFIG.CURRENCY}\n` +
          `💰 Minimum: ${CONFIG.MIN_WITHDRAW} ${CONFIG.CURRENCY}\n\n` +
          `Send: /withdraw <amount> <payment_method> <payment_id>`;
        bot.sendMessage(chatId, withdrawMsg);
      }
      break;

    case '📊 Profile':
      const profileMsg = `📊 Your Profile\n\n` +
        `👤 Name: ${users[userId].firstName}\n` +
        `🆔 ID: ${userId}\n` +
        `💰 Balance: ${users[userId].balance} ${CONFIG.CURRENCY}\n` +
        `👥 Referrals: ${users[userId].referrals}\n` +
        `📈 Total Earned: ${users[userId].totalEarned} ${CONFIG.CURRENCY}\n` +
        `✅ Tasks Completed: ${users[userId].tasksCompleted}\n` +
        `📅 Joined: ${new Date(users[userId].joinedAt).toLocaleDateString()}`;
      bot.sendMessage(chatId, profileMsg);
      break;

    // Admin commands
    case '📊 Total Users':
      if (userId === ADMIN_ID) {
        const totalUsers = Object.keys(users).length;
        const totalBalance = Object.values(users).reduce((sum: number, user: any) => sum + user.balance, 0);
        const adminMsg = `📊 Bot Statistics\n\n` +
          `👥 Total Users: ${totalUsers}\n` +
          `💰 Total Balance: ${totalBalance} ${CONFIG.CURRENCY}\n` +
          `📢 Active Tasks: ${Object.values(tasks).filter((t: any) => t.status === 'approved').length}`;
        bot.sendMessage(chatId, adminMsg);
      }
      break;

    case '👤 User Menu':
      if (userId === ADMIN_ID) {
        bot.sendMessage(chatId, 'Switched to user menu', getMainKeyboard());
      }
      break;

    case '💬 Broadcast':
      if (userId === ADMIN_ID) {
        bot.sendMessage(chatId, 'Send your broadcast message:');
        // Set state for next message to be broadcast
      }
      break;
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
