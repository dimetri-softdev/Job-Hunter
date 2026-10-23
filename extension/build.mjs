import { mkdir, readFile, copyFile, writeFile } from "node:fs/promises";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import ts from "typescript";

const extensionDirectory = dirname(fileURLToPath(import.meta.url));
const rootDirectory = resolve(extensionDirectory, "..");
const outputDirectory = join(extensionDirectory, "dist");

await mkdir(outputDirectory, { recursive: true });

for (const file of [
  "manifest.json",
  "popup.html",
  "popup.css",
  "popup.js",
  "background.js",
  "content.js",
]) {
  const sourcePath = join(extensionDirectory, file === "manifest.json" ? file : `src/${file}`);
  await copyFile(sourcePath, join(outputDirectory, file));
}

const mapperPath = join(rootDirectory, "src/lib/autofill-field-mapper.ts");
const mapperSource = await readFile(mapperPath, "utf8");
const mapperOutput = ts.transpileModule(mapperSource, {
  compilerOptions: {
    module: ts.ModuleKind.ESNext,
    target: ts.ScriptTarget.ES2022,
  },
  reportDiagnostics: true,
});

const errors = (mapperOutput.diagnostics ?? []).filter(
  (diagnostic) => diagnostic.category === ts.DiagnosticCategory.Error,
);
if (errors.length > 0) {
  throw new Error(
    ts.formatDiagnosticsWithColorAndContext(errors, {
      getCanonicalFileName: (fileName) => fileName,
      getCurrentDirectory: process.cwd,
      getNewLine: () => "\n",
    }),
  );
}

await writeFile(
  join(outputDirectory, "autofill-field-mapper.js"),
  mapperOutput.outputText,
  "utf8",
);

console.log(`Extension built at ${outputDirectory}`);