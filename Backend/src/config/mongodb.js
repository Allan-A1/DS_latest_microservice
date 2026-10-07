import mongoose from "mongoose";

const ConnectDB = async () => {
  mongoose.connection.on("connected", () => {
    console.log(`MongoDB Connected`);
  });
  await mongoose.connect(`${process.env.MONGODB_URI}/spotify`, {
    w: "majority",
  });
};

export default ConnectDB;
