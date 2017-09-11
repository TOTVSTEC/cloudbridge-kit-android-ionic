var path = require('path'),
	fs = require('fs'),
	os = require('os'),
	Q = null,
	shelljs = null,
	utils = null,
	inquirer = null;

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
		var kitSrc = path.join(__dirname, "src"),
			appServerPackagedir = path.join(kitSrc, "com", "totvs", "appserver"),
			mActivity = path.join(kitSrc, "io", "ionic", "stater" ),
			binPath = path.join(__dirname, "libs"),
			assetsPath = path.join(__dirname, "assets"),
			targetPath = path.join("platforms", "android"),
			targetPackageDir = path.join(targetPath, "src", "com", "totvs", "appserver"),
			targetMActivity = path.join(targetPath, "src", "io", "cordova", "hellocordova"),
			targetAssetsPath = path.join(targetPath, "assets"),
			targetBinPath = path.join(targetPath, "libs");

		// AppServer package (com/totvs/appserver)
		shelljs.mkdir('-p', targetPackageDir);
		//AppServer.java
		var files = shelljs.ls(path.join(appServerPackagedir, "*.java"));
		for (var i = 0; i < files.length; i++){
			var targetFile = path.join(targetPackageDir, path.basename(files[i]));
			shelljs.cp("-f", files[i], targetFile);
		}

		//MainActivity
		files = shelljs.ls(path.join(mActivity, "*.java"));
		for (var i = 0; i < files.length; i++){
			var targetFile = path.join(targetPackageDir, path.basename(files[i]));
			shelljs.cp("-f", files[i], targetFile);
		}

		//Binario
		var procDir = shelljs.ls("-d", path.join(binPath, "/*"));
		for (var i=0; i < procDir.length; i++){
			shelljs.cp("-rf", procDir[i], targetBinPath);
		}

		//Assets
		var fassets = shelljs.ls(path.join(assetsPath, "*"));
		for (var i = 0; i < fassets.length; i++){
			shelljs.cp("-rf", fassets[i], targetAssetsPath);
		}

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
		if (shelljs.exec("cordova platform add android").code != 0) {
			shelljs.rm('-rf', path.join(_this.projectDir, "platforms", "android"));
			throw new Error("Make sure cordova is installed (npm install -g cordova).");
		}

		return Q();
	}
}
