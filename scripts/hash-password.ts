import { hashPassword } from "../server/_core/auth";

const password = process.argv[2];
if (!password || password.length < 12) {
  console.error("Uso: pnpm password:hash 'uma-senha-forte-com-12-ou-mais-caracteres'");
  process.exit(1);
}
console.log(hashPassword(password));
