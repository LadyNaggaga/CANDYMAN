var _ = require('lodash');
var walk = require('klaw');
var chalk = require('chalk');
var mkdirp = require('mkdirp');
var framework = require('./frameworks.js')
var generators = require('yeoman-generator');

var success = false;

module.exports = generators.Base.extend({
	constructor: function() {
		generators.Base.apply(this, arguments);

		// This makes `appname` a required argument.
    	this.argument('appname', { type: String, required: false });
    	// And you can then access it later on this way; e.g. CamelCased
    	this.appname = _.camelCase(this.appname);
	},

	//Initialize variables and opening statement
	initializing: function() {
		this.log(chalk.cyan.bold("Barebones ASP.NET Core Application\n"));
		this.log(chalk.cyan("\t<includes: bootstrap, jquery>\n"));
	},

	//Prompt user for any data inputs
	prompting: function() {
		if(this.appname){
			this.log(chalk.green("App name provided - Skipping prompt"));
		}
		var gen = this;
		var done = this.async();
	    return this.prompt([{
	      type    : 'input',
	      name    : 'name',
	      message : 'Enter your project name',
		  when: function() {
			  return !(gen.appname);
		  }
	    }, {
		  type    : 'list',
	      name    : 'css',
	      message : 'What CSS Framework would you like to use?',
		  choices : [{name:"None"}, framework.skeleton, framework.bootstrap],
	      store   : true	
		}, {
		  type    : 'list',
		  name    : 'jquery',
		  message : 'Would you like to enable jQuery?',
		  choices : ['Yes', 'No'],
		  store   : true
		}
		]).then(function(answers) {
		  if (answers.name){
			this.appname =  answers.name;
		  }
		  this.framework = answers.css;
		  this.jquery = answers.jquery;
	      done();
	    }.bind(this));
	},

	//Define Paths
	paths: function() {
		this.sourceRoot();
		this.templatePath('index.js');
	},

	//Write File Systems
	writing: {
		//Build out all folders needed
		scaffoldFolders: function() {
			mkdirp(this.appname + "/Controllers");
			mkdirp(this.appname + "/Views/Shared");
			mkdirp(this.appname + "/Views/Home");
			mkdirp(this.appname + "/wwwroot/css");
			mkdirp(this.appname + "/wwwroot/images");
			mkdirp(this.appname + "/wwwroot/js");
		},

		//Add base JS and CSS Files in the wwwroot path
		scaffoldStatic: function() {
			this.fs.copy(
				this.templatePath("_wwwroot/"),
				this.destinationPath(this.appname + '/wwwroot/')
			);
		},

		//Bower Files
		bower: function() {
			this.fs.copyTpl(
				this.templatePath('_bower.json'),
				this.destinationPath(this.appname + '/bower.json'),
				{ title: this.appname, framework: this.framework, jquery: this.jquery }
			);
			this.fs.copy(
				this.templatePath('bowerrc'),
				this.destinationPath(this.appname + '/.bowerrc')
			);
		},

		//Project.json File
		jsproject: function() {
			this.fs.copy(
				this.templatePath('_project.json'),
				this.destinationPath(this.appname + '/project.json')
			);
		},

		//Start-up and Program CS File
		baseConfig: function() {
			this.fs.copyTpl(
				this.templatePath('_Startup.cs'),
				this.destinationPath(this.appname + '/Startup.cs'),
				{ namespace: this.appname }
			);
			this.fs.copyTpl(
				this.templatePath('_Program.cs'),
				this.destinationPath(this.appname + '/Program.cs'),
				{ namespace: this.appname }
			);
		},

		//Controller Files
		controller: function() {
			this.fs.copyTpl(
				this.templatePath('_Controllers/_HomeController.cs'),
				this.destinationPath(this.appname + '/Controllers/HomeController.cs'),
				{ namespace: this.appname }
			);
		},

		//View Files
		views: function() {
			this.fs.copy(
				this.templatePath('_Views/_Home/_Index.cshtml'),
				this.destinationPath(this.appname + '/Views/Home/Index.cshtml')
			);
			this.fs.copyTpl(
				this.templatePath('_Views/_Shared/_Layout.cshtml'),
				this.destinationPath(this.appname + '/Views/Shared/_Layout.cshtml'),
				{ title: this.appname, framework: this.framework, jquery: this.jquery }
			);
			this.fs.copyTpl(
				this.templatePath('_Views/_ViewImports.cshtml'),
				this.destinationPath(this.appname + '/Views/_ViewImports.cshtml'),
				{ namespace: this.appname }
			);
			this.fs.copy(
				this.templatePath('_Views/_ViewStart.cshtml'),
				this.destinationPath(this.appname + '/Views/_ViewStart.cshtml')
			);
	    	// var tempRoute = this.templatePath("_Views/");
	    	// var gen = this;
	    	// walk(tempRoute)
	    	// 	.on('data', function(item){
	    	// 		//if item ends in .cshtml it is one to add
	    	// 		if(item.path.endsWith(".cshtml")){
	    	// 			//Remove all underscores from everything after templates as to make proper destination path
	    	// 			var dest = item.path.split("templates")[1].replace(/_/g,"");
	    	// 			gen.fs.copy(
						// 	item.path,
						// 	gen.destinationPath(gen.appname + dest)
						// );
	    	// 		}
	    	// 	});
		}
	},

	//Run terminal install commmands
	install: function() {
		var gen = this;
		this.log(chalk.blue("Configuring and Installing Bower Packages..."));
		this.bowerInstall('', {
			'config.cwd': ("./" + this.appname)	
		},
		function(err){
			if(err){
				console.log(chalk.red(err));
			}else{
				success = true;
				console.log(chalk.green("Finished Bower Install!"));
				//************************************
				//Disabled Auto-run dotnet restore because it was restoring all projects
				//in directory where the yeoman generator was run
				//Plan to re-enable at a later point
				//************************************
				// gen.spawnCommand('dotnet', ['restore'], {
				// 	'config.cwd': (("./" + gen.appname + "/"))
				// },
				// function(err){
				// 	if(err){
				// 		console.log(chalk.red(err));
				// 	}else{
				// 		console.log(chalk.green("Finished DotNet Restore!"));
				// 	}
				// });
			}
		});
	},

	//Wrap-up messages
	end: function() {
		var base = chalk.bold(("------------------------") + "\n");
		if(success){
			this.log(base + chalk.cyan.bold("Base ASP.NET application successfully created\n") + base);
		} else {
			this.log(base + chalk.red.bold("App failed to be created...\nReview Logs above to see what may have gone wrong\n") + base);
		}
	}

	//
	//Possible function to install bower if it does not already exist?
	//
});