#!/usr/bin/env node

const yargs = require('yargs');
const fs = require('fs');
const xmlParser = require('xml-js');

const { version } = require('../package');

const { argv } = yargs
  .usage('Usage: tinker --module <module_path>')
  .option('m', {
    alias: 'module',
    describe: 'Specify path of module to be implemented tinker'
  })
  .require('module')
  .help('help', 'Show this help and exit')
  .version(version);

if (!fs.existsSync(argv.module)) {
  console.error('Project module does not exist');
  process.exit(1);
}

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

  console.log(`Finished, now sync project in android studio`);
}

autoConfig().catch(e => console.error('Error: ' + e));