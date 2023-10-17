const express = require('express')

const router = express.Router()

const {cpp_runner} = require('../controller/cpp_runner')
const { run_save_cpp } = require('../controller/run_save_cpp')
const { c_runner } = require('../controller/c_runner')
const { run_save_c } = require('../controller/run_save_c')

router.post('/cpp/run',cpp_runner)

router.post('/cpp/save',run_save_cpp)

router.post('/c/run',c_runner)

router.post('/c/save',run_save_c)

module.exports = router;