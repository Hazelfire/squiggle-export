# Example JS Squiggle utility

This is an example squiggle utility for use by Joel to export results of squiggle
calculations. It exports to JSON files.

To run, simply call the export.js script:

```
./export.js [input .squiggle file] [output .json file] [parameters .json file]
```

Note that this works on .squiggle files and not the .squiggleU files!

Examples of all such files have been included in this repo.

I'll add more documentation later if it's confusing. But hopefully this should
give you a good headstart!

The `export.js` script is standalone, so you should be able to copy this to any
repo (and rename it what you wish). As long as you have squiggle in the environment:

```bash
npm install @quri/squiggle-lang
```

Paramaters are a json file, see an example in parameters.json. This file
will be an object with keys:

```json
{
  "x": 3,
  "y": [1, 2, 3],
  "z": { "x": 2 }
}
```

These keys will show up as parameters that you can use in your own models:

```
normal($x, $z.x) // same as normal(3, 2)
```

When run, this will create a distribution. However, you can also export lists,
numbers, strings, dictionaries etc to the output. This makes it easy to export
multiple distributions:

```
{ dist1: normal(3, 2), moreDists: [normal(5, 3), 2 to 10], method: "OLS", pValue: 0.001}
```

This will export a JSON file in that shape.

Distribution objects are sampled and returns an object like this:

```
{ "samples": [ ... list of numbers which represent samples ... ] }
```
