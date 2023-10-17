const { exec } = require("child_process");
var randomstring = require("randomstring");
const Analysis = require("../model/analysis");

exports.run_save_cpp = async (req, res) => {
  const cppCode = req.body.code;
  const testCases = req.body.testCases;

  const {s_id,lab_id,practical_id,problem_id,code} = req.body;

  if(!s_id || !lab_id || !practical_id || !problem_id || !code){
    return res.json({success:false,error:"Invalid Request"})
    }

  // Save the C++ code to a temporary file
  var tempCppFileName = randomstring.generate(7);
  var tempFolderName = randomstring.generate(7);

  const fs = require("fs");

  fs.mkdirSync(`./temp/${tempFolderName}`, { recursive: true }, (err) => {
    if (err) throw err;
  });
  fs.writeFileSync(`./temp/${tempFolderName}/${tempCppFileName}.cpp`, cppCode);

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
        //you can handle the error here
      });
    });
  };

  const results = [];

  // Loop through test cases
  for (const testCase of testCases) {
    const input = testCase.input;
    const output = testCase.output;

    var inputFileName = randomstring.generate(7);
    var outputFileName = randomstring.generate(7);

    console.log(`${inputFileName}.txt -> INPUT`, input);
    console.log(`${outputFileName}.txt -> OUTPUT`, output);

    // Save input and expected output to temporary files
    fs.writeFileSync(`./temp/${tempFolderName}/${inputFileName}.txt`, input);
    fs.writeFileSync(
      `./temp/${tempFolderName}/${outputFileName}.txt`,
      output
    );

    // Execute the C++ code with input from the temporary file
    exec(
      `g++ ./temp/${tempFolderName}/${tempCppFileName}.cpp -o ./temp/${tempFolderName}/${tempCppFileName}.out && ./temp/${tempFolderName}/${tempCppFileName}.out < ./temp/${tempFolderName}/${inputFileName}.txt`,
      (error, stdout, stderr) => {
        if (stderr) {
          console.log("STD ERROR : ", stderr);
          results.push({
            input,
            output,
            actualOutput: "Skipped 🙃",
            success: true,
          });
          if (results.length === testCases.length) {
            const setStatus = (results) => {
              if (
                results.filter((result) => result.success).length ===
                results.length
              ) {
                return 3;
              } else if (
                results.filter((result) => result.success).length > 0
              ) {
                return 2;
              } else {
                return 1;
              }
            };

            Analysis.findOneAndUpdate(
              { s_id, lab_id, practical_id, problem_id },
              {
                status: setStatus(results),
                tc_pass: results.filter((result) => result.success).length,
                submission: cppCode,
                score: results.filter((result) => result.success).length,
                date : Date.now(),
                time : Date.now()
              }
            )
              .then((analysis) => {
                if (!analysis) {
                  return res.json({ success: false, error: "Not Found in DB" });
                }
                else{
                    if (error) {
                        console.log(`error: ${error.message}`);
                        removeTempFiles();
                        return res.json({ success: false, error: stderr });
                      }
                      removeTempFiles();
                      // Clean up temporary files
                      return res.json({ success: true, results });
                }

               
              })
              .catch((err) => {
                return res.json({ success: false, error: err.message });
              });
          }
        } else {
          const actualOutput = stdout.trim(); // Remove trailing newline
          console.log("ACTUAL OUTPUT", actualOutput);
          const success = actualOutput === output;

          results.push({ input, output, actualOutput, success });

          // If all test cases are processed, send the results as the API response
          if (results.length === testCases.length) {
            const setStatus = (results) => {
              if (
                results.filter((result) => result.success).length ===
                results.length
              ) {
                return 3;
              } else if (
                results.filter((result) => result.success).length > 0
              ) {
                return 2;
              } else {
                return 1;
              }
            };

            Analysis.findOneAndUpdate(
              { s_id, lab_id, practical_id, problem_id },
              {
                status: setStatus(results),
                tc_pass: results.filter((result) => result.success).length,
                submission: cppCode,
                score: results.filter((result) => result.success).length,
                date : Date.now(),
                time : Date.now()
              }
            )
              .then((analysis) => {
                if (!analysis) {
                  return res.json({ success: false, error: "Not Found in DB" });
                }
                else{
                    if (error) {
                        console.log(`error: ${error.message}`);
                        removeTempFiles();
                        return res.json({ success: false, error: stderr });
                      }
                      removeTempFiles();
                      // Clean up temporary files
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
  }
};