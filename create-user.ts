import { auth } from "./auth";

const args = process.argv.slice(2);
const email = args[0];
const password = args[1];
const name = args[2] || (email ? email.split("@")[0] : "User");

if (!email || !password) {
  console.error("❌ Usage: npx tsx --env-file=.env create-user.ts <email> <password> [name]");
  process.exit(1);
}

async function main() {
  console.log(`Creating user: ${email} (${name})...`);
  try {
    const result = await auth.api.signUpEmail({
      body: {
        email,
        password,
        name
      }
    });
    console.log("✅ User created successfully!");
    console.log(result);
  } catch (error) {
    console.error("❌ Failed to create user:", error);
  } finally {
    process.exit(0);
  }
}

main();
