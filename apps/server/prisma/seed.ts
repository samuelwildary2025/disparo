import { prisma } from "../src/config/prisma";
import { hashPassword } from "../src/utils/password";

async function main() {
  const adminEmail = "admin@disparo.app";
  const password = await hashPassword("admin123");

  await prisma.user.upsert({
    where: { email: adminEmail },
    update: {},
    create: {
      email: adminEmail,
      name: "Administrador",
      passwordHash: password,
      role: "owner"
    }
  });

  console.log("Seed completed. Default credentials: admin@disparo.app / admin123");
}

main()
  .catch((err) => {
    console.error(err);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
