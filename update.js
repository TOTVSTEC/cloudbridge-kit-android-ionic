var task = module.exports,
	path = require('path'),
	Q = null;
	shelljs = null;

task.run = function run(cli, targetPath, projectData) {
	shelljs = cli.require('shelljs');
	Q = cli.require('q');

	if (shelljs.exec("cordova platform update android").code != 0) {
		throw new Error("Make sure cordova is installed (npm install -g cordova).");
	}

	return Q()
		.then(copyDependencies);
};

function copyDependencies() {
	var binPath = path.join(__dirname, "libs"),
		targetPath = path.join("platforms", "android"),
		targetBinPath = path.join(targetPath, "libs");

	//Binario
	var procDir = shelljs.ls("-d", path.join(binPath, "/*"));
	for (var i=0; i < procDir.length; i++){
		shelljs.cp("-rf", procDir[i], targetBinPath);
	}
}
