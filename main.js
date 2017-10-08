var esprima = require("esprima");
var options = {tokens:true, tolerant: true, loc: true, range: true };
var faker = require("faker");
var fs = require("fs");
faker.locale = "en";
var mock = require('mock-fs');
var _ = require('underscore');
var Random = require('random-js');

function main()
{
	var args = process.argv.slice(2);

	if( args.length == 0 )
	{
		// Default file: subject.js
		args = ["subject.js"];
	}
	var filePath = args[0];

	constraints(filePath);

	generateTestCases()

}


var engine = Random.engines.mt19937().autoSeed();
function createConcreteIntegerValue( greaterThan, constraintValue )
{
	if( greaterThan )
		return Random.integer(constraintValue,constraintValue+10)(engine);
	else
		return Random.integer(constraintValue-10,constraintValue)(engine);
}


function Constraint(properties)
{
	this.ident = properties.ident;
	this.expression = properties.expression;
	this.operator = properties.operator;
	this.value = properties.value;
	this.altvalue = properties.altvalue;
	this.funcName = properties.funcName;
	// Supported kinds: "fileWithContent","fileExists"
	// integer, string, phoneNumber
	this.kind = properties.kind;
}

//fakeDemo();

function fakeDemo()
{
	console.log( faker.phone.phoneNumber() );
	console.log( faker.phone.phoneNumberFormat() );
	console.log( faker.phone.phoneFormats() );
}

var functionConstraints = {}

var mockFileLibrary = 
{
	pathExists:
	{
		'path/fileExists': {}
	},
	fileWithContent:
	{
		pathContent: 
		{	
  			file1: 'text content',
		}
	}
};

function initalizeParams(constraints)
{
	var params = {};
	
	// initialize params
	for (var i =0; i < constraints.params.length; i++ )
	{
		var paramName = constraints.params[i];
		params[paramName] = []; // Change param into a array
	}
	return params;	
}

function fillParams(constraints,params,property)
{
	// plug-in values for parameters
	for( var c = 0; c < constraints.length; c++ )
	{
		var constraint = constraints[c];
		if( params.hasOwnProperty( constraint.ident ) )
		{
			if(!params[constraint.ident].includes(constraint[property]) && constraint[property] != undefined) // Check duplicate param options
				params[constraint.ident].push(constraint[property]);
		}
	}
}

var args = [];

function generateTestCases()
{
	var content = "var subject = require('./subject.js');\nvar mock = require('mock-fs');\n"// + "var subject = require('./subject.js');\n"
	for ( var funcName in functionConstraints )
	{
		//console.log("FuncName", funcName);
		var params = initalizeParams(functionConstraints[funcName])
		var altparams = initalizeParams(functionConstraints[funcName])

		// update parameter values based on known constraints.
		var constraints = functionConstraints[funcName].constraints;
		// Handle global constraints...
		var fileWithContent = _.some(constraints, {kind: 'fileWithContent' });
		var pathExists      = _.some(constraints, {kind: 'fileExists' });

		fillParams(constraints,params,"value")
		fillParams(constraints,params,"altvalue") // Put all param optional values into param array
		
		//console.log("ALT",altparams)
		// console.log("P",params)
		// Prepare function arguments.
		//var args = Object.keys(params).map( function(k) {return params[k]; }).join(",");
		//var altargs = Object.keys(altparams).map( function(k) {return altparams[k]; }).join(",");

		if( pathExists || fileWithContent )
		{
			//content += generateMockFsTestCases(pathExists,fileWithContent,funcName, args);
			//content += generateMockFsTestCases(!pathExists,fileWithContent,funcName, args);
			//content += generateMockFsTestCases(pathExists,!fileWithContent,funcName, args);
			//content += generateMockFsTestCases(!pathExists,!fileWithContent,funcName, args);
			
			args = [];
			buildArgs(params, "", 0);
			//console.log("Args",args);
			
			var buf = true;
			var len = true;

			content += generateMockFsTestCases(pathExists,fileWithContent,funcName,args,buf,len);
			content += generateMockFsTestCases(pathExists,fileWithContent,funcName,args,!buf,len);
			content += generateMockFsTestCases(pathExists,fileWithContent,funcName,args,buf,!len);
			content += generateMockFsTestCases(pathExists,fileWithContent,funcName,args,!buf,!len);
			content += generateMockFsTestCases(pathExists,!fileWithContent,funcName,args,buf,len);
			content += generateMockFsTestCases(pathExists,!fileWithContent,funcName,args,!buf,len);
			content += generateMockFsTestCases(pathExists,!fileWithContent,funcName,args,buf,!len);
			content += generateMockFsTestCases(pathExists,!fileWithContent,funcName,args,!buf,!len);
			content += generateMockFsTestCases(!pathExists,fileWithContent,funcName,args,buf,len);
			content += generateMockFsTestCases(!pathExists,fileWithContent,funcName,args,!buf,len);
			content += generateMockFsTestCases(!pathExists,fileWithContent,funcName,args,buf,!len);
			content += generateMockFsTestCases(!pathExists,fileWithContent,funcName,args,!buf,!len);
			content += generateMockFsTestCases(!pathExists,!fileWithContent,funcName,args,buf,len);
			content += generateMockFsTestCases(!pathExists,!fileWithContent,funcName,args,!buf,len);
			content += generateMockFsTestCases(!pathExists,!fileWithContent,funcName,args,buf,!len);
			content += generateMockFsTestCases(!pathExists,!fileWithContent,funcName,args,!buf,!len);				

		} else// Generate Simple Test Cases
		{
			args = [];
			//console.log( altargs )
			// Emit simple test case.
			buildArgs(params, "", 0);
			//console.log( args )
			for(var n in args) content += "subject.{0}({1});\n".format(funcName, args[n]);
			
		}

	}

	fs.writeFileSync('test.js', content, "utf8");

}


