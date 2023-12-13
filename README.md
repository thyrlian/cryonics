# Cryonics

A Chrome extension which helps user save all opened tabs and resuscitate them all at once later.

[![Chrome Web Store](https://img.shields.io/badge/Chrome%20Web%20Store-Download-brightgreen.svg)](https://chrome.google.com/webstore/detail/cryonics/hkombacagedhkddahffppknpaiocgeap)

<img src="https://github.com/thyrlian/cryonics/blob/master/Cryonics.jpg">

Picture by [Gizmodo](http://io9.gizmodo.com/5977640/23-year-old-kim-suozzi-undergoes-cryonic-preservation-after-successful-fundraising-campaign)

> **Cryonics** (from Greek κρύος 'kryos-' meaning 'cold') is the low-temperature preservation (usually at -196°C) of people who cannot be sustained by contemporary medicine, with the hope that resuscitation and restoration to full health may be possible in the far future. Cryopreservation of humans is not reversible with present technology; cryonicists hope that medical advances will someday allow cryopreserved people to be revived.
> - [Wikipedia](https://en.wikipedia.org/wiki/Cryonics)

## Features

 ✭ Saved data can be automatically synced with Chrome sync (no other account needed).

 ✭ Neat UI, powered by Twitter's Bootstrap.

 ✭ The hint (optional) for saving can be a word or phrase, just to remind you what the opened tabs are about.  If it's empty, the saving identifier will consist of a timestamp and the number of tabs, e.g. 2013-12-18T20:15:59 (10 tabs).

 ✭ After saving, it wouldn't close your chrome window.  Thus, you can continue working on those tabs if you want.

 ✭ You can save as many times as you want, they'll be stored as different entries.

 ✭ Right after saved tabs are opened, the saved entry will be automatically removed. (GTD - Getting Things Done)

 ✍ Project is open sourced at https://github.com/thyrlian/cryonics

## Build & Test

To build and test this Chrome extension locally, please follow below steps:

* Open Chrome, go to `chrome://extensions/`.
* Make sure on the extensions page the **"Developer mode"** is switched **ON** (it's on the top right).
* Click the **"Load unpacked"** button and select the extension directory.

## Release

* Navigate to the inside of the extension directory, create a ZIP file: `zip -r ../cryonics.zip * -x Cryonics.jpg -x LICENSE -x PRIVACY_POLICY.md -x README.md`.
* Go to [Chrome Web Store Developer Dashboard](https://chrome.google.com/webstore/developer/dashboard), click the item (extension) to its details page.
* Click **"Package"** on the left navigation menu, then click the **"Upload new package"** button shows on the top right.
* After successfully uploading, click **"Save draft"**.
* Finally, click **"Submit for review"**.

## Privacy Policy

Please read the details [here](https://github.com/thyrlian/cryonics/blob/master/PRIVACY_POLICY.md).

## License

Copyright (c) 2013-2023 Jing Li. **Cryonics** is released under the Apache License version 2.0. See the [LICENSE](https://github.com/thyrlian/cryonics/blob/master/LICENSE) file for details.