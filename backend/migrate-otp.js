const { sequelize } = require('./utils/db');

(async () => {
  try {
     await sequelize.authenticate();
     console.log("Connected...");
     try {
       await sequelize.query("ALTER TABLE Users ADD COLUMN loginOtp VARCHAR(255);");
       console.log("Added loginOtp column");
     } catch (e) {
       console.log("loginOtp already exists or failed:", e.message);
     }
     try {
       await sequelize.query("ALTER TABLE Users ADD COLUMN otpExpiresAt DATETIME;");
       console.log("Added otpExpiresAt column");
     } catch (e) {
       console.log("otpExpiresAt already exists or failed:", e.message);
     }
     console.log("Migration finished.");
     process.exit(0);
  } catch (error) {
     console.error("Migration failed:", error);
     process.exit(1);
  }
})();
