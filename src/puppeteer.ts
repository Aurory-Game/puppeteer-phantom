import * as path from 'path'
import puppeteer from 'puppeteer'
import { sleep } from './utils'

let _browser: puppeteer.Browser | null = null
let _mainWindow: puppeteer.Page | null = null
let _phantomWindow: puppeteer.Page | null = null
let _extensionId: string | null = null

/**
 * Get cached browser object
 *
 * @returns puppeteer.Browser
 */
export function getBrowser() {
  return _browser!
}

/**
 * Get cached main window object
 *
 * @returns puppeteer.Page
 */
export function getMainWindow() {
  return _mainWindow!
}

/**
 * Get cached phantom window object
 *
 * @returns puppeteer.Page
 */
export function getPhantomWindow() {
  return _phantomWindow!
}

/**
 * @ignore
 */
export async function setupBrowser(args: string[]) {
  _browser = await puppeteer.launch({
    defaultViewport: null,
    headless: false,
    ignoreDefaultArgs: ['--disable-extensions', '--enable-automation'],
    args: [
      // `--start-maximized`,
      `--load-extension=${path.resolve(__dirname, '../data/phantom')}`,
      '--ignore-certificate-errors',
      '--no-sandbox',
      '--disable-setuid-sandbox',
      '--disable-accelerated-2d-canvas',
      '--disable-gpu',
      ...args,
    ],
  })

  await sleep(1000)
}

/**
 * @ignore
 */
export async function setupWindows() {
  if (!_browser) return

  await sleep(3000)

  const pages = await _browser.pages()

  for (const page of pages) {
    const url = page.url()
    if (url.includes('about:blank')) {
      _mainWindow = page
    } else if (url.includes('extension')) {
      _phantomWindow = page
    }
  }

  return !!_phantomWindow
}

/**
 * @ignore
 */
export async function setupPhantomWindow() {
  if (!_browser) return
  await teardownPhantomWindow()
  _phantomWindow = await _browser!.newPage()
  await _phantomWindow!.goto(`chrome-extension://${await getExtensionId()}/popup.html`)
}

/**
 * @ignore
 */
export async function teardownPhantomWindow() {
  _phantomWindow?.close()
}

/**
 * @ignore
 */
export async function switchToMainWindow() {
  await getMainWindow().bringToFront()
}

/**
 * @ignore
 */
// export async function switchToPhantomWindow() {
//   await getPhantomWindow().bringToFront()
// }

/**
 * @ignore
 */
export async function switchToPhantomNotification() {
  await getPhantomWindow().waitForTimeout(3000)
  const pages = await getBrowser().pages()
  const extensionId = await getExtensionId()
  for (const page of pages) {
    const url = page.url()
    if (url === `chrome-extension://${extensionId}/notification.html`) {
      await page.bringToFront()
      return page
    }
  }
}

/**
 * @ignore
 */
async function getExtensionId() {
  if (_extensionId) return _extensionId

  const extensionName = 'Phantom'
  const targets = await _browser!.targets()
  // @ts-ignore
  const extensionTarget = targets.find(({ _targetInfo }) => {
    return _targetInfo.title === extensionName && _targetInfo.type === 'background_page'
  })
  // @ts-ignore
  const extensionURL = extensionTarget._targetInfo.url
  const urlSplit = extensionURL.split('/')
  _extensionId = urlSplit[2]
  return _extensionId
}
