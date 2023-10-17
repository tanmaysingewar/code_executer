const mongoose = require('mongoose');
const {Schema} = mongoose

const analysisSchema = new Schema({
    s_id :{
        type : Schema.Types.ObjectId,
        ref : "Student",
        required : true,
    },
    lab_id : {
        type: Schema.Types.ObjectId,
        ref : "Lab",
        required : true,
    },
    practical_id : {
        type: Schema.Types.ObjectId,
        ref : "Practical",
        required : true,
    },
    problem_id : {
        type: Schema.Types.ObjectId,
        ref : "Problem",
        required : true,
    },
    date : {
        type : String,
        required : true,
    },
    time : {
        type : String,
        required : true,
    },
    status : {
        type : Number,
        required : true,
        default : 0,
    },
    tc_pass : {
        type : Number,
        required : true,
        default : 0,
    },
    submission : {
        type : String,
    },
    attemptTime :{
        type : String,
        required : true,
    },
    score : {
        type : Number,
        required : true,
        default : 0,
    },
})

module.exports = mongoose.model('Analysis',analysisSchema)