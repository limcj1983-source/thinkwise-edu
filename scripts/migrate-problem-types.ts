/**
 * 기존 문제 타입을 새로운 구조로 마이그레이션하는 스크립트
 *
 * 변환 규칙:
 * - MULTIPLE_CHOICE → type: AI_VERIFICATION, answerFormat: MULTIPLE_CHOICE
 * - TRUE_FALSE → type: AI_VERIFICATION, answerFormat: TRUE_FALSE
 * - AI_VERIFICATION → type: AI_VERIFICATION, answerFormat: SHORT_ANSWER
 * - PROBLEM_DECOMPOSITION → type: PROBLEM_DECOMPOSITION, answerFormat: SHORT_ANSWER
 */

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('🔄 문제 타입 마이그레이션 시작...\n');

  try {
    // 1. 현재 데이터베이스의 문제 통계 확인
    const totalProblems = await prisma.problem.count();
    console.log(`📊 전체 문제 수: ${totalProblems}`);

    if (totalProblems === 0) {
      console.log('✅ 마이그레이션할 문제가 없습니다.');
      return;
    }

    // 2. 각 타입별 문제 수 확인 (raw query 사용)
    const typeStats = await prisma.$queryRaw<Array<{ type: string; count: bigint }>>`
      SELECT type, COUNT(*) as count
      FROM problems
      GROUP BY type
    `;

    console.log('\n현재 문제 타입 분포:');
    typeStats.forEach((stat) => {
      console.log(`  - ${stat.type}: ${stat.count}개`);
    });

    // 3. MULTIPLE_CHOICE 타입 문제들 변환
    const multipleChoiceCount = await prisma.$executeRaw`
      UPDATE problems
      SET
        type = 'AI_VERIFICATION',
        "answerFormat" = 'MULTIPLE_CHOICE'
      WHERE type = 'MULTIPLE_CHOICE'
    `;
    console.log(`\n✅ MULTIPLE_CHOICE → AI_VERIFICATION + MULTIPLE_CHOICE: ${multipleChoiceCount}개 변환`);

    // 4. TRUE_FALSE 타입 문제들 변환
    const trueFalseCount = await prisma.$executeRaw`
      UPDATE problems
      SET
        type = 'AI_VERIFICATION',
        "answerFormat" = 'TRUE_FALSE'
      WHERE type = 'TRUE_FALSE'
    `;
    console.log(`✅ TRUE_FALSE → AI_VERIFICATION + TRUE_FALSE: ${trueFalseCount}개 변환`);

    // 5. AI_VERIFICATION 타입 문제들에 answerFormat 추가 (아직 없는 경우)
    const aiVerificationCount = await prisma.$executeRaw`
      UPDATE problems
      SET "answerFormat" = 'SHORT_ANSWER'
      WHERE type = 'AI_VERIFICATION' AND "answerFormat" IS NULL
    `;
    console.log(`✅ AI_VERIFICATION 문제에 SHORT_ANSWER 형식 추가: ${aiVerificationCount}개`);

    // 6. PROBLEM_DECOMPOSITION 타입 문제들에 answerFormat 추가 (아직 없는 경우)
    const problemDecompositionCount = await prisma.$executeRaw`
      UPDATE problems
      SET "answerFormat" = 'SHORT_ANSWER'
      WHERE type = 'PROBLEM_DECOMPOSITION' AND "answerFormat" IS NULL
    `;
    console.log(`✅ PROBLEM_DECOMPOSITION 문제에 SHORT_ANSWER 형식 추가: ${problemDecompositionCount}개`);

    // 7. 변환 후 통계 확인
    const afterStats = await prisma.$queryRaw<Array<{ type: string; answerformat: string; count: bigint }>>`
      SELECT type, "answerFormat" as answerformat, COUNT(*) as count
      FROM problems
      GROUP BY type, "answerFormat"
      ORDER BY type, "answerFormat"
    `;

    console.log('\n📊 변환 후 문제 분포:');
    afterStats.forEach((stat) => {
      console.log(`  - ${stat.type} + ${stat.answerformat}: ${stat.count}개`);
    });

    console.log('\n✅ 마이그레이션 완료!');
    console.log('\n다음 단계:');
    console.log('1. 이 스크립트가 성공적으로 실행되었다면');
    console.log('2. 스키마에서 MULTIPLE_CHOICE, TRUE_FALSE를 ProblemType에서 제거해도 안전합니다');
    console.log('3. git add . && git commit && git push를 실행하세요');

  } catch (error) {
    console.error('❌ 마이그레이션 중 오류 발생:', error);
    throw error;
  }
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
