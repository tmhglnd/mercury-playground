// 
// The default instrument objects for Mercury
// 

const objects = {
	'empty' : {
		'object' : '',
		'type' : '',
		'functions' : {
			'group' : [],
			'add_fx' : []
		}
	},
	'synth' : {
		'object' : '',
		'type' : 'saw',
		'functions' : {
			'group' : [],
			'time' : [ '1/1', 0 ],
			'note' : [ 0, 0 ],
			'env' : [ 1, 250 ],
			'beat' : [ 1 ],
			'amp' : [ 0.7 ],
			'wave2' : [ 'saw', 0 ],
			'add_fx' : [],
		}
	},
	'polySynth' : {
		'object' : '',
		'type' : 'saw',
		'functions' : {
			'group' : [],
			'time' : [ '1/1', 0 ],
			'note' : [ 0, 0 ],
			'env' : [ 1, 250 ],
			'beat' : [ 1 ],
			'amp' : [ 0.7 ],
			'wave2' : [ 'saw', 0 ],
			'add_fx' : [],
		}
	},
	'sample' : {
		'object' : '',
		'type' : 'kick_909',
		'functions' : {
			'group' : [],
			'time' : [ '1/1', 0 ],
			'speed' : [ 1 ],
			// 'note' : [ 0, 0 ],
			'env' : [ -1 ],
			'beat' : [ 1 ],
			'amp' : [ 0.9 ],
			'stretch': [0, 1, 1],
			'add_fx' : [],
		}
	},
	'loop' : {
		'object' : '',
		'type' : 'amen',
		'functions' : {
			'group' : [],
			'time' : [ '1/1', 0 ],
			'speed' : [ 1 ],
			// 'note' : [ 0, 0 ],
			'env' : [ -1 ],
			'beat' : [ 1 ],
			'amp' : [ 0.9 ],
			'stretch': [1, 1, 1],
			'add_fx' : [],
		}
	},
	'midi' : {
		'object' : '',
		'type' : 'default',
		'functions' : {
			'group' : [],
			'time' : [ '1/1', 0 ],
			'note' : [ 0, 0 ],
			'env' : [ 100 ],
			'out' : [ 1 ],
			'chord' : 'off',
			'sync' : 'off',
			'add_fx' : []
		}
	}
}
module.exports = { objects };