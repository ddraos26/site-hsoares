import bcrypt from 'bcryptjs';

const password = process.argv[2];

if (!password) {
  console.error("Uso: npm run admin:hash -- 'SUA_SENHA_FORTE'");
  process.exit(1);
}

const hash = await bcrypt.hash(password, 12);
console.log(hash);
