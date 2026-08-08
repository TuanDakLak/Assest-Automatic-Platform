const { chromium } = require('playwright');
const readline = require('readline');
const path = require('path');
const fs = require('fs');

async function main() {
  console.log('Starting browser in interactive (headed) mode with stealth settings...');

  let browser;
  const launchOptions = {
    headless: false,
    args: [
      '--disable-blink-features=AutomationControlled',
      '--no-sandbox',
      '--disable-setuid-sandbox',
      '--disable-infobars',
      '--window-size=1280,800',
    ]
  };

  // Try Chrome first, then Edge, then default Chromium
  try {
    console.log('Attempting to launch Google Chrome...');
    browser = await chromium.launch({ ...launchOptions, channel: 'chrome' });
  } catch (e) {
    try {
      console.log('Google Chrome not found. Attempting to launch Microsoft Edge...');
      browser = await chromium.launch({ ...launchOptions, channel: 'msedge' });
    } catch (e2) {
      console.log('Edge not found. Falling back to default Chromium...');
      browser = await chromium.launch(launchOptions);
    }
  }

  const context = await browser.newContext({
    viewport: { width: 1280, height: 800 },
    userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36',
    locale: 'vi-VN,vi;q=0.9,en-US;q=0.8,en;q=0.7',
    timezoneId: 'Asia/Ho_Chi_Minh',
  });

  // Inject script to make extra sure navigator.webdriver is undefined
  await context.addInitScript(() => {
    Object.defineProperty(navigator, 'webdriver', {
      get: () => undefined,
    });
  });

  const page = await context.newPage();
  
  console.log('Navigating to NotebookLM...');
  await page.goto('https://notebooklm.google/');
  
  console.log('\n==================================================');
  console.log('HƯỚNG DẪN / INSTRUCTIONS:');
  console.log('1. Một cửa sổ trình duyệt đã được mở ra (chạy bằng trình duyệt thật của máy).');
  console.log('2. Đăng nhập tài khoản Google của bạn trên cửa sổ đó.');
  console.log('3. Hoàn tất nhập Email, Mật khẩu và Xác thực 2 lớp (nếu có).');
  console.log('4. Sau khi đăng nhập thành công và thấy giao diện NotebookLM,');
  console.log('   quay lại terminal này và nhấn phím ENTER để lưu phiên.');
  console.log('==================================================\n');
  
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
  });
  
  await new Promise(resolve => {
    rl.question('Nhấn ENTER tại đây sau khi bạn đã đăng nhập thành công...', () => {
      rl.close();
      resolve();
    });
  });
  
  const sessionPath = path.join(__dirname, 'session.json');
  console.log(`Đang lưu trạng thái phiên vào: ${sessionPath}`);
  
  await context.storageState({ path: sessionPath });
  console.log('Lưu phiên đăng nhập thành công! (Session saved successfully)');
  
  await browser.close();
  console.log('Đã đóng trình duyệt. Quá trình thiết lập hoàn tất.');
}

main().catch(err => {
  console.error('Đã xảy ra lỗi:', err);
  process.exit(1);
});
