const { chromium } = require('playwright');
const readline = require('readline');
const path = require('path');
const fs = require('fs');

// Shared with notebooklm.processor.ts. The session must be saved under the
// exact fingerprint it will later be replayed under, or Google bounces it to a
// sign-in page and then refuses the sign-in with "This browser or app may not
// be secure".
const profile = require('./browser-profile');

async function main() {
  console.log('Starting browser in interactive (headed) mode with stealth settings...');

  const { browser, channel } = await profile.launchBrowser(chromium, false, console.log);

  if (channel === 'chromium') {
    console.log('\n!! CẢNH BÁO: đang dùng Chromium đóng gói của Playwright.');
    console.log('   Google thường từ chối đăng nhập trên bản này.');
    console.log('   Nên cài Google Chrome hoặc Microsoft Edge rồi chạy lại.\n');
  }

  const context = await profile.createContext(browser);

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
