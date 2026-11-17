//
//  This file is part of the 2FAS Browser Extension (https://github.com/twofas/2fas-browser-extension)
//  Copyright © 2026 Two Factor Authentication Service, Inc.
//  Contributed by Grzegorz Zając. All rights reserved.
//
//  This program is free software: you can redistribute it and/or modify
//  it under the terms of the GNU General Public License as published by
//  the Free Software Foundation, either version 3 of the License, or
//  any later version.
//
//  This program is distributed in the hope that it will be useful,
//  but WITHOUT ANY WARRANTY; without even the implied warranty of
//  MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE. See the
//  GNU General Public License for more details.
//
//  You should have received a copy of the GNU General Public License
//  along with this program. If not, see <https://www.gnu.org/licenses/>
//

// @vitest-environment jsdom
import { describe, it, expect, beforeAll } from 'vitest';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import path from 'node:path';
import browser from 'webextension-polyfill';

// The default test stub answers getMessage with '' everywhere, so nothing in the suite
// otherwise proves a locale catalogue actually reaches the screen. These cases feed the
// real zh_CN files to getMessage and then render through the production modules, which
// is what catches a dropped token or a formatter that ignores the pattern key.
const src = path.join(path.dirname(fileURLToPath(import.meta.url)), '_locales', 'zh_CN');

const catalogue = Object.assign(...['general', 'optionsPage', 'months']
  .map(file => JSON.parse(readFileSync(path.join(src, `${file}.json`), 'utf8'))));

describe('zh_CN rendering through production modules', () => {
  beforeAll(() => {
    browser.i18n.getMessage = key => catalogue[key]?.message ?? '';
  });

  it('renders the pairing date year-first', async () => {
    document.body.innerHTML = '<table><tbody class="js-twofas-device-list"></tbody></table>';

    const { default: generateDevicesList } = await import('@optionsPage/functions/generateDevicesList.js');

    generateDevicesList([{ id: '1', name: 'Phone', platform: 'android', paired_at: '2026-10-12T08:00:00.000Z' }]);

    const cells = [...document.querySelectorAll('.js-twofas-device-list tr td')].map(td => td.textContent);

    expect(cells[1]).toBe('2026年10月12日');
  });

  it('builds the pairing device name from the localized pattern', async () => {
    Object.defineProperty(window.navigator, 'userAgent', {
      value: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/141.0.0.0 Safari/537.36',
      configurable: true
    });

    const { default: getBrowserInfo } = await import('@background/functions/getBrowserInfo.js');
    const info = await getBrowserInfo({ force: true });

    expect(info.name).toMatch(/^Chrome · Windows \([\da-f]{4}\)$/);
  });
});
