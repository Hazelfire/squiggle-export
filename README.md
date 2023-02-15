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

You can specify arbitrary outputs (like Records, arrays, numbers, string etc)
as well as arbitrary parameters. You cannot have distributions as inputs.

```
npm install @quri/squiggle-lang
```
