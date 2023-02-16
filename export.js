#!/usr/bin/env node
/* A script built for Joel for exporting / running simulations */

// ./export.js [input filename] [output filename] [params file]
// Default input filename is my_model.squiggle and default output filename is output.json

// Imports
const { SqProject, defaultEnvironment } = require("@quri/squiggle-lang");
const fs = require("fs");

// Get filenames, either from the command line or the default
const INPUT_FILENAME = process.argv[2] ?? "my_model.squiggle";
const OUTPUT_FILENAME = process.argv[3] ?? "output.json";

// If you wish, you can either edit the paramaters here, or create a seperate
// .json file and put them there so that you can change them on every execution
const defaultParams = {};

// Get paramaters, either from command line or the default ones
async function getParams() {
  if (process.argv[4]) {
    let params = await fs.promises.readFile(process.argv[4]);
    return JSON.parse(params.toString());
  } else {
    return defaultParams;
  }
}

// The amount of samples to calculate with
// Change this to change the amount of samples.
const sampleCount = defaultEnvironment.sampleCount; // default is 10,000

// The environment. Allows you to modify how many samples
const options = {
  sampleCount: sampleCount,
  // This paramater is the amount of points to use in pointset dists
  xyPointLength: defaultEnvironment.xyPointLength,
};

// Main function, runs the squiggle code and writes output
async function main() {
  // Read input code file
  const contents = await fs.promises.readFile(INPUT_FILENAME);
  const code = contents.toString();

  // Create Squiggle project
  const project = SqProject.create();
  project.setEnvironment(options);

  // create a source named "main" that has the code in it
  project.setSource("main", code);

  // Create an includes source, which contains the parameters
  project.setSource("include", jsImportsToSquiggleCode(await getParams()));

  // Allow main to access variabled declared in parameters
  project.setContinues("main", ["include"]);

  // Run all code
  project.runAll("main");

  // Get result of squiggle execution
  const result = project.getResult("main");
  if (result.ok) {
    // Convert value into JSON and save
    const value = squiggleValueToJson(result.value);
    await fs.promises.writeFile(OUTPUT_FILENAME, JSON.stringify(value));
  } else {
    console.error(result.value.toString());
  }
}

main();

///////////////////////////////////////////////////////////////////////////
//                           Utility functions                           //
///////////////////////////////////////////////////////////////////////////

// Convert a returned squiggle file into a JavaScript object that can be saved
// to a file
function squiggleValueToJson(value) {
  if (value.tag === "Dist") {
    return { samples: value.value._value.sampleN(sampleCount) };
  } else if (value.tag === "Record") {
    const entries = value.value.entries();
    return Object.fromEntries(
      entries.map(([key, value]) => [key, squiggleValueToJson(value)])
    );
  } else if (value.tag === "Array") {
    return value.value.getValues().map((x) => squiggleValueToJson(x));
  } else if (
    value.tag === "String" ||
    value.tag === "Number" ||
    value.tag === "Boolean"
  ) {
    return value.value;
  } else {
    return { error: `Could not parse type ${value.tag}` };
  }
}

var quote = function (arg) {
  return '"'.concat(arg.replace(new RegExp('"', "g"), '\\"'), '"');
};

function jsImportsValueToSquiggleCode(v) {
  if (typeof v === "number") {
    return String(v);
  } else if (typeof v === "string") {
    return quote(v);
  } else if (v instanceof Array) {
    return (
      "[" +
      v.map(function (x) {
        return jsImportsValueToSquiggleCode(x);
      }) +
      "]"
    );
  } else {
    if (Object.keys(v).length) {
      return (
        "{" +
        Object.entries(v)
          .map(function (_a) {
            var k = _a[0],
              v = _a[1];
            return ""
              .concat(quote(k), ":")
              .concat(jsImportsValueToSquiggleCode(v), ",");
          })
          .join("") +
        "}"
      );
    } else {
      return "{}";
    }
  }
}

// Convert a json object into squiggle code that is used as parameters
// In the past, Squiggle had in-built import functionality, but that was removed
// in a refactor. I believe we will be adding this back in the near future.
// But for now, this is the hacky code that just generates squiggle source code
// that is used as parameters.
function jsImportsToSquiggleCode(v) {
  var validId = new RegExp("[a-zA-Z][[a-zA-Z0-9]*");
  var result = Object.entries(v)
    .map(function (_a) {
      var k = _a[0],
        v = _a[1];
      if (!k.match(validId)) {
        return ""; // skipping without warnings; can be improved
      }
      return "$".concat(k, " = ").concat(jsImportsValueToSquiggleCode(v), "\n");
    })
    .join("");
  if (!result) {
    result = "$__no_valid_imports__ = 1"; // without this generated squiggle code can be invalid
  }
  return result;
}
