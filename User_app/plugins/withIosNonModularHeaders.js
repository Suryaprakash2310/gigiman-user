
const {
  createRunOncePlugin,
  withPodfile,
} = require('@expo/config-plugins');

const {
  mergeContents,
} = require('@expo/config-plugins/build/utils/generateCode');

const PLUGIN_NAME = 'withIosNonModularHeaders';
const PLUGIN_VERSION = '1.2.1';
const GENERATED_TAG = 'rnfb-allow-non-modular-headers';

/**
 * Generates the Ruby code that enables non-modular header
 * inclusion only for React Native Firebase Pod targets.
 */
function createTargetedPostInstallCode(installerVar) {
  return `    # [expo-config-plugin] Allow non-modular includes for React Native Firebase
    rnfb_targets = ['RNFBApp', 'RNFBAuth', 'RNFBMessaging']

    ${installerVar}.pods_project.targets.each do |target|
      if rnfb_targets.include?(target.name) || target.name.start_with?('RNFB')
        target.build_configurations.each do |config|
          config.build_settings['CLANG_ALLOW_NON_MODULAR_INCLUDES_IN_FRAMEWORK_MODULES'] = 'YES'
        end
      end
    end`;
}

/**
 * Modifies the Podfile by inserting the configuration
 * inside its existing post_install hook.
 */
function modifyPodfile(podfileContents) {
  const postInstallPattern =
    /post_install\s+do\s+\|\s*(\w+)\s*\|/;

  const postInstallMatch = podfileContents.match(postInstallPattern);

  if (!postInstallMatch) {
    throw new Error(
      `[${PLUGIN_NAME}] Could not find the expected post_install hook in the iOS Podfile.`
    );
  }

  const installerParam = postInstallMatch[1];

  const postInstallCode =
    createTargetedPostInstallCode(installerParam);

  const anchor = new RegExp(
    `post_install\\s+do\\s+\\|\\s*${installerParam}\\s*\\|`
  );

  try {
    const result = mergeContents({
      tag: GENERATED_TAG,
      src: podfileContents,
      newSrc: postInstallCode,
      anchor,
      offset: 1,
      comment: '#',
    });

    if (!result.didMerge) {
      throw new Error(
        'The RNFirebase configuration was not inserted into the Podfile.'
      );
    }

    return result.contents;
  } catch (error) {
    throw new Error(
      `[${PLUGIN_NAME}] Failed to update the iOS Podfile: ${error.message}`
    );
  }
}

/**
 * Expo Config Plugin.
 */
function withIosNonModularHeaders(config) {
  return withPodfile(config, (podfileConfig) => {
    podfileConfig.modResults.contents = modifyPodfile(
      podfileConfig.modResults.contents
    );

    return podfileConfig;
  });
}

module.exports = createRunOncePlugin(
  withIosNonModularHeaders,
  PLUGIN_NAME,
  PLUGIN_VERSION
);