// Recursion method that prepares function arguments
function buildArgs(param, argStr, index)
{
	//console.log("Length", Object.keys(param).length);
	if(index < Object.keys(param).length-1){
		var paraName = Object.keys(param)[index];
		//console.log("Param",param[paraName]);
		if(param[paraName].length == 0){
			if(paraName == "phoneNumber") buildArgs(param, argStr + "\"" + faker.phone.phoneNumberFormat() + "\"" + ",", index+1);
			else if(paraName == "formatString") buildArgs(param, argStr + "\"" + faker.phone.phoneFormats() + "\"" + ",", index+1);
			else buildArgs(param, argStr + "\"TestString\"" + ",", index+1);
		}else{
			for( var i in param[paraName]){
				buildArgs(param, argStr + param[paraName][i] + ",", index+1);
			}
		}
	}else if(index == Object.keys(param).length-1){
		var paraName = Object.keys(param)[index];
		if(param[paraName].length == 0){
			if(paraName == "phoneNumber") buildArgs(param, argStr + "\"" + faker.phone.phoneNumberFormat() + "\"", index+1);
			else if(paraName == "formatString") buildArgs(param, argStr + "\"" + faker.phone.phoneFormats() + "\"", index+1);
			else buildArgs(param, argStr + "\"TestString\"", index+1);
		}else{
			for( var i in param[paraName]){
				buildArgs(param, argStr + param[paraName][i], index+1);
			}
		}	
	}else{
		//console.log("Args", arg);
		args.push(argStr);
	}
}


function generateMockFsTestCases(pathExists,fileWithContent,funcName, args, buf, len) 
{
	var testCase = "";
	// Build mock file system based on constraints.
	var mergedFS = {};

	if(!pathExists ){

	}else{
		if( pathExists )
		{
			for (var attrname in mockFileLibrary.pathExists) { mergedFS[attrname] = mockFileLibrary.pathExists[attrname]; }
		}

		 if( fileWithContent )
		{
			for (var attrname in mockFileLibrary.fileWithContent) { mergedFS[attrname] = mockFileLibrary.fileWithContent[attrname]; }
			mergedFS['path/fileExists'] = {'file1' : ''};
		}

		if( !fileWithContent )
		{
			for (var attrname in mockFileLibrary.fileWithContent) {  mergedFS[attrname] = mockFileLibrary.fileWithContent[attrname]; }
				mergedFS['path/fileExists'] = {'file1' : 'hello'};
				mergedFS['pathContent'] = {};
		}

		if( fileWithContent && ! buf ){
			for (var attrname in mockFileLibrary.fileWithContent) { mergedFS[attrname] = mockFileLibrary.fileWithContent[attrname]; }
			mergedFS['pathContent']={'file1' : ''};
		}
		if( fileWithContent && buf ){
			for (var attrname in mockFileLibrary.fileWithContent) { mergedFS[attrname] = mockFileLibrary.fileWithContent[attrname]; }
			mergedFS['path/fileExists']={'file1' : 'hello'};
			mergedFS['pathContent']={'file1' : 'hi'};
		}

		if ( len ) {
			for (var attrname in mockFileLibrary.fileWithContent) { mergedFS[attrname] = mockFileLibrary.fileWithContent[attrname]; }
			mergedFS['path/fileExists'] = {};
			mergedFS['pathContent'] = {};
		}
	}
	
	testCase += 
	"mock(" +
		JSON.stringify(mergedFS)
		+
	");\n";

	testCase += "\tsubject.{0}({1});\n".format(funcName, args[1]);
	testCase+="mock.restore();\n";
	return testCase;
}

