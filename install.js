var path = require('path'),
	fs = require('fs'),
	os = require('os'),
	Q = null,
	shelljs = null,
	utils = null,
	inquirer = null,
	cordova = null,
	semver = null;

const OPTIONS_OVERWIRTE = 0,
	OPTIONS_RENAME = 1;

module.exports.run = function run(cli, targetPath, projectData) {
	var task = new InstallTask(cli, targetPath, projectData);

	return task.run();
};

class InstallTask {

	constructor(cli, targetPath, projectData) {
		this.cli = cli;
		this.projectDir = targetPath;
		this.projectData = projectData;

		Q = cli.require('q');
		shelljs = cli.require('shelljs');
		inquirer = cli.require('inquirer');
		utils = cli.utils;
		cordova = cb_require('utils/cordova');
		semver = cli.require('semver');
	}

	run() {
		var self = this;

		return Q()
			.then(function() {
				return self.checkForExistingFiles();
			})
			.then(function(action) {
				var promise = null;

				if (action === OPTIONS_RENAME) {
					promise = self.renameSources();
				}
				else {
					promise = self.cleanSources();
				}
				if (promise !== null) {
					return promise;
				}
			})
			.then(function() {
				return self.runCordova();
			})
			.then(function() {
				return self.copySources();
			});
			// .then(function() {
			// 	var restoreTask = require('./restore');

			// 	return restoreTask.run(self.cli, self.projectDir, self.projectData);
			// });
	}

	cleanSources() {
		var srcPath = path.join(this.projectDir, 'platforms', 'android');

		if (fs.existsSync(srcPath)) {
			shelljs.rm("-rf", srcPath);
		}

		return Q();
	}

	copySources() {
		var androidVersion = cordova.findCordovaAndroidVersion(this.projectDir),
			packagePath = path.join.apply(path, this.projectData.id.split('.')),
			kitSrc = path.join(__dirname, "src"),
			binPath = path.join(__dirname, "libs"),
			assetsPath = path.join(__dirname, "assets"),
			targetPath = path.join(this.projectDir, "platforms", "android"),
			targetMainPath = path.join(targetPath, 'app', 'src', 'main'),
			targetPackageDir = path.join(targetMainPath, "java", "com", "totvs", "appserver"),
			targetMActivity = path.join(targetMainPath, "java", packagePath),
			targetAssetsPath = path.join(targetMainPath, "assets"),
			targetBinPath = path.join(targetMainPath, "jniLibs");

		if (semver.lt(androidVersion, '7.0.0')) {
			targetPackageDir = path.join(targetPath, "src", "com", "totvs", "appserver");
			targetMActivity = path.join(targetPath, "src", packagePath);
			targetAssetsPath = path.join(targetPath, "assets");
			targetBinPath = path.join(targetPath, "libs");
		}

		// create directories
		shelljs.mkdir('-p', targetPackageDir);
		shelljs.mkdir('-p', targetMActivity);
		shelljs.mkdir('-p', targetBinPath);
		shelljs.mkdir('-p', targetAssetsPath);

		console.log('directories created!');

		//AppServer.java
		shelljs.cp("-f", path.join(kitSrc, "AppServer.java"), targetPackageDir);

		console.log('AppServer.java copied!');

		var tempFolder = path.join(os.tmpdir(), 'cloudbridge-' + new Date().getTime());
		shelljs.mkdir('-p', tempFolder);
		shelljs.cp("-f", path.join(kitSrc, "MainActivity.java"), tempFolder);

		utils.copyTemplate(tempFolder, targetMActivity, {
			project: this.projectData
		}, /\.(java)/);

		console.log('MainActivity.java copied!');

		shelljs.rm('-rf', tempFolder);

		//Binario
		var jnis = shelljs.ls("-d", path.join(binPath, "*"));
		for (var i = 0; i < jnis.length; i++) {
			shelljs.cp("-rf", jnis[i], targetBinPath);
		}

		console.log('libs copied!');

		//Assets
		var assets = shelljs.ls(path.join(assetsPath, "*"));
		for (var j = 0; j < assets.length; j++) {
			shelljs.cp("-rf", assets[j], targetAssetsPath);
		}

		console.log('assets copied!');
	}

	checkForExistingFiles() {
		var deferred = Q.defer(),
			targetPath = path.join(this.projectDir, 'platforms', 'android');

		if (fs.existsSync(targetPath)) {
			inquirer.prompt([{
				type: 'list',
				name: 'action',
				message: ['The directory'.error.bold, targetPath, 'already exists.\n'.error.bold].join(' '),
				choices: [
					{
						name: 'Clean',
						value: OPTIONS_OVERWIRTE, //'overwrite',
						short: '\nCleaning folder and files...'
					},
					{
						name: 'Rename',
						value: OPTIONS_RENAME,// 'rename',
						short: '\nRenaming the existing directory and copying the new files...'
					},
					new inquirer.Separator(' ')
				],
				default: OPTIONS_RENAME	//'rename'
			}]).then(function(answers) {
				deferred.resolve(answers.action);
			});
		}
		else {
			deferred.resolve({});
		}

		return deferred.promise;
	}

	renameSources() {
		var srcPath = path.join(this.projectDir, 'platforms', 'android'),
			targetPath = path.join(this.projectDir, 'platforms', 'android.old');

		if (fs.existsSync(targetPath)) {
			var count = 1;
			while (fs.existsSync(targetPath + '.' + count)) {
				count++;
			}

			targetPath += '.' + count;
		}

		shelljs.mv(srcPath, targetPath);

		return Q();
	}

	runCordova() {
		if (shelljs.exec("ionic cordova platform add android").code != 0) {
			shelljs.rm('-rf', path.join(_this.projectDir, "platforms", "android"));
			throw new Error("Make sure cordova is installed (npm install -g cordova).");
		}

		return Q();
	}
}
