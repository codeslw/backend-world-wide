import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

const servicesData = [
  {
    slug: 'document-translation-apostille',
    titleUz: "Hujjatlarni tarjima qilish va apostil qo'yish",
    titleRu: 'Перевод документов и апостилирование',
    titleEn: 'Document translation and apostille',
    shortDescUz: "Diplom, attestat va boshqa rasmiy hujjatlarni sifatli tarjima qilish hamda apostil/legalizatsiya qilish xizmati.",
    shortDescRu: 'Качественный перевод дипломов, аттестатов и других документов с последующим апостилированием и легализацией.',
    shortDescEn: 'Professional translation of diplomas, transcripts, and official certificates with apostille and legal authentication.',
    fullDescUz: "Chet el universitetlariga hujjat topshirishda eng muhim bosqichlardan biri — bu hujjatlarni to'g'ri tarjima qilish va notarial tasdiqlash hamda apostil qo'yishdir. Bizning professional tarjimonlarimiz va huquqiy mutaxassislarimiz barcha hujjatlaringizni xalqaro standartlarga mos ravishda tayyorlab berishadi.",
    fullDescRu: 'Один из ключевых этапов поступления в зарубежный вуз — точный перевод и нотариальное заверение документов, а также проставление апостиля. Наши квалифицированные переводчики и юристы подготовят ваши документы в полном соответствии с международными требованиями.',
    fullDescEn: 'Accurate translation, notarization, and apostille validation are critical steps for studying abroad. Our experienced translators and legal advisers prepare all your academic and personal credentials according to strict international university guidelines.',
    iconName: 'FileCheck',
    badgeUz: 'Rasmiy & Huquqiy',
    badgeRu: 'Официально',
    badgeEn: 'Official & Legal',
    featuresUz: [
      "Notarial tasdiqlangan professional tarjima (Ingliz, Nemis, Turk, Koreys va b.)",
      "Adliya vazirligi va Tashqi ishlar vazirligi orqali apostil qo'yish",
      "Konsullik legalizatsiyasi va tasdiqlov hujjatlari",
      "Tezkor tayyorlash imkoniyati (Express service)"
    ],
    featuresRu: [
      'Нотариально заверенный перевод (английский, немецкий, турецкий, корейский и др.)',
      'Проставление апостиля через Минюст и МИД',
      'Консульская легализация документов',
      'Срочное оформление (Express service)'
    ],
    featuresEn: [
      'Certified notarized translations (English, German, Turkish, Korean, etc.)',
      'Official apostille processing via Ministry of Justice & Foreign Affairs',
      'Consular legalization & document verification',
      'Fast-track options available (Express processing)'
    ],
    actionTextUz: "Tarjima buyurtma qilish",
    actionTextRu: 'Заказать перевод',
    actionTextEn: 'Order Translation',
    sortOrder: 1,
    isActive: true,
    isFeatured: true,
  },
  {
    slug: 'university-application',
    titleUz: 'Universitet dasturlariga hujjat topshirish',
    titleRu: 'Подача документов в университетские программы',
    titleEn: 'Applying to university programs',
    shortDescUz: 'Bakalavr, magistratura va doktorantura dasturlariga to\'liq hamrohlik va kafolatlangan topshirish.',
    shortDescRu: 'Полное сопровождение и гарантированная подача заявк на программы бакалавриата, магистратуры и докторантуры.',
    shortDescEn: 'End-to-end support for applying to Bachelor, Master, and PhD degree programs worldwide.',
    fullDescUz: "Biz talabalarga mos universitet va dasturni tanlash, Motivatsion xat (SOP), Rezyume (CV) va Tavsiyanomalar (LOR) yozishda yordam beramiz. Hujjatlaringiz universitet qabul komissiyasiga xatosiz va o'z vaqtida topshirilishi ta'minlanadi.",
    fullDescRu: 'Мы помогаем выбрать идеально подходящий вуз и специальность, составить мотивационное письмо (SOP), резюме (CV) и рекомендательные письма (LOR). Гарантируем своевременную и грамотную подачу документов в приемную комиссию.',
    fullDescEn: 'We provide strategic guidance on selecting the best-fit program, writing compelling Statement of Purpose (SOP), CV, and Recommendation Letters (LOR). We ensure flawless and timely application submission directly to university admissions.',
    iconName: 'GraduationCap',
    badgeUz: 'Top Xizmat',
    badgeRu: 'Популярно',
    badgeEn: 'Popular Choice',
    featuresUz: [
      'Individual Universitet va Grant dasturlari tanlovi',
      'Motivation Letter (SOP) va CV/Resume yozishda ko\'mak',
      'Portfellar va akademik hujjatlarni tekshirish',
      'Qabul komissiyasi bilan to\'g\'ridan-to\'g\'ri muloqot'
    ],
    featuresRu: [
      'Индивидуальный подбор вузов и грантовых программ',
      'Помощь в составлении Motivation Letter (SOP) и CV',
      'Аудит академического портфолио',
      'Прямая связь с приемными комиссиями'
    ],
    featuresEn: [
      'Personalized selection of universities & scholarship options',
      'Assistance with Motivation Letter (SOP) & Academic CV drafting',
      'Document audit & portfolio review',
      'Direct communication with university admissions officers'
    ],
    actionTextUz: "Hujjat topshirishni boshlash",
    actionTextRu: 'Начать поступление',
    actionTextEn: 'Start Application',
    sortOrder: 2,
    isActive: true,
    isFeatured: true,
  },
  {
    slug: 'airport-pickup',
    titleUz: 'Aeroportda kutib olish xizmati',
    titleRu: 'Встреча в аэропорту',
    titleEn: 'Airport pickup',
    shortDescUz: "Chet elga yetib borganingizda aeroportdan turar joyingizgacha xavfsiz va qulay transfer xizmati.",
    shortDescRu: 'Безопасный и комфортный трансфер из аэропорта прилета прямо до вашего места проживания или кампуса.',
    shortDescEn: 'Safe and comfortable transfer service from the arrival airport directly to your campus or accommodation.',
    fullDescUz: "Yangi davlatga birinchi marta borayotgan talabalar uchun aeroportda kutib olish eng muhim qulaylikdir. Bizning vakillarimiz sizni aeroportda kutib olib, yotoqxona yoki xonadoningizgacha kuzatib qo'yishadi hamda mahalliy aloqa (SIM-karta) va transport bo'yicha dastlabki yordamni ko'rsatishadi.",
    fullDescRu: 'Для студентов, прилетающих в новую страну впервые, встреча в аэропорту — залог спокойствия и безопасности. Наш представитель встретит вас с табличкой, доставит до места проживания и поможет оформить местную SIM-карту и проездной.',
    fullDescEn: 'Arriving in a new country can be daunting. Our local representative meets you right at the arrivals hall, assists with luggage, drives you safely to your housing, and helps with initial setup like local SIM card registration and transport cards.',
    iconName: 'PlaneTakeoff',
    badgeUz: 'Qulaylik & Xavfsizlik',
    badgeRu: 'Комфорт',
    badgeEn: 'Comfort & Safety',
    featuresUz: [
      'Aeroportda ism-sharif yozilgan lavha bilan kutib olish',
      'Yotoqxona yoki kvartiraga qadar qulay transport',
      'Mahalliy SIM-karta va aloqani sozlashda ko\'mak',
      'Shahar bo\'yicha dastlabki orientatsiya va maslahatlar'
    ],
    featuresRu: [
      'Встреча в терминале прибытия с именной табличкой',
      'Комфортный трансфер до общежития или квартиры',
      'Помощь в покупке и активации местной SIM-карты',
      'Первичный инструктаж по транспорту и инфраструктуре'
    ],
    featuresEn: [
      'Personal meet-and-greet in arrival terminal',
      'Direct comfortable transfer to campus housing or apartment',
      'Immediate help with local SIM card setup & connectivity',
      'City orientation & local essential tips'
    ],
    actionTextUz: "Kutib olishni bron qilish",
    actionTextRu: 'Забронировать встречу',
    actionTextEn: 'Book Pickup',
    sortOrder: 3,
    isActive: true,
    isFeatured: false,
  },
  {
    slug: 'accommodation-search',
    titleUz: 'Turar joy topish va joylashtirish',
    titleRu: 'Поиск и бронирование жилья',
    titleEn: 'Finding accommodation',
    shortDescUz: "Talabalar yotoqxonasi, ijaraga xonadon yoki sheriklik turar joylarini topish va shartnoma tuzishda yordam.",
    shortDescRu: 'Помощь в поиске студгородков, студенческих общежитий, аренде квартир и оформлении договоров.',
    shortDescEn: 'Assistance with securing student dormitories, shared apartments, or private housing before your arrival.',
    fullDescUz: "Chet elda o'qish davomida shinam va hamyonbop turar joy topish juda muhim. Biz universitet yotoqxonasidan joy band qilish yoki shahar markazida xavfsiz kvartira ijara shartnomasirasmiylashtirishda to'liq yordam beramiz.",
    fullDescRu: 'Комфортное и доступное жилье — ключевой фактор успешного обучения. Мы оказываем содействие в бронировании мест в университетских общежитиях, а также в поиске и проверке договоров аренды частных квартир.',
    fullDescEn: 'Finding convenient and affordable housing is essential. We assist with booking university dorm rooms, finding verified student apartments, and managing rental lease contracts legally prior to your departure.',
    iconName: 'Home',
    badgeUz: 'Kafolatlangan Joy',
    badgeRu: 'Проверенное жилье',
    badgeEn: 'Verified Housing',
    featuresUz: [
      'Universitet yotoqxonalariga o\'rin band qilish',
      'Talabalar uchun hamyonbop kvartira va xonalarni topish',
      'Ijara shartnomasi (Lease Agreement) xavfsizligini tekshirish',
      'Manzil bo\'yicha ro\'yxatdan o\'tish (Anmeldung/Registration) yordami'
    ],
    featuresRu: [
      'Бронирование мест в университетских общежитиях',
      'Поиск доступных студенческих квартир и комнат',
      'Юридическая проверка договора аренды',
      'Помощь в прописке/регистрации по месту жительства'
    ],
    featuresEn: [
      'Priority booking for university residence halls',
      'Search for affordable private student apartments & flatshares',
      'Lease contract verification & legal check',
      'Support with municipal residence registration (Anmeldung/Registration)'
    ],
    actionTextUz: "Turar joy so'rash",
    actionTextRu: 'Запросить жилье',
    actionTextEn: 'Request Housing',
    sortOrder: 4,
    isActive: true,
    isFeatured: true,
  },
  {
    slug: 'student-insurance',
    titleUz: "Tibbiy sug'urta расмийlashtirish",
    titleRu: 'Медицинское страхование студентов',
    titleEn: 'Insurance',
    shortDescUz: "Viza olish va universitetda o'qish uchun talab etiladigan xalqaro tibbiy sug'urta polislarini rasmiylashtirish.",
    shortDescRu: 'Оформление международных медицинских страховых полисов, необходимых для получения визы и учебы.',
    shortDescEn: 'Comprehensive health & medical insurance plans tailored for international student visa & university compliance.',
    fullDescUz: "Ko'plab davlatlarda (Yevropa, AQSh, Osiyo) talaba vizasini olish va universitetga yozilish uchun rasmiy tibbiy sug'urta bo'lishi shart. Biz eng ishonchli xalqaro sug'urta kompaniyalari (Swisscare, Techniker Krankenkasse, AOK, Allianz va b.) bilan ishlaymiz.",
    fullDescRu: 'Для получения студенческой визы и зачисления в большинство зарубежных вузов наличие официальной медицинской страховки является обязательным. Мы помогаем оформить полисы проверенных международных страховых компаний.',
    fullDescEn: 'Obtaining mandatory health coverage is required for student visa applications and university enrollment across Europe, North America, and Asia. We connect you with top recognized health insurance providers (e.g. TK, AOK, Swisscare, Allianz).',
    iconName: 'ShieldCheck',
    badgeUz: 'Vizaga Mos',
    badgeRu: 'Для визы',
    badgeEn: 'Visa Compliant',
    featuresUz: [
      'Viza elchixonasi talablariga 100% mos sug\'urta polisi',
      'Shoshilinch tibbiy yordam va gospitalizatsiya qoplamasi',
      'Onlayn tezkor rasmiylashtirish va elektron polis berish',
      'Talabalar uchun maxsus chegirmali tariflar'
    ],
    featuresRu: [
      '100% соответствие требованиям посольств и консульств',
      'Покрытие экстренной медицинской помощи и госпитализации',
      'Быстрое онлайн-оформление и получение полиса на email',
      'Специальные студенческие льготные тарифы'
    ],
    featuresEn: [
      '100% compliance with embassy visa requirements',
      'Coverage for emergency medical treatments, doctors & hospitalization',
      'Instant online issuance with official digital certificate',
      'Discounted student-friendly subscription rates'
    ],
    actionTextUz: "Sug'urta rasmiylashtirish",
    actionTextRu: 'Оформить страховку',
    actionTextEn: 'Get Insurance',
    sortOrder: 5,
    isActive: true,
    isFeatured: false,
  },
  {
    slug: 'visa-assistance',
    titleUz: "Viza ko'magi va konsultatsiya",
    titleRu: 'Визовая поддержка и консультации',
    titleEn: 'Visa assistance',
    shortDescUz: "Talabalik vizasini olish uchun hujjatlar paketini tayyorlash, anketalarni to'ldirish va elchixona suhbatiga tayyorlash.",
    shortDescRu: 'Подготовка полного пакета документов на студенческую визу, заполнение анкет и подготовка к собеседованию.',
    shortDescEn: 'Full embassy visa guidance, application form filling, document verification, and mock interview practice.',
    fullDescUz: "Viza rad etilishining oldini olish uchun barcha hujjatlar va moliyaviy manbalar elchixona talablariga mukammal mos kelishi kerak. Bizning viza ekspertlarimiz anketalarni to'g'ri to'ldirish, navbat (appointment) olish va elchixonadagi suhbatdan muvaffaqiyatli o'tish bo'yicha intensiv tayyorgarlik o'tkazishadi.",
    fullDescRu: 'Чтобы избежать отказа в визе, каждый документ и финансовая справка должны быть безупречно оформлены. Наши визовые специалисты помогут правильно заполнить анкету, записаться на подачу и пройти тренировочное собеседование.',
    fullDescEn: 'Securing your student visa requires precision to avoid unexpected rejections. Our experienced visa specialists meticulously prepare your document dossier, book embassy appointment slots, and conduct mock interview simulations.',
    iconName: 'Passport',
    badgeUz: 'Yuqori Muvaffaqiyat',
    badgeRu: 'Высокий шанс',
    badgeEn: 'High Approval Rate',
    featuresUz: [
      'Elchixona uchun viza hujjatlari paketini to\'liq tekshirish',
      'Viza anketalari (DS-160, National Visa application)ni to\'ldirish',
      'Elchixonaga uchrashuv navbatini (Appointment) band qilish',
      'Konsul suhbatiga tayyorlovchi Mock Interview Mashg\'ulotlari'
    ],
    featuresRu: [
      'Полная проверка и аудит визового досье для посольства',
      'Заполнение визовых анкет любой сложности',
      'Запись на подачу документов (Appointment slot)',
      'Симуляция собеседования с консулом (Mock Interview)'
    ],
    featuresEn: [
      'Complete document audit aligned with target country embassy rules',
      'Accurate completion of visa forms (Schengen, DS-160, Student Visas)',
      'Embassy appointment slot booking support',
      'Intensive Mock Interview practice with real consular questions'
    ],
    actionTextUz: "Viza konsultatsiyasi",
    actionTextRu: 'Визовая консультация',
    actionTextEn: 'Get Visa Assistance',
    sortOrder: 6,
    isActive: true,
    isFeatured: true,
  },
  {
    slug: 'bank-statement-assistance',
    titleUz: 'Bank ko\'chirmasi va moliyaviy hujjatlar ko\'magi',
    titleRu: 'Помощь с банковской выпиской и финансовыми документами',
    titleEn: 'Bank statement assistance',
    shortDescUz: "Chet elda o'qish uchun moliyaviy kafolat hujjatlari, bank ko'chirmalari va bloklangan hisoblar (Sperrkonto) bo'yicha konsultatsiya.",
    shortDescRu: 'Консультации по подготовке банковских выписок, подтверждению финансовых средств и открытию блокированных счетов.',
    shortDescEn: 'Consultation on proving funds sufficiency, bank statements validation, and blocked account setup (Sperrkonto).',
    fullDescUz: "Chet el universitetlari va elchixonalari talabadan yetarli moliyaviy mablag' mavjudligini (Proof of Funds) tasdiqlashni talab qiladi. Biz bank ko'chirmalarini to'g'ri rasmiylashtirish, homiylik xatlarini (Sponsorship letter) tayyorlash va Yevropa mamlakatlari uchun bloklangan hisob ochishda yo'l-yo'riq ko'rsatamiz.",
    fullDescRu: 'Посольства требуют официальное подтверждение наличия средств на весь период учебы. Мы консультируем по грамотному оформлению банковских справок, спонсорских писем и открытию блокированных счетов (например, в Германии).',
    fullDescEn: 'Embassies demand verifiable proof of financial solvency for tuition and living expenses. We guide you through preparing compliant bank statements, drafting affidavit of support letters, and opening blocked bank accounts (e.g., Sperrkonto for Germany).',
    iconName: 'Landmark',
    badgeUz: 'Moliyaviy Kafolat',
    badgeRu: 'Финансовая справка',
    badgeEn: 'Financial Guidance',
    featuresUz: [
      'Bank ko\'chirmasi va mablag\'lar yetarliligi bo\'yicha maslahat',
      'Homiylik xati (Affidavit of Support) tayyorlash',
      'Bloklangan bank hisobi (Sperrkonto / Fintiba / Expatrio) ochishda ko\'mak',
      'Xalqaro pul o\'tkazmalari va kontrakt to\'lovlari bo\'yicha yo\'riqnoma'
    ],
    featuresRu: [
      'Консультация по требованиям к сумме и сроку банковской выписки',
      'Подготовка спонсорского письма (Affidavit of Support)',
      'Помощь в открытии блокированного счета (Sperrkonto / Fintiba)',
      'Инструкции по международным переводам и оплате обучения'
    ],
    featuresEn: [
      'Expert advice on bank statement requirements & required balance',
      'Drafting of official Affidavit of Support / Sponsor letters',
      'Assistance opening German/European blocked accounts (Sperrkonto)',
      'Guidance on swift international tuition fees transfer'
    ],
    actionTextUz: "Moliyaviy maslahat olish",
    actionTextRu: 'Получить консультацию',
    actionTextEn: 'Financial Advice',
    sortOrder: 7,
    isActive: true,
    isFeatured: false,
  },
];

