/**
 * 모든 사용자 목록 조회
 */

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('👥 사용자 목록:\n');

  const users = await prisma.user.findMany({
    select: {
      id: true,
      email: true,
      name: true,
      role: true,
      grade: true,
      subscription: true,
      createdAt: true,
    },
    orderBy: {
      createdAt: 'desc',
    },
  });

  if (users.length === 0) {
    console.log('❌ 등록된 사용자가 없습니다.');
    console.log('\n회원가입: http://localhost:3000/signup');
    return;
  }

  users.forEach((user, index) => {
    console.log(`${index + 1}. ${user.name}`);
    console.log(`   이메일: ${user.email}`);
    console.log(`   역할: ${user.role}`);
    if (user.grade) console.log(`   학년: ${user.grade}학년`);
    console.log(`   구독: ${user.subscription}`);
    console.log(`   가입일: ${user.createdAt.toLocaleDateString('ko-KR')}`);
    console.log('');
  });

  console.log(`총 ${users.length}명의 사용자`);
}

main()
  .catch((e) => {
    console.error('❌ 오류:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
