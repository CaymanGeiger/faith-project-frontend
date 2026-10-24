// Shared by NativeWind's build config and the native runtime.
const tokens = require('./designTokens.json');
function alpha(hex, opacity) {
  const channels = [1, 3, 5].map(offset => parseInt(hex.slice(offset, offset + 2), 16));
  return `rgba(${channels.join(', ')}, ${opacity})`;
}
module.exports = {
  ...tokens,
  colors: {
    ...tokens.palette,
    ink: tokens.palette.blue,
    muted: alpha(tokens.palette.blue, tokens.opacity.muted),
  },
  shades: {
    ...Object.fromEntries(Object.entries(tokens.opacity).map(([name, opacity]) => [name, alpha(tokens.palette.blue, opacity)])),
    transparentRed: alpha(tokens.palette.red, 0),
  },
};
