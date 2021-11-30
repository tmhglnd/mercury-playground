# TOKENIZER
@{%
const moo = require('moo');
const IR = require('./mercuryIR.js');

const lexer = moo.compile({
	// comment:	/(?:\/\/|\$).*?$/,
	comment:	/(?:\/\/).*?$/,
	
	//instrument: [/synth/, /sample/, /polySynth/, /loop/, /emitter/],
	/*instrument:	{
					match: [/synth\ /, /sample\ /, /polySynth\ /, /loop\ /,/emitter\ / ],
					value: x => x.slice(0, x.length-1)
				},*/

	list:		[/ring /, /array /, /list /],
	newObject:	[/new /, /make /, /add(?: |$)/],
	setObject:	[/set /, /apply /, /give /, /send /],
	print:		[/print /, /post /, /log /],

	//action:		[/ring\ /, /new\ /, /set\ /],
	//kill:		/kill[\-|_]?[a|A]ll/,

	seperator:	/,/,
	//newLine:	/[&;]/,
	
	//note:	/[a-gA-G](?:[0-9])?(?:#+|b+|x)?/,
	number:		/[+-]?(?:[0-9]|[0-9]+)(?:\.[0-9]+)?(?:[eE][-+]?[0-9]+)?\b/,
	//hex:		/0x[0-9a-f]+/,
	
	divider:	/[/:]/,

	//timevalue:	/[nm]/,

	lParam:		'(',
	rParam:		')',
	lArray:		'[',
	rArray:		']',
	//lFunc:		'{',
	//rFunc:		'}'
	
	string:		{ 
					match: /["'`](?:\\["\\]|[^\n"'``])*["'`]/, 
					value: x => x.slice(1, x.length-1)
				},
	
	//identifier:	/[a-zA-Z\_\-][a-zA-Z0-9\_\-\.]*/,
	//identifier:	/[a-zA-Z\_\-][^\s]*/,
	identifier:	/[^0-9\s][^\s\(\)\[\]]*/,

	//signal:		/~(?:\\["\\]|[^\n"\\ \t])+/,
	//osc:		/\/(?:\\["\\]|[^\n"\\ \t])*/,

	ws:			/[ \t]+/,
});
%}

# Pass your lexer object using the @lexer option:
@lexer lexer

main ->
	_ globalStatement _ %comment:?
		{% (d) => { return { "@global" : d[1] }} %}
	|
	_ listStatement _ %comment:?
		{% (d) => { return { "@list" : d[1] }} %}
	|
	_ objectStatement _ %comment:?
		{% (d) => { return { "@object" : d[1] }} %}
	# |
	# _ %newObject | %setObject | %ring _
	# 	{% (d) => {
	# 		console.log('not enough arguments for message');
	# 		return null; 
	# 	}%}

objectStatement ->
	%newObject _ %identifier __ objectIdentifier
		{% (d) => {
			return {
				//"@action" : 'new',
				"@new" : {
					"@inst" : d[2].value,
					"@type" : d[4]
				}
			}
		}%}
	|
	%newObject _ %identifier __ objectIdentifier __ objExpression
		{% (d) => {
			return {
				//"@action" : 'new',
				"@new" : {
					"@inst" : d[2].value,
					"@type" : d[4],
					"@functions" : d[6]
				}
			}
		}%}
	|
	%setObject _ %identifier __ objExpression
		{% (d) => {	
			return {
				"@set" : {
					"@name" : d[2].value,
					"@functions" : d[4]
				}
				//"@action" : 'set',
			}
		}%}
	# |
	# %setObject _ name __ objExpression
	# 	{% (d) => {	
	# 		return {
	# 			"@action" : 'set',
	# 			"@name" : d[2],
	# 			"@functions" : d[4]
	# 		}
	# 	}%}

# an identifier can be a name or a 'string'
objectIdentifier ->
	name
		{% id %}
	|
	array
		{% id %}

# lists in the form of: list identifier [ params ]
listStatement ->
	%list _ %identifier _ paramElement
		{% (d) => {
			return {
				"@name" : d[2].value,
				"@params" : d[4]
			}
		} %}

# make a comment or print a value/function
globalStatement ->
	%comment
		{% (d) => { return { "@comment" : d[0].value }} %}
	|
	%print _ objExpression
		{% (d) => { return { "@print" : d[2] }} %}
	|
	name
		{% (d) => { return { "@settings" : d[0] }} %}
	# |
	# objExpression
		# {% (d) => { return { "@print" : d[0] }} %}
	# |
	# objExpression _ %seperator:?
	# 	{% (d) => d[0] %}
	# |
	# objExpression _ %seperator _ statement
	# 	{% (d) => [d[0], d[4]] %}

# an expression can be one or multiple functions or elements
objExpression ->
	paramElement
		{% (d) => [d[0]] %}
	|
	paramElement __ objExpression
		{% (d) => [d[0], d[2]].flat(Infinity) %}

# ringExpression ->
# 	paramElement
# 		{% (d) => d[0] %}

# function in the form of: identifier( arguments )
function ->
	# optional whitespace between name and (
	%identifier functionArguments
		{% (d) => {
			return { 
				//"@function": IR.bindFunction(d[0].value),
				"@function": { 
					"@name": IR.keyBind(d[0].value),
					"@args": d[1]
				}
			}
		}%}

# arguments start with '(', some optional params, end with ')'
functionArguments ->
	%lParam _ params:? _ %rParam
		{% (d) => d[2] %}

# array starts with '[', some optional params, ends with ']'
array ->
	%lArray _ params:? _ %rArray
		{% (d) => { return { "@array" : d[2] }} %}

# parameters can be param element or element followed by more params
params ->
	# paramElement _ %seperator:?
	paramElement
		{% (d) => [d[0]] %}
	|
	# paramElement _ %seperator:? _ params
	paramElement _ params
		{% (d) => [d[0], d[2]].flat(Infinity) %}

# parameter elements can be:
# number, name, string, array, function, division
paramElement ->
	%number
		{% (d) => { return IR.num(d) } %}
	|
	name
		{% (d) => d[0] %}
	|
	array
		{% (d) => d[0] %}
	|
	function
		{% (d) => d[0] %}
	|
	division
		{% (d) => d[0] %}
	# |
	# timing
	# 	{% (d) => d[0] %}
	# |	
	# %osc
	# 	{% (d) => { return { "@address" : d[0].value }} %}

# any division value in the form of xx/xx or xx:xx
division ->
	%number %divider %number
		{% (d) => { return IR.division(d) } %}

# a timevalue syntax in the form of \d+[nm](dt.)? (eg. 8n, 16nt, 4nd)
# timing ->
# 	%number %timevalue
# 		{% (d) => { return IR.identifier(d) } %}

# any string or identifier
# other identifiers: note (c g# eb ax), signal (~)
name ->
	%identifier
		{% (d) => { return IR.identifier(d) } %}
	|
	%string
		{% (d) => { return { "@string" : d[0].value }} %}

# optional whitespace
_  -> 		wschar:* 	{% (d) => null %}
# mendatory whitespace
__ -> 		wschar:+ 	{% (d) => null %}
# whitespace
wschar -> 	%ws 		{% id %}