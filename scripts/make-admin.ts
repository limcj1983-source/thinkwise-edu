/**
 * 사용자를 관리자/교사로 변경하는 스크립트
 *
 * 사용법:
 * npx tsx scripts/make-admin.ts student@test.com TEACHER
 * npx tsx scripts/make-admin.ts student@test.com ADMIN
 */

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  const email = process.argv[2];
  const role = process.argv[3] as 'STUDENT' | 'TEACHER' | 'ADMIN';

  if (!email || !role) {
    console.error('❌ 사용법: npx tsx scripts/make-admin.ts <email> <TEACHER|ADMIN>');
    console.error('예시: npx tsx scripts/make-admin.ts student@test.com TEACHER');
    process.exit(1);
  }

  if (!['STUDENT', 'TEACHER', 'ADMIN'].includes(role)) {
    console.error('❌ 역할은 STUDENT, TEACHER, ADMIN 중 하나여야 합니다.');
    process.exit(1);
  }

  console.log(`🔍 이메일 ${email}을 가진 사용자를 찾는 중...`);

  const user = await prisma.user.findUnique({
    where: { email },
  });

  if (!user) {
    console.error(`❌ 이메일 ${email}을 가진 사용자를 찾을 수 없습니다.`);
    process.exit(1);
  }

  console.log(`✅ 사용자 찾음: ${user.name} (현재 역할: ${user.role})`);
  console.log(`🔄 역할을 ${role}로 변경 중...`);

  const updatedUser = await prisma.user.update({
    where: { email },
    data: { role },
  });

  console.log(`✨ 완료! ${updatedUser.name}님의 역할이 ${role}로 변경되었습니다.`);
  console.log('');
  console.log('이제 관리자 페이지에 접속할 수 있습니다:');
  console.log('👉 http://localhost:3000/admin');
}

main()
  .catch((e) => {
    console.error('❌ 오류 발생:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
