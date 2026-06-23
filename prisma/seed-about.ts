import { PrismaClient } from '@prisma/client';

// Seeds the About page CMS with realistic Worldwide Consulting / TalabaLink
// content so the admin and student frontend have something to render.
// Idempotent: clears the lists and upserts the singleton each run.

const prisma = new PrismaClient();

async function main() {
  // ── Singleton page content ────────────────────────────────────────────────
  await prisma.aboutPage.upsert({
    where: { id: 'global' },
    create: { id: 'global' },
    update: {},
  });

  await prisma.aboutPage.update({
    where: { id: 'global' },
    data: {
      heroTitleEn: 'Our Story',
      heroTitleRu: 'Наша история',
      heroTitleUz: 'Bizning tariximiz',
      heroSubtitleEn:
        'TalabaLink is the technology platform built and operated by Worldwide Consulting — connecting students in Uzbekistan with universities around the world.',
      heroSubtitleRu:
        'TalabaLink — это технологическая платформа, созданная и управляемая Worldwide Consulting, соединяющая студентов из Узбекистана с университетами по всему миру.',
      heroSubtitleUz:
        'TalabaLink — Worldwide Consulting tomonidan yaratilgan va boshqariladigan texnologik platforma boʻlib, Oʻzbekiston talabalarini dunyo universitetlari bilan bogʻlaydi.',

      introHeadingEn: 'Built on experience, driven by technology',
      introHeadingRu: 'Основано на опыте, движимо технологиями',
      introHeadingUz: 'Tajribaga asoslangan, texnologiya bilan harakatlanadi',
      introBodyEn:
        'Since 2020, Worldwide Consulting has guided hundreds of students through every step of studying abroad. In January 2026 we launched TalabaLink to put that expertise into a single, transparent platform — university search, applications, scholarships and personal guidance in one place.',
      introBodyRu:
        'С 2020 года Worldwide Consulting сопровождает сотни студентов на каждом этапе обучения за рубежом. В январе 2026 года мы запустили TalabaLink, чтобы собрать весь этот опыт на единой прозрачной платформе.',
      introBodyUz:
        '2020-yildan beri Worldwide Consulting yuzlab talabalarni chet elda taʼlim olishning har bir bosqichida qoʻllab-quvvatlab keldi. 2026-yil yanvar oyida biz ushbu tajribani yagona shaffof platformaga jamlash uchun TalabaLink’ni ishga tushirdik.',

      operatorStatementEn:
        'TalabaLink is a platform developed and operated by Worldwide Consulting.',
      operatorStatementRu:
        'TalabaLink — платформа, разработанная и управляемая компанией Worldwide Consulting.',
      operatorStatementUz:
        'TalabaLink — Worldwide Consulting tomonidan ishlab chiqilgan va boshqariladigan platforma.',

      foundedYear: 2020,
      platformLaunch: '2026-01',

      founderHeadingEn: 'Meet the Founder',
      founderHeadingRu: 'Основатель',
      founderHeadingUz: 'Asoschi',
      milestonesHeadingEn: 'Our Journey',
      milestonesHeadingRu: 'Наш путь',
      milestonesHeadingUz: 'Bizning yoʻlimiz',
      teamHeadingEn: 'Meet the Team',
      teamHeadingRu: 'Наша команда',
      teamHeadingUz: 'Bizning jamoamiz',
      certificatesHeadingEn: 'Certificates & Accreditations',
      certificatesHeadingRu: 'Сертификаты и аккредитации',
      certificatesHeadingUz: 'Sertifikatlar va akkreditatsiyalar',
    },
  });

  // ── Founder ───────────────────────────────────────────────────────────────
  await prisma.founder.deleteMany();
  await prisma.founder.create({
    data: {
      name: 'Worldwide Consulting Founder',
      roleEn: 'Founder & CEO',
      roleRu: 'Основатель и генеральный директор',
      roleUz: 'Asoschi va bosh direktor',
      bioEn:
        'Our founder started Worldwide Consulting in 2020 with a simple belief: every ambitious student in Uzbekistan deserves clear, honest guidance to study at a great university abroad. After years of personally advising students, that mission grew into the TalabaLink platform.',
      bioRu:
        'Наш основатель создал Worldwide Consulting в 2020 году с простой идеей: каждый амбициозный студент в Узбекистане заслуживает честного и понятного сопровождения для поступления в хороший зарубежный университет.',
      bioUz:
        'Asoschimiz Worldwide Consulting’ni 2020-yilda oddiy bir ishonch bilan boshlagan: Oʻzbekistondagi har bir intiluvchan talaba chet eldagi yaxshi universitetda taʼlim olish uchun ochiq va halol yoʻl-yoʻriqqa loyiq.',
      sortOrder: 0,
    },
  });

  // ── Milestones ────────────────────────────────────────────────────────────
  await prisma.milestone.deleteMany();
  await prisma.milestone.createMany({
    data: [
      {
        year: '2020',
        titleEn: 'Worldwide Consulting is founded',
        titleRu: 'Основана Worldwide Consulting',
        titleUz: 'Worldwide Consulting tashkil etildi',
        descriptionEn:
          'We opened our doors in Tashkent and began advising the first students on studying abroad.',
        descriptionRu:
          'Мы открылись в Ташкенте и начали консультировать первых студентов по обучению за рубежом.',
        descriptionUz:
          'Toshkentda faoliyatimizni boshladik va birinchi talabalarga chet elda taʼlim boʻyicha maslahat bera boshladik.',
        sortOrder: 0,
      },
      {
        year: '2022',
        titleEn: 'Growing partner network',
        titleRu: 'Растущая сеть партнёров',
        titleUz: 'Hamkorlar tarmogʻining kengayishi',
        descriptionEn:
          'Our network expanded to dozens of universities across multiple countries.',
        descriptionRu:
          'Наша сеть расширилась до десятков университетов в разных странах.',
        descriptionUz:
          'Tarmogʻimiz bir nechta davlatlardagi oʻnlab universitetlargacha kengaydi.',
        sortOrder: 1,
      },
      {
        year: 'Jan 2026',
        titleEn: 'TalabaLink platform launches',
        titleRu: 'Запуск платформы TalabaLink',
        titleUz: 'TalabaLink platformasi ishga tushdi',
        descriptionEn:
          'We officially launched TalabaLink, bringing university search, applications and guidance into one platform.',
        descriptionRu:
          'Мы официально запустили TalabaLink, объединив поиск университетов, подачу заявок и сопровождение в одной платформе.',
        descriptionUz:
          'Universitet qidiruvi, ariza topshirish va yoʻl-yoʻriqni yagona platformaga jamlab, TalabaLink’ni rasman ishga tushirdik.',
        sortOrder: 2,
      },
    ],
  });

  // ── Team ──────────────────────────────────────────────────────────────────
  await prisma.teamMember.deleteMany();
  await prisma.teamMember.createMany({
    data: [
      {
        name: 'Head of Admissions',
        positionEn: 'Head of Admissions',
        positionRu: 'Руководитель приёмной комиссии',
        positionUz: 'Qabul boʻlimi rahbari',
        roleEn: 'Leads the student application process end to end',
        roleRu: 'Руководит процессом подачи заявок студентов',
        roleUz: 'Talabalar ariza jarayonini boshqaradi',
        groupEn: 'Leadership',
        groupRu: 'Руководство',
        groupUz: 'Rahbariyat',
        sortOrder: 0,
      },
      {
        name: 'Senior Consultant',
        positionEn: 'Senior Education Consultant',
        positionRu: 'Старший консультант по образованию',
        positionUz: 'Katta taʼlim maslahatchisi',
        roleEn: 'Advises students on university and program selection',
        roleRu: 'Консультирует студентов по выбору университета и программы',
        roleUz: 'Talabalarga universitet va dastur tanlashda maslahat beradi',
        groupEn: 'Consultants',
        groupRu: 'Консультанты',
        groupUz: 'Maslahatchilar',
        sortOrder: 1,
      },
      {
        name: 'Student Support Specialist',
        positionEn: 'Student Support Specialist',
        positionRu: 'Специалист поддержки студентов',
        positionUz: 'Talabalarni qoʻllab-quvvatlash mutaxassisi',
        roleEn: 'Helps students with documents, visas and arrival',
        roleRu: 'Помогает студентам с документами, визами и приездом',
        roleUz: 'Talabalarga hujjatlar, vizalar va kelishda yordam beradi',
        groupEn: 'Consultants',
        groupRu: 'Консультанты',
        groupUz: 'Maslahatchilar',
        sortOrder: 2,
      },
    ],
  });

  // ── Certificates ──────────────────────────────────────────────────────────
  await prisma.certificate.deleteMany();
  await prisma.certificate.createMany({
    data: [
      {
        titleEn: 'Official Education Agency Registration',
        titleRu: 'Официальная регистрация образовательного агентства',
        titleUz: 'Rasmiy taʼlim agentligi roʻyxatdan oʻtgani',
        issuerEn: 'Republic of Uzbekistan',
        issuerRu: 'Республика Узбекистан',
        issuerUz: 'Oʻzbekiston Respublikasi',
        isFeatured: true,
        sortOrder: 0,
      },
      {
        titleEn: 'Certified University Partner',
        titleRu: 'Сертифицированный партнёр университетов',
        titleUz: 'Sertifikatlangan universitet hamkori',
        issuerEn: 'Partner Universities',
        issuerRu: 'Университеты-партнёры',
        issuerUz: 'Hamkor universitetlar',
        isFeatured: true,
        sortOrder: 1,
      },
      {
        titleEn: 'Member of International Education Network',
        titleRu: 'Член международной образовательной сети',
        titleUz: 'Xalqaro taʼlim tarmogʻi aʼzosi',
        issuerEn: 'International Education Network',
        issuerRu: 'Международная образовательная сеть',
        issuerUz: 'Xalqaro taʼlim tarmogʻi',
        isFeatured: false,
        sortOrder: 2,
      },
    ],
  });

  console.log('About page CMS seeded successfully.');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