function constraints(filePath)
{
	var buf = fs.readFileSync(filePath, "utf8");
    var result = esprima.parse(buf, options);

	traverse(result, function (node) 
	{
		if (node.type === 'FunctionDeclaration') 
		{
			var funcName = functionName(node);
			//console.log("Line : {0} Function: {1}".format(node.loc.start.line, funcName ));

			var params = node.params.map(function(p) {return p.name});

			functionConstraints[funcName] = {constraints:[], params: params};

			// Check for expressions using argument.
			traverse(node, function(child)
			{
				
				
				if( child.type === 'BinaryExpression' && (child.operator == "==" || child.operator == "!=" ))
				{
					// Left is a param
					if( child.left.type === 'Identifier' && params.indexOf( child.left.name ) > -1 )
					{
						// get expression from original source code:
						var expression = buf.substring(child.range[0], child.range[1]);
						var rightHand = buf.substring(child.right.range[0], child.right.range[1])
						//console.log("rightHand: " + rightHand);
						
						if( child.right.type === 'Literal'){ // Right is integer or string
						
							if( rightHand.includes("\"")){ // Right is String
							
								functionConstraints[funcName].constraints.push( 
									new Constraint(
									{
										ident: child.left.name,
										value: rightHand,
										altvalue: "\"" + rightHand.substring(1, rightHand.length-1)+"Salt"+"\"", // Add salt to string
										funcName: funcName,
										kind: "string",
										operator : child.operator,
										expression: expression
									}));
									
							}else{ // Right is Integer
							
								functionConstraints[funcName].constraints.push( 
									new Constraint(
									{
										ident: child.left.name,
										value: rightHand,
										altvalue: parseInt(rightHand) + createConcreteIntegerValue(true, parseInt(rightHand)),
										funcName: funcName,
										kind: "integer",
										operator : child.operator,
										expression: expression
									}));
								
							}
							
						} else if( child.right.type === 'Identifier' ){ // Right is identifier
							
							if( rightHand === "undefined"){ // Right is Undefined
								functionConstraints[funcName].constraints.push( 
									new Constraint(
									{
										ident: child.left.name,
										value: rightHand,
										altvalue: "\"Salt\"", 
										funcName: funcName,
										kind: "string",
										operator : child.operator,
										expression: expression
									}));
							}	
						}
					}// Left is a method call containing param
					else if( child.left.type === 'CallExpression' && params.indexOf( child.left.callee.object.name ) > -1 )
					{
						// get expression from original source code:
						var expression = buf.substring(child.range[0], child.range[1]);
						
						// For method "indexof"
						if( child.left.callee.property.name =='indexOf' ){
							//console.log("Callee", child.left.arguments[0].value);
							
							functionConstraints[funcName].constraints.push( 
								new Constraint(
								{
									ident: child.left.callee.object.name,
									value: "\"" + genStr(child.left.arguments[0].value,
														parseInt(buf.substring(child.right.range[0], child.right.range[1]))) + "\"", 
														//A string that contain substr at index
									altvalue: "\""+ genAntiStr(child.left.arguments[0].value,
														parseInt(buf.substring(child.right.range[0], child.right.range[1]))) +"\"", 
														//Empty string that does not contain substr at index 
									funcName: funcName,
									kind: "string",
									operator : child.operator,
									expression: expression
								}));
						}
					}// Left is not a param but a variable from param
					else if( child.left.type === 'Identifier' && child.left.name == 'area'){
						var expression = buf.substring(child.range[0], child.range[1]);
						var rightHand = buf.substring(child.right.range[0], child.right.range[1])
						functionConstraints[funcName].constraints.push( 
								new Constraint(
								{
									ident: "phoneNumber",
									value: "\"" + rightHand.substring(1,rightHand.length-1) 
										+ faker.phone.phoneNumberFormat().substring(rightHand.length-2, faker.phone.phoneNumberFormat().length) + "\"", 
										//A string that contain substr at index
									altvalue: "\""+ genAntiStr(rightHand.substring(1,rightHand.length-1),0) +"\"", 
										//Empty string that does not contain substr at index 
									funcName: funcName,
									kind: "string",
									operator : child.operator,
									expression: expression
								}));
					}
				}
				

				if( child.type === 'BinaryExpression' && (child.operator == "<" || child.operator == "<=" || child.operator == ">" || child.operator == ">=") )
				{
					if( child.left.type === 'Identifier' && params.indexOf( child.left.name ) > -1)
					{
						// get expression from original source code:
						var expression = buf.substring(child.range[0], child.range[1]);
						var rightHand = buf.substring(child.right.range[0], child.right.range[1])
						//console.log("Parse Result", parseInt(rightHand))
						
						functionConstraints[funcName].constraints.push( 
							new Constraint(
							{
								ident: child.left.name,
								value: createConcreteIntegerValue(true, parseInt(rightHand)+1),
								altvalue: createConcreteIntegerValue(false, parseInt(rightHand)-1),
								funcName: funcName,
								kind: "integer",
								operator : child.operator,
								expression: expression
							}));
					}
				}
				
				if( child.type == 'LogicalExpression' && (child.operator == '||' || child.operator == '&&') )
				{
					//console.log("Left name", child.left.argument.name);
					if( child.left.type === 'UnaryExpression' && child.left.operator == "!" && params.indexOf( child.left.argument.name ) > -1)
					{
						
						functionConstraints[funcName].constraints.push( 
							new Constraint(
							{
								ident: child.left.argument.name,
								value: true,
								altvalue: false,
								funcName: funcName,
								kind: "boolean",
								operator : child.left.operator,
							}));
					}
					
					if(child.right.type === 'UnaryExpression' && child.right.operator == "!" ){
						
						if(child.right.argument.type == "MemberExpression"  && params.indexOf( child.right.argument.object.name ) > -1){
							
							functionConstraints[funcName].constraints.push( 
								new Constraint(
								{
									ident: child.right.argument.object.name,
									value: "{"+child.right.argument.property.name+":"+"true"+"}",
									altvalue: "{"+child.right.argument.property.name+":"+"false"+"}",
									funcName: funcName,
									kind: "boolean",
									operator : child.right.operator,
								}));							

						}					
					}
				}
				

				if( child.type == "CallExpression" && 
					 child.callee.property &&
					 child.callee.property.name =="readFileSync" )
				{
					for( var p =0; p < params.length; p++ )
					{
						if( child.arguments[0].name == params[p] )
						{
							functionConstraints[funcName].constraints.push( 
							new Constraint(
							{
								ident: params[p],
								value:  "'pathContent/file1'",
								funcName: funcName,
								kind: "fileWithContent",
								operator : child.operator,
								expression: expression
							}));
						}
					}
				}

				if( child.type == "CallExpression" &&
					 child.callee.property &&
					 child.callee.property.name =="existsSync")
				{
					for( var p =0; p < params.length; p++ )
					{
						if( child.arguments[0].name == params[p] )
						{
							functionConstraints[funcName].constraints.push( 
							new Constraint(
							{
								ident: params[p],
								// A fake path to a file
								value:  "'path/fileExists'",
								funcName: funcName,
								kind: "fileExists",
								operator : child.operator,
								expression: expression
							}));
						}
					}					
				}

			});

			
			//console.log( functionConstraints[funcName]);

		}
	});
}

