module.exports = function (api) {
    api.cache(true);
    return {
      presets: [
        [
          'babel-preset-expo',
          {
            // Expo SDK 53+ needs this for import.meta support
            unstable_transformImportMeta: true,
          },
        ],
      ],
    };
  };
  