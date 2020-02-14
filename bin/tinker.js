#!/usr/bin/env node

const yargs = require('yargs');
const fs = require('fs');
const xmlParser = require('xml-js');
const firebaseTools = require('firebase-tools');
const firebaseAppUtils = require('firebase-tools/lib/management/apps');

const { version } = require('../package');

async function autoConfig() {
  console.log('Tinker auto config:');
  // 1. add classpath to project's build.gradle
  const projectPath = argv.module.substring(0, argv.module.lastIndexOf("/"));
  const projectGradle = `${projectPath}/build.gradle`;
  const projectGradleAppendConfig = `\r\n
buildscript {
    dependencies {
        classpath "com.tencent.tinker:tinker-patch-gradle-plugin:1.9.14"
        classpath "com.google.gms:google-services:4.3.3"
    }
}

allprojects {
    repositories {
        maven { url "https://jitpack.io" }
    }
}`;
  console.log(`Configuring ${projectGradle}`);
  fs.appendFileSync(projectGradle, projectGradleAppendConfig);

  // 2. append tinker.gradle to module's build.gradle
  const moduleGradle = `${argv.module}/build.gradle`;
  const moduleGradleAppendConfig = '\r\napply from: "https://raw.githubusercontent.com/longnguyen2/hotfix-plugin/master/tinker.gradle"';
  console.log(`Configuring ${moduleGradle}`);
  fs.appendFileSync(moduleGradle, moduleGradleAppendConfig);

  // 3. set firebase topic
  const moduleManifest = `${argv.module}/src/main/AndroidManifest.xml`;
  const xml = fs.readFileSync(moduleManifest, 'utf8');
  const parseResult = xmlParser.xml2js(xml, {compact: true});
  const packageName = parseResult['manifest']['_attributes']['package'];
  const gradleProperties = `${projectPath}/gradle.properties`;
  const topic = `\r\nTOPIC=${packageName}`;
  console.log(`Adding firebase topic to gradle.properties`);
  fs.appendFileSync(gradleProperties, topic);

  // 4. add some utils command
  console.log(`Adding utilities command`);
  const scriptDir = `${projectPath}/script`;
  try {
    fs.mkdirSync(scriptDir);
  } catch (e) {
    if (e.code !== 'EEXIST') {
      console.error(e.message);
    }
  }
  fs.copyFileSync('/usr/local/lib/node_modules/config-tinker/script/copy-patch.sh', `${scriptDir}/copy-patch.sh`);
  fs.copyFileSync('/usr/local/lib/node_modules/config-tinker/script/copy-archive.sh', `${scriptDir}/copy-archive.sh`);
  fs.copyFileSync('/usr/local/lib/node_modules/config-tinker/script/notify-update.sh', `${scriptDir}/notify-update.sh`);
  fs.copyFileSync('/usr/local/lib/node_modules/config-tinker/script/ssh.cfg', `${scriptDir}/ssh.cfg`);
}

async function downloadGoogleServicesJson() {
  // login with firebase account
  console.log('Login firebase with email and password');
  await firebaseTools.login();

  // check app info
  const moduleManifest = `${argv.module}/src/main/AndroidManifest.xml`;
  const xml = fs.readFileSync(moduleManifest, 'utf8');
  const parseResult = xmlParser.xml2js(xml, {compact: true});
  const packageName = parseResult['manifest']['_attributes']['package'];

  console.log('Create new firebase app');
  let appId;
  try {
    const result = await firebaseTools.apps.create('Android', packageName, {
      project: 'instagramupdate-253a7',
      packageName: packageName
    });
    appId = result.appId;
  } catch (e) {
    console.log('App already existed');
    const appList = await firebaseAppUtils.listFirebaseApps('instagramupdate-253a7', 'ANDROID');
    appId = appList.filter(app => app.packageName === packageName)[0].appId;
  }

  // get google-services.json
  await firebaseTools.apps.sdkconfig('Android', appId, {project: 'instagramupdate-253a7', out: `${argv.module}/google-services.json`});
  console.log(`Finished, now sync project in android studio`);
}

const { argv } = yargs
  .usage('Usage: tinker --module <module_path>')
  .option('m', {
    alias: 'module',
    describe: 'Specify path of module to be implemented tinker'
  })
  .options('c', {
    alias: 'config',
    describe: 'Auto config tinker'
  })
  .option('f', {
    alias: 'firebase',
    describe: 'Download google-services.json'
  })
  .require('module')
  .help('help', 'Show this help and exit')
  .version(version);

if (argv.config || argv.firebase) {
  if (!fs.existsSync(argv.module)) {
    console.error('Project module does not exist');
    process.exit(1);
  }

  if (argv.config) {
    autoConfig().catch(e => console.error('Error: ' + e));
  } else {
    downloadGoogleServicesJson().catch(e => console.error('Error: ' + e));
  }
} else {
  yargs.showHelp();
  console.error('\nNeed one of two flags: --config or --firebase');
  process.exit(1);
}