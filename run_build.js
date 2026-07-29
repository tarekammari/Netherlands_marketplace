const { execSync } = require("child_process");
try {
  console.log("Running next build...");
  const output = execSync("node_modules\\.bin\\next build", { encoding: "utf8", stdio: "pipe" });
  console.log(output);
} catch (error) {
  console.error(error.stdout || error.message);
  if (error.stderr) console.error(error.stderr);
  process.exit(1);
}