async function main() {
  console.log('Seeding Our Services page and items...');

  // 1. Ensure singleton page content exists
  const page = await prisma.ourServicesPage.findFirst();
  if (!page) {
    await prisma.ourServicesPage.create({
      data: {
        heroTitleUz: 'Xizmatlarimiz!',
        heroTitleRu: 'Наши услуги!',
        heroTitleEn: 'Our Services!',
        heroSubtitleUz: "O'qishga kirishdan tortib viza va aeroportda kutib olishgacha — barcha professional xizmatlarimiz",
        heroSubtitleRu: 'От поступления в университет до визы и встречи в аэропорту — все наши профессиональные услуги',
        heroSubtitleEn: 'From university admissions to visa assistance and airport pickup — all our professional services',
        bannerTitleUz: 'Savollaringiz bormi yoki maslahat kerakmi?',
        bannerTitleRu: 'Есть вопросы или нужна консультация?',
        bannerTitleEn: 'Have questions or need consultation?',
        bannerSubtitleUz: 'Bizning mutaxassislarimiz sizga eng maqbul yechimni taklif qilishadi',
        bannerSubtitleRu: 'Наши специалисты предложат вам наилучшее решение',
        bannerSubtitleEn: 'Our experts will offer you the best possible solution',
      },
    });
  }

  // 2. Upsert default services
  for (const item of servicesData) {
    await prisma.ourService.upsert({
      where: { slug: item.slug },
      create: item,
      update: item,
    });
    console.log(`Upserted service: ${item.slug}`);
  }

  console.log('Seeding Our Services completed successfully!');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
