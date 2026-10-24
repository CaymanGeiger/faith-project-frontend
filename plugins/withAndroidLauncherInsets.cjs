const { withFinalizedMod } = require('expo/config-plugins');
const { mkdir, writeFile } = require('node:fs/promises');
const path = require('node:path');

// Reuse the approved, unmodified Hercules artwork. Android drawable insets
// keep both layers inside adaptive launcher masks, including themed icons.
const launcherXml = `<?xml version="1.0" encoding="utf-8"?>
<adaptive-icon xmlns:android="http://schemas.android.com/apk/res/android">
  <background android:drawable="@color/iconBackground" />
  <foreground>
    <inset android:drawable="@mipmap/ic_launcher_foreground" android:inset="12%" />
  </foreground>
  <monochrome>
    <inset android:drawable="@mipmap/ic_launcher_monochrome" android:inset="27%" />
  </monochrome>
</adaptive-icon>
`;

module.exports = function withAndroidLauncherInsets(config) {
  return withFinalizedMod(config, ['android', async (config) => {
    const directory = path.join(config.modRequest.platformProjectRoot, 'app/src/main/res/mipmap-anydpi-v26');
    await mkdir(directory, { recursive: true });
    for (const name of ['ic_launcher.xml', 'ic_launcher_round.xml']) {
      await writeFile(path.join(directory, name), launcherXml);
    }
    return config;
  }]);
};
