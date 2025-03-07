const {Schema,model, Types}= require("mongoose")


const UserSchema = Schema({
    name:{
        type:String,
        require:true
    },
    surname:String,
    bio:String,
    nick:{
        type:String
    },
    email:{
        type:String,
        require:true
    },
    password:{
     type:String,
     require:true
    },
    role:{
        type:String,
        default:"role_user"
    },
    imagen:{
        type:String,
        default:"defaul.png"
    },
    create_at:{
        type:Date,
        default:Date.now
    }
})
module.exports = model("User",UserSchema,"users")