function traverse(object, visitor) 
{
    var key, child;

    visitor.call(null, object);
    for (key in object) {
        if (object.hasOwnProperty(key)) {
            child = object[key];
            if (typeof child === 'object' && child !== null) {
                traverse(child, visitor);
            }
        }
    }
}

function traverseWithCancel(object, visitor)
{
    var key, child;

    if( visitor.call(null, object) )
    {
	    for (key in object) {
	        if (object.hasOwnProperty(key)) {
	            child = object[key];
	            if (typeof child === 'object' && child !== null) {
	                traverseWithCancel(child, visitor);
	            }
	        }
	    }
 	 }
}

// Generate a string which contains "substr" at index of "index"
function genStr(substr, index){
	var str = "";
	
	for(var i = 0; i < index; i++){
		str += "S";
	}
	
	str += substr;
	return str;
}

// Generate a string which doesn't contain "substr" at index of "index"
function genAntiStr(substr, index){
	var str = "";
	
	if(index == -1) return str+substr;
	else return "";
}

function functionName( node )
{
	if( node.id )
	{
		return node.id.name;
	}
	return "";
}


if (!String.prototype.format) {
  String.prototype.format = function() {
    var args = arguments;
    return this.replace(/{(\d+)}/g, function(match, number) { 
      return typeof args[number] != 'undefined'
        ? args[number]
        : match
      ;
    });
  };
}

main();
exports.main = main;
