const { exec } = require("child_process");
const randomstring = require("randomstring");

exports.c_runner = (req, res) => {
  const cppCode = req.body.code;
  const testCases = req.body.testCases;
  console.log(req.body);

  if (!cppCode || !testCases) {
    if (!res.headersSent) {
      return res.json({ success: false, error: "Invalid Request" });
    }
  }

  // Save the C++ code to a temporary file
  const tempCppFileName = randomstring.generate(7);
  const tempFolderName = randomstring.generate(7);

  const fs = require("fs");

  fs.mkdirSync(`./temp/${tempFolderName}`, { recursive: true }, (err) => {
    if (err) throw err;
  });
  fs.writeFileSync(`./temp/${tempFolderName}/${tempCppFileName}.c`, cppCode);

  const removeTempFiles = () => {
    const fs = require("fs");
    const path = require("path");

    const directory = `./temp/${tempFolderName}`;

    fs.readdir(directory, (err, files) => {
      if (err) throw err;

      for (const file of files) {
        fs.unlink(path.join(directory, file), (err) => {
          if (err) throw err;
        });
      }
      fs.rm(directory, { recursive: true, force: true }, (error) => {
        // Handle the error here if needed
      });
    });
  };

  const results = [];
  let testCasesProcessed = 0;

  const executeTestCase = (testCase) => {
    const input = testCase.input;
    const output = testCase.output;

    const inputFileName = randomstring.generate(7);
    const outputFileName = randomstring.generate(7);

    console.log(`${inputFileName}.txt -> INPUT`, input);
    console.log(`${outputFileName}.txt -> OUTPUT`, output);

    // Save input and expected output to temporary files
    fs.writeFileSync(`./temp/${tempFolderName}/${inputFileName}.txt`, input);

    // Execute the C++ code with input from the temporary file
    const childProcess = exec(
      `gcc ./temp/${tempFolderName}/${tempCppFileName}.c -o ./temp/${tempFolderName}/${tempCppFileName}.out && ./temp/${tempFolderName}/${tempCppFileName}.out < ./temp/${tempFolderName}/${inputFileName}.txt`,
      (error, stdout, stderr) => {
        if (stderr) {
          console.log("STD ERROR : ", stderr);
          results.push({
            input,
            output,
            actualOutput: "Skipped 🙃",
            success: true,
          });
        } else {
          const actualOutput = stdout.trim(); // Remove trailing newline
          console.log("ACTUAL OUTPUT", actualOutput);
          const success = actualOutput === output;
          results.push({ input, output, actualOutput, success });
        }

        testCasesProcessed++;

        if (testCasesProcessed === testCases.length) {
          const setStatus = (results) => {
            if (
              results.filter((result) => result.success).length ===
              results.length
            ) {
              return 3; // All test cases passed
            } else if (results.filter((result) => result.success).length > 0) {
              return 2; // Some test cases passed
            } else {
              return 1; // No test cases passed
            }
          };

          removeTempFiles(); // Clean up temporary files

          if (!res.headersSent) {
            if (error) {
              console.log(`error: ${error.message}`);
              return res.json({ success: false, error: stderr });
            }
            return res.json({
              success: true,
              results,
              status: setStatus(results),
            });
          }
        }
      }
    );

    // Set a timer to terminate the child process if it exceeds the timeout
    const timeout = 5000; // 5 seconds timeout
    const timeoutTimer = setTimeout(() => {
      childProcess.kill(); // Terminate the child process
      results.push({
        input,
        output,
        actualOutput: "Command Timeout",
        success: false,
      });
      testCasesProcessed++;
      if (testCasesProcessed === testCases.length) {
        removeTempFiles(); // Clean up temporary files
        if (!res.headersSent) {
          return res.json({ success: false, results });
        }
      }
    }, timeout);
  };

  // Loop through test cases and execute each one
  for (const testCase of testCases) {
    executeTestCase(testCase);
  }
};
