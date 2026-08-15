import mongoose from "mongoose";

const MONGODB_URI = "mongodb://sharjeelajmalg786:Sharry326%40@ac-hgvknzg-shard-00-00.ybridnw.mongodb.net:27017,ac-hgvknzg-shard-00-01.ybridnw.mongodb.net:27017,ac-hgvknzg-shard-00-02.ybridnw.mongodb.net:27017/pronotes?ssl=true&replicaSet=atlas-n114ok-shard-0&authSource=admin&retryWrites=true&w=majority";

async function run() {
  try {
    await mongoose.connect(MONGODB_URI);
    console.log("Connected to MongoDB.");

    // Update Notes
    const noteResult = await mongoose.connection.collection("notes").updateMany(
      { portal: { $exists: false } },
      { $set: { portal: "personal" } }
    );
    console.log(`Migrated ${noteResult.modifiedCount} legacy notes to 'personal' portal.`);

    // Update Categories
    const categoryResult = await mongoose.connection.collection("categories").updateMany(
      { portal: { $exists: false } },
      { $set: { portal: "personal" } }
    );
    console.log(`Migrated ${categoryResult.modifiedCount} legacy categories to 'personal' portal.`);

    process.exit(0);
  } catch (err) {
    console.error("Migration error:", err);
    process.exit(1);
  }
}

run();
