const { exec } = require("child_process");
var randomstring = require("randomstring");
const Analysis = require("../model/analysis");

exports.run_save_c = (req, res) => {
  try {
    const cppCode = req.body.code;
    const testCases = req.body.testCases;

    const { lab_id, practical_id, problem_id, code, s_id } = req.body;

    console.log(req.body);

    if (!lab_id || !practical_id || !problem_id || !code || !s_id) {
      return res.json({ success: false, error: "Invalid Request" });
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
        // fs.rm(directory, { recursive: true })
        fs.rm(directory, { recursive: true, force: true }, (error) => {
          // You can handle the error here if needed
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
      fs.writeFileSync(`./temp/${tempFolderName}/${outputFileName}.txt`, output);

      // Execute the C++ code with input from the temporary file
      const childProcess = exec(
        `gcc ./temp/${tempFolderName}/${tempCppFileName}.c -o ./temp/${tempFolderName}/${tempCppFileName}.out && ./temp/${tempFolderName}/${tempCppFileName}.out < ./temp/${tempFolderName}/${inputFileName}.txt`,
        (error, stdout, stderr) => {
          if (error) {
            console.log("STD ERROR : ", stderr);
            results.push({
              input,
              output,
              actualOutput: "Skipped 🙃",
              success: false,
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
              } else if (
                results.filter((result) => result.success).length > 0
              ) {
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
              Analysis.findOneAndUpdate(
                { s_id, lab_id, practical_id, problem_id },
                {
                  status: setStatus(results),
                  tc_pass: results.filter((result) => result.success).length,
                  submission: cppCode,
                  score: results.filter((result) => result.success).length * 100,
                  date: Date.now(),
                  time: Date.now(),
                }
              )
                .then((analysis) => {
                  if (!analysis) {
                    return res.json({ success: false, error: "Not Found in DB" });
                  } else {
                    return res.json({ success: true, results });
                  }
                })
                .catch((err) => {
                  return res.json({ success: false, error: err.message });
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
  } catch (err) {
    console.log(err);
    return res.json({ success: false, error: "Something went wrong" });
  }
};
