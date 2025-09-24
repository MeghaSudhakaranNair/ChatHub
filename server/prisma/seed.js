import { PrismaClient } from "@prisma/client";
const prisma = new PrismaClient();

async function main() {
  // Create the assistant user if it doesn't already exist
  const assistant = await prisma.user.upsert({
    where: { email: "assistant@example.com" },
    update: {},
    create: {
      email: "assistant@example.com",
      name: "@assistant",
    },
  });
  console.log(`Created assistant user with ID: ${assistant.id}`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
