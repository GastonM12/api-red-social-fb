const { Schema, model } = require("mongoose");

const PublicationSchema = Schema({
   user: {
      type: Schema.ObjectId,
      ref: "User",
   },
   text: {
      type: String,
      required: true,
   },
   file: String,
   create_at: {
      type: Date,
      default: Date.now,
   },
});

module.exports = model("Publication", PublicationSchema, "publications");
