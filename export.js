#!/usr/bin/env node
/* A script built for Joel for exporting / running simulations */

// node export.js [input filename] [output filename] [params file]
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
const sampleCount = defaultEnvironment.sampleCount;

// The environment. Allows you to modify how many samples
const options = {
  sampleCount: sampleCount,
  xyPointLength: defaultEnvironment.xyPointLength,
};

// Main function, runs the squiggle code and writes output
async function main() {
  const contents = await fs.promises.readFile(INPUT_FILENAME);
  const code = contents.toString();
  const project = SqProject.create();
  project.setEnvironment(options);
  project.setSource("main", code);
  project.setSource("include", jsImportsToSquiggleCode(await getParams()));
  project.setContinues("main", ["include"]);
  project.runAll("main");
  const result = project.getResult("main");
  if (result.ok) {
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
//
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